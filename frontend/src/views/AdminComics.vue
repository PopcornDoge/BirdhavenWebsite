<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-5xl space-y-10">
      <div class="flex items-center justify-between gap-4">
        <div class="text-center w-full">
          <h1 class="page-title text-4xl font-bold">Upload Comic Chapter</h1>
          <p class="page-text mt-2">
            Upload a full chapter folder and create a new comic chapter.
          </p>
        </div>

        <router-link to="/admin" class="back-btn absolute right-6">
          Back
        </router-link>
      </div>

      <section class="panel space-y-6">
        <form class="grid gap-5" @submit.prevent="handleUploadChapter">
          <div>
            <label class="form-label">Chapter Title</label>
            <input
                v-model="chapterTitle"
                type="text"
                class="form-input"
                placeholder="Chapter Name"
                required
            />
          </div>

          <div>
            <label class="form-label">Chapter Slug</label>
            <input
                v-model="chapterSlug"
                type="text"
                class="form-input"
                placeholder="chapter1"
                required
            />
          </div>

          <div>
            <label class="form-label">Chapter Folder</label>

            <div class="file-picker-row">
              <label for="chapter-folder-input" class="file-picker-btn">
                Choose Folder
              </label>

              <span class="file-picker-name">
                {{ selectedFolderLabel }}
              </span>
            </div>

            <input
                id="chapter-folder-input"
                ref="folderInputRef"
                type="file"
                class="sr-only"
                webkitdirectory
                multiple
                accept="image/png,image/jpeg,image/webp"
                @change="handleFolderChange"
            />
          </div>

          <div v-if="selectedFiles.length" class="space-y-2">
            <p class="page-text">
              {{ selectedFiles.length }} image<span v-if="selectedFiles.length !== 1">s</span> selected
            </p>

            <div class="preview-list">
              <div
                  v-for="file in sortedSelectedFiles"
                  :key="file.webkitRelativePath || file.name"
                  class="preview-item"
              >
                {{ file.name }}
              </div>
            </div>
          </div>

          <div>
            <label class="inline-flex items-center gap-2">
              <input v-model="published" type="checkbox" />
              <span class="page-text">Published</span>
            </label>
          </div>

          <div>
            <p v-if="successMessage" class="success-text">
              {{ successMessage }}
            </p>

            <p v-if="errorMessage" class="error-text">
              {{ errorMessage }}
            </p>
          </div>

          <div>
            <button class="primary-btn" type="submit" :disabled="isUploading">
              {{ isUploading ? 'Uploading Chapter...' : 'Upload Chapter' }}
            </button>
          </div>
        </form>
      </section>

      <section class="panel space-y-6">
        <div>
          <h2 class="page-title text-2xl font-bold">Existing Chapters</h2>
          <p class="page-text mt-2">
            Delete a chapter and all of its uploaded pages.
          </p>
        </div>

        <div v-if="isLoadingChapters" class="page-text">
          Loading chapters...
        </div>

        <div v-else-if="chapters.length" class="space-y-3">
          <div
              v-for="chapter in chapters"
              :key="chapter.id"
              class="chapter-row"
          >
            <div class="min-w-0">
              <p class="chapter-row-title">
                {{ chapter.title }}
              </p>
              <p class="chapter-row-meta">
                /read/{{ chapter.slug }}
              </p>
            </div>

            <button
                type="button"
                class="delete-btn"
                :disabled="deletingChapterId === chapter.id"
                @click="handleDeleteChapter(chapter)"
            >
              {{ deletingChapterId === chapter.id ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>

        <div v-else class="page-text">
          No chapters found.
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const chapterTitle = ref('')
const chapterSlug = ref('')
const published = ref(true)
const selectedFiles = ref([])
const selectedFolderLabel = ref('No folder selected')
const folderInputRef = ref(null)
const isUploading = ref(false)
const isLoadingChapters = ref(true)
const deletingChapterId = ref(null)
const successMessage = ref('')
const errorMessage = ref('')
const chapters = ref([])

const sanitizeFileName = (name) => {
  return name
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
}

const sortFilesNumerically = (files) => {
  return [...files].sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    return aName.localeCompare(bName, undefined, { numeric: true })
  })
}

const sortedSelectedFiles = computed(() => {
  return sortFilesNumerically(selectedFiles.value)
})

const loadChapters = async () => {
  isLoadingChapters.value = true

  try {
    const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .order('created_at', { ascending: true })

    if (error) {
      console.error('loadChapters error:', error)
      chapters.value = []
      return
    }

    chapters.value = data || []
  } finally {
    isLoadingChapters.value = false
  }
}

const handleFolderChange = (event) => {
  const files = Array.from(event.target.files || []).filter((file) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  )

  selectedFiles.value = files

  if (files.length > 0) {
    const firstPath = files[0].webkitRelativePath || ''
    const folderName = firstPath.split('/')[0] || 'Folder selected'
    selectedFolderLabel.value = folderName
  } else {
    selectedFolderLabel.value = 'No folder selected'
  }
}

const resetForm = () => {
  chapterTitle.value = ''
  chapterSlug.value = ''
  published.value = true
  selectedFiles.value = []
  selectedFolderLabel.value = 'No folder selected'

  if (folderInputRef.value) {
    folderInputRef.value.value = ''
  }
}

const handleUploadChapter = async () => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!chapterTitle.value.trim()) {
    errorMessage.value = 'Please enter a chapter title.'
    return
  }

  if (!chapterSlug.value.trim()) {
    errorMessage.value = 'Please enter a chapter slug.'
    return
  }

  if (!selectedFiles.value.length) {
    errorMessage.value = 'Please choose a chapter folder.'
    return
  }

  isUploading.value = true

  try {
    const slug = chapterSlug.value.trim()

    const { data: chapterInsert, error: chapterError } = await supabase
        .from('chapters')
        .insert([
          {
            title: chapterTitle.value.trim(),
            slug,
            published: published.value,
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

    if (chapterError) {
      errorMessage.value = chapterError.message
      return
    }

    const chapterId = chapterInsert.id
    const files = sortFilesNumerically(selectedFiles.value)
    const pageRows = []

    for (let i = 0; i < files.length; i += 1) {
      const file = files[i]
      const safeName = sanitizeFileName(file.name)
      const filePath = `${slug}/${Date.now()}-${i + 1}-${safeName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
          .from('comics')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          })

      if (uploadError) {
        errorMessage.value = uploadError.message
        return
      }

      pageRows.push({
        chapter_id: chapterId,
        image_path: uploadData.path,
        page_number: i + 1,
        is_cover: i === 0,
      })
    }

    const { error: pagesError } = await supabase
        .from('comic_pages')
        .insert(pageRows)

    if (pagesError) {
      errorMessage.value = pagesError.message
      return
    }

    successMessage.value = 'Chapter uploaded successfully.'
    resetForm()
    await loadChapters()
  } catch (error) {
    errorMessage.value = error?.message || 'Unable to upload chapter.'
  } finally {
    isUploading.value = false
  }
}

const handleDeleteChapter = async (chapter) => {
  const confirmed = window.confirm(
    `Delete "${chapter.title}" and all of its pages? This cannot be undone.`
  )

  if (!confirmed) return

  successMessage.value = ''
  errorMessage.value = ''
  deletingChapterId.value = chapter.id

  try {
    const { data: pageRows, error: pagesFetchError } = await supabase
      .from('comic_pages')
      .select('image_path')
      .eq('chapter_id', chapter.id)

    if (pagesFetchError) {
      errorMessage.value = pagesFetchError.message
      return
    }

    const filePaths = (pageRows || [])
      .map((page) => page.image_path)
      .filter(Boolean)

    if (filePaths.length) {
      const { error: storageDeleteError } = await supabase.storage
        .from('comics')
        .remove(filePaths)

      if (storageDeleteError) {
        errorMessage.value = storageDeleteError.message
        return
      }
    }

    const { data: deletedChapters, error: chapterDeleteError } = await supabase
      .from('chapters')
      .delete()
      .eq('id', chapter.id)
      .select()

    if (chapterDeleteError) {
      errorMessage.value = chapterDeleteError.message
      return
    }

    if (!deletedChapters || deletedChapters.length === 0) {
      errorMessage.value = 'No chapter was deleted.'
      return
    }

    chapters.value = chapters.value.filter((item) => item.id !== chapter.id)
    successMessage.value = `Deleted "${chapter.title}".`
  } catch (error) {
    errorMessage.value = error?.message || 'Unable to delete chapter.'
  } finally {
    deletingChapterId.value = null
  }
}

onMounted(async () => {
  await loadChapters()
})
</script>

<style scoped>
.page-title {
  color: var(--text-main);
}

.page-text {
  color: var(--text-muted);
}

.panel {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-main);
  font-weight: 600;
}

.form-input {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 0.95rem;
  padding: 0.85rem 1rem;
  box-sizing: border-box;
}

.file-picker-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.file-picker-btn,
.primary-btn,
.back-btn,
.delete-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-weight: 600;
  transition: transform 0.2s ease, opacity 0.2s ease;
  cursor: pointer;
}

.file-picker-btn:hover,
.primary-btn:hover,
.back-btn:hover,
.delete-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.delete-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.delete-btn {
  background: transparent;
  color: #dc2626;
  border-color: rgba(220, 38, 38, 0.35);
}

.file-picker-name {
  color: var(--text-muted);
  font-size: 0.95rem;
  text-align: center;
}

.preview-list {
  max-height: 18rem;
  overflow: auto;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  border-radius: 1rem;
  padding: 0.75rem;
}

.preview-item {
  color: var(--text-main);
  font-size: 0.95rem;
  padding: 0.35rem 0;
}

.chapter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  border-radius: 1rem;
  padding: 1rem;
}

.chapter-row-title {
  color: var(--text-main);
  font-weight: 600;
}

.chapter-row-meta {
  color: var(--text-muted);
  font-size: 0.9rem;
  margin-top: 0.25rem;
}

.success-text {
  color: #15803d;
}

.error-text {
  color: #dc2626;
}
</style>
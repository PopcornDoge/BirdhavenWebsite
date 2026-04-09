<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-6xl space-y-10">
      <div class="relative flex items-center justify-center">
        <div class="text-center">
          <h1 class="page-title text-4xl font-bold">Art Manager</h1>
          <p class="page-text mt-2">
            Upload new art, then edit titles, tags, and publishing whenever you want.
          </p>
        </div>

        <router-link
            to="/admin"
            class="back-btn absolute right-0"
        >
          Back to Admin
        </router-link>
      </div>

      <section class="panel space-y-6">
        <div>
          <h2 class="section-title text-2xl font-semibold">Upload New Art</h2>
          <p class="page-text mt-2">
            Choose between single-image upload with full controls, or bulk upload for quick drafts.
          </p>
        </div>

        <div class="upload-tabs">
          <button
              type="button"
              class="upload-tab"
              :class="{ 'upload-tab-active': uploadMode === 'single' }"
              @click="setUploadMode('single')"
          >
            Single Upload
          </button>

          <button
              type="button"
              class="upload-tab"
              :class="{ 'upload-tab-active': uploadMode === 'bulk' }"
              @click="setUploadMode('bulk')"
          >
            Bulk Upload
          </button>
        </div>

        <form
            v-if="uploadMode === 'single'"
            class="grid gap-5 md:grid-cols-2"
            @submit.prevent="handleSingleUpload"
        >
          <div class="md:col-span-2">
            <label class="form-label">Image File</label>

            <div class="file-picker-row">
              <label for="single-art-file-input" class="file-picker-btn">
                Choose File
              </label>

              <span class="file-picker-name">
                {{ singleSelectedFileName || 'No file selected' }}
              </span>
            </div>

            <input
                id="single-art-file-input"
                ref="singleFileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                @change="handleSingleFileChange"
                required
            />
          </div>

          <div class="md:col-span-2">
            <label class="form-label">Title</label>
            <input
                v-model="singleArt.title"
                type="text"
                class="form-input"
                placeholder="Image Name"
                required
            />
          </div>

          <div class="md:col-span-2">
            <label class="form-label">Tags</label>
            <div class="tag-entry-row">
              <input
                  v-model="singleTagInput"
                  type="text"
                  class="form-input"
                  placeholder="Add a tag and press Add"
                  @keydown.enter.prevent="addSingleTag"
              />
              <button type="button" class="tag-add-btn" @click="addSingleTag">
                Add
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                  v-for="tag in singleArt.tags"
                  :key="tag"
                  type="button"
                  class="tag-pill"
                  @click="removeSingleTag(tag)"
              >
                {{ tag }} ×
              </button>
            </div>
          </div>

          <div class="md:col-span-2 flex items-center gap-3">
            <label class="inline-flex items-center gap-2">
              <input v-model="singleArt.published" type="checkbox" />
              <span class="page-text">Published</span>
            </label>
          </div>

          <div class="md:col-span-2">
            <p v-if="uploadMessage" class="success-text">
              {{ uploadMessage }}
            </p>

            <p v-if="uploadError" class="error-text">
              {{ uploadError }}
            </p>
          </div>

          <div class="md:col-span-2">
            <button class="primary-btn" type="submit" :disabled="isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload Art' }}
            </button>
          </div>
        </form>

        <form
            v-else
            class="grid gap-5 md:grid-cols-2"
            @submit.prevent="handleBulkUpload"
        >
          <div class="md:col-span-2">
            <label class="form-label">Image Files</label>

            <div class="file-picker-row">
              <label for="bulk-art-file-input" class="file-picker-btn">
                Choose Images
              </label>

              <span class="file-picker-name">
                {{ bulkSelectedFilesLabel }}
              </span>
            </div>

            <input
                id="bulk-art-file-input"
                ref="bulkFileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                multiple
                @change="handleBulkFileChange"
                required
            />
          </div>

          <div v-if="bulkSelectedFiles.length" class="md:col-span-2">
            <p class="page-text mb-3">
              {{ bulkSelectedFiles.length }} file<span v-if="bulkSelectedFiles.length !== 1">s</span> selected
            </p>

            <div class="preview-list">
              <div
                  v-for="file in bulkSelectedFiles"
                  :key="file.name + file.size"
                  class="preview-item"
              >
                {{ formatTitleFromFileName(file.name) }}
              </div>
            </div>
          </div>

          <div class="md:col-span-2">
            <p v-if="uploadMessage" class="success-text">
              {{ uploadMessage }}
            </p>

            <p v-if="uploadError" class="error-text">
              {{ uploadError }}
            </p>
          </div>

          <div class="md:col-span-2">
            <button class="primary-btn" type="submit" :disabled="isUploading">
              {{ isUploading ? 'Uploading...' : 'Upload Selected Images' }}
            </button>
          </div>
        </form>
      </section>

      <section class="panel space-y-6">
        <div>
          <h2 class="section-title text-2xl font-semibold">Existing Art</h2>
          <p class="page-text mt-2">
            Review and update tags for existing art records.
          </p>
        </div>

        <div v-if="isLoadingArt" class="page-text">Loading art...</div>

        <div v-else class="space-y-6">
          <div class="flex flex-wrap items-center gap-3">
            <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip-active': filterNoTags }"
                @click="filterNoTags = !filterNoTags"
            >
              No Tags
            </button>

            <button
                type="button"
                class="filter-chip"
                :class="{ 'filter-chip-active': filterUnpublished }"
                @click="filterUnpublished = !filterUnpublished"
            >
              Unpublished
            </button>

            <button
                v-if="dirtyPieces.length"
                type="button"
                class="save-all-btn"
                :disabled="isSavingAll"
                @click="saveAllPieces"
            >
              {{ isSavingAll ? 'Saving All...' : `Save All Changes (${dirtyPieces.length})` }}
            </button>
          </div>

          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <input
                v-model="artSearch"
                type="text"
                class="form-input search-input"
                placeholder="Search by title, filename, or tag..."
            />

            <p class="page-text text-sm">
              {{ filteredAdminArtPieces.length }} result<span v-if="filteredAdminArtPieces.length !== 1">s</span>
            </p>
          </div>

          <div v-if="saveMessage" class="success-text">
            {{ saveMessage }}
          </div>

          <div v-if="saveError" class="error-text">
            {{ saveError }}
          </div>

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <article
                v-for="piece in filteredAdminArtPieces"
                :key="piece.id"
                class="art-card"
                :class="{ 'art-card-dirty': isPieceDirty(piece) }"
            >
              <img
                  :src="piece.imageUrl"
                  :alt="piece.title"
                  class="art-thumb"
              />

              <div class="space-y-3">
                <div>
                  <h3 class="card-title text-lg font-semibold">
                    {{ piece.title || 'Untitled' }}
                  </h3>
                  <p class="card-subtitle text-sm">
                    {{ piece.image_path }}
                  </p>
                </div>

                <div>
                  <label class="form-label">Edit Title</label>
                  <input
                      v-model="piece.title"
                      type="text"
                      class="form-input"
                      placeholder="Image title"
                  />
                </div>

                <div>
                  <label class="form-label">Edit Tags</label>
                  <div class="tag-entry-row">
                    <input
                        v-model="piece.newTag"
                        type="text"
                        class="form-input"
                        placeholder="Add tag"
                        @keydown.enter.prevent="addExistingTag(piece)"
                    />
                    <button type="button" class="tag-add-btn" @click="addExistingTag(piece)">
                      Add
                    </button>
                  </div>

                  <div class="mt-3 flex flex-wrap gap-2">
                    <button
                        v-for="tag in piece.tags"
                        :key="`${piece.id}-${tag}`"
                        type="button"
                        class="tag-pill"
                        @click="removeExistingTag(piece, tag)"
                    >
                      {{ tag }} ×
                    </button>
                  </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                  <label class="inline-flex items-center gap-2">
                    <input v-model="piece.published" type="checkbox" />
                    <span class="page-text">Published</span>
                  </label>

                  <button class="save-btn" @click="saveExistingPiece(piece)">
                    Save
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const filterNoName = ref(false)
const filterNoTags = ref(false)
const filterUnpublished = ref(false)
const isUploading = ref(false)
const isSavingAll = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const saveMessage = ref('')
const saveError = ref('')
const isLoadingArt = ref(true)
const artSearch = ref('')
const uploadMode = ref('single')

const singleTagInput = ref('')
const singleSelectedFile = ref(null)
const singleSelectedFileName = ref('')
const singleFileInputRef = ref(null)

const bulkSelectedFiles = ref([])
const bulkFileInputRef = ref(null)

const singleArt = reactive({
  title: '',
  alt: '',
  tags: [],
  published: true,
})

const artPieces = ref([])

const getPublicImageUrl = (imagePath) => {
  const { data } = supabase.storage.from('art').getPublicUrl(imagePath)
  return data?.publicUrl || ''
}

const sanitizeFileName = (name) => {
  return name
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
}

const normalizeTags = (tags) => {
  return [...(tags || [])].map((tag) => tag.trim()).filter(Boolean).sort()
}

const sameTags = (a, b) => {
  const left = normalizeTags(a)
  const right = normalizeTags(b)

  if (left.length !== right.length) return false
  return left.every((tag, index) => tag === right[index])
}

const formatTitleFromFileName = (fileName) => {
  return String(fileName || '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
}

const bulkSelectedFilesLabel = computed(() => {
  if (!bulkSelectedFiles.value.length) return 'No files selected'
  if (bulkSelectedFiles.value.length === 1) return bulkSelectedFiles.value[0].name
  return `${bulkSelectedFiles.value.length} files selected`
})

const isPieceDirty = (piece) => {
  return (
      (piece.title || '').trim() !== (piece.originalTitle || '').trim() ||
      (piece.alt || '').trim() !== (piece.originalAlt || '').trim() ||
      piece.published !== piece.originalPublished ||
      !sameTags(piece.tags, piece.originalTags)
  )
}

const dirtyPieces = computed(() => {
  return artPieces.value.filter((piece) => isPieceDirty(piece))
})

const filteredAdminArtPieces = computed(() => {
  const query = artSearch.value.trim().toLowerCase()

  return artPieces.value.filter((piece) => {
    const title = piece.originalTitle?.trim() || ''
    const alt = piece.originalAlt?.trim() || ''
    const tags = piece.originalTags || []

    const titleMatch = title.toLowerCase().includes(query)
    const fileMatch = piece.image_path?.toLowerCase().includes(query)
    const imageUrlMatch = piece.imageUrl?.toLowerCase().includes(query)
    const altMatch = alt.toLowerCase().includes(query)
    const tagMatch = tags.some((tag) => tag.toLowerCase().includes(query))

    const matchesSearch =
        !query || titleMatch || fileMatch || imageUrlMatch || altMatch || tagMatch

    const matchesNoName =
        !filterNoName.value || !title

    const matchesNoTags =
        !filterNoTags.value || tags.length === 0

    const matchesUnpublished =
        !filterUnpublished.value || piece.originalPublished === false

    return matchesSearch && matchesNoName && matchesNoTags && matchesUnpublished
  })
})

const setUploadMode = (mode) => {
  uploadMode.value = mode
  uploadMessage.value = ''
  uploadError.value = ''
}

const loadArt = async () => {
  isLoadingArt.value = true

  try {
    const { data, error } = await supabase
        .from('art')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
      console.error('loadArt error:', error)
      artPieces.value = []
      return
    }

    artPieces.value = (data || []).map((piece) => ({
      ...piece,
      imageUrl: getPublicImageUrl(piece.image_path),
      newTag: '',
      tags: [...(piece.tags || [])],
      originalTags: [...(piece.tags || [])],
      originalTitle: piece.title || '',
      originalAlt: piece.alt || '',
      originalPublished: piece.published,
    }))
  } finally {
    isLoadingArt.value = false
  }
}

const handleSingleFileChange = (event) => {
  const file = event.target.files?.[0] || null
  singleSelectedFile.value = file
  singleSelectedFileName.value = file?.name || ''
}

const handleBulkFileChange = (event) => {
  const files = Array.from(event.target.files || []).filter((file) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
  )

  bulkSelectedFiles.value = files
}

const addSingleTag = () => {
  const cleanTag = singleTagInput.value.trim()
  if (!cleanTag || singleArt.tags.includes(cleanTag)) return

  singleArt.tags.push(cleanTag)
  singleTagInput.value = ''
}

const removeSingleTag = (tagToRemove) => {
  const nextTags = singleArt.tags.filter((tag) => tag !== tagToRemove)
  singleArt.tags.splice(0, singleArt.tags.length, ...nextTags)
}

const resetSingleUploadForm = () => {
  singleArt.title = ''
  singleArt.alt = ''
  singleArt.tags.splice(0, singleArt.tags.length)
  singleArt.published = true
  singleTagInput.value = ''
  singleSelectedFile.value = null
  singleSelectedFileName.value = ''

  if (singleFileInputRef.value) {
    singleFileInputRef.value.value = ''
  }
}

const resetBulkUploadForm = () => {
  bulkSelectedFiles.value = []

  if (bulkFileInputRef.value) {
    bulkFileInputRef.value.value = ''
  }
}

const handleSingleUpload = async () => {
  uploadMessage.value = ''
  uploadError.value = ''

  if (!singleSelectedFile.value) {
    uploadError.value = 'Please select an image file.'
    return
  }

  isUploading.value = true

  try {
    const file = singleSelectedFile.value
    const safeName = sanitizeFileName(file.name)
    const fileName = `${Date.now()}-${safeName}`

    const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('art')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })

    if (uploadErr) {
      console.error('upload error:', uploadErr)
      uploadError.value = uploadErr.message
      return
    }

    const { error: insertErr } = await supabase
        .from('art')
        .insert([
          {
            title: singleArt.title.trim(),
            alt: (singleArt.alt || singleArt.title).trim(),
            image_path: uploadData.path,
            tags: singleArt.tags,
            published: singleArt.published,
          },
        ])

    if (insertErr) {
      console.error('insert error:', insertErr)
      uploadError.value = insertErr.message
      return
    }

    uploadMessage.value = 'Art uploaded successfully.'
    resetSingleUploadForm()
    await loadArt()
  } catch (error) {
    console.error('handleSingleUpload error:', error)
    uploadError.value = error?.message || 'Unable to upload to Supabase.'
  } finally {
    isUploading.value = false
  }
}

const handleBulkUpload = async () => {
  uploadMessage.value = ''
  uploadError.value = ''

  if (!bulkSelectedFiles.value.length) {
    uploadError.value = 'Please select one or more image files.'
    return
  }

  isUploading.value = true

  try {
    const rowsToInsert = []

    for (const file of bulkSelectedFiles.value) {
      const safeName = sanitizeFileName(file.name)
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`

      const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('art')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type || 'application/octet-stream',
          })

      if (uploadErr) {
        console.error('upload error:', uploadErr)
        uploadError.value = uploadErr.message
        return
      }

      const titleFromFile = formatTitleFromFileName(file.name)

      rowsToInsert.push({
        title: titleFromFile,
        alt: titleFromFile,
        image_path: uploadData.path,
        tags: [],
        published: false,
      })
    }

    const { error: insertErr } = await supabase
        .from('art')
        .insert(rowsToInsert)

    if (insertErr) {
      console.error('insert error:', insertErr)
      uploadError.value = insertErr.message
      return
    }

    uploadMessage.value = `${rowsToInsert.length} image${rowsToInsert.length !== 1 ? 's' : ''} uploaded successfully.`
    resetBulkUploadForm()
    await loadArt()
  } catch (error) {
    console.error('handleBulkUpload error:', error)
    uploadError.value = error?.message || 'Unable to upload to Supabase.'
  } finally {
    isUploading.value = false
  }
}

const addExistingTag = (piece) => {
  const cleanTag = piece.newTag.trim()
  if (!cleanTag || piece.tags.includes(cleanTag)) return

  piece.tags.push(cleanTag)
  piece.newTag = ''
}

const removeExistingTag = (piece, tagToRemove) => {
  piece.tags = piece.tags.filter((tag) => tag !== tagToRemove)
}

const syncPieceOriginals = (piece) => {
  piece.originalTitle = piece.title || ''
  piece.originalAlt = piece.alt || ''
  piece.originalTags = [...(piece.tags || [])]
  piece.originalPublished = piece.published
}

const saveExistingPiece = async (piece) => {
  saveMessage.value = ''
  saveError.value = ''

  const { error } = await supabase
      .from('art')
      .update({
        title: piece.title.trim(),
        alt: (piece.alt || piece.title).trim(),
        tags: piece.tags,
        published: piece.published,
        updated_at: new Date().toISOString(),
      })
      .eq('id', piece.id)

  if (error) {
    console.error('saveExistingPiece error:', error)
    saveError.value = `Unable to save "${piece.title || piece.image_path}".`
    return false
  }

  piece.alt = (piece.alt || piece.title).trim()
  syncPieceOriginals(piece)
  return true
}

const saveAllPieces = async () => {
  saveMessage.value = ''
  saveError.value = ''

  if (!dirtyPieces.value.length) return

  isSavingAll.value = true

  try {
    let successCount = 0

    for (const piece of dirtyPieces.value) {
      const didSave = await saveExistingPiece(piece)
      if (didSave) {
        successCount += 1
      }
    }

    if (successCount > 0) {
      saveMessage.value = `Saved ${successCount} item${successCount !== 1 ? 's' : ''}.`
    }
  } finally {
    isSavingAll.value = false
  }
}

onMounted(async () => {
  await loadArt()
})
</script>

<style scoped>
.page-title,
.section-title,
.card-title {
  color: var(--text-main);
}

.page-text,
.card-subtitle {
  color: var(--text-muted);
}

.panel {
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.upload-tabs {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.upload-tab {
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.75rem 1rem;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.upload-tab:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
}

.upload-tab-active {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-color: var(--border-strong);
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

.file-picker-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-strong);
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.file-picker-btn:hover {
  transform: translateY(-1px);
}

.file-picker-name {
  color: var(--text-muted);
  font-size: 0.95rem;
  word-break: break-word;
  text-align: center;
}

.search-input {
  max-width: 28rem;
}

.tag-entry-row {
  display: flex;
  gap: 0.75rem;
}

.tag-add-btn,
.save-btn,
.back-btn,
.primary-btn,
.save-all-btn {
  border: 1px solid var(--border-strong);
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-radius: 999px;
  padding: 0.8rem 1rem;
  font-weight: 600;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.tag-add-btn:hover,
.save-btn:hover,
.back-btn:hover,
.primary-btn:hover,
.save-all-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled,
.save-all-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tag-pill {
  border: 1px solid var(--border);
  background: var(--surface-hover);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.85rem;
}

.art-card {
  border: 1px solid var(--border);
  background: var(--surface-strong);
  border-radius: 1.25rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.art-card-dirty {
  border-color: var(--border-strong);
  box-shadow: 0 0 0 1px var(--border-strong);
}

.art-thumb {
  width: 100%;
  height: 16rem;
  object-fit: contain;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.08);
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

.success-text {
  color: #15803d;
}

.error-text {
  color: #dc2626;
}

.filter-chip {
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.65rem 0.95rem;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, border-color 0.2s ease;
}

.filter-chip:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
}

.filter-chip-active {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
  border-color: var(--border-strong);
}
</style>
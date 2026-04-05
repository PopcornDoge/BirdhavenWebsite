<template>
  <main class="min-h-screen px-6 py-28">
    <div class="mx-auto max-w-6xl space-y-10">
      <div class="relative flex items-center justify-center">
        <div class="text-center">
          <h1 class="page-title text-4xl font-bold">Art Manager</h1>
          <p class="page-text mt-2">
            Upload new art, add tags, and edit existing entries.
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
            Add a new image and tag it before publishing.
          </p>
        </div>

        <form class="grid gap-5 md:grid-cols-2" @submit.prevent="handleUpload">
          <div class="md:col-span-2">
            <label class="form-label">Image File</label>

            <div class="file-picker-row">
              <label for="art-file-input" class="file-picker-btn">
                Choose File
              </label>

              <span class="file-picker-name">
                {{ selectedFileName || 'No file selected' }}
              </span>
            </div>

            <input
                id="art-file-input"
                ref="fileInputRef"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                class="sr-only"
                @change="handleFileChange"
                required
            />
          </div>

          <div class="md:col-span-2">
            <label class="form-label">Title</label>
            <input
                v-model="newArt.title"
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
                  v-model="tagInput"
                  type="text"
                  class="form-input"
                  placeholder="Add a tag and press Add"
                  @keydown.enter.prevent="addTag"
              />
              <button type="button" class="tag-add-btn" @click="addTag">
                Add
              </button>
            </div>

            <div class="mt-3 flex flex-wrap gap-2">
              <button
                  v-for="tag in newArt.tags"
                  :key="tag"
                  type="button"
                  class="tag-pill"
                  @click="removeTag(tag)"
              >
                {{ tag }} ×
              </button>
            </div>
          </div>

          <div class="md:col-span-2 flex items-center gap-3">
            <label class="inline-flex items-center gap-2">
              <input v-model="newArt.published" type="checkbox"/>
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

          <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <article
                v-for="piece in filteredAdminArtPieces"
                :key="piece.id"
                class="art-card"
            >
              <img
                  :src="piece.imageUrl"
                  :alt="piece.title"
                  class="art-thumb"
              />

              <div class="space-y-3">
                <div>
                  <h3 class="card-title text-lg font-semibold">
                    {{ piece.title }}
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
                    <input v-model="piece.published" type="checkbox"/>
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
import {computed, onMounted, reactive, ref} from 'vue'
import {useRouter} from 'vue-router'
import {supabase} from '../lib/supabase.js'

const router = useRouter()

const isUploading = ref(false)
const uploadMessage = ref('')
const uploadError = ref('')
const isLoadingArt = ref(true)
const tagInput = ref('')
const selectedFile = ref(null)
const selectedFileName = ref('')
const fileInputRef = ref(null)
const artSearch = ref('')

const newArt = reactive({
  title: '',
  alt: '',
  tags: [],
  published: true,
})

const artPieces = ref([])

const getPublicImageUrl = (imagePath) => {
  const {data} = supabase.storage.from('art').getPublicUrl(imagePath)
  return data?.publicUrl || ''
}

const sanitizeFileName = (name) => {
  return name
      .normalize('NFKD')
      .replace(/[^\w.\-]+/g, '-')
      .replace(/-+/g, '-')
}

const filteredAdminArtPieces = computed(() => {
  const query = artSearch.value.trim().toLowerCase()

  if (!query) {
    return artPieces.value
  }

  return artPieces.value.filter((piece) => {
    const titleMatch = piece.title?.toLowerCase().includes(query)
    const fileMatch = piece.image_path?.toLowerCase().includes(query)
    const imageUrlMatch = piece.imageUrl?.toLowerCase().includes(query)
    const altMatch = piece.alt?.toLowerCase().includes(query)
    const tagMatch = (piece.tags || []).some((tag) =>
        tag.toLowerCase().includes(query)
    )

    return titleMatch || fileMatch || imageUrlMatch || altMatch || tagMatch
  })
})

const loadArt = async () => {
  isLoadingArt.value = true

  try {
    const {data, error} = await supabase
        .from('art')
        .select('*')
        .order('created_at', {ascending: false})

    if (error) {
      console.error('loadArt error:', error)
      artPieces.value = []
      return
    }

    artPieces.value = (data || []).map((piece) => ({
      ...piece,
      imageUrl: getPublicImageUrl(piece.image_path),
      newTag: '',
    }))
  } finally {
    isLoadingArt.value = false
  }
}

const handleFileChange = (event) => {
  const file = event.target.files?.[0] || null
  selectedFile.value = file
  selectedFileName.value = file?.name || ''
}

const addTag = () => {
  const cleanTag = tagInput.value.trim()
  if (!cleanTag || newArt.tags.includes(cleanTag)) return

  newArt.tags.push(cleanTag)
  tagInput.value = ''
}

const removeTag = (tagToRemove) => {
  const nextTags = newArt.tags.filter((tag) => tag !== tagToRemove)
  newArt.tags.splice(0, newArt.tags.length, ...nextTags)
}

const resetNewArtForm = () => {
  newArt.title = ''
  newArt.alt = ''
  newArt.tags.splice(0, newArt.tags.length)
  newArt.published = true
  tagInput.value = ''
  selectedFile.value = null
  selectedFileName.value = ''

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const handleUpload = async () => {
  uploadMessage.value = ''
  uploadError.value = ''

  if (!selectedFile.value) {
    uploadError.value = 'Please select an image file.'
    return
  }

  isUploading.value = true

  try {
    const file = selectedFile.value
    const safeName = sanitizeFileName(file.name)
    const fileName = `${Date.now()}-${safeName}`

    const {data: uploadData, error: uploadErr} = await supabase.storage
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

    const {error: insertErr} = await supabase
        .from('art')
        .insert([
          {
            title: newArt.title.trim(),
            alt: (newArt.alt || newArt.title).trim(),
            image_path: uploadData.path,
            tags: newArt.tags,
            published: newArt.published,
          },
        ])

    if (insertErr) {
      console.error('insert error:', insertErr)
      uploadError.value = insertErr.message
      return
    }

    uploadMessage.value = 'Art uploaded successfully.'
    resetNewArtForm()
    await loadArt()
  } catch (error) {
    console.error('handleUpload error:', error)
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

const saveExistingPiece = async (piece) => {
  const {error} = await supabase
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

.form-file {
  padding: 0.7rem 1rem;
}

.file-picker-row {
  display: flex;
  flex-direction: column;
  align-items: center; /* centers horizontally */
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
.primary-btn {
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
.primary-btn:hover {
  transform: translateY(-1px);
}

.primary-btn:disabled {
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

.art-thumb {
  width: 100%;
  height: 16rem;
  object-fit: contain;
  border-radius: 1rem;
  background: rgba(0, 0, 0, 0.08);
}

.success-text {
  color: #15803d;
}

.error-text {
  color: #dc2626;
}
</style>
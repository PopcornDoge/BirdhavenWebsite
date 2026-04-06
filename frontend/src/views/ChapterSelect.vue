<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-6xl px-6 py-28">
      <div class="mb-12 flex flex-col items-center justify-between gap-6 sm:flex-row">
        <h1 class="page-title text-4xl font-bold md:text-5xl">
          Chapter Select
        </h1>

        <div class="view-toggle flex rounded-full border p-1 backdrop-blur-sm">
          <button
              class="toggle-button rounded-full px-4 py-2 text-sm font-medium transition"
              :class="viewMode === 'grid' ? 'toggle-active' : 'toggle-inactive'"
              @click="viewMode = 'grid'"
          >
            Grid
          </button>

          <button
              class="toggle-button rounded-full px-4 py-2 text-sm font-medium transition"
              :class="viewMode === 'list' ? 'toggle-active' : 'toggle-inactive'"
              @click="viewMode = 'list'"
          >
            List
          </button>
        </div>
      </div>

      <div v-if="isLoading" class="empty-state rounded-2xl border p-8 text-center">
        Loading chapters...
      </div>

      <div v-else-if="loadError" class="empty-state rounded-2xl border p-8 text-center">
        {{ loadError }}
      </div>

      <div
          v-else-if="viewMode === 'grid'"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <router-link
            v-for="chapter in chapters"
            :key="chapter.id"
            :to="`/read/${chapter.slug}`"
            class="chapter-card group overflow-hidden rounded-2xl border backdrop-blur-sm transition duration-300 hover:-translate-y-1"
        >
          <div class="aspect-[4/3] overflow-hidden">
            <img
                v-if="chapter.cover"
                :src="chapter.cover"
                :alt="chapter.title"
                class="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />

            <div v-else class="thumbnail-box flex h-full w-full items-center justify-center">
              <span class="chapter-label text-sm">No Cover</span>
            </div>
          </div>

          <div class="p-5">
            <p class="chapter-label text-sm uppercase tracking-[0.2em]">
              {{ chapter.label }}
            </p>

            <h2 class="chapter-title mt-2 text-2xl font-semibold">
              {{ chapter.title }}
            </h2>
          </div>
        </router-link>
      </div>

      <div v-else class="flex flex-col gap-1">
        <router-link
            v-for="chapter in chapters"
            :key="chapter.id"
            :to="`/read/${chapter.slug}`"
            class="chapter-card group flex items-center gap-4 rounded-2xl border p-2 backdrop-blur-sm transition duration-300 hover:-translate-y-1"
        >
          <div class="thumbnail-box h-10 w-10 shrink-0 overflow-hidden rounded-md">
            <img
                v-if="chapter.cover"
                :src="chapter.cover"
                :alt="chapter.title"
                class="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />

            <div v-else class="flex h-full w-full items-center justify-center">
              <span class="chapter-label text-[10px]">No Cover</span>
            </div>
          </div>

          <div class="min-w-0 text-left">
            <p class="chapter-label text-xs uppercase tracking-[0.2em]">
              {{ chapter.label }}
            </p>

            <h2 class="chapter-title mt-0 text-sm font-semibold">
              {{ chapter.title }}
            </h2>
          </div>
        </router-link>
      </div>
    </section>
  </main>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { supabase } from '../lib/supabase.js'

const viewMode = ref('grid')
const chapters = ref([])
const isLoading = ref(true)
const loadError = ref('')

const getPublicImageUrl = (imagePath) => {
  const cleanPath = String(imagePath || '').replace(/^comics\//, '')
  const { data } = supabase.storage.from('comics').getPublicUrl(cleanPath)
  return data?.publicUrl || ''
}

const loadChapters = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const { data: chapterRows, error: chapterError } = await supabase
        .from('chapters')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: true })

    if (chapterError) {
      throw chapterError
    }

    const chapterIds = (chapterRows || []).map((chapter) => chapter.id)

    let coverRows = []

    if (chapterIds.length) {
      const { data, error } = await supabase
          .from('comic_pages')
          .select('chapter_id, image_path, is_cover, page_number')
          .in('chapter_id', chapterIds)
          .eq('is_cover', true)

      if (error) {
        throw error
      }

      coverRows = data || []
    }

    const coverMap = new Map(
        coverRows.map((page) => [page.chapter_id, getPublicImageUrl(page.image_path)])
    )

    chapters.value = (chapterRows || []).map((chapter, index) => ({
      ...chapter,
      label: `Chapter ${index + 1}`,
      cover: coverMap.get(chapter.id) || '',
    }))
  } catch (error) {
    console.error('loadChapters error:', error)
    loadError.value = 'Unable to load chapters right now.'
    chapters.value = []
  } finally {
    isLoading.value = false
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

.view-toggle {
  border-color: var(--border);
  background: var(--surface);
}

.toggle-active {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.toggle-inactive {
  color: var(--text-muted);
}

.toggle-inactive:hover {
  background: var(--surface-hover);
}

.chapter-card {
  border-color: var(--border);
  background: var(--surface);
}

.chapter-card:hover {
  background: var(--surface-hover);
}

.chapter-label {
  color: var(--text-soft);
}

.chapter-title {
  color: var(--text-main);
}

.thumbnail-box {
  background: var(--surface-strong);
}

.empty-state {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text-main);
}
</style>
<template>
  <main class="min-h-screen">
    <section class="mx-auto w-full max-w-7xl px-6 py-28">
      <div class="mb-10 text-center">
        <p class="page-label text-sm uppercase tracking-[0.3em]">
          Gallery
        </p>
        <h1 class="page-title mt-2 text-4xl font-bold md:text-5xl">
          Art
        </h1>
      </div>

      <div class="mb-10 flex flex-col items-center gap-4">
        <button
            type="button"
            class="filter-toggle"
            @click="isFilterOpen = !isFilterOpen"
        >
          {{ isFilterOpen ? 'Hide Filters' : 'Show Filters' }}
        </button>

        <Transition name="filter-panel">
          <div
              v-if="isFilterOpen"
              class="filter-panel flex w-full max-w-3xl flex-col items-center gap-4"
          >
            <input
                v-model="filterSearch"
                type="text"
                placeholder="Search filters..."
                class="filter-search w-full rounded-full border px-4 py-3 outline-none"
            />

            <div class="flex flex-wrap justify-center gap-3">
              <button
                  type="button"
                  class="filter-chip"
                  :class="{ 'filter-chip-active': selectedTag === 'all' }"
                  @click="selectedTag = 'all'"
              >
                All
              </button>

              <button
                  v-for="tag in visibleTags"
                  :key="tag.name"
                  type="button"
                  class="filter-chip"
                  :class="{ 'filter-chip-active': selectedTag === tag.name }"
                  @click="selectedTag = tag.name"
              >
                {{ tag.name }}
                <span class="ml-2 opacity-70">({{ tag.count }})</span>
              </button>
            </div>

            <p
                v-if="!visibleTags.length"
                class="filter-empty text-sm"
            >
              No filters match that search.
            </p>
          </div>
        </Transition>
      </div>

      <div
          v-if="isLoading"
          class="empty-state mx-auto max-w-xl rounded-2xl border p-8 text-center"
      >
        Loading art...
      </div>

      <div
          v-else-if="loadError"
          class="empty-state mx-auto max-w-xl rounded-2xl border p-8 text-center"
      >
        {{ loadError }}
      </div>

      <div
          v-else-if="filteredArtPieces.length"
          class="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3 xl:columns-4"
      >
        <div
            v-for="(piece, index) in filteredArtPieces"
            :key="piece.id"
            class="break-inside-avoid"
        >
          <button
              type="button"
              class="block w-full cursor-pointer text-left"
              @click="openLightbox(index)"
          >
            <img
                :src="piece.imageUrl"
                :alt="piece.title"
                class="w-full h-auto object-contain transition duration-300 hover:scale-[1.02]"
                loading="lazy"
            />
          </button>
        </div>
      </div>

      <div
          v-else
          class="empty-state mx-auto max-w-xl rounded-2xl border p-8 text-center"
      >
        No art matches that tag.
      </div>

      <div
          v-if="isLightboxOpen"
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          @click="closeLightbox"
      >
        <button
            type="button"
            class="absolute right-6 top-6 z-[110] rounded-full border border-white/20 bg-black/40 px-4 py-2 text-white transition hover:bg-white/10"
            @click.stop="closeLightbox"
            aria-label="Close image viewer"
        >
          ✕
        </button>

        <button
            v-if="filteredArtPieces.length > 1"
            type="button"
            class="absolute left-4 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-4 py-3 text-2xl text-white transition hover:bg-white/10 md:left-8"
            @click.stop="prevImage"
            aria-label="Previous image"
        >
          ‹
        </button>

        <div
            class="flex max-h-[90vh] max-w-[90vw] flex-col items-center justify-center"
            @click.stop
        >
          <img
              :src="currentImage.imageUrl"
              :alt="currentImage.title"
              class="max-h-[80vh] max-w-[90vw] object-contain shadow-2xl"
          />
        </div>

        <button
            v-if="filteredArtPieces.length > 1"
            type="button"
            class="absolute right-4 top-1/2 z-[110] -translate-y-1/2 rounded-full border border-white/20 bg-black/40 px-4 py-3 text-2xl text-white transition hover:bg-white/10 md:right-8"
            @click.stop="nextImage"
            aria-label="Next image"
        >
          ›
        </button>

        <div
            class="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/40 px-4 py-2 text-sm text-white/80"
        >
          {{ currentIndex + 1 }} / {{ filteredArtPieces.length }}
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { supabase } from '../lib/supabase.js'

const artPieces = ref([])
const isLoading = ref(true)
const loadError = ref('')
const isFilterOpen = ref(false)
const filterSearch = ref('')
const selectedTag = ref('all')
const isLightboxOpen = ref(false)
const currentIndex = ref(0)

const getPublicImageUrl = (imagePath) => {
  const { data } = supabase.storage.from('art').getPublicUrl(imagePath)
  return data?.publicUrl || ''
}

const loadArt = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const { data, error } = await supabase
        .from('art')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false })

    if (error) {
      console.error('loadArt error:', error)
      throw error
    }

    artPieces.value = (data || []).map((piece) => ({
      ...piece,
      imageUrl: getPublicImageUrl(piece.image_path),
    }))
  } catch (error) {
    loadError.value = 'Unable to load gallery right now.'
    artPieces.value = []
  } finally {
    isLoading.value = false
  }
}

const sortedTags = computed(() => {
  const tagCounts = new Map()

  artPieces.value.forEach((piece) => {
    ;(piece.tags || []).forEach((tag) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })

  return [...tagCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      })
})

const visibleTags = computed(() => {
  const query = filterSearch.value.trim().toLowerCase()

  if (!query) return sortedTags.value

  return sortedTags.value.filter((tag) =>
      tag.name.toLowerCase().includes(query)
  )
})

const filteredArtPieces = computed(() => {
  if (selectedTag.value === 'all') {
    return artPieces.value
  }

  return artPieces.value.filter((piece) =>
      (piece.tags || []).includes(selectedTag.value)
  )
})

const currentImage = computed(() => {
  return filteredArtPieces.value[currentIndex.value] || {
    imageUrl: '',
    title: '',
    image_path: '',
    tags: [],
  }
})

const openLightbox = (index) => {
  currentIndex.value = index
  isLightboxOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeLightbox = () => {
  isLightboxOpen.value = false
  document.body.style.overflow = ''
}

const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % filteredArtPieces.value.length
}

const prevImage = () => {
  currentIndex.value =
      (currentIndex.value - 1 + filteredArtPieces.value.length) % filteredArtPieces.value.length
}

const handleKeydown = (event) => {
  if (!isLightboxOpen.value) return

  if (event.key === 'Escape') {
    closeLightbox()
  } else if (event.key === 'ArrowRight') {
    nextImage()
  } else if (event.key === 'ArrowLeft') {
    prevImage()
  }
}

watch(selectedTag, () => {
  currentIndex.value = 0
})

watch(isFilterOpen, (open) => {
  if (!open) {
    filterSearch.value = ''
  }
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  await loadArt()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.body.style.overflow = ''
})
</script>

<style scoped>
.page-label {
  color: var(--text-soft);
}

.page-title {
  color: var(--text-main);
}

.art-title {
  color: var(--text-main);
}

.filter-toggle {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  font-weight: 600;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.filter-toggle:hover {
  background: var(--surface-hover);
}

.filter-panel {
  width: 100%;
}

.filter-search {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text-main);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.filter-search::placeholder {
  color: var(--text-soft);
}

.filter-search:focus {
  border-color: var(--border-strong);
}

.filter-chip {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.filter-chip:hover {
  background: var(--surface-hover);
}

.filter-chip-active {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.filter-empty {
  color: var(--text-soft);
}

.empty-state {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text-main);
}

.filter-panel-enter-active,
.filter-panel-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.filter-panel-enter-from,
.filter-panel-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.filter-panel-enter-to,
.filter-panel-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
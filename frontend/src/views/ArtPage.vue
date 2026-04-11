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
              class="filter-panel"
          >
            <div class="filter-search-wrap">
              <input
                  ref="filterSearchInputRef"
                  v-model="filterSearch"
                  type="text"
                  placeholder="Search filters..."
                  class="filter-search"
                  @focus="isAutocompleteOpen = true"
                  @keydown.down.prevent="moveAutocompleteSelection(1)"
                  @keydown.up.prevent="moveAutocompleteSelection(-1)"
                  @keydown.enter.prevent="handleAutocompleteEnter"
                  @keydown.esc="closeAutocomplete"
              />

              <div
                  v-if="showAutocomplete"
                  class="filter-autocomplete"
              >
                <button
                    v-for="(tag, index) in autocompleteTags"
                    :key="tag.name"
                    type="button"
                    class="filter-autocomplete-item"
                    :class="{ 'filter-autocomplete-item-active': index === autocompleteIndex }"
                    @mousedown.prevent="selectAutocompleteTag(tag.name)"
                >
                  <span>{{ tag.name }}</span>
                  <span class="opacity-70">({{ tag.count }})</span>
                </button>
              </div>
            </div>

            <div class="filter-toolbar">
              <button
                  type="button"
                  class="filter-toggle-pill"
                  @click="toggleMatchMode"
              >
                {{ matchMode === 'all' ? 'Match All' : 'Match Any' }}
              </button>

              <button
                  type="button"
                  class="filter-toggle-pill"
                  @click="toggleSortMode"
              >
                {{ sortMode === 'newest' ? 'Newest First' : 'Oldest First' }}
              </button>

              <button
                  v-if="selectedTags.length"
                  type="button"
                  class="filter-clear-pill"
                  @click="clearSelectedTags"
              >
                Clear Filters
              </button>
            </div>

            <div class="filter-chip-panel">
              <div class="filter-chip-grid">
                <button
                    type="button"
                    class="filter-chip"
                    :class="{ 'filter-chip-active': selectedTags.length === 0 }"
                    @click="clearSelectedTags"
                >
                  All
                </button>

                <button
                    v-for="tag in displayedTags"
                    :key="tag.name"
                    type="button"
                    class="filter-chip"
                    :class="{ 'filter-chip-active': selectedTags.includes(tag.name) }"
                    @click="toggleTag(tag.name)"
                >
                  {{ tag.name }}
                  <span class="ml-2 opacity-70">({{ tag.count }})</span>
                </button>
              </div>

              <button
                  v-if="shouldShowMoreButton"
                  type="button"
                  class="show-more-btn"
                  @click="isShowingAllTags = !isShowingAllTags"
              >
                {{ isShowingAllTags ? 'Show Less' : `Show More (${hiddenTagCount})` }}
              </button>
            </div>

            <div
                v-if="selectedTags.length"
                class="selected-filters"
            >
              <span class="page-label text-sm">Active filters:</span>

              <button
                  v-for="tag in selectedTags"
                  :key="`selected-${tag}`"
                  type="button"
                  class="selected-filter-pill"
                  @click="toggleTag(tag)"
              >
                {{ tag }} ×
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
        No art matches the selected filters.
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
            class="flex max-h-[90vh] max-w-[90vw] flex-col items-center justify-center gap-4"
            @click.stop
        >
          <div
              v-if="currentImage.title"
              class="lightbox-title rounded-full bg-black/40 px-5 py-2 text-center text-white"
          >
            {{ currentImage.title }}
          </div>

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
const selectedTags = ref([])
const matchMode = ref('all')
const sortMode = ref('newest')
const isLightboxOpen = ref(false)
const currentIndex = ref(0)

const isAutocompleteOpen = ref(false)
const autocompleteIndex = ref(0)
const filterSearchInputRef = ref(null)
const isShowingAllTags = ref(false)

const COLLAPSED_TAG_LIMIT = 11

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

const displayedTags = computed(() => {
  if (isShowingAllTags.value) {
    return visibleTags.value
  }

  return visibleTags.value.slice(0, COLLAPSED_TAG_LIMIT)
})

const hiddenTagCount = computed(() => {
  return Math.max(visibleTags.value.length - COLLAPSED_TAG_LIMIT, 0)
})

const shouldShowMoreButton = computed(() => {
  return visibleTags.value.length > COLLAPSED_TAG_LIMIT
})

const autocompleteTags = computed(() => {
  const query = filterSearch.value.trim().toLowerCase()

  if (!query) return []

  return sortedTags.value
      .filter((tag) =>
          tag.name.toLowerCase().includes(query) &&
          !selectedTags.value.includes(tag.name)
      )
      .slice(0, 8)
})

const showAutocomplete = computed(() => {
  return (
      isAutocompleteOpen.value &&
      autocompleteTags.value.length > 0 &&
      filterSearch.value.trim().length > 0
  )
})

const filteredArtPieces = computed(() => {
  let pieces = [...artPieces.value]

  if (selectedTags.value.length) {
    pieces = pieces.filter((piece) => {
      const pieceTags = piece.tags || []

      if (matchMode.value === 'all') {
        return selectedTags.value.every((tag) => pieceTags.includes(tag))
      }

      return selectedTags.value.some((tag) => pieceTags.includes(tag))
    })
  }

  pieces.sort((a, b) => {
    const aTime = new Date(a.created_at || 0).getTime()
    const bTime = new Date(b.created_at || 0).getTime()

    if (sortMode.value === 'oldest') {
      return aTime - bTime
    }

    return bTime - aTime
  })

  return pieces
})

const currentImage = computed(() => {
  return filteredArtPieces.value[currentIndex.value] || {
    imageUrl: '',
    title: '',
    image_path: '',
    tags: [],
  }
})

const toggleTag = (tagName) => {
  if (selectedTags.value.includes(tagName)) {
    selectedTags.value = selectedTags.value.filter((tag) => tag !== tagName)
    return
  }

  selectedTags.value = [...selectedTags.value, tagName]
}

const clearSelectedTags = () => {
  selectedTags.value = []
}

const toggleMatchMode = () => {
  matchMode.value = matchMode.value === 'all' ? 'any' : 'all'
}

const toggleSortMode = () => {
  sortMode.value = sortMode.value === 'newest' ? 'oldest' : 'newest'
}

const selectAutocompleteTag = (tagName) => {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value = [...selectedTags.value, tagName]
  }

  filterSearch.value = ''
  autocompleteIndex.value = 0
  isAutocompleteOpen.value = false
}

const moveAutocompleteSelection = (direction) => {
  if (!showAutocomplete.value) {
    isAutocompleteOpen.value = true
    autocompleteIndex.value = 0
    return
  }

  const lastIndex = autocompleteTags.value.length - 1

  if (direction > 0) {
    autocompleteIndex.value =
        autocompleteIndex.value >= lastIndex ? 0 : autocompleteIndex.value + 1
    return
  }

  autocompleteIndex.value =
      autocompleteIndex.value <= 0 ? lastIndex : autocompleteIndex.value - 1
}

const handleAutocompleteEnter = () => {
  if (showAutocomplete.value && autocompleteTags.value[autocompleteIndex.value]) {
    selectAutocompleteTag(autocompleteTags.value[autocompleteIndex.value].name)
    return
  }

  if (visibleTags.value.length === 1 && !selectedTags.value.includes(visibleTags.value[0].name)) {
    selectAutocompleteTag(visibleTags.value[0].name)
  }
}

const closeAutocomplete = () => {
  isAutocompleteOpen.value = false
  autocompleteIndex.value = 0
}

const handleDocumentClick = (event) => {
  if (!filterSearchInputRef.value) return

  const wrapper = filterSearchInputRef.value.closest('.filter-search-wrap')
  if (wrapper && !wrapper.contains(event.target)) {
    closeAutocomplete()
  }
}

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
  if (isLightboxOpen.value) {
    if (event.key === 'Escape') {
      closeLightbox()
    } else if (event.key === 'ArrowRight') {
      nextImage()
    } else if (event.key === 'ArrowLeft') {
      prevImage()
    }
  }
}

watch([selectedTags, matchMode, sortMode], () => {
  currentIndex.value = 0
})

watch(filterSearch, () => {
  autocompleteIndex.value = 0
  isAutocompleteOpen.value = true
  isShowingAllTags.value = false
})

watch(isFilterOpen, (open) => {
  if (!open) {
    filterSearch.value = ''
    closeAutocomplete()
    isShowingAllTags.value = false
  }
})

onMounted(async () => {
  window.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', handleDocumentClick)
  await loadArt()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', handleDocumentClick)
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
  width: min(100%, 56rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 1.5rem;
  padding: 1rem;
}

.filter-search-wrap {
  position: relative;
  width: 100%;
}

.lightbox-title {
  max-width: min(90vw, 40rem);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.4;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.filter-search {
  width: 100%;
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.95rem 1rem;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.filter-search::placeholder {
  color: var(--text-soft);
}

.filter-search:focus {
  border-color: var(--border-strong);
}

.filter-autocomplete {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  z-index: 20;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 1rem;
  padding: 0.4rem;
  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.filter-autocomplete-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  text-align: left;
  border: none;
  background: transparent;
  color: var(--text-main);
  border-radius: 0.8rem;
  padding: 0.75rem 0.9rem;
  transition: background 0.2s ease, color 0.2s ease;
}

.filter-autocomplete-item:hover,
.filter-autocomplete-item-active {
  background: var(--surface-hover);
}

.filter-toolbar {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

.filter-toggle-pill,
.filter-clear-pill {
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.7rem 1rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

.filter-toggle-pill:hover,
.filter-clear-pill:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.filter-chip-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.filter-chip-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.filter-chip {
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-muted);
  border-radius: 999px;
  padding: 0.75rem 0.95rem;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  text-align: center;
}

.filter-chip:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.filter-chip-active {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.show-more-btn {
  align-self: center;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  font-weight: 600;
  transition: background 0.2s ease, transform 0.2s ease;
}

.show-more-btn:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.selected-filters {
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
  align-items: center;
}

.selected-filter-pill {
  border: 1px solid var(--border);
  background: var(--surface-strong);
  color: var(--text-main);
  border-radius: 999px;
  padding: 0.45rem 0.8rem;
  font-size: 0.9rem;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.selected-filter-pill:hover {
  background: var(--surface-hover);
}

.filter-empty {
  color: var(--text-soft);
  text-align: center;
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

@media (min-width: 768px) {
  .filter-chip-grid {
    grid-template-columns: repeat(6, minmax(0, 1fr));
  }
}
</style>
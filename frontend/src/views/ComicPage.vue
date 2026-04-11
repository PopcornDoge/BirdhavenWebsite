<template>
  <main class="min-h-screen">
    <section class="w-full px-4 py-24">
      <div class="mx-auto mb-8 max-w-5xl text-center">
        <p class="chapter-label text-sm uppercase tracking-[0.3em]">
          {{ chapterData.label }}
        </p>
        <h1 class="chapter-title mt-2 text-4xl font-bold md:text-5xl">
          {{ chapterData.title }}
        </h1>
      </div>

      <div v-if="isLoading" class="mx-auto max-w-5xl text-center">
        <p class="chapter-label">Loading chapter...</p>
      </div>

      <div v-else-if="loadError" class="mx-auto max-w-5xl text-center">
        <p class="chapter-label">{{ loadError }}</p>
      </div>

      <div v-else class="flex flex-col gap-8">
        <div
            v-for="(page, index) in comicPages"
            :key="page.id"
            :ref="el => setPageRef(el, index)"
            class="page-frame transition-all duration-1000 ease-out"
            :class="[
            visiblePages[index] !== false ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
            widePages[index] ? 'page-frame-wide' : 'page-frame-normal',
            activeHotspot?.pageId === page.id ? 'page-frame-active' : ''
          ]"
        >
          <div class="comic-image-wrap">
            <img
                :src="page.src"
                :alt="page.alt || page.name || chapterData.title"
                class="comic-image"
                loading="lazy"
                @load="handleImageLoad($event, index)"
            />

            <button
                v-for="hotspot in page.hotspots || []"
                :key="hotspot.id"
                type="button"
                class="comic-hotspot"
                :style="getHotspotStyle(hotspot)"
                :aria-label="hotspot.popupTitle || 'Comic concept explanation'"
                @mouseenter="setActiveHotspot(page.id, hotspot.id)"
                @mouseleave="clearActiveHotspot"
                @focus="setActiveHotspot(page.id, hotspot.id)"
                @blur="clearActiveHotspot"
                @click="openHotspotLightbox(hotspot)"
            >
              <div
                  v-if="isHotspotActive(page.id, hotspot.id)"
                  class="hotspot-popup"
                  :class="hotspot.popupPosition === 'left' ? 'hotspot-popup-left' : 'hotspot-popup-right'"
                  :style="getPopupStyle(hotspot)"
              >
                <img
                    v-if="hotspot.popupImage"
                    :src="hotspot.popupImage"
                    :alt="hotspot.popupTitle || 'Explanation image'"
                    class="hotspot-popup-image"
                />

                <div
                    v-if="hotspot.popupTitle || hotspot.popupText"
                    class="hotspot-popup-copy"
                >
                  <p v-if="hotspot.popupTitle" class="hotspot-popup-title">
                    {{ hotspot.popupTitle }}
                  </p>

                  <p v-if="hotspot.popupText" class="hotspot-popup-text">
                    {{ hotspot.popupText }}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
          v-if="previousChapter || nextChapter"
          class="chapter-nav mx-auto mt-12 flex max-w-5xl items-center justify-center gap-4"
      >
        <router-link
            v-if="previousChapter"
            :to="previousChapter"
            class="chapter-nav-btn"
        >
          Previous Chapter
        </router-link>

        <router-link
            v-if="nextChapter"
            :to="nextChapter"
            class="chapter-nav-btn"
        >
          Next Chapter
        </router-link>
      </div>
    </section>

    <div
        v-if="hotspotLightboxImage"
        class="hotspot-lightbox"
        @click="closeHotspotLightbox"
    >
      <button
          type="button"
          class="hotspot-lightbox-close"
          @click.stop="closeHotspotLightbox"
          aria-label="Close hotspot image"
      >
        ✕
      </button>

      <img
          :src="hotspotLightboxImage"
          alt="Expanded hotspot"
          class="hotspot-lightbox-image"
          @click.stop
      />
    </div>
  </main>
</template>

<script setup>
import { computed, ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { supabase } from '../lib/supabase.js'

const route = useRoute()

const isLoading = ref(true)
const loadError = ref('')
const chapters = ref([])
const chapterRecord = ref(null)
const comicPages = ref([])

const visiblePages = ref([])
const widePages = ref([])
const pageRefs = ref([])
const activeHotspot = ref(null)
const hotspotLightboxImage = ref('')

let observer = null

const normalizeSlug = (value) => String(value || '').trim().toLowerCase()

const getPublicImageUrl = (imagePath) => {
  const cleanPath = String(imagePath || '').replace(/^comics\//, '')
  const { data } = supabase.storage.from('comics').getPublicUrl(cleanPath)
  return data?.publicUrl || ''
}

const currentChapter = computed(() => normalizeSlug(route.params.chapter))

const publishedChapters = computed(() => {
  return [...chapters.value]
      .filter((chapter) => chapter.published !== false)
      .sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime()
        const bDate = new Date(b.created_at || 0).getTime()
        return aDate - bDate
      })
})

const currentChapterIndex = computed(() => {
  const currentSlug = chapterRecord.value?.slug
      ? normalizeSlug(chapterRecord.value.slug)
      : currentChapter.value

  return publishedChapters.value.findIndex(
      (chapter) => normalizeSlug(chapter.slug) === currentSlug
  )
})

const previousChapter = computed(() => {
  const index = currentChapterIndex.value
  if (index > 0) {
    return `/read/${publishedChapters.value[index - 1].slug}`
  }
  return null
})

const nextChapter = computed(() => {
  const index = currentChapterIndex.value
  if (index !== -1 && index < publishedChapters.value.length - 1) {
    return `/read/${publishedChapters.value[index + 1].slug}`
  }
  return null
})

const chapterData = computed(() => {
  const index = currentChapterIndex.value

  if (!chapterRecord.value) {
    return {
      label: 'Unknown Chapter',
      title: 'Untitled',
    }
  }

  return {
    label: index !== -1 ? `Chapter ${index + 1}` : 'Chapter',
    title: chapterRecord.value.title || 'Untitled',
  }
})

const setPageRef = (el, index) => {
  if (el) {
    pageRefs.value[index] = el
  }
}

const handleImageLoad = (event, index) => {
  const img = event.target
  widePages.value[index] = img.naturalWidth > img.naturalHeight
}

const setActiveHotspot = (pageId, hotspotId) => {
  activeHotspot.value = { pageId, hotspotId }
}

const clearActiveHotspot = () => {
  activeHotspot.value = null
}

const isHotspotActive = (pageId, hotspotId) => {
  return (
      activeHotspot.value?.pageId === pageId &&
      activeHotspot.value?.hotspotId === hotspotId
  )
}

const getHotspotStyle = (hotspot) => {
  return {
    left: `${hotspot.x}%`,
    top: `${hotspot.y}%`,
    width: `${hotspot.width}%`,
    height: `${hotspot.height}%`,
  }
}

const getPopupStyle = (hotspot) => {
  return {
    width: hotspot.popupWidth || 'min(30vw, 400px)',
    maxWidth: '90vw',
    height: hotspot.popupHeight || 'auto',
  }
}

const openHotspotLightbox = (hotspot) => {
  if (!hotspot?.popupImage) return
  hotspotLightboxImage.value = hotspot.popupImage
  document.body.style.overflow = 'hidden'
}

const closeHotspotLightbox = () => {
  hotspotLightboxImage.value = ''
  document.body.style.overflow = ''
}

const getHotspotsForPage = (page) => {
  const fileName = page.image_path?.split('/').pop()?.toLowerCase() || ''
  const chapterSlug = chapterRecord.value?.slug || ''

  if (chapterSlug === 'chapter1' && fileName.includes('ch1p15')) {
    return [
      {
        id: 'Terubi Notes',
        x: 55,
        y: 85,
        width: 39,
        height: 10,
        popupImage: 'https://kxucuowecyzvxihbfszq.supabase.co/storage/v1/object/public/hotspotNotes/voxernotesterubi.png',
        popupWidth: 'min(30vw, 1000px)',
        popupPosition: 'right',
      }
    ]
  }

  return []
}

const setupObserver = async () => {
  if (observer) {
    observer.disconnect()
  }

  pageRefs.value = []
  widePages.value = comicPages.value.map(() => false)
  visiblePages.value = comicPages.value.map(() => true)

  await nextTick()

  if (!('IntersectionObserver' in window)) {
    return
  }

  observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = pageRefs.value.findIndex((el) => el === entry.target)

          if (index !== -1 && entry.isIntersecting) {
            visiblePages.value[index] = true
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -5% 0px',
      }
  )

  pageRefs.value.forEach((el) => {
    if (el) observer.observe(el)
  })
}

const loadChapters = async () => {
  const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  chapters.value = data || []
}

const loadCurrentChapter = async () => {
  const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('slug', route.params.chapter)
      .single()

  if (error) {
    throw error
  }

  chapterRecord.value = data
}

const loadPages = async () => {
  if (!chapterRecord.value?.id) {
    comicPages.value = []
    return
  }

  const { data, error } = await supabase
      .from('comic_pages')
      .select('*')
      .eq('chapter_id', chapterRecord.value.id)
      .order('page_number', { ascending: true })

  if (error) {
    throw error
  }

  comicPages.value = (data || [])
      .filter((page) => !page.is_cover)
      .map((page) => ({
        ...page,
        src: getPublicImageUrl(page.image_path),
        name: page.image_path?.split('/').pop() || '',
        hotspots: getHotspotsForPage(page),
      }))
}

const loadComicPage = async () => {
  isLoading.value = true
  loadError.value = ''
  activeHotspot.value = null
  hotspotLightboxImage.value = ''

  try {
    await loadChapters()
    await loadCurrentChapter()
    await loadPages()
    await setupObserver()
  } catch (error) {
    console.error('loadComicPage error:', error)
    loadError.value = 'Unable to load this chapter right now.'
    chapterRecord.value = null
    comicPages.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadComicPage()
})

watch(
    () => route.params.chapter,
    async () => {
      window.scrollTo({ top: 0, behavior: 'auto' })
      await loadComicPage()
    }
)

onBeforeUnmount(() => {
  if (observer) observer.disconnect()
  document.body.style.overflow = ''
})
</script>

<style scoped>
.chapter-label {
  color: var(--text-soft);
}

.chapter-title {
  color: var(--text-main);
}

.page-frame {
  position: relative;
  margin-left: auto;
  margin-right: auto;
  z-index: 1;
}

.page-frame-active {
  z-index: 50;
}

.page-frame-normal {
  width: min(85vw, 48rem);
}

.page-frame-wide {
  width: min(92vw, 80rem);
}

@media (max-width: 1920px) {
  .page-frame-normal {
    width: min(80vw, 44rem);
  }

  .page-frame-wide {
    width: min(88vw, 70rem);
  }
}

@media (max-width: 1280px) {
  .page-frame-normal {
    width: min(92vw, 40rem);
  }

  .page-frame-wide {
    width: min(96vw, 60rem);
  }
}

.comic-image-wrap {
  position: relative;
  width: 100%;
  overflow: visible;
  z-index: 1;
}

.comic-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.comic-hotspot {
  position: absolute;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  z-index: 60;
}

.hotspot-popup {
  position: absolute;
  top: 50%;
  background: transparent;
  padding: 0;
  box-shadow: none;
  border-radius: 0;
  z-index: 9999;
  pointer-events: none;
  box-sizing: border-box;
  overflow: visible;
}

.hotspot-popup-right {
  left: 100%;
  transform: translate(12px, -50%);
}

.hotspot-popup-left {
  right: 100%;
  transform: translate(-12px, -50%);
}

.hotspot-popup-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  margin: 0;
  background: transparent;
}

.hotspot-popup-copy {
  display: none;
}

.chapter-nav {
  min-height: 3.5rem;
}

.chapter-nav-btn {
  border-radius: 999px;
  padding: 0.75rem 1.1rem;
  font-size: 0.95rem;
  font-weight: 600;
  border: 1px solid var(--border-strong);
  background: var(--header-button-bg);
  color: var(--text-main);
  transition: background 0.2s ease, transform 0.2s ease;
}

.chapter-nav-btn:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
}

.hotspot-lightbox {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.82);
  padding: 1.5rem;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.hotspot-lightbox-image {
  max-width: 92vw;
  max-height: 90vh;
  object-fit: contain;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.45);
}

.hotspot-lightbox-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  color: white;
  border-radius: 999px;
  padding: 0.65rem 0.95rem;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 768px) {
  .hotspot-popup {
    width: 180px !important;
    height: auto !important;
  }
}
</style>
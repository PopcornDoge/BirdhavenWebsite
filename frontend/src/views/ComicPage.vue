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
            widePages[index] ? 'page-frame-wide' : 'page-frame-normal'
          ]"
        >
          <img
              :src="page.src"
              :alt="page.alt || page.name || chapterData.title"
              class="comic-image"
              loading="lazy"
              @load="handleImageLoad($event, index)"
          />
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
      }))
}

const loadComicPage = async () => {
  isLoading.value = true
  loadError.value = ''

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
  margin-left: auto;
  margin-right: auto;
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

.comic-image {
  display: block;
  width: 100%;
  height: auto;
  object-fit: contain;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
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
</style>
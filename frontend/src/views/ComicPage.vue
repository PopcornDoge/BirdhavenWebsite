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

      <div class="flex flex-col gap-8">
        <div
            v-for="(page, index) in comicPages"
            :key="page.src"
            :ref="el => setPageRef(el, index)"
            class="page-frame transition-all duration-1000 ease-out"
            :class="[
            visiblePages[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10',
            widePages[index] ? 'page-frame-wide' : 'page-frame-normal'
          ]"
        >
          <img
              :src="page.src"
              :alt="page.name"
              class="comic-image"
              loading="lazy"
              @load="handleImageLoad($event, index)"
          />
        </div>
      </div>

      <div class="chapter-nav mx-auto mt-12 flex max-w-5xl items-center justify-center gap-4">
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
import {computed, ref, watch, nextTick, onMounted, onBeforeUnmount} from 'vue'
import {useRoute} from 'vue-router'

const route = useRoute()

const chapterMeta = {
  chapter1: {
    label: 'Chapter 1',
    title: 'Voxer Elafiel',
  },
  chapter2: {
    label: 'Chapter 2',
    title: 'City of Birdhaven',
  },
  chapter3: {
    label: 'Chapter 3',
    title: 'Ochi Heiwa',
  },
  chapter4: {
    label: 'Chapter 4',
    title: 'The Bargain',
  },
  chapter5: {
    label: 'Chapter 5',
    title: 'A Revelation',
  },
  chapter6: {
    label: 'Chapter 6',
    title: 'The Gift',
  },
}

const chapterOrder = [
  '/read/chapter1',
  '/read/chapter2',
  '/read/chapter3',
  '/read/chapter4',
  '/read/chapter5',
  '/read/chapter6',
]

const allImageModules = import.meta.glob(
    '../assets/comic/chapter*/*.{png,jpg,jpeg,webp}',
    {
      eager: true,
      import: 'default',
    }
)

const currentChapter = computed(() => route.params.chapter || 'chapter1')

const currentChapterPath = computed(() => `/read/${currentChapter.value}`)

const currentChapterIndex = computed(() =>
    chapterOrder.findIndex((chapter) => chapter === currentChapterPath.value)
)

const previousChapter = computed(() => {
  const index = currentChapterIndex.value
  return index > 0 ? chapterOrder[index - 1] : null
})

const nextChapter = computed(() => {
  const index = currentChapterIndex.value
  return index !== -1 && index < chapterOrder.length - 1
      ? chapterOrder[index + 1]
      : null
})

const chapterData = computed(() => {
  return chapterMeta[currentChapter.value] || {
    label: 'Unknown Chapter',
    title: 'Untitled',
  }
})

const comicPages = computed(() => {
  const pages = Object.entries(allImageModules)
      .filter(([path]) => path.includes(`/comic/${currentChapter.value}/`))
      .map(([path, src]) => ({
        src,
        name: path.split('/').pop(),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, {numeric: true}))


  return pages.slice(1)
})

const visiblePages = ref([])
const widePages = ref([])
const pageRefs = ref([])
let observer = null

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

  visiblePages.value = comicPages.value.map(() => false)
  widePages.value = comicPages.value.map(() => false)
  pageRefs.value = []

  await nextTick()

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

onMounted(async () => {
  await setupObserver()
})

watch(
    () => route.params.chapter,
    async () => {
      window.scrollTo({top: 0, behavior: 'auto'})
      await setupObserver()
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
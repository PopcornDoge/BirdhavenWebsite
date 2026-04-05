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

      <div
          v-if="viewMode === 'grid'"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <router-link
            v-for="chapter in chapters"
            :key="chapter.slug"
            :to="`/read/${chapter.slug}`"
            class="chapter-card group overflow-hidden rounded-2xl border backdrop-blur-sm transition duration-300 hover:-translate-y-1"
        >
          <div class="aspect-[4/3] overflow-hidden">
            <img
                :src="chapter.cover"
                :alt="chapter.title"
                class="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />
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
            :key="chapter.slug"
            :to="`/read/${chapter.slug}`"
            class="chapter-card group flex items-center gap-4 rounded-2xl border p-2 backdrop-blur-sm transition duration-300 hover:-translate-y-1"
        >
          <div class="thumbnail-box h-10 w-10 shrink-0 overflow-hidden rounded-md">
            <img
                :src="chapter.cover"
                :alt="chapter.title"
                class="h-full w-full object-contain transition duration-500 group-hover:scale-105"
            />
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
import { ref } from 'vue'

const viewMode = ref('grid')

const chapterMeta = [
  { slug: 'chapter1', label: 'Chapter 1', title: 'Voxer Elafiel' },
  { slug: 'chapter2', label: 'Chapter 2', title: 'City of Birdhaven' },
  { slug: 'chapter3', label: 'Chapter 3', title: 'Ochi Heiwa' },
  { slug: 'chapter4', label: 'Chapter 4', title: 'The Bargain' },
  { slug: 'chapter5', label: 'Chapter 5', title: 'A Revelation' },
  { slug: 'chapter6', label: 'Chapter 6', title: 'The Gift' },
]

const imageModules = import.meta.glob(
    '../assets/comic/chapter*/*.{png,jpg,jpeg,webp}',
    {
      eager: true,
      import: 'default',
    }
)

const chapterImages = Object.entries(imageModules).reduce((acc, [path, src]) => {
  const match = path.match(/chapter\d+/)
  if (!match) return acc

  const chapterSlug = match[0]

  if (!acc[chapterSlug]) {
    acc[chapterSlug] = []
  }

  acc[chapterSlug].push({
    src,
    name: path.split('/').pop(),
  })

  return acc
}, {})

Object.values(chapterImages).forEach((images) => {
  images.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
})

const chapters = chapterMeta.map((chapter) => ({
  ...chapter,
  cover: chapterImages[chapter.slug]?.[0]?.src || '',
}))
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
</style>
<template>
  <header
      class="site-header fixed top-0 left-0 z-50 w-full"
      :style="{ opacity: computedOpacity }"
      @mouseenter="showHeaderTemporarily"
  >
    <div class="flex w-full items-center justify-between">
      <div class="flex flex-1 justify-start">
        <router-link to="/">
          <img
              src="/images/headerLogo.png"
              alt="Logo"
              class="w-[200px] object-contain"
          />
        </router-link>
      </div>

      <div
          v-if="isComicPage"
          class="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center gap-4"
      >
        <router-link
            v-if="previousChapter"
            :to="previousChapter"
            class="chapter-btn"
        >
          Previous Chapter
        </router-link>

        <router-link
            v-if="nextChapter"
            :to="nextChapter"
            class="chapter-btn"
        >
          Next Chapter
        </router-link>
      </div>

      <div class="flex flex-1 items-center justify-end gap-4">
        <nav class="nav-links">
          <router-link to="/read/chapter1">Latest Chapter</router-link>
          <router-link to="/chapters">Chapter Select</router-link>
          <a href="/about">About</a>
          <a href="/art">Art</a>
        </nav>

        <button
            class="theme-toggle"
            type="button"
            @click="$emit('toggle-theme')"
        >
          {{ theme === "dark" ? "Light" : "Dark" }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue"
import { useRoute } from "vue-router"

const props = defineProps({
  theme: {
    type: String,
    required: true,
  },
})

defineEmits(["toggle-theme"])

const route = useRoute()

const baseOpacity = ref(1)
const forceVisible = ref(false)
const lastScrollY = ref(0)
const fadeDistance = 200
const revealDuration = 1200
let hideTimeout = null

const clearHideTimeout = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

const showHeaderTemporarily = () => {
  forceVisible.value = true
  clearHideTimeout()

  hideTimeout = setTimeout(() => {
    forceVisible.value = false
  }, revealDuration)
}

const handleScroll = () => {
  const scrollY = window.scrollY
  const scrollingUp = scrollY < lastScrollY.value
  const scrollingDown = scrollY > lastScrollY.value

  baseOpacity.value = Math.max(0, 1 - scrollY / fadeDistance)

  if (scrollingUp && scrollY > 40) {
    showHeaderTemporarily()
  }

  if (scrollingDown) {
    forceVisible.value = false
    clearHideTimeout()
  }

  lastScrollY.value = scrollY
}

const handleMouseMove = (e) => {
  if (e.clientY < 80) {
    showHeaderTemporarily()
  }
}

const computedOpacity = computed(() => {
  if (forceVisible.value) return 1
  return baseOpacity.value
})

const isComicPage = computed(() => route.path.startsWith("/read"))

const chapterOrder = [
  "/read/chapter1",
  "/read/chapter2",
  "/read/chapter3",
  "/read/chapter4",
  "/read/chapter5",
  "/read/chapter6",
]

const currentChapterIndex = computed(() =>
    chapterOrder.findIndex((chapter) => chapter === route.path)
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

onMounted(() => {
  lastScrollY.value = window.scrollY
  window.addEventListener("scroll", handleScroll, { passive: true })
  window.addEventListener("mousemove", handleMouseMove)
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll)
  window.removeEventListener("mousemove", handleMouseMove)
  clearHideTimeout()
})
</script>

<style scoped>
.site-header {
  width: 100%;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  background: var(--header-bg);
  color: var(--text-main);
  border: 1px solid var(--border);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition:
      opacity 0.35s ease,
      background 0.35s ease,
      border-color 0.35s ease,
      color 0.35s ease;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.chapter-btn,
.theme-toggle {
  border-radius: 999px;
  padding: 0.55rem 0.95rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: 1px solid var(--border-strong);
  background: var(--header-button-bg);
  color: var(--text-main);
  transition: background 0.2s ease, transform 0.2s ease;
}

.chapter-btn:hover,
.theme-toggle:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
}
</style>
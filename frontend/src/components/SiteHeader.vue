<template>
  <header
      class="site-header fixed top-0 left-0 z-50 w-full"
      :style="{ opacity: computedOpacity }"
      @mouseenter="showHeaderTemporarily"
  >
    <div class="relative flex w-full items-center justify-between">
      <div class="flex flex-1 justify-start">
        <router-link to="/">
          <img
              src="/images/headerLogo.png"
              alt="Logo"
              class="w-[130px] md:w-[200px] object-contain"
          />
        </router-link>
      </div>

      <!-- Desktop chapter nav -->
      <div
          v-if="isComicPage && chapterNavReady"
          class="pointer-events-auto absolute left-1/2 hidden -translate-x-1/2 items-center gap-4 lg:flex"
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

      <!-- Mobile chapter arrows -->
      <div
          v-if="isComicPage && chapterNavReady"
          class="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center gap-2 lg:hidden"
      >
        <router-link
            v-if="previousChapter"
            :to="previousChapter"
            class="chapter-arrow"
            aria-label="Previous chapter"
        >
          ←
        </router-link>

        <router-link
            v-if="nextChapter"
            :to="nextChapter"
            class="chapter-arrow"
            aria-label="Next chapter"
        >
          →
        </router-link>
      </div>

      <div class="hidden flex-1 items-center justify-end gap-4 lg:flex">
        <nav class="nav-links">
          <router-link
              v-if="latestChapter"
              :to="latestChapter"
          >
            Latest Chapter
          </router-link>

          <router-link v-else to="/chapters">
            Latest Chapter
          </router-link>

          <router-link to="/chapters">Chapter Select</router-link>
          <router-link to="/art">Art</router-link>
        </nav>

        <button
            class="theme-toggle-switch"
            type="button"
            @click="$emit('toggle-theme')"
            :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <div class="switch-track" :class="{ 'is-dark-track': theme === 'dark' }">
            <div class="switch-thumb" :class="{ 'is-dark': theme === 'dark' }">
              <font-awesome-icon
                  :icon="theme === 'dark' ? 'sun' : 'moon'"
                  class="switch-icon"
              />
            </div>
          </div>
        </button>
      </div>

      <div class="flex flex-1 justify-end lg:hidden">
        <button
            class="menu-toggle"
            type="button"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            aria-label="Open navigation menu"
        >
          ☰
        </button>
      </div>
    </div>

    <transition name="mobile-menu-fade">
      <div
          v-if="isMobileMenuOpen"
          class="mobile-menu mt-4 lg:hidden"
      >
        <nav class="mobile-nav">
          <router-link
              v-if="latestChapter"
              :to="latestChapter"
              @click="closeMobileMenu"
          >
            Latest Chapter
          </router-link>

          <router-link
              v-else
              to="/chapters"
              @click="closeMobileMenu"
          >
            Latest Chapter
          </router-link>

          <router-link to="/chapters" @click="closeMobileMenu">
            Chapter Select
          </router-link>

          <router-link to="/art" @click="closeMobileMenu">
            Art
          </router-link>
        </nav>

        <button
            class="theme-toggle mt-4 w-full"
            type="button"
            @click="handleMobileThemeToggle"
        >
          {{ theme === "dark" ? "Light Mode" : "Dark Mode" }}
        </button>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue"
import { useRoute } from "vue-router"
import { supabase } from "../lib/supabase.js"

defineProps({
  theme: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(["toggle-theme"])

const route = useRoute()

const baseOpacity = ref(1)
const forceVisible = ref(false)
const lastScrollY = ref(0)
const isMobileMenuOpen = ref(false)
const chapters = ref([])
const isLoadingChapters = ref(false)

const fadeDistance = 200
const revealDuration = 1200
let hideTimeout = null

const normalizeSlug = (value) => String(value || "").trim().toLowerCase()

const publishedChapters = computed(() => {
  return [...chapters.value]
      .filter((chapter) => chapter.published !== false)
      .sort((a, b) => {
        const aDate = new Date(a.created_at || 0).getTime()
        const bDate = new Date(b.created_at || 0).getTime()
        return aDate - bDate
      })
})

const chapterNavReady = computed(() => {
  return !isLoadingChapters.value && publishedChapters.value.length > 0
})

const latestChapter = computed(() => {
  if (!publishedChapters.value.length) return null
  const latest = publishedChapters.value[publishedChapters.value.length - 1]
  return `/read/${latest.slug}`
})

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
    if (!isMobileMenuOpen.value) {
      forceVisible.value = false
    }
  }, revealDuration)
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleMobileThemeToggle = () => {
  emit("toggle-theme")
}

const handleScroll = () => {
  const scrollY = window.scrollY
  const scrollingUp = scrollY < lastScrollY.value
  const scrollingDown = scrollY > lastScrollY.value

  baseOpacity.value = Math.max(0, 1 - scrollY / fadeDistance)

  if (scrollingUp && scrollY > 40) {
    showHeaderTemporarily()
  }

  if (scrollingDown && !isMobileMenuOpen.value) {
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
  if (isMobileMenuOpen.value) return 1
  if (forceVisible.value) return 1
  return baseOpacity.value
})

const isComicPage = computed(() => route.path.startsWith("/read"))

const currentChapterIndex = computed(() => {
  const currentSlug = normalizeSlug(route.params.chapter)

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

const loadChapters = async () => {
  isLoadingChapters.value = true

  const { data, error } = await supabase
      .from("chapters")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: true })

  if (error) {
    console.error("loadChapters error:", error)
    chapters.value = []
    isLoadingChapters.value = false
    return
  }

  chapters.value = data || []
  isLoadingChapters.value = false
}

watch(
    () => route.fullPath,
    async () => {
      closeMobileMenu()
      await loadChapters()
    }
)

onMounted(async () => {
  lastScrollY.value = window.scrollY
  window.addEventListener("scroll", handleScroll, { passive: true })
  window.addEventListener("mousemove", handleMouseMove)
  await loadChapters()
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
  flex-direction: column;
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
.theme-toggle,
.menu-toggle,
.chapter-arrow {
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
.theme-toggle:hover,
.menu-toggle:hover,
.chapter-arrow:hover {
  transform: translateY(-1px);
  background: var(--surface-hover);
}

.menu-toggle {
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chapter-arrow {
  min-width: 2.5rem;
  min-height: 2.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
}

.mobile-menu {
  border-top: 1px solid var(--border);
  padding-top: 1rem;
}

.mobile-nav {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.mobile-nav a {
  color: var(--text-main);
}

.mobile-menu-fade-enter-active,
.mobile-menu-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mobile-menu-fade-enter-from,
.mobile-menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.mobile-menu-fade-enter-to,
.mobile-menu-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
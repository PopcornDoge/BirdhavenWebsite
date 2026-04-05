<template>
  <section class="hero-section">
    <div class="hero-copy flex flex-col items-center text-center">
      <div class="flex justify-center">
        <img
            src="/images/LOGO3.png"
            alt="Logo"
            class="w-200 object-contain"
        />
      </div>
      <p class="hero-text text-center max-w-xl mx-auto">
        Voxer Elafiel is the only elf left alive in his world, with monster attacks increasing and the military having him in their sight he begins his search for answers that lead him to more than he could have ever imagined.
      </p>

      <div class="hero-actions justify-center md:justify-start max-w-xl mx-auto md:mx-0 mb-5">
        <router-link
            class="primary-btn"
            :to="`/read/${latestChapter}`"
        >
          Read Latest Chapter
        </router-link>
        <a class="secondary-btn" href="/chapters">Chapter Select</a>
      </div>
    </div>

    <div class="hero-art">
      <HeroCarousel />
    </div>


  </section>
</template>

<script setup>
import HeroCarousel from "./HeroCarousel.vue";
import { computed } from 'vue'

const chapterOrder = [
  'chapter1',
  'chapter2',
  'chapter3',
  'chapter4',
  'chapter5',
  'chapter6',
]

const latestChapter = computed(() => {
  return chapterOrder[chapterOrder.length - 1]
})
</script>

<style scoped>
.hero-section {
  width: 100%;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
}

.hero-text {
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.25rem;
  border-radius: 999px;
  font-weight: 600;
  transition: transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.primary-btn {
  background: var(--button-primary-bg);
  color: var(--button-primary-text);
}

.secondary-btn {
  color: var(--button-secondary-text);
  border: 1px solid var(--border-strong);
  background: transparent;
}

.primary-btn:hover,
.secondary-btn:hover {
  transform: translateY(-2px);
  background: var(--surface-hover);
}

@media (max-width: 800px) {
  .hero-section {
    grid-template-columns: 1fr;
    text-align: center;
    padding-top: 6.5rem;
  }

  .hero-actions {
    justify-content: center;
  }
}
</style>
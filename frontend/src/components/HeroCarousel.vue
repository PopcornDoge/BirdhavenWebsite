<template>
  <div class="relative h-screen w-full overflow-hidden">
    <div
        v-for="(image, index) in images"
        :key="image.src"
        class="absolute inset-0 transition-opacity duration-500"
        :class="currentIndex === index ? 'opacity-100' : 'opacity-0'"
    >
      <img
          :src="image.src"
          :alt="image.alt"
          class="h-full w-full object-cover"
      />
    </div>
    <div class="absolute inset-0 bg-gradient-to-l from-transparent to-black/50"></div>

    <div
        class="absolute bottom-6 right-6 z-10 flex flex-col items-end gap-3"
        @mouseleave="isPickerOpen = false"
    >
      <div
          v-if="isPickerOpen"
          class="flex gap-3 rounded-2xl border border-white/20 bg-black/40 p-3 backdrop-blur-sm"
      >
        <button
            v-for="(image, index) in images"
            :key="`${image.src}-selector`"
            type="button"
            class="overflow-hidden rounded-lg border transition"
            :class="
        currentIndex === index
          ? 'border-white/80 opacity-100'
          : 'border-white/20 opacity-70 hover:opacity-100'
      "
            @click="selectImage(index)"
            :aria-label="`Select banner ${index + 1}`"
        >
          <img
              :src="image.src"
              :alt="image.alt"
              class="h-12 w-20 object-cover"
          />
        </button>
      </div>

      <button
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-white/10"
          @click="togglePicker"
          aria-label="Choose background"
      >
    <span class="grid grid-cols-2 gap-1">
      <span class="h-1.5 w-1.5 rounded-sm bg-white"></span>
      <span class="h-1.5 w-1.5 rounded-sm bg-white"></span>
      <span class="h-1.5 w-1.5 rounded-sm bg-white"></span>
      <span class="h-1.5 w-1.5 rounded-sm bg-white"></span>
    </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const STORAGE_KEY = 'hero-banner-selection'

const images = [
  {
    src: '/images/banner1.webp',
    alt: 'Banner 1',
  },
  {
    src: '/images/banner2.webp',
    alt: 'Banner 2',
  },
  {
    src: '/images/banner3.webp',
    alt: 'Banner 3',
  },
]

const currentIndex = ref(0)
const isPickerOpen = ref(false)

const selectImage = (index) => {
  currentIndex.value = index
  isPickerOpen.value = false
}

const togglePicker = () => {
  isPickerOpen.value = !isPickerOpen.value
}

onMounted(() => {
  const savedIndex = localStorage.getItem(STORAGE_KEY)

  if (savedIndex !== null) {
    const parsedIndex = Number(savedIndex)

    if (!Number.isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < images.length) {
      currentIndex.value = parsedIndex
    }
  }
})

watch(currentIndex, (newValue) => {
  localStorage.setItem(STORAGE_KEY, String(newValue))
})
</script>
<template>
  <footer
      class="site-footer"
      :style="{ opacity: computedOpacity }"
  >
    <div class="footer-inner">
      <p class="footer-text">
        © Shenpai Productions {{ year }}
      </p>

      <router-link to="/legal" class="footer-link">
        Legal
      </router-link>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const opacity = ref(1)

const year = new Date().getFullYear()

const handleScroll = () => {
  const scrollY = window.scrollY
  const windowHeight = window.innerHeight
  const docHeight = document.documentElement.scrollHeight

  const distanceFromTop = scrollY
  const distanceFromBottom = docHeight - (scrollY + windowHeight)

  const fadeRange = 150

  const topFade = Math.min(1, distanceFromTop / fadeRange)
  const bottomFade = Math.min(1, distanceFromBottom / fadeRange)

  const middleFade = Math.min(topFade, bottomFade)

  opacity.value = 1 - middleFade
}

const computedOpacity = computed(() => opacity.value)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.site-footer {
  position: fixed;
  left: 1rem;
  bottom: 1rem;
  z-index: 40;

  transition: opacity 0.3s ease;
}

.footer-inner {
  display: flex;
  align-items: center;
  gap: 1rem;

  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  backdrop-filter: blur(10px);
}

.footer-text {
  margin: 0;
  color: var(--text-soft);
  font-size: 0.9rem;
}

.footer-link {
  color: var(--text-main);
  font-size: 0.9rem;
  text-decoration: underline;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.7;
}
</style>
<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

let scrollTimeoutId
const isScrollbarVisible = ref(false)
const scrollbarThumbStyle = ref({ height: '24px', transform: 'translateY(0)' })

function updateScrollbar() {
  const viewportHeight = window.innerHeight
  const contentHeight = document.documentElement.scrollHeight
  const maxScroll = contentHeight - viewportHeight
  const trackHeight = Math.max(viewportHeight - 16, 24)
  const thumbHeight = Math.max((viewportHeight / contentHeight) * trackHeight, 24)
  const availableTravel = trackHeight - thumbHeight
  const thumbTop = maxScroll > 0 ? (window.scrollY / maxScroll) * availableTravel : 0

  scrollbarThumbStyle.value = {
    height: `${thumbHeight}px`,
    transform: `translateY(${thumbTop}px)`,
  }
}

function showScrollbar() {
  isScrollbarVisible.value = true
  updateScrollbar()
  window.clearTimeout(scrollTimeoutId)
  scrollTimeoutId = window.setTimeout(() => {
    isScrollbarVisible.value = false
  }, 1200)
}

onMounted(() => {
  updateScrollbar()
  window.addEventListener('scroll', showScrollbar, { passive: true })
  window.addEventListener('resize', updateScrollbar, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', showScrollbar)
  window.removeEventListener('resize', updateScrollbar)
  window.clearTimeout(scrollTimeoutId)
})
</script>

<template>
  <div class="app-shell">
    <main class="page-content">
      <RouterView />
    </main>
  </div>
  <div v-if="isScrollbarVisible" class="overlay-scrollbar" aria-hidden="true">
    <div class="overlay-scrollbar-thumb" :style="scrollbarThumbStyle"></div>
  </div>
</template>

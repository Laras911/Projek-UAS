<template>
  <div id="app">
    <Navbar v-if="!hideLayout" />
    <main class="main-content">
      <router-view />
    </main>
    <Footer v-if="!hideLayout" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'

const route = useRoute()
const authStore = useAuthStore()

const hideLayout = computed(() => {
  return route.name === 'login' || route.name === 'register'
})

// Ambil data user saat aplikasi dimuat
onMounted(async () => {
  if (authStore.token) {
    await authStore.fetchUser()
  }
})
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f3f3f4;
  color: #1a1a1a;
  line-height: 1.5;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 1.5rem 1rem;
  max-width: 1280px;
  margin: 0 auto;
  width: 100%;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  cursor: pointer;
}

img {
  max-width: 100%;
  display: block;
}
</style>
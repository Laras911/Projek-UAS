<template>
  <header class="navbar-neo">
    <div class="nav-container">
      <!-- Kiri: Logo (tidak bisa diklik) -->
      <div class="nav-left">
        <span class="logo">BARTERYUK</span>
      </div>

      <!-- Tengah: Menu dengan background solid -->
      <nav class="nav-links">
        <button
          @click="$router.push('/')"
          class="nav-btn"
          :class="{ active: isActive('/') }"
        >
          Dashboard
        </button>
        <button
          @click="$router.push('/my-items')"
          class="nav-btn"
          :class="{ active: isActive('/my-items') }"
        >
          My Items
        </button>
        <button
          @click="$router.push({ path: '/my-items', query: { tab: 'trades' } })"
          class="nav-btn"
          :class="{ active: isActive('/my-items') && $route.query.tab === 'trades' }"
        >
          Trades
        </button>
      </nav>

      <!-- Kanan: Profile & Logout -->
      <div class="nav-right" v-if="authStore.isAuthenticated">
        <button @click="$router.push('/my-items')" class="profile-btn">
          <i class="fas fa-user"></i>
          <span class="hidden sm:inline">Profile</span>
        </button>
        <button @click="handleLogout" class="logout-btn">Logout</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'
import { useRouter, useRoute } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const isActive = (path) => {
  if (path === '/') return route.path === '/'
  if (path === '/my-items') {
    return route.path === '/my-items' && !route.query.tab
  }
  return route.path === path
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
/* ===== NAVBAR NEOBRUTALISM ===== */
.navbar-neo {
  width: 100%;
  padding: 0.8rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 50;
  background: #f9f9f9;
  border-bottom: 3px solid black;
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12rem;
}

/* ===== KIRI: Logo (tidak bisa diklik) ===== */
.nav-left {
  display: flex;
  align-items: center;
}

.logo {
  font-family: 'Inter', 'Archivo', sans-serif;
  font-style: italic;
  font-size: 2rem;
  font-weight: 900;
  color: #705d00;
  letter-spacing: -0.02em;
  cursor: default; /* tidak bisa diklik */
  user-select: none;
}

/* ===== TENGAH: Menu dengan background solid ===== */
.nav-links {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.nav-btn {
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.5rem 1.2rem;
  background: white; /* solid putih */
  border: 2px solid #ccc;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #1a1c1c;
  border-radius: 0;
}

.nav-btn:hover {
  background: #f0f0f0;
  border-color: #999;
  transform: translate(-1px, -1px);
}

.nav-btn.active {
  background: #ff6b6b;
  border-color: black;
  box-shadow: 2px 2px 0 0 rgba(0, 0, 0, 1);
  transform: translate(-1px, -1px);
  color: black;
}

/* ===== KANAN: Profile & Logout ===== */
.nav-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.profile-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.85rem;
  color: #ac2471;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.3rem 0.6rem;
  text-decoration: underline;
  text-decoration-thickness: 2px;
  text-underline-offset: 4px;
  transition: color 0.15s;
}

.profile-btn:hover {
  color: #6c0042;
}

.logout-btn {
  background: #ac2471;
  color: white;
  border: 3px solid black;
  padding: 0.4rem 1.2rem;
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 4px 4px 0 0 rgba(0, 0, 0, 1);
  transition: all 0.1s ease;
}

.logout-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 0 rgba(0, 0, 0, 1);
}

.logout-btn:active {
  transform: translate(2px, 2px);
  box-shadow: none;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .logo {
    font-size: 1.5rem;
  }
  .nav-btn {
    font-size: 0.75rem;
    padding: 0.3rem 0.8rem;
  }
  .logout-btn {
    padding: 0.3rem 0.8rem;
    font-size: 0.7rem;
  }
}
</style>
<template>
  <div class="login-page">
    <div class="login-container">
      <h1 class="brand-title">BARTERYUK</h1>

      <div class="login-card">
        <div class="card-top-bar"></div>
        <div class="card-body">
          <h2 class="card-title">Masuk ke BarterYuk</h2>
          <p class="card-subtitle">Kembali ke zona barter digital tanpa uang tunai.</p>

          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" v-model="email" placeholder="email@contoh.com" required />
              </div>
            </div>

            <div class="form-group">
              <div class="label-row">
                <label>Kata Sandi</label>
                <a href="#" class="forgot-link">Lupa Sandi?</a>
              </div>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" v-model="password" placeholder="••••••••" required />
              </div>
            </div>

            <div class="remember-row">
              <button type="button" class="checkbox-btn" @click="rememberMe = !rememberMe">
                <span class="check-box" :class="{ checked: rememberMe }">✓</span>
                <span>Ingat Saya</span>
              </button>
            </div>

            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Memproses...' : 'MASUK SEKARANG' }}
              <i class="fas fa-arrow-right"></i>
            </button>
          </form>

          <div class="toggle-row">
            <span>Belum punya akun? </span>
            <router-link to="/register" class="toggle-link">Daftar</router-link>
          </div>

          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
        </div>
      </div>

      <div class="bottom-footer">
        <span>© 2026 Made By Laras. Join the BarterYuk.</span>
        <div class="footer-links">
          <a href="#">Ketentuan Layanan</a>
          <a href="#">Kebijakan Privasi</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  try {
    await authStore.login(email.value, password.value)
    toast.success('Selamat datang kembali!')
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.message || 'Login gagal'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped src="../assets/login.css"></style>

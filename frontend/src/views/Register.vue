<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Brand -->
      <h1 class="brand-title">BARTERYUK</h1>

      <!-- Card -->
      <div class="register-card">
        <div class="card-top-bar"></div>

        <div class="card-body">
          <h2 class="card-title">Daftar Akun Baru</h2>
          <p class="card-subtitle">
            Bergabunglah dengan ribuan trader yang menukarkan barang tak terpakai mereka secara langsung.
          </p>

          <form @submit.prevent="handleRegister">
            <!-- Username -->
            <div class="form-group">
              <label>Username</label>
              <div class="input-wrapper">
                <i class="fas fa-user"></i>
                <input type="text" v-model="form.username" placeholder="BarterYuk" required />
              </div>
            </div>

            <!-- Email -->
            <div class="form-group">
              <label>Email</label>
              <div class="input-wrapper">
                <i class="fas fa-envelope"></i>
                <input type="email" v-model="form.email" placeholder="Barter@email.com" required />
              </div>
            </div>

            <!-- Password -->
            <div class="form-group">
              <label>Password</label>
              <div class="input-wrapper">
                <i class="fas fa-lock"></i>
                <input type="password" v-model="form.password" placeholder="********" required />
              </div>
            </div>

            <!-- Nama Lengkap -->
            <div class="form-group">
              <label>Nama Lengkap</label>
              <div class="input-wrapper">
                <i class="fas fa-id-card"></i>
                <input type="text" v-model="form.fullname" placeholder="Laras Yupss" />
              </div>
            </div>

            <!-- No. Telepon -->
            <div class="form-group">
              <label>No. Telepon</label>
              <div class="input-wrapper">
                <i class="fas fa-phone"></i>
                <input type="text" v-model="form.phone" placeholder="08123456789" />
              </div>
            </div>

            <!-- Alamat -->
            <div class="form-group">
              <label>Alamat</label>
              <div class="input-wrapper">
                <i class="fas fa-map-marker-alt"></i>
                <input type="text" v-model="form.address" placeholder="Jl. Karya 1, Gg. Pusri, Pekanbaru" />
              </div>
            </div>

            <!-- Submit -->
            <button type="submit" class="btn-submit" :disabled="loading">
              {{ loading ? 'Mendaftar...' : 'Daftar Sekarang' }}
              <i class="fas fa-arrow-right"></i>
            </button>
          </form>

          <!-- Toggle Login -->
          <div class="toggle-row">
            <span>Sudah punya akun?</span>
            <router-link to="/login" class="toggle-link">Login di sini →</router-link>
          </div>

          <!-- Notifikasi -->
          <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
          <div v-if="success" class="alert alert-success mt-3">Registrasi berhasil! Silakan login.</div>
        </div>
      </div>

      <!-- Footer bawah -->
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
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const form = reactive({
  username: '',
  email: '',
  password: '',
  fullname: '',
  phone: '',
  address: ''
})

const loading = ref(false)
const error = ref('')
const success = ref(false)

const handleRegister = async () => {
  loading.value = true
  error.value = ''
  success.value = false

  try {
    await authStore.register(
      form.username,
      form.email,
      form.password,
      form.fullname,
      form.phone,
      form.address
    )
    success.value = true
    // Reset form
    Object.assign(form, {
      username: '',
      email: '',
      password: '',
      fullname: '',
      phone: '',
      address: ''
    })
    setTimeout(() => router.push('/login'), 1500)
  } catch (err) {
    error.value = err.response?.data?.message || 'Registrasi gagal'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped src="../assets/register.css"></style>

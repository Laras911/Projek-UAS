import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token
  },
  actions: {
    async login(email, password) {
      try {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data
        this.token = token
        this.user = user
        localStorage.setItem('token', token)
        return true
      } catch (error) {
        throw error
      }
    },
    async register(username, email, password, fullname, phone, address) {
      try {
        await api.post('/auth/register', { username, email, password, fullname, phone, address })
        return true
      } catch (error) {
        throw error
      }
    },
    async fetchUser() {
      if (!this.token) return
      try {
        const res = await api.get('/auth/profile')
        if (res.data.user) {
          this.user = res.data.user
        }
      } catch (error) {
        console.error('Gagal fetch user:', error)
        this.logout()
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    }
  }
})
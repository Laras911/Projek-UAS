import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import MyItems from '../views/MyItems.vue'
import Trades from '../views/Trades.vue'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'login', component: Login, meta: { guest: true } },
  { path: '/register', name: 'register', component: Register, meta: { guest: true } },
  { path: '/', name: 'dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/my-items', name: 'my-items', component: MyItems, meta: { requiresAuth: true } },
  { path: '/trades', name: 'trades', component: Trades, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.guest && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
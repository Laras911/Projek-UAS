import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import Toast
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Import Neobrutalism Styles
import './assets/neobrutalism.css'
import './assets/components.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(Toast, {
  position: 'top-right',
  timeout: 3000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
})

app.mount('#app')
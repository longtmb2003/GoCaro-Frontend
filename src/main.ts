import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Restore any persisted session before the first navigation so the route guard
// sees the real authentication state and does not flash the login page.
await useAuthStore().initialize()
await router.isReady()

app.mount('#app')

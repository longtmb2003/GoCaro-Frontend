import { createApp } from 'vue'

import App from './App.vue'
import { pinia } from './pinia'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'

const app = createApp(App)

app.use(pinia)

// Initialize auth BEFORE routing so the route guard sees the loaded state
await useAuthStore(pinia).initialize()

app.use(router)
await router.isReady()

app.mount('#app')

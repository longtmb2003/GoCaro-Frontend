import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'

const app = createApp(App)

app.use(createPinia())

// Initialize auth BEFORE routing so the route guard sees the loaded state
await useAuthStore().initialize()

app.use(router)
await router.isReady()

app.mount('#app')

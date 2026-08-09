import { createApp } from 'vue'

import App from './App.vue'
import { checkServerAvailability } from './api/serverAvailability'
import { pinia } from './pinia'
import router from './router'
import { useAuthStore } from './stores/auth'

import './assets/main.css'

const app = createApp(App)

app.use(pinia)

// Probe readiness before restoring auth. If the backend is down, skip profile
// retries and mount the maintenance screen immediately; retrying reloads the app
// and resumes the normal initialization path once the server is healthy.
const serverReady = await checkServerAvailability()
if (serverReady) {
  // Initialize auth BEFORE routing so the route guard sees the loaded state.
  await useAuthStore(pinia).initialize()
}

app.use(router)
await router.isReady()

app.mount('#app')

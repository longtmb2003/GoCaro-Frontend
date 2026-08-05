import { createPinia } from 'pinia'

/**
 * The single Pinia instance shared by the app entrypoint and router guards.
 *
 * Router guards run outside a component setup context, so passing this
 * instance explicitly prevents stores from depending on an active Pinia
 * injected by Vue at that moment.
 */
export const pinia = createPinia()

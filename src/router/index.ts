import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: () => import('@/pages/LobbyPage.vue'),
      meta: { requiresAuth: true, title: 'Lobby' },
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('@/pages/GamePage.vue'),
      meta: { requiresAuth: true, title: 'Match' },
      // The game screen is only reachable through a live match. A direct visit
      // or reload (in-memory match state is gone) returns to the lobby.
      beforeEnter: () => (useGameStore().isInMatch ? true : { name: 'lobby' }),
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('@/pages/LeaderboardPage.vue'),
      meta: { requiresAuth: true, title: 'Leaderboard' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue'),
      meta: { requiresAuth: true, title: 'Match history' },
    },
    {
      path: '/replay/:id',
      name: 'replay',
      component: () => import('@/pages/ReplayPage.vue'),
      meta: { requiresAuth: true, title: 'Replay' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true, title: 'Sign in' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { guestOnly: true, title: 'Create account' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: 'Page not found' },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'lobby' }
  }

  return true
})

// Reflect the current page in the browser tab.
router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · GoCaro` : 'GoCaro'
})

export default router

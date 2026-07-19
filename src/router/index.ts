import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'lobby',
      component: () => import('@/pages/LobbyPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('@/pages/GamePage.vue'),
      meta: { requiresAuth: true },
      // The game screen is only reachable through a live match. A direct visit
      // or reload (in-memory match state is gone) returns to the lobby.
      beforeEnter: () => (useGameStore().isInMatch ? true : { name: 'lobby' }),
    },
    {
      path: '/leaderboard',
      name: 'leaderboard',
      component: () => import('@/pages/LeaderboardPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/replay/:id',
      name: 'replay',
      component: () => import('@/pages/ReplayPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/RegisterPage.vue'),
      meta: { guestOnly: true },
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

export default router

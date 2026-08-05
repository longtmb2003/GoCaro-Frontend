import { createRouter, createWebHistory } from 'vue-router'

import { useMatchAudio } from '@/composables/useMatchAudio'
import { useAuthStore } from '@/stores/auth'
import { useGameStore } from '@/stores/game'
import { pinia } from '@/pinia'
import { hasMatchRecovery } from '@/utils/matchRecovery'

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
      beforeEnter: () => {
        const auth = useAuthStore(pinia)
        return useGameStore(pinia).isInMatch || hasMatchRecovery(auth.user?.id)
          ? true
          : { name: 'lobby' }
      },
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
      path: '/tournaments',
      name: 'tournaments',
      component: () => import('@/pages/TournamentsPage.vue'),
      meta: { requiresAuth: true, title: 'Tournaments' },
    },
    {
      path: '/tournaments/:id',
      name: 'tournament-detail',
      component: () => import('@/pages/TournamentDetailPage.vue'),
      meta: { requiresAuth: true, title: 'Tournament' },
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
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true, title: 'Create account' },
    },
    {
      path: '/join/:code',
      name: 'join-invite',
      component: () => import('@/pages/JoinPage.vue'),
      meta: { requiresAuth: true, title: 'Join Match' },
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
  const auth = useAuthStore(pinia)

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'lobby' }
  }

  // Reopening the site at `/` after accidentally closing the match tab should
  // resume the active room, not strand the player in the lobby. The game route
  // performs the same check before it mounts and starts the socket reconnect.
  if (to.name === 'lobby' && auth.isAuthenticated && hasMatchRecovery(auth.user?.id)) {
    return { name: 'game' }
  }

  return true
})

const matchAudio = useMatchAudio()

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · GoCaro` : 'GoCaro'
  if (to.name === 'game') matchAudio.enterMatch()
  else matchAudio.stopAll()
})

export default router

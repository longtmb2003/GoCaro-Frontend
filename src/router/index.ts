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
      meta: { requiresAuth: true, title: 'Play Gomoku Online with Friends' },
    },
    {
      path: '/game',
      name: 'game',
      component: () => import('@/pages/GamePage.vue'),
      meta: { requiresAuth: true, title: 'Online Gomoku Match' },
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
      meta: { requiresAuth: true, title: 'Gomoku Player Leaderboard' },
    },
    {
      path: '/shop',
      name: 'shop',
      component: () => import('@/pages/ShopPage.vue'),
      meta: { requiresAuth: true, title: 'Gomoku Rewards and Cosmetic Shop' },
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/pages/HistoryPage.vue'),
      meta: { requiresAuth: true, title: 'Online Gomoku Match History' },
    },
    {
      path: '/collection',
      name: 'collection',
      component: () => import('@/pages/CollectionPage.vue'),
      meta: { requiresAuth: true, title: 'Your GoCaro Cosmetic Collection' },
    },
    {
      path: '/achievements',
      name: 'achievements',
      component: () => import('@/pages/AchievementsPage.vue'),
      meta: { requiresAuth: true, title: 'GoCaro Achievements and Rewards' },
    },
    {
      path: '/tournaments',
      name: 'tournaments',
      component: () => import('@/pages/TournamentsPage.vue'),
      meta: { requiresAuth: true, title: 'Online Gomoku Tournaments' },
    },
    {
      path: '/tournaments/:id',
      name: 'tournament-detail',
      component: () => import('@/pages/TournamentDetailPage.vue'),
      meta: { requiresAuth: true, title: 'Gomoku Tournament Details' },
    },
    {
      path: '/replay/:id',
      name: 'replay',
      component: () => import('@/pages/ReplayPage.vue'),
      meta: { title: 'Watch a Gomoku Match Replay' },
    },
    {
      path: '/share/:token',
      name: 'shared-link',
      component: () => import('@/pages/ShareRedirectPage.vue'),
      meta: { title: 'Open a Shared GoCaro Link' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true, title: 'Sign In and Play Gomoku Online' },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/pages/LoginPage.vue'),
      meta: { guestOnly: true, title: 'Create Your GoCaro Account' },
    },
    {
      path: '/join/:code',
      name: 'join-invite',
      component: () => import('@/pages/JoinPage.vue'),
      meta: { requiresAuth: true, title: 'Join a Private Gomoku Match' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/pages/NotFoundPage.vue'),
      meta: { title: 'Page Not Found' },
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
  document.title = to.meta.title
    ? `${to.meta.title} | GoCaro`
    : 'GoCaro: Play Gomoku Online with Friends'
  if (to.name === 'game') matchAudio.enterMatch()
  else matchAudio.enterLobby()
})

export default router

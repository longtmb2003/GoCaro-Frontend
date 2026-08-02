<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Crown, Trophy, Users } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { useSocketStore } from '@/stores/socket'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ErrorState from '@/components/ui/ErrorState.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import TournamentBracket from '@/components/TournamentBracket.vue'
import TournamentChampionBanner from '@/components/TournamentChampionBanner.vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { useTournamentStore } from '@/stores/tournament'
import { statusPresentation } from '@/utils/tournament'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const tournaments = useTournamentStore()
const auth = useAuthStore()
const socket = useSocketStore()

const tournamentId = computed(() => String(route.params.id ?? ''))

const detail = computed(() => tournaments.detailFor(tournamentId.value))
const tournament = computed(() => detail.value?.tournament ?? null)
const participants = computed(() => detail.value?.participants ?? [])
const bracket = computed(() => tournaments.bracketFor(tournamentId.value))

const status = computed(() =>
  tournament.value === null ? null : statusPresentation(tournament.value.status),
)

const champion = computed(() => participants.value.find((p) => p.status === 'champion') ?? null)

/** Seeds only exist once the field is full, so the label has to say which it is. */
const fieldHeading = computed(() => {
  const t = tournament.value
  if (t === null) return 'Players'
  if (t.status !== 'registration') return 'Seeded field'
  return `Entered (${String(participants.value.length)}/${String(t.max_players)})`
})

function load(): void {
  if (tournamentId.value !== '') {
    void tournaments.loadTournament(tournamentId.value)
  }
}

const isOrganizer = computed(() => tournament.value?.created_by === auth.user?.id)
const isParticipant = computed(() => participants.value.some((p) => p.user_id === auth.user?.id))

const canRegister = computed(
  () =>
    tournament.value?.status === 'registration' &&
    !isParticipant.value &&
    participants.value.length < (tournament.value?.max_players ?? 0),
)

const canWithdraw = computed(() => tournament.value?.status === 'registration' && isParticipant.value)

const canStart = computed(() => tournament.value?.status === 'ready' && isOrganizer.value)

const registering = ref(false)
const starting = ref(false)

async function handleRegister() {
  registering.value = true
  try {
    await tournaments.register(tournamentId.value)
    toast.addToast('Successfully entered the tournament', 'success')
  } catch (err: any) {
    toast.addToast(err.message || 'Failed to register', 'error')
  } finally {
    registering.value = false
  }
}

async function handleWithdraw() {
  registering.value = true
  try {
    await tournaments.withdraw(tournamentId.value)
    toast.addToast('Withdrawn from the tournament', 'info')
  } catch (err: any) {
    toast.addToast(err.message || 'Failed to withdraw', 'error')
  } finally {
    registering.value = false
  }
}

async function handleStart() {
  starting.value = true
  try {
    await tournaments.start(tournamentId.value)
    toast.addToast('Tournament started', 'success')
  } catch (err: any) {
    toast.addToast(err.message || 'Failed to start', 'error')
  } finally {
    starting.value = false
  }
}

onMounted(load)
watch(tournamentId, load)

watch(
  () => socket.status,
  (status) => {
    if (status === 'matched') {
      router.push('/game')
    }
  },
)

const showChampionBanner = ref(false)

watch(
  () => tournament.value,
  (newT, oldT) => {
    if (!newT) return
    const isNowFinished = newT.status === 'finished'
    const wasNotFinished = !oldT || oldT.status !== 'finished'
    
    // Check if the current user is the champion
    const champion = detail.value?.participants.find(p => p.status === 'champion')
    const amIChampion = champion?.user_id === auth.user?.id
    
    if (isNowFinished && amIChampion) {
      const storageKey = `champion_banner_seen_${newT.id}`
      const hasSeen = sessionStorage.getItem(storageKey)
      
      // Trigger if transitioning to finished while watching, OR if this is the first load
      // of a finished tournament and we haven't seen the banner this session.
      if (wasNotFinished || !hasSeen) {
        showChampionBanner.value = true
        sessionStorage.setItem(storageKey, 'true')
      }
    }
  }
)
</script>

<template>
  <AppLayout :title="tournament?.name ?? 'Tournament'">
    <template #actions>
      <RouterLink
        to="/tournaments"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        All tournaments
      </RouterLink>
    </template>

    <div class="gap-6 mx-auto flex max-w-5xl flex-col">
      <p v-if="tournaments.detailLoading" class="text-foreground-muted py-6 text-body text-center">
        Loading tournament…
      </p>

      <ErrorState v-else-if="tournaments.detailError" :message="tournaments.detailError">
        <template #action>
          <BaseButton variant="secondary" @click="load()">Try again</BaseButton>
        </template>
      </ErrorState>

      <template v-else-if="tournament && status">
        <GlassCard as="section" variant="elevated">
          <div class="gap-4 flex flex-wrap items-start justify-between">
            <div class="gap-2 flex flex-col">
              <div class="gap-3 flex flex-wrap items-center">
                <h2 class="text-card text-foreground gap-2 flex items-center">
                  <Trophy :size="18" aria-hidden="true" />
                  {{ tournament.name }}
                </h2>
                <BaseBadge :variant="status.variant">{{ status.label }}</BaseBadge>
              </div>
              <p class="text-small text-foreground-muted">
                Single elimination · {{ tournament.max_players }} players
                <template v-if="tournament.current_round > 0">
                  · round {{ tournament.current_round }}
                </template>
              </p>
            </div>

            <div v-if="champion" class="gap-2 text-warning flex items-center">
              <Crown :size="20" aria-hidden="true" />
              <span class="text-body font-semibold">{{ champion.display_name }}</span>
            </div>
          </div>
          <template #actions>
            <div class="flex items-center gap-2">
              <BaseButton
                v-if="canRegister"
                variant="primary"
                size="sm"
                :disabled="registering"
                @click="handleRegister"
              >
                Enter Tournament
              </BaseButton>
              <BaseButton
                v-if="canWithdraw"
                variant="secondary"
                size="sm"
                :disabled="registering"
                @click="handleWithdraw"
              >
                Withdraw
              </BaseButton>
              <BaseButton
                v-if="canStart"
                variant="primary"
                size="sm"
                :disabled="starting"
                @click="handleStart"
              >
                Start Tournament
              </BaseButton>
            </div>
          </template>
        </GlassCard>

        <GlassCard as="section" :title="fieldHeading">
          <template #icon><Users :size="18" aria-hidden="true" /></template>

          <EmptyState
            v-if="participants.length === 0"
            title="Nobody has entered yet"
            description="This tournament is waiting for its first players."
          />

          <ul v-else class="gap-2 grid sm:grid-cols-2">
            <li
              v-for="participant in participants"
              :key="participant.user_id"
              class="gap-3 text-small flex items-center justify-between"
              :class="
                participant.status === 'eliminated' ? 'text-foreground-muted' : 'text-foreground'
              "
            >
              <span class="gap-2 flex min-w-0 items-center">
                <span
                  v-if="participant.seed !== null"
                  class="text-caption text-foreground-muted w-6 tabular-nums"
                >
                  #{{ participant.seed }}
                </span>
                <span class="truncate">{{ participant.display_name }}</span>
              </span>
              <span class="gap-2 flex shrink-0 items-center">
                <span class="text-caption text-foreground-muted tabular-nums">
                  {{ participant.elo }}
                </span>
                <Crown
                  v-if="participant.status === 'champion'"
                  :size="14"
                  class="text-warning"
                  aria-label="Champion"
                />
              </span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard as="section" title="Bracket">
          <p v-if="tournaments.bracketLoading" class="text-foreground-muted py-6 text-body text-center">
            Loading bracket…
          </p>

          <ErrorState v-else-if="tournaments.bracketError" :message="tournaments.bracketError">
            <template #action>
              <BaseButton variant="secondary" @click="tournaments.loadBracket(tournamentId)">
                Try again
              </BaseButton>
            </template>
          </ErrorState>

          <TournamentBracket v-else :slots="bracket" />
        </GlassCard>
      </template>
    </div>

    <TournamentChampionBanner
      v-if="showChampionBanner && tournament"
      :tournament-name="tournament.name"
      @close="showChampionBanner = false"
    />
  </AppLayout>
</template>

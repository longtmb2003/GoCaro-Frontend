<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Crown, Trophy, Users } from 'lucide-vue-next'

import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'

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
import { useAppLanguage } from '@/composables/useAppLanguage'

const route = useRoute()
const toast = useToast()
const tournaments = useTournamentStore()
const auth = useAuthStore()
const { t } = useAppLanguage()

const tournamentId = computed(() => String(route.params.id ?? ''))

const detail = computed(() => tournaments.detailFor(tournamentId.value))
const tournament = computed(() => detail.value?.tournament ?? null)
const participants = computed(() => detail.value?.participants ?? [])
const bracket = computed(() => tournaments.bracketFor(tournamentId.value))

const status = computed(() => {
  if (tournament.value === null) return null
  const presentation = statusPresentation(tournament.value.status)
  const labels = {
    registration: t('Open', 'Đang mở'),
    ready: t('Full', 'Đã đủ'),
    running: t('Live', 'Đang diễn ra'),
    finished: t('Finished', 'Đã kết thúc'),
    cancelled: t('Cancelled', 'Đã hủy'),
  }
  return { ...presentation, label: labels[tournament.value.status] }
})

const champion = computed(() => participants.value.find((p) => p.status === 'champion') ?? null)

/** Seeds only exist once the field is full, so the label has to say which it is. */
const fieldHeading = computed(() => {
  const currentTournament = tournament.value
  if (currentTournament === null) return t('Players', 'Người chơi')
  if (currentTournament.status !== 'registration') return t('Seeded field', 'Danh sách hạt giống')
  return `${t('Entered', 'Đã tham gia')} (${String(participants.value.length)}/${String(currentTournament.max_players)})`
})

function load(): void {
  if (tournamentId.value !== '') {
    void tournaments.loadTournament(tournamentId.value)
  }
}

const isOrganizer = computed(() => tournament.value?.created_by === auth.user?.id)
const isParticipant = computed(() => participants.value.some((p) => p.user_id === auth.user?.id))

const canRegister = computed(() => {
  const current = tournament.value
  return current?.status === 'registration' &&
    !isParticipant.value &&
    participants.value.length < current.max_players
})

const canWithdraw = computed(() => tournament.value?.status === 'registration' && isParticipant.value)

const canStart = computed(() => tournament.value?.status === 'ready' && isOrganizer.value)

const registering = ref(false)
const starting = ref(false)

async function handleRegister() {
  registering.value = true
  try {
    await tournaments.register(tournamentId.value)
    toast.addToast(t('Successfully entered the tournament', 'Đã tham gia giải đấu'), 'success')
  } catch (error: unknown) {
    const fallback = t('Failed to register', 'Không thể đăng ký')
    toast.addToast(error instanceof Error ? error.message : fallback, 'error')
  } finally {
    registering.value = false
  }
}

async function handleWithdraw() {
  registering.value = true
  try {
    await tournaments.withdraw(tournamentId.value)
    toast.addToast(t('Withdrawn from the tournament', 'Đã rút khỏi giải đấu'), 'info')
  } catch (error: unknown) {
    const fallback = t('Failed to withdraw', 'Không thể rút khỏi giải đấu')
    toast.addToast(error instanceof Error ? error.message : fallback, 'error')
  } finally {
    registering.value = false
  }
}

async function handleStart() {
  starting.value = true
  try {
    await tournaments.start(tournamentId.value)
    toast.addToast(t('Tournament started', 'Giải đấu đã bắt đầu'), 'success')
  } catch (error: unknown) {
    const fallback = t('Failed to start', 'Không thể bắt đầu giải đấu')
    toast.addToast(error instanceof Error ? error.message : fallback, 'error')
  } finally {
    starting.value = false
  }
}

onMounted(load)
watch(tournamentId, load)



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
  <AppLayout :title="tournament?.name ?? 'Tournament'" fantasy>
    <template #actions>
      <RouterLink
        to="/tournaments"
        class="text-foreground-muted hover:text-foreground text-sm font-medium transition-colors"
      >
        {{ t('All tournaments', 'Tất cả giải đấu') }}
      </RouterLink>
    </template>

    <div class="gap-6 mx-auto flex max-w-5xl flex-col">
      <p v-if="tournaments.detailLoading" class="text-foreground-muted py-6 text-body text-center">
        {{ t('Loading tournament…', 'Đang tải giải đấu…') }}
      </p>

      <ErrorState v-else-if="tournaments.detailError" :message="tournaments.detailError">
        <template #action>
          <BaseButton variant="secondary" @click="load()">{{ t('Try again', 'Thử lại') }}</BaseButton>
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
                {{ t('Single elimination', 'Loại trực tiếp') }} · {{ tournament.max_players }} {{ t('players', 'người chơi') }}
                <template v-if="tournament.current_round > 0">
                  · {{ t('round', 'vòng') }} {{ tournament.current_round }}
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
                {{ t('Enter Tournament', 'Tham gia giải') }}
              </BaseButton>
              <BaseButton
                v-if="canWithdraw"
                variant="secondary"
                size="sm"
                :disabled="registering"
                @click="handleWithdraw"
              >
                {{ t('Withdraw', 'Rút lui') }}
              </BaseButton>
              <BaseButton
                v-if="canStart"
                variant="primary"
                size="sm"
                :disabled="starting"
                @click="handleStart"
              >
                {{ t('Start Tournament', 'Bắt đầu giải') }}
              </BaseButton>
            </div>
          </template>
        </GlassCard>

        <GlassCard as="section" :title="fieldHeading">
          <template #icon><Users :size="18" aria-hidden="true" /></template>

          <EmptyState
            v-if="participants.length === 0"
            :title="t('Nobody has entered yet', 'Chưa có ai tham gia')"
            :description="t('This tournament is waiting for its first players.', 'Giải đấu đang chờ những người chơi đầu tiên.')"
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
                  :aria-label="t('Champion', 'Nhà vô địch')"
                />
              </span>
            </li>
          </ul>
        </GlassCard>

        <GlassCard as="section" :title="t('Bracket', 'Nhánh đấu')">
          <p v-if="tournaments.bracketLoading" class="text-foreground-muted py-6 text-body text-center">
            {{ t('Loading bracket…', 'Đang tải nhánh đấu…') }}
          </p>

          <ErrorState v-else-if="tournaments.bracketError" :message="tournaments.bracketError">
            <template #action>
              <BaseButton variant="secondary" @click="tournaments.loadBracket(tournamentId)">
                {{ t('Try again', 'Thử lại') }}
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

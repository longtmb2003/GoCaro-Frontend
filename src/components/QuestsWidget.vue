<script setup lang="ts">
import { ref, onUnmounted, watch, computed } from 'vue'
import { fetchQuests, claimQuestReward, type Quest } from '@/api/quest'
import { useAuthStore } from '@/stores/auth'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useToast } from '@/composables/useToast'
import GlassCard from '@/components/ui/GlassCard.vue'
import FantasyIcon from '@/components/ui/FantasyIcon.vue'
import BaseProgress from '@/components/ui/BaseProgress.vue'
import BaseDivider from '@/components/ui/BaseDivider.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useCountUp } from '@/composables/useCountUp'
import { Loader2 } from 'lucide-vue-next'

const { t } = useAppLanguage()
const { addToast } = useToast()
const auth = useAuthStore()

const quests = ref<Quest[]>([])
const loading = ref(true)
const claimingCode = ref<string | null>(null)
const loadFailed = ref(false)
const resetCountdown = ref('')
const isModalOpen = ref(false)
let timerInterval: ReturnType<typeof setInterval> | null = null
let recheckTimeout: ReturnType<typeof setTimeout> | null = null
let reloadedForDate: string | null = null

const displayCoins = useCountUp(() => auth.user?.stats.coins ?? 0)

const completedCount = computed(() => quests.value.filter(q => q.progress >= q.target).length)
const totalCount = computed(() => quests.value.length)
const hasClaimable = computed(() => quests.value.some(q => q.progress >= q.target && !q.claimed_at))
const summaryPercent = computed(() => totalCount.value > 0 ? Math.floor((completedCount.value / totalCount.value) * 100) : 0)

watch(
  () => auth.isAuthenticated,
  (authenticated: boolean) => {
    if (authenticated) {
      void loadQuests()
    } else {
      loading.value = false
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
  if (recheckTimeout) clearTimeout(recheckTimeout)
})

function startTimer() {
  if (timerInterval) clearInterval(timerInterval)
  updateResetCountdown()
  timerInterval = setInterval(updateResetCountdown, 1000)
}

function updateResetCountdown() {
  const questDateStr = quests.value[0]?.date
  if (!questDateStr) {
    resetCountdown.value = ''
    return
  }
  const baseDate = new Date(questDateStr)
  if (Number.isNaN(baseDate.getTime())) {
    resetCountdown.value = ''
    return
  }
  const resetTime = baseDate.getTime() + 24 * 60 * 60 * 1000
  const diff = resetTime - Date.now()

  if (diff <= 0) {
    resetCountdown.value = '00:00:00'
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
    if (reloadedForDate === questDateStr) {
      if (!recheckTimeout) {
        recheckTimeout = setTimeout(() => {
          recheckTimeout = null
          void loadQuests()
        }, 60_000)
      }
    } else {
      reloadedForDate = questDateStr
      void loadQuests()
    }
    return
  }
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const secs = Math.floor((diff % (1000 * 60)) / 1000)
  resetCountdown.value = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

async function loadQuests() {
  loading.value = true
  loadFailed.value = false
  try {
    quests.value = await fetchQuests()
    if (quests.value.length > 0) {
      startTimer()
    }
  } catch (err) {
    console.error('Failed to load quests', err)
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

async function claim(quest: Quest) {
  if (claimingCode.value || quest.claimed_at || quest.progress < quest.target) return

  claimingCode.value = quest.code
  try {
    const res = await claimQuestReward(quest.code, quest.date)

    const idx = quests.value.findIndex(q => q.code === quest.code && q.date === quest.date)
    if (idx !== -1) {
      quests.value[idx] = res.quest
    }

    if (auth.user) {
      auth.user.stats.coins = res.new_balance
    }

    addToast(
      t(
        `Quest claimed! Received ${String(quest.reward_coins)} gold.`,
        `Đã nhận thưởng! Nhận được ${String(quest.reward_coins)} vàng.`,
      ),
      'success',
    )
  } catch (err) {
    console.error('Failed to claim quest', err)
    addToast(t('Failed to claim reward', 'Không thể nhận thưởng'), 'error')
  } finally {
    claimingCode.value = null
  }
}

const getQuestName = (code: string) => {
  switch (code) {
    case 'play_3_matches': return t('Play 3 ranked matches', 'Chơi 3 trận xếp hạng')
    case 'win_2_matches': return t('Win 2 ranked matches', 'Thắng 2 trận xếp hạng')
    case 'reach_20_moves': return t('Reach 20 moves in a ranked match', 'Đạt 20 nước trong 1 trận xếp hạng')
    default: return code
  }
}

const getQuestIcon = (code: string) => {
  switch (code) {
    case 'play_3_matches': return 'daily-missions'
    case 'win_2_matches': return 'match-history'
    case 'reach_20_moves': return 'share-game'
    default: return 'daily-missions'
  }
}
</script>

<template>
  <div v-if="auth.isAuthenticated">
    <!-- Compact Summary Side Card -->
    <GlassCard
      as="section"
      :title="t('Daily Missions', 'Nhiệm vụ hằng ngày')"
      class="side-card side-card--missions"
    >
      <template #icon><FantasyIcon type="daily-missions" size="small" /></template>
      <template #actions>
        <span v-if="resetCountdown" class="mission-reset font-mono text-xs text-amber-300/90 font-bold">
          {{ resetCountdown }}
        </span>
      </template>

      <div v-if="loading" class="p-3 flex justify-center text-foreground-muted">
        <Loader2 class="animate-spin" :size="20" />
      </div>
      <div v-else-if="loadFailed" class="p-3 text-center text-xs mission-error">
        <p class="m-0 text-red-400">{{ t('Could not load quests.', 'Không tải được nhiệm vụ.') }}</p>
        <button type="button" class="mission-retry text-amber-300 underline mt-1" @click="loadQuests">
          {{ t('Try again', 'Thử lại') }}
        </button>
      </div>
      <div v-else class="p-3 flex flex-col gap-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-200 font-bold flex items-center gap-1.5">
            <span>{{ completedCount }} / {{ totalCount }} {{ t('Completed', 'Hoàn thành') }}</span>
            <span v-if="hasClaimable" class="px-1.5 py-0.25 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse">
              {{ t('Claimable!', 'Nhận thưởng!') }}
            </span>
          </span>
          <span class="text-slate-400 font-mono font-bold">{{ summaryPercent }}%</span>
        </div>

        <BaseProgress
          tone="warning"
          :label="t('Daily Missions progress', 'Tiến độ nhiệm vụ hằng ngày')"
          :value="summaryPercent"
        />

        <BaseButton
          variant="secondary"
          size="sm"
          class="w-full mt-1.5 flex items-center justify-center gap-1.5"
          @click="isModalOpen = true"
        >
          <FantasyIcon type="daily-missions" size="small" />
          <span>{{ t('View Missions', 'Xem chi tiết nhiệm vụ') }}</span>
        </BaseButton>
      </div>
    </GlassCard>

    <!-- Full Detailed Missions Modal -->
    <BaseModal
      v-if="isModalOpen"
      :title="t('Daily Missions', 'Nhiệm vụ hằng ngày')"
      size="md"
      variant="fantasy"
      @close="isModalOpen = false"
    >
      <div class="mission-list space-y-3">
        <div v-for="quest in quests" :key="quest.code" class="mission-row p-3.5 rounded-xl bg-slate-900/80 border border-[var(--color-fantasy-border-subtle)] space-y-2.5 shadow-md">
          <div class="mission-row__heading flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <FantasyIcon :type="getQuestIcon(quest.code)" size="small" />
              <div class="flex flex-col">
                <small class="text-[10px] text-amber-400 uppercase font-bold tracking-wider">{{ t('Daily quest', 'Nhiệm vụ ngày') }}</small>
                <strong class="text-sm font-bold text-slate-100">{{ getQuestName(quest.code) }}</strong>
              </div>
            </div>
            <div class="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-400/10 px-2 py-1 rounded-lg border border-amber-400/30">
              <span>◆</span> {{ quest.reward_coins }} {{ t('gold', 'vàng') }}
            </div>
          </div>

          <div class="mission-row__progress flex items-center gap-3">
            <BaseProgress
              class="flex-1"
              tone="warning"
              :label="getQuestName(quest.code) + ' progress'"
              :value="quest.progress >= quest.target ? 100 : Math.floor((quest.progress / quest.target) * 100)"
            />
            <span class="text-xs font-mono font-bold text-slate-300">{{ Math.min(quest.progress, quest.target) }} / {{ quest.target }}</span>
          </div>

          <div class="flex justify-end pt-1">
            <button
              type="button"
              :disabled="quest.claimed_at !== null || quest.progress < quest.target || claimingCode === quest.code"
              class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border"
              :class="{
                'opacity-50 cursor-not-allowed bg-slate-800/40 text-slate-400 border-slate-700': quest.claimed_at !== null || quest.progress < quest.target,
                'bg-amber-400/20 text-amber-300 border-amber-400/50 hover:bg-amber-400/30 shadow-glow cursor-pointer': quest.progress >= quest.target && quest.claimed_at === null
              }"
              @click="claim(quest)"
            >
              <Loader2 v-if="claimingCode === quest.code" class="animate-spin inline mr-1" :size="14" />
              <span>{{ quest.claimed_at ? t('Claimed', 'Đã nhận') : quest.progress >= quest.target ? t('Claim Reward', 'Nhận thưởng') : t('In progress', 'Đang làm') }}</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-slate-400 text-center italic pt-1">
          {{ t('Casual matches do not count toward quests.', 'Trận thường không tính vào nhiệm vụ.') }}
        </p>

        <BaseDivider />
        <div class="flex items-center justify-between text-xs font-bold text-slate-200">
          <span>{{ t('Treasury', 'Kho báu') }}</span>
          <span class="text-amber-300 font-mono text-sm">◆ {{ displayCoins }}</span>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<style scoped>
.side-card--missions {
  /* Use same styling classes available in LobbyPage */
}

.mission-reset {
  font-family: var(--font-mono);
  font-size: var(--text-caption);
  font-weight: 600;
  color: var(--color-fantasy-gold);
  background: color-mix(in srgb, var(--color-fantasy-gold) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-fantasy-gold) 20%, transparent);
  border-radius: var(--radius-pill);
  padding: 0.125rem var(--space-sm);
}

.mission-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: 0 var(--space-lg) var(--space-lg);
}

.mission-row {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1px dashed var(--color-border);
}
.mission-row:last-of-type {
  border-bottom: none;
  padding-bottom: 0;
}

.mission-row__heading {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.mission-row__heading span {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.mission-row__rarity {
  font-size: var(--text-caption);
  color: var(--color-fantasy-gold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}

.mission-row__heading strong {
  font-size: var(--text-body);
  color: var(--color-fantasy-stone);
}

.mission-row__progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  font-size: var(--text-caption);
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.mission-row__reward {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--text-caption);
  margin-top: 2px;
}

.mission-row__reward span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-fantasy-gold);
  font-weight: 600;
}

.mission-row__reward button {
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  font-size: var(--text-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.2s;
}

.mission-row__reward button:disabled {
  color: var(--text-muted);
}

.mission-error {
  color: var(--color-error);
}

.mission-retry {
  margin-top: var(--space-sm);
  font-size: var(--text-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fantasy-gold);
  background: none;
  border: none;
  padding: 0;
}

.mission-retry:hover {
  text-decoration: underline;
}

.mission-note {
  margin: 0;
  font-size: var(--text-caption);
  color: var(--text-muted);
  font-style: italic;
}

.mission-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 0;
  font-size: var(--text-body);
  color: var(--text-muted);
}

.mission-total strong {
  font-size: var(--text-h3);
  color: var(--color-fantasy-gold);
  font-family: var(--font-mono);
  font-weight: 800;
}
</style>

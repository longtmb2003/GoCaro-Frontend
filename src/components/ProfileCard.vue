<script setup lang="ts">
import { computed } from 'vue'
import { Coins, Flame, Lock, Pencil, ShieldCheck, Trophy } from 'lucide-vue-next'

import { getRankProgress, getRankSubTier, getRankTier } from '@/config/ranks'
import { useCountUp } from '@/composables/useCountUp'
import { useAppLanguage } from '@/composables/useAppLanguage'
import { useUserProfile } from '@/composables/useUserProfile'
import { useAuthStore } from '@/stores/auth'
import type { AccountType, UserStats } from '@/types/auth'
import FantasySystemIcon from './ui/FantasySystemIcon.vue'

import RankFrame from './RankFrame.vue'

import { onMounted } from 'vue'
import { useShopStore } from '@/stores/shop'
import { resolveSpirit } from '@/spirits/spiritRegistry'

const auth = useAuthStore()
const shopStore = useShopStore()
const { openProfile } = useUserProfile()
const { language, rankName, t } = useAppLanguage()

onMounted(async () => {
  if (!shopStore.isLoaded && auth.isAuthenticated) {
    await shopStore.loadStore().catch(() => undefined)
  }
})

const equippedSpirit = computed(() => {
  const code = shopStore.getEquipped('spirit_art')
  if (!code) return null
  const spirit = resolveSpirit(code, null, { withArt: true })
  if (!spirit.model.source) return null
  const langKey = language.value
  return {
    code,
    name: spirit.name[langKey],
    source: spirit.model.source,
  }
})

const props = defineProps<{
  displayName: string
  elo: number
  accountType: AccountType
  stats?: UserStats
}>()

const emit = defineEmits<{ edit: []; upgrade: [] }>()

const initial = computed(() => props.displayName.charAt(0).toUpperCase())
const isGuest = computed(() => props.accountType === 'anonymous')
const rankTier = computed(() => {
  const tier = getRankTier(props.elo)
  return `${rankName(tier.name)} ${getRankSubTier(props.elo)}`.trim()
})
const rankColor = computed(() => getRankTier(props.elo).color)
const rankKey = computed(() => getRankTier(props.elo).name.toLowerCase())
const winRate = computed(() => {
  if (!props.stats || props.stats.matches_played === 0) return 0
  return Math.round((props.stats.wins / props.stats.matches_played) * 100)
})
const streak = computed(() => props.stats?.current_streak || 0)
const rankProgress = computed(() => getRankProgress(props.elo))
const nextLevelMax = computed(() => rankProgress.value.nextThreshold)
const progressPercent = computed(() => rankProgress.value.percent)
const displayCoins = useCountUp(() => props.stats?.coins || 0)
</script>

<template>
  <section class="profile-card" :data-rank-tier="rankKey" :aria-label="t('Your profile', 'Hồ sơ của bạn')">
    <span class="profile-card__light" aria-hidden="true" />

    <div class="profile-card__identity">
      <div class="profile-card__avatar">
        <span class="profile-card__halo" aria-hidden="true" />
        <RankFrame :elo="elo" :initial="initial" size="lg" />
        <span class="profile-card__status" aria-hidden="true" />
      </div>

      <div v-if="equippedSpirit" class="profile-card__companion" :title="t('Active Companion: ', 'Đồng hành: ') + equippedSpirit.name">
        <img :src="equippedSpirit.source" :alt="equippedSpirit.name" class="companion-art" />
      </div>
    </div>

    <div class="profile-card__name-row">
      <p class="profile-card__fullname" :title="displayName">{{ displayName }}</p>
      <button
        v-if="!isGuest"
        type="button"
        class="profile-card__edit"
        :aria-label="t('Edit profile', 'Chỉnh sửa hồ sơ')"
        @click="emit('edit')"
      >
        <FantasySystemIcon compact><Pencil :size="14" aria-hidden="true" /></FantasySystemIcon>
      </button>
    </div>

    <div class="profile-card__rank">
      <p>{{ t('Realm rating', 'Điểm xếp hạng') }}</p>
      <strong>{{ elo }}</strong>
      <span :class="rankColor"
        ><FantasySystemIcon compact><ShieldCheck :size="18" /></FantasySystemIcon>
        {{ rankTier }}</span
      >
    </div>

    <div class="profile-card__progress">
      <div>
        <span>{{ t('Rank progress', 'Tiến trình xếp hạng') }}</span>
        <span v-if="nextLevelMax !== null">{{ elo }} / {{ nextLevelMax }}</span>
        <span v-else>{{ elo }} Elo · {{ t('Max rank', 'Bậc cao nhất') }}</span>
      </div>
      <div
        class="profile-card__track"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="nextLevelMax !== null
          ? t(`Progress to ${nextLevelMax.toString()} rating`, `Tiến trình đến ${nextLevelMax.toString()} điểm`)
          : t('Highest rank achieved', 'Đã đạt bậc cao nhất')"
      >
        <span class="profile-card__track-bed" aria-hidden="true" />
        <span class="profile-card__crystal" aria-hidden="true" />
        <span
          class="profile-card__energy"
          :style="{ width: `${progressPercent.toString()}%` }"
          aria-hidden="true"
        >
          <i class="profile-card__spark profile-card__spark--one" />
          <i class="profile-card__spark profile-card__spark--two" />
        </span>
      </div>
    </div>

    <dl class="profile-card__stats">
      <div>
        <dt>
          <FantasySystemIcon compact><Coins :size="18" aria-hidden="true" /></FantasySystemIcon>
          {{ t('Coins', 'Xu') }}
        </dt>
        <dd>{{ displayCoins }}</dd>
      </div>
      <div>
        <dt>{{ t('Win rate', 'Tỷ lệ thắng') }}</dt>
        <dd>{{ winRate }}%</dd>
      </div>
      <div>
        <dt>
          <FantasySystemIcon compact><Flame :size="18" aria-hidden="true" /></FantasySystemIcon>
          {{ t('Streak', 'Chuỗi thắng') }}
        </dt>
        <dd>{{ streak > 0 ? `+${streak.toString()}` : streak }}</dd>
      </div>
    </dl>

    <button
      type="button"
      class="profile-card__cta"
      @click="!auth.isGuest ? openProfile(auth.user?.id || '') : emit('upgrade')"
    >
      <FantasySystemIcon compact>
        <Lock v-if="auth.isGuest" :size="18" aria-hidden="true" />
        <Trophy v-else :size="18" aria-hidden="true" />
      </FantasySystemIcon>
      {{
        auth.isGuest
          ? t('Unlock Competitive Profile', 'Mở khóa hồ sơ thi đấu')
          : t('View Competitive Profile', 'Xem hồ sơ thi đấu')
      }}
    </button>
  </section>
</template>

<style scoped>
.profile-card {
  --profile-rank: var(--color-rank-iron);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-iron) 48%, white);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 0.85rem 1rem;
  border: 1px solid color-mix(in srgb, var(--profile-rank) 30%, transparent);
  border-radius: var(--radius-card);
  background:
    radial-gradient(
      circle at 18% 0%,
      color-mix(in srgb, var(--profile-rank) 10%, transparent),
      transparent 42%
    ),
    repeating-linear-gradient(
      108deg,
      transparent 0 0.85rem,
      rgb(229 222 210 / 0.015) 0.9rem 0.95rem
    ),
    linear-gradient(145deg, rgb(30 42 52 / 0.92), rgb(7 18 32 / 0.95));
  box-shadow:
    var(--shadow-card),
    inset 0 1px 0 rgb(229 222 210 / 0.1),
    0 0 1rem color-mix(in srgb, var(--profile-rank) 5%, transparent);
  -webkit-backdrop-filter: blur(var(--blur-md)) saturate(1.08);
  backdrop-filter: blur(var(--blur-md)) saturate(1.08);
}

.profile-card[data-rank-tier='bronze'] {
  --profile-rank: var(--color-rank-bronze);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-bronze) 58%, white);
}

.profile-card[data-rank-tier='silver'] {
  --profile-rank: var(--color-rank-silver);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-silver) 52%, white);
}

.profile-card[data-rank-tier='gold'] {
  --profile-rank: var(--color-rank-gold);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-gold-warm) 58%, white);
}

.profile-card[data-rank-tier='diamond'] {
  --profile-rank: var(--color-rank-diamond);
  --profile-rank-highlight: color-mix(in srgb, var(--color-rank-diamond) 50%, white);
}

.profile-card::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  margin: 0.3rem;
  border: 1px solid rgb(229 222 210 / 0.05);
  border-radius: calc(var(--radius-card) - 0.3rem);
  background: linear-gradient(115deg, rgb(229 222 210 / 0.03), transparent 38%);
  content: '';
}

.profile-card::after {
  position: absolute;
  inset: 0.3rem;
  z-index: 0;
  border: 1px solid rgb(229 222 210 / 0.04);
  border-radius: calc(var(--radius-card) - 0.3rem);
  background:
    linear-gradient(
        135deg,
        rgb(214 181 106 / 0.35) 0 0.18rem,
        rgb(70 47 22 / 0.4) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      top left / 1.25rem 1.25rem no-repeat,
    linear-gradient(
        225deg,
        rgb(214 181 106 / 0.35) 0 0.18rem,
        rgb(70 47 22 / 0.4) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      top right / 1.25rem 1.25rem no-repeat,
    linear-gradient(
        45deg,
        rgb(214 181 106 / 0.3) 0 0.18rem,
        rgb(70 47 22 / 0.35) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      bottom left / 1.25rem 1.25rem no-repeat,
    linear-gradient(
        315deg,
        rgb(214 181 106 / 0.3) 0 0.18rem,
        rgb(70 47 22 / 0.35) 0.2rem 0.32rem,
        transparent 0.34rem
      )
      bottom right / 1.25rem 1.25rem no-repeat;
  box-shadow: inset 0 0 1rem rgb(0 5 14 / 0.15);
  content: '';
  pointer-events: none;
}

.profile-card > :not(.profile-card__light) {
  position: relative;
  z-index: 1;
}

.profile-card__light {
  position: absolute;
  top: 0;
  left: 12%;
  width: 76%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgb(211 168 84 / 0.8), transparent);
}

.profile-card__identity {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.profile-card__avatar {
  position: relative;
  display: grid;
  width: 4.15rem;
  height: 4.15rem;
  place-items: center;
}

.profile-card__halo {
  position: absolute;
  inset: 0;
  border: 1px solid color-mix(in srgb, var(--profile-rank) 48%, var(--color-rank-gold));
  box-shadow:
    0 0 18px color-mix(in srgb, var(--profile-rank) 18%, transparent),
    inset 0 0 16px color-mix(in srgb, var(--profile-rank) 10%, transparent);
  clip-path: polygon(50% 0, 88% 16%, 100% 50%, 88% 84%, 50% 100%, 12% 84%, 0 50%, 12% 16%);
}

.profile-card__halo::before,
.profile-card__halo::after {
  position: absolute;
  top: 50%;
  width: 0.5rem;
  height: 1px;
  background: var(--color-warning);
  content: '';
}

.profile-card__halo::before {
  left: -0.25rem;
}
.profile-card__halo::after {
  right: -0.25rem;
}

.profile-card__status {
  position: absolute;
  right: 0.25rem;
  bottom: 0.25rem;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--surface-background);
  border-radius: var(--radius-pill);
  background: var(--color-success);
  box-shadow: 0 0 6px var(--color-success);
}

.profile-card__name-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  margin-top: 0.125rem;
}

.profile-card__fullname {
  color: var(--text-foreground);
  font-size: 0.8rem;
  font-weight: 700;
  line-height: 1.3;
  text-align: center;
  word-break: break-word;
  overflow-wrap: break-word;
}

.profile-card__edit {
  display: grid;
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-duration-fast) ease-out,
    background var(--transition-duration-fast) ease-out;
}

.profile-card__edit:hover {
  color: var(--color-accent);
  background: var(--color-accent-soft);
}

.profile-card__rank {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: end;
  gap: 0.25rem 0.75rem;
  margin-top: 0.5rem;
  padding-top: 0.45rem;
  border-top: 1px solid var(--surface-border-subtle);
}

.profile-card__rank p {
  grid-column: 1 / -1;
}

.profile-card__rank p,
.profile-card__progress > div:first-child,
.profile-card__stats dt {
  color: var(--text-muted);
  font-size: var(--text-caption);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.profile-card__rank strong {
  color: transparent;
  font-family: 'Manrope', Inter, ui-sans-serif, system-ui, sans-serif;
  font-size: 1.5rem;
  line-height: 1.7rem;
  background: linear-gradient(135deg, #fff1b8, var(--color-warning));
  -webkit-background-clip: text;
  background-clip: text;
  filter: drop-shadow(0 0 6px rgb(211 168 84 / 0.12));
}

.profile-card__rank > span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-small);
  font-weight: 700;
  justify-self: end;
  text-align: right;
  text-shadow: 0 0 0.5rem color-mix(in srgb, var(--profile-rank) 34%, transparent);
}

.profile-card__progress {
  margin-top: 0.45rem;
}

.profile-card__progress > div:first-child {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  letter-spacing: 0.06em;
}

.profile-card__track {
  position: relative;
  height: 0.5rem;
  margin-left: 0.35rem;
  padding: 1px;
  border: 1px solid rgb(214 181 106 / 0.48);
  border-radius: var(--radius-pill);
  background: var(--surface-sunken);
  box-shadow:
    inset 0 2px 4px rgb(0 0 0 / 0.52),
    0 0 0.5rem rgb(86 183 255 / 0.08);
}

.profile-card__track-bed {
  position: absolute;
  inset: 1px;
  overflow: hidden;
  border-radius: inherit;
  background: linear-gradient(90deg, rgb(9 24 40 / 0.9), rgb(18 41 59 / 0.86));
}

.profile-card__energy {
  position: absolute;
  top: 1px;
  bottom: 1px;
  left: 1px;
  display: block;
  border-radius: inherit;
  background: linear-gradient(90deg, #2b7fd3, #56b7ff 55%, #6be3ff);
  box-shadow:
    0 0 0.75rem rgb(107 227 255 / 0.7),
    inset 0 1px 0 rgb(255 255 255 / 0.56);
  transition: width var(--transition-duration-slow) ease-out;
}

.profile-card__crystal {
  position: absolute;
  top: 50%;
  left: -0.35rem;
  z-index: 2;
  width: 0.85rem;
  height: 0.85rem;
  border: 1px solid rgb(229 222 210 / 0.9);
  background: linear-gradient(135deg, #dff8ff, #56b7ff 48%, #2457ac);
  box-shadow:
    0 0 0.65rem rgb(107 227 255 / 0.76),
    inset 0 1px 0 rgb(255 255 255 / 0.74);
  transform: translateY(-50%) rotate(45deg);
}

.profile-card__spark {
  position: absolute;
  width: 0.18rem;
  height: 0.18rem;
  border-radius: var(--radius-pill);
  background: #f7feff;
  box-shadow: 0 0 0.3rem #6be3ff;
  animation: crystal-spark 2.4s ease-out infinite;
}

.profile-card__spark--one {
  top: -0.1rem;
  right: 18%;
}

.profile-card__spark--two {
  right: 42%;
  bottom: -0.1rem;
  animation-delay: 1.1s;
}

@keyframes crystal-spark {
  0%,
  70%,
  100% {
    opacity: 0;
    transform: scale(0.5);
  }
  78% {
    opacity: 1;
    transform: scale(1.3);
  }
}

.profile-card__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: 0.5rem;
}

.profile-card__stats > div {
  min-width: 0;
  padding: 0 0.5rem;
  text-align: center;
}

.profile-card__stats dt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  letter-spacing: 0.04em;
}

.profile-card__stats dt svg {
  color: var(--color-warning);
}

.profile-card__stats dd {
  margin-top: 0.15rem;
  color: var(--text-foreground);
  font-size: var(--text-body);
  font-weight: 800;
}

.profile-card__cta {
  display: flex;
  width: 100%;
  min-height: 2.25rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.6rem;
  padding: 0.45rem 0.75rem;
  color: var(--text-secondary);
  font-size: var(--text-small);
  font-weight: 700;
  border: 1px solid rgb(211 168 84 / 0.3);
  border-radius: var(--radius-button);
  background: rgb(255 255 255 / 0.035);
  transition:
    transform var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-fast) ease-out;
}

.profile-card__cta:hover {
  color: var(--text-foreground);
  border-color: rgb(211 168 84 / 0.44);
  box-shadow: 0 0 12px rgb(211 168 84 / 0.1);
  transform: translateY(-2px);
}

.profile-card__companion {
  position: relative;
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-card);
  border: 1px solid var(--color-fantasy-border-subtle);
  background: color-mix(in srgb, var(--color-fantasy-gold) 12%, transparent);
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-fantasy-gold) 20%, transparent);
  transition: transform var(--transition-duration-normal) ease, border-color var(--transition-duration-normal) ease;
}

.profile-card__companion:hover {
  transform: scale(1.12);
  border-color: var(--color-fantasy-gold);
}

.companion-art {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.6));
}

@media (prefers-reduced-motion: reduce) {
  .profile-card__energy,
  .profile-card__spark,
  .profile-card__cta {
    transition: none;
    animation: none;
  }
  .profile-card__cta:hover {
    transform: none;
  }
}
</style>

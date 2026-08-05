<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  Bell,
  ChevronDown,
  CircleDot,
  Gamepad2,
  Gift,
  Globe2,
  LockKeyhole,
  Settings,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  UsersRound,
} from 'lucide-vue-next'

import { ApiError } from '@/api/ApiError'
import PlayAsGuestButton from '@/components/PlayAsGuestButton.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import GlassCard from '@/components/ui/GlassCard.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const isRegisterMode = computed(() => route.name === 'register')

type LanguageCode = 'en' | 'vi'

const UI_COPY = {
  en: {
    season: 'Season I',
    seasonName: 'The Aether Crown',
    languageLabel: 'Choose language',
    notifications: 'Notifications',
    launcherSettings: 'Launcher settings',
    ambientSound: 'Ambient sound',
    off: 'Off',
    motionEffects: 'Motion effects',
    auto: 'Auto',
    brandKicker: 'Enter the floating kingdom',
    brandSubtitle: 'The Ultimate Online Gomoku Experience',
    accountAccess: 'Account access',
    login: 'Log in',
    createAccount: 'Create account',
    username: 'Username',
    password: 'Password',
    confirmPassword: 'Confirm password',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    agreement: 'I accept the Player Agreement and Privacy Policy.',
    usernameLength: 'Username must be 3–20 characters.',
    usernameCharacters: 'Use letters and numbers only.',
    passwordMin: 'Password must be at least 8 characters.',
    passwordMax: 'Password must be at most 72 characters.',
    passwordMismatch: 'Passwords do not match.',
    agreementRequired: 'Please accept the player agreement to continue.',
    unreachable: 'The realm could not be reached. Please try again.',
    recovery: 'Password recovery is coming soon. Please contact game support for help.',
    noNotifications: 'You have no new launcher notifications.',
    providerNotice: 'sign-in is not connected yet. Use your GoCaro account or enter as a guest.',
    opening: 'Opening the gates…',
    forging: 'Forging your account…',
    enterRealm: 'Enter the realm',
    createChampion: 'Create your champion',
    continueWith: 'Continue with',
    guest: 'Enter as guest',
    noAccount: 'No account needed',
    realtime: 'Realtime',
    globalMultiplayer: 'Global multiplayer',
    ranked: 'Ranked',
    climbLadder: 'Climb the ladder',
    rewards: 'Rewards',
    seasonTreasures: 'Season treasures',
    heroEyebrow: 'A world above the clouds',
    compete: 'Compete.',
    climb: 'Climb.',
    conquer: 'Conquer.',
    heroDescription:
      'Master the ancient game. Challenge players across the realm and forge your legend.',
    seasonLive: 'Season I · Now live',
    termsPrivacy: 'Terms · Privacy',
    support: 'Support',
    welcome: 'Welcome back, champion',
    legendBegins: 'Your legend begins',
    entering: 'Entering the realm…',
  },
  vi: {
    season: 'Mùa I',
    seasonName: 'Vương Miện Thiên Không',
    languageLabel: 'Chọn ngôn ngữ',
    notifications: 'Thông báo',
    launcherSettings: 'Cài đặt launcher',
    ambientSound: 'Âm thanh môi trường',
    off: 'Tắt',
    motionEffects: 'Hiệu ứng chuyển động',
    auto: 'Tự động',
    brandKicker: 'Bước vào vương quốc trên mây',
    brandSubtitle: 'Trải nghiệm Gomoku trực tuyến đỉnh cao',
    accountAccess: 'Truy cập tài khoản',
    login: 'Đăng nhập',
    createAccount: 'Tạo tài khoản',
    username: 'Tên đăng nhập',
    password: 'Mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu',
    rememberMe: 'Ghi nhớ tôi',
    forgotPassword: 'Quên mật khẩu?',
    agreement: 'Tôi đồng ý với Thỏa thuận người chơi và Chính sách quyền riêng tư.',
    usernameLength: 'Tên đăng nhập phải có từ 3–20 ký tự.',
    usernameCharacters: 'Chỉ sử dụng chữ cái và chữ số.',
    passwordMin: 'Mật khẩu phải có ít nhất 8 ký tự.',
    passwordMax: 'Mật khẩu không được vượt quá 72 ký tự.',
    passwordMismatch: 'Mật khẩu xác nhận không khớp.',
    agreementRequired: 'Vui lòng chấp nhận thỏa thuận người chơi để tiếp tục.',
    unreachable: 'Không thể kết nối tới máy chủ. Vui lòng thử lại.',
    recovery: 'Tính năng khôi phục mật khẩu sắp ra mắt. Vui lòng liên hệ hỗ trợ.',
    noNotifications: 'Bạn không có thông báo mới.',
    providerNotice: 'chưa được kết nối. Hãy dùng tài khoản GoCaro hoặc chơi với tư cách khách.',
    opening: 'Đang mở cánh cổng…',
    forging: 'Đang tạo tài khoản…',
    enterRealm: 'Bước vào vương quốc',
    createChampion: 'Tạo chiến binh',
    continueWith: 'Tiếp tục với',
    guest: 'Chơi với tư cách khách',
    noAccount: 'Không cần tài khoản',
    realtime: 'Thời gian thực',
    globalMultiplayer: 'Đấu trực tuyến toàn cầu',
    ranked: 'Xếp hạng',
    climbLadder: 'Chinh phục bảng xếp hạng',
    rewards: 'Phần thưởng',
    seasonTreasures: 'Kho báu mùa giải',
    heroEyebrow: 'Thế giới trên những tầng mây',
    compete: 'Thi đấu.',
    climb: 'Thăng hạng.',
    conquer: 'Chinh phục.',
    heroDescription:
      'Làm chủ trò chơi cổ xưa, thách đấu người chơi khắp vương quốc và viết nên huyền thoại.',
    seasonLive: 'Mùa I · Đang diễn ra',
    termsPrivacy: 'Điều khoản · Quyền riêng tư',
    support: 'Hỗ trợ',
    welcome: 'Chào mừng nhà vô địch trở lại',
    legendBegins: 'Huyền thoại của bạn bắt đầu',
    entering: 'Đang bước vào vương quốc…',
  },
} as const

const languageOptions = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const
const storedLanguage = localStorage.getItem('gocaro.language')
const language = ref<LanguageCode>(storedLanguage === 'vi' ? 'vi' : 'en')
const ui = computed(() => UI_COPY[language.value])
const selectedLanguage = computed(
  () => languageOptions.find((option) => option.code === language.value)?.label ?? 'English',
)

const rememberedUsername = localStorage.getItem('gocaro.rememberedUsername') ?? ''
const username = ref(rememberedUsername)
const password = ref('')
const confirmPassword = ref('')
const rememberMe = ref(rememberedUsername !== '')
const termsAccepted = ref(false)
const usernameError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')
const termsError = ref('')
const serverError = ref('')
const recoveryNotice = ref('')
const loading = ref(false)
const loginSuccess = ref(false)

const USERNAME_PATTERN = /^[a-zA-Z0-9]+$/

watch(isRegisterMode, () => {
  password.value = ''
  confirmPassword.value = ''
  termsAccepted.value = false
  usernameError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  termsError.value = ''
  serverError.value = ''
  recoveryNotice.value = ''
})

watch(
  language,
  (value) => {
    localStorage.setItem('gocaro.language', value)
    document.documentElement.lang = value
    usernameError.value = ''
    passwordError.value = ''
    confirmPasswordError.value = ''
    termsError.value = ''
    serverError.value = ''
    recoveryNotice.value = ''
  },
  { immediate: true },
)

function validate(): boolean {
  usernameError.value = ''
  passwordError.value = ''
  confirmPasswordError.value = ''
  termsError.value = ''

  const name = username.value.trim()
  if (name.length < 3 || name.length > 20) {
    usernameError.value = ui.value.usernameLength
  } else if (!USERNAME_PATTERN.test(name)) {
    usernameError.value = ui.value.usernameCharacters
  }

  if (password.value.length < 8) {
    passwordError.value = ui.value.passwordMin
  } else if (password.value.length > 72) {
    passwordError.value = ui.value.passwordMax
  }

  if (isRegisterMode.value && confirmPassword.value !== password.value) {
    confirmPasswordError.value = ui.value.passwordMismatch
  }

  if (isRegisterMode.value && !termsAccepted.value) {
    termsError.value = ui.value.agreementRequired
  }

  return (
    usernameError.value === '' &&
    passwordError.value === '' &&
    confirmPasswordError.value === '' &&
    termsError.value === ''
  )
}

async function handleSubmit(): Promise<void> {
  if (loading.value || !validate()) return

  loading.value = true
  serverError.value = ''
  recoveryNotice.value = ''

  try {
    const credentials = { username: username.value.trim(), password: password.value }
    if (isRegisterMode.value) {
      await auth.register(credentials)
    }
    await auth.login(credentials)

    if (!isRegisterMode.value && rememberMe.value) {
      localStorage.setItem('gocaro.rememberedUsername', credentials.username)
    } else if (!isRegisterMode.value) {
      localStorage.removeItem('gocaro.rememberedUsername')
    }

    loginSuccess.value = true
    window.setTimeout(async () => {
      const redirect =
        !isRegisterMode.value && typeof route.query.redirect === 'string'
          ? route.query.redirect
          : '/'
      await router.push(redirect)
    }, 600)
  } catch (error) {
    serverError.value = error instanceof ApiError ? error.message : ui.value.unreachable
    loading.value = false
  }
}

function showRecoveryNotice(): void {
  serverError.value = ''
  recoveryNotice.value = ui.value.recovery
}

function showProviderNotice(provider: string): void {
  serverError.value = ''
  recoveryNotice.value = `${provider} ${ui.value.providerNotice}`
}

function showNotificationNotice(): void {
  serverError.value = ''
  recoveryNotice.value = ui.value.noNotifications
}

function selectLanguage(nextLanguage: LanguageCode, event: MouseEvent): void {
  language.value = nextLanguage
  const languageMenu = (event.currentTarget as HTMLElement).closest('details')
  languageMenu?.removeAttribute('open')
}
</script>

<template>
  <main class="launcher min-h-screen overflow-hidden bg-background text-foreground">
    <img
      class="launcher__art"
      src="/gocaro-login-stone-arena-v4.png"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
    />
    <div class="launcher__shade" aria-hidden="true" />
    <div class="launcher__ambient" aria-hidden="true" />
    <div class="launcher__clouds" aria-hidden="true" />
    <div class="launcher__particles" aria-hidden="true">
      <span v-for="particle in 12" :key="particle" />
    </div>

    <header class="launcher-bar" aria-label="Launcher controls">
      <div class="season-badge">
        <span class="season-badge__crest" aria-hidden="true"><Sparkles :size="16" /></span>
        <span
          ><strong>{{ ui.season }}</strong
          ><small>{{ ui.seasonName }}</small></span
        >
      </div>

      <div class="launcher-bar__actions">
        <span class="server-state"><i aria-hidden="true" /> North America</span>
        <details class="bar-menu">
          <summary :aria-label="ui.languageLabel">
            <Globe2 :size="18" aria-hidden="true" />
            <span>{{ selectedLanguage }}</span>
            <ChevronDown :size="15" aria-hidden="true" />
          </summary>
          <div class="bar-menu__popover">
            <button
              v-for="option in languageOptions"
              :key="option.code"
              type="button"
              :aria-current="language === option.code ? 'true' : undefined"
              @click="selectLanguage(option.code, $event)"
            >
              {{ option.label }}
            </button>
          </div>
        </details>
        <button
          class="bar-icon"
          type="button"
          :aria-label="ui.notifications"
          :title="ui.notifications"
          @click="showNotificationNotice"
        >
          <Bell :size="18" aria-hidden="true" />
          <span class="bar-icon__dot" aria-hidden="true" />
        </button>
        <details class="bar-menu bar-menu--settings">
          <summary class="bar-icon" :aria-label="ui.launcherSettings" :title="ui.launcherSettings">
            <Settings :size="18" aria-hidden="true" />
          </summary>
          <div class="bar-menu__popover settings-popover">
            <p>{{ ui.launcherSettings }}</p>
            <div class="settings-row">
              <span>{{ ui.ambientSound }}</span
              ><span class="setting-state">{{ ui.off }}</span>
            </div>
            <div class="settings-row">
              <span>{{ ui.motionEffects }}</span
              ><span class="setting-state">{{ ui.auto }}</span>
            </div>
          </div>
        </details>
      </div>
    </header>

    <div class="launcher__content">
      <GlassCard
        as="section"
        variant="elevated"
        class="login-panel"
        :class="{ 'login-panel--register': isRegisterMode }"
      >
        <div class="brand-lockup">
          <div class="crystal-mark" aria-hidden="true">
            <svg viewBox="0 0 96 96" role="img">
              <defs>
                <linearGradient id="crystal" x1="10" y1="10" x2="86" y2="86">
                  <stop stop-color="var(--color-accent-hover)" />
                  <stop offset=".5" stop-color="var(--color-primary-500)" />
                  <stop offset="1" stop-color="var(--color-player-o-hover)" />
                </linearGradient>
              </defs>
              <path
                d="M48 5 84 29v38L48 91 12 67V29Z"
                fill="none"
                stroke="url(#crystal)"
                stroke-width="2"
              />
              <path
                d="m48 14 21 22-9 31-12 12-12-12-9-31Z"
                fill="url(#crystal)"
                fill-opacity=".24"
                stroke="url(#crystal)"
                stroke-width="2"
              />
              <path
                d="M48 14v65M27 36h42M36 67l12-31 12 31"
                fill="none"
                stroke="var(--color-primary-100)"
                stroke-opacity=".8"
                stroke-width="1.5"
              />
              <circle cx="31" cy="52" r="4.5" fill="var(--color-accent)" />
              <circle cx="65" cy="52" r="4.5" fill="var(--color-player-o)" />
              <path d="m43 31 5-9 5 9-5 8Z" fill="var(--color-foreground)" />
            </svg>
          </div>
          <p class="brand-kicker">{{ ui.brandKicker }}</p>
          <h1>GO CARO</h1>
          <p class="brand-subtitle">{{ ui.brandSubtitle }}</p>
        </div>

        <nav class="auth-tabs" :aria-label="ui.accountAccess">
          <RouterLink to="/login" :aria-current="!isRegisterMode ? 'page' : undefined">{{
            ui.login
          }}</RouterLink>
          <RouterLink to="/register" :aria-current="isRegisterMode ? 'page' : undefined">{{
            ui.createAccount
          }}</RouterLink>
        </nav>

        <form class="login-form" novalidate @submit.prevent="handleSubmit">
          <BaseInput
            v-model="username"
            name="username"
            :label="ui.username"
            label-hidden
            :placeholder="ui.username"
            autocomplete="username"
            :error="usernameError"
            :disabled="loading || loginSuccess"
            required
          >
            <template #prefix><UserRound :size="19" /></template>
          </BaseInput>
          <BaseInput
            v-model="password"
            name="password"
            type="password"
            :label="ui.password"
            label-hidden
            :placeholder="ui.password"
            :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
            :error="passwordError"
            :disabled="loading || loginSuccess"
            required
          >
            <template #prefix><LockKeyhole :size="18" /></template>
          </BaseInput>

          <Transition name="field-reveal">
            <BaseInput
              v-if="isRegisterMode"
              v-model="confirmPassword"
              name="confirm-password"
              type="password"
              :label="ui.confirmPassword"
              label-hidden
              :placeholder="ui.confirmPassword"
              autocomplete="new-password"
              :error="confirmPasswordError"
              :disabled="loading || loginSuccess"
              required
            >
              <template #prefix><ShieldCheck :size="18" /></template>
            </BaseInput>
          </Transition>

          <div v-if="!isRegisterMode" class="form-options">
            <label class="remember-control">
              <input v-model="rememberMe" type="checkbox" :disabled="loading || loginSuccess" />
              <span class="checkbox-visual" aria-hidden="true" />
              <span class="control-label">{{ ui.rememberMe }}</span>
            </label>
            <button type="button" @click="showRecoveryNotice">{{ ui.forgotPassword }}</button>
          </div>

          <div v-else class="register-agreement">
            <label class="remember-control">
              <input v-model="termsAccepted" type="checkbox" :disabled="loading || loginSuccess" />
              <span class="checkbox-visual" aria-hidden="true" />
              <span class="control-label agreement-copy">{{ ui.agreement }}</span>
            </label>
            <p v-if="termsError" role="alert">{{ termsError }}</p>
          </div>

          <p v-if="serverError" class="form-message form-message--error" role="alert">
            {{ serverError }}
          </p>
          <p v-else-if="recoveryNotice" class="form-message" role="status">
            {{ recoveryNotice }}
          </p>

          <BaseButton
            type="submit"
            size="lg"
            class="launcher-submit w-full"
            :loading="loading"
            :disabled="loginSuccess"
          >
            {{
              loading
                ? isRegisterMode
                  ? ui.forging
                  : ui.opening
                : isRegisterMode
                  ? ui.createChampion
                  : ui.enterRealm
            }}
          </BaseButton>
        </form>

        <PlayAsGuestButton
          compact
          :compact-label="ui.guest"
          :compact-badge="ui.noAccount"
          :disabled="loading || loginSuccess"
          class="guest-entry"
        />

        <div class="social-divider">
          <span />
          <p>{{ ui.continueWith }}</p>
          <span />
        </div>
        <div class="social-logins" aria-label="Social sign in options">
          <button
            type="button"
            aria-label="Continue with Google"
            title="Google"
            @click="showProviderNotice('Google')"
          >
            <b>G</b>
          </button>
          <button
            type="button"
            aria-label="Continue with Discord"
            title="Discord"
            @click="showProviderNotice('Discord')"
          >
            <Gamepad2 :size="21" />
          </button>
          <button
            type="button"
            aria-label="Continue with Steam"
            title="Steam"
            @click="showProviderNotice('Steam')"
          >
            <CircleDot :size="21" />
          </button>
          <button
            type="button"
            aria-label="Continue with Apple"
            title="Apple"
            @click="showProviderNotice('Apple')"
          >
            <b>A</b>
          </button>
        </div>

        <div class="feature-strip" aria-label="Game features">
          <article>
            <span><UsersRound :size="19" /></span>
            <div>
              <h2>{{ ui.realtime }}</h2>
              <p>{{ ui.globalMultiplayer }}</p>
            </div>
          </article>
          <article>
            <span><Trophy :size="19" /></span>
            <div>
              <h2>{{ ui.ranked }}</h2>
              <p>{{ ui.climbLadder }}</p>
            </div>
          </article>
          <article>
            <span><Gift :size="19" /></span>
            <div>
              <h2>{{ ui.rewards }}</h2>
              <p>{{ ui.seasonTreasures }}</p>
            </div>
          </article>
        </div>
      </GlassCard>

      <section class="hero-message" aria-label="Game introduction">
        <p class="hero-message__eyebrow"><Sparkles :size="15" /> {{ ui.heroEyebrow }}</p>
        <h2>
          {{ ui.compete }}<br />{{ ui.climb }}<br /><em>{{ ui.conquer }}</em>
        </h2>
        <p>{{ ui.heroDescription }}</p>
        <div>
          <span /><small>{{ ui.seasonLive }}</small>
        </div>
      </section>
    </div>

    <footer class="launcher-footer">
      <span>GoCaro v1.0.0</span>
      <nav aria-label="Launcher information">
        <span>{{ ui.termsPrivacy }}</span>
        <a
          href="https://github.com/longtmb2003/GoCaro-Frontend"
          target="_blank"
          rel="noopener noreferrer"
          >{{ ui.support }}</a
        >
      </nav>
    </footer>

    <div v-if="loginSuccess" class="success-overlay" role="status" aria-live="polite">
      <div class="crystal-mark crystal-mark--success" aria-hidden="true">
        <Sparkles :size="42" />
      </div>
      <h2>{{ isRegisterMode ? ui.legendBegins : ui.welcome }}</h2>
      <p>{{ ui.entering }}</p>
    </div>
  </main>
</template>

<style scoped>
.launcher {
  position: relative;
  isolation: isolate;
  background: var(--surface-background);
  /* Local aliases map directly to the documented 4px spacing scale. */
  --spacing-xs: calc(var(--spacing) * 1);
  --spacing-sm: calc(var(--spacing) * 2);
  --spacing-md: calc(var(--spacing) * 3);
  --spacing-lg: calc(var(--spacing) * 4);
  --spacing-xl: calc(var(--spacing) * 6);
  --spacing-2xl: calc(var(--spacing) * 8);
  --spacing-3xl: calc(var(--spacing) * 10);
}

.launcher__art,
.launcher__shade,
.launcher__ambient,
.launcher__clouds,
.launcher__particles {
  position: fixed;
  inset: 0;
}

.launcher__art {
  z-index: -5;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.01);
}

.launcher__shade {
  z-index: -4;
  background:
    linear-gradient(90deg, rgb(3 9 24 / 0.75) 0%, rgb(3 9 24 / 0.34) 32%, transparent 58%),
    linear-gradient(0deg, rgb(3 8 20 / 0.78) 0%, transparent 34%),
    radial-gradient(circle at 72% 35%, transparent 18%, rgb(3 7 18 / 0.12) 72%);
}

.launcher__ambient {
  z-index: -3;
  background: radial-gradient(circle at 63% 13%, rgb(255 211 137 / 0.14), transparent 24%);
  animation: ambient-light 9s ease-in-out infinite alternate;
}

.launcher__clouds {
  z-index: -2;
  width: 46%;
  height: 28%;
  top: 26%;
  left: 33%;
  border-radius: var(--radius-pill);
  background: rgb(205 225 255 / 0.08);
  filter: blur(var(--blur-xl));
  animation: cloud-drift 18s ease-in-out infinite alternate;
}

.launcher__particles {
  z-index: -1;
  pointer-events: none;
}

.launcher__particles span {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: var(--radius-pill);
  background: var(--color-accent-hover);
  box-shadow: 0 0 12px var(--color-accent);
  opacity: 0;
  animation: dust-rise 8s ease-in infinite;
}

.launcher__particles span:nth-child(1) {
  left: 39%;
  top: 84%;
  animation-delay: 0s;
}
.launcher__particles span:nth-child(2) {
  left: 52%;
  top: 72%;
  animation-delay: 1.4s;
}
.launcher__particles span:nth-child(3) {
  left: 69%;
  top: 80%;
  animation-delay: 2.7s;
}
.launcher__particles span:nth-child(4) {
  left: 83%;
  top: 67%;
  animation-delay: 3.6s;
}
.launcher__particles span:nth-child(5) {
  left: 91%;
  top: 78%;
  animation-delay: 5.1s;
}
.launcher__particles span:nth-child(6) {
  left: 60%;
  top: 58%;
  animation-delay: 6.3s;
}
.launcher__particles span:nth-child(7) {
  left: 75%;
  top: 53%;
  animation-delay: 1.8s;
}
.launcher__particles span:nth-child(8) {
  left: 47%;
  top: 62%;
  animation-delay: 4.4s;
}
.launcher__particles span:nth-child(9) {
  left: 88%;
  top: 44%;
  animation-delay: 2.2s;
}
.launcher__particles span:nth-child(10) {
  left: 57%;
  top: 88%;
  animation-delay: 5.7s;
}
.launcher__particles span:nth-child(11) {
  left: 96%;
  top: 60%;
  animation-delay: 3.1s;
}
.launcher__particles span:nth-child(12) {
  left: 72%;
  top: 92%;
  animation-delay: 7s;
}

.launcher-bar {
  position: fixed;
  z-index: 20;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  min-height: 72px;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg) var(--spacing-2xl);
  background: linear-gradient(180deg, rgb(3 8 22 / 0.5), transparent);
}

.season-badge,
.launcher-bar__actions,
.bar-menu summary,
.server-state {
  display: flex;
  align-items: center;
}

.season-badge {
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg) var(--spacing-sm) var(--spacing-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-pill);
  background: rgb(5 14 35 / 0.62);
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    var(--shadow-card);
  backdrop-filter: blur(var(--blur-md));
}

.season-badge__crest {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: var(--radius-pill);
  color: var(--color-warning-400);
  background: color-mix(in srgb, var(--color-warning-500) 16%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-warning-400) 30%, transparent);
}

.season-badge strong,
.season-badge small {
  display: block;
  line-height: 1.2;
  text-transform: uppercase;
}

.season-badge strong {
  color: var(--color-warning-400);
  font-size: var(--text-caption);
  letter-spacing: 0.12em;
}

.season-badge small {
  margin-top: var(--spacing-xs);
  color: var(--color-foreground-secondary);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.launcher-bar__actions {
  gap: var(--spacing-sm);
}
.server-state {
  gap: var(--spacing-sm);
  margin-right: var(--spacing-sm);
  color: var(--color-foreground-secondary);
  font-size: var(--text-caption);
}
.server-state i {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-success-400);
  box-shadow: 0 0 10px var(--color-success-400);
}

.bar-menu {
  position: relative;
}
.bar-menu summary,
.bar-icon {
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: var(--radius-button);
  color: var(--color-foreground-secondary);
  background: transparent;
  transition:
    background-color var(--transition-duration-fast) ease-out,
    color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out;
}
.bar-menu summary {
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-md);
  list-style: none;
  cursor: pointer;
}
.bar-menu summary::-webkit-details-marker {
  display: none;
}
.bar-icon {
  position: relative;
  display: grid;
  min-width: 44px;
  place-items: center;
}
.bar-menu summary:hover,
.bar-icon:hover,
.bar-menu[open] summary {
  color: var(--color-foreground);
  border-color: var(--color-border);
  background: var(--color-glass);
}
.bar-icon__dot {
  position: absolute;
  top: 11px;
  right: 11px;
  width: 5px;
  height: 5px;
  border-radius: var(--radius-pill);
  background: var(--color-player-o);
  box-shadow: 0 0 8px var(--color-player-o);
}
.bar-menu__popover {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  width: 170px;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-md);
  background: var(--color-glass-strong);
  box-shadow: var(--shadow-floating);
  backdrop-filter: blur(var(--blur-lg));
}
.bar-menu__popover button {
  width: 100%;
  min-height: 40px;
  padding: 0 var(--spacing-md);
  border-radius: var(--radius-sm);
  color: var(--color-foreground-secondary);
  text-align: left;
}
.bar-menu__popover button:hover {
  color: var(--color-foreground);
  background: var(--color-glass-light);
}
.settings-popover {
  width: 240px;
}
.settings-popover p {
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-foreground);
  font-size: var(--text-small);
  font-weight: 600;
}
.settings-row {
  display: flex;
  min-height: 40px;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
  color: var(--color-foreground-secondary);
  font-size: var(--text-small);
}
.setting-state {
  color: var(--color-accent);
  font-size: var(--text-caption);
}

.launcher__content {
  position: relative;
  z-index: 5;
  display: flex;
  min-height: 100vh;
  align-items: center;
  padding: 88px var(--spacing-3xl) 56px;
}

.login-panel {
  width: 100%;
  max-width: 500px;
  margin-left: 1vw;
  border-radius: var(--radius-modal);
}

.login-panel--register {
  max-width: 520px;
}

.brand-lockup {
  text-align: center;
}
.crystal-mark {
  position: relative;
  width: 76px;
  height: 76px;
  margin: 0 auto var(--spacing-sm);
  filter: drop-shadow(0 0 18px var(--color-accent-glow))
    drop-shadow(0 0 28px var(--color-player-o-glow));
  animation: logo-float 5s ease-in-out infinite;
}
.crystal-mark::after {
  position: absolute;
  inset: 12%;
  background: linear-gradient(
    110deg,
    transparent 28%,
    rgb(255 255 255 / 0.72) 48%,
    transparent 68%
  );
  content: '';
  clip-path: polygon(50% 0, 100% 34%, 86% 100%, 14% 100%, 0 34%);
  transform: translateX(-120%);
  animation: logo-shimmer 5s ease-in-out infinite;
}
.crystal-mark svg {
  width: 100%;
  height: 100%;
}
.brand-kicker {
  color: var(--color-warning-400);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.brand-lockup h1 {
  margin-top: var(--spacing-xs);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--text-page);
  font-weight: 500;
  letter-spacing: 0.14em;
  text-shadow: 0 0 24px var(--color-accent-glow);
}
.brand-subtitle {
  margin-top: var(--spacing-xs);
  color: var(--color-foreground-muted);
  font-size: 11px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.auth-tabs {
  position: relative;
  display: grid;
  grid-template-columns: 1fr 1fr;
  margin-top: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}
.auth-tabs a {
  position: relative;
  display: grid;
  min-height: 46px;
  place-items: center;
  color: var(--color-foreground-muted);
  font-size: var(--text-small);
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  transition: color var(--transition-duration-fast) ease-out;
}
.auth-tabs a:hover {
  color: var(--color-foreground);
}
.auth-tabs a[aria-current='page'] {
  color: var(--color-foreground);
}
.auth-tabs a[aria-current='page']::after {
  position: absolute;
  right: 12%;
  bottom: -1px;
  left: 12%;
  height: 2px;
  border-radius: var(--radius-pill);
  background: linear-gradient(90deg, var(--color-accent), var(--color-secondary-400));
  box-shadow: 0 0 12px var(--color-accent);
  content: '';
  animation: tab-reveal var(--transition-duration-normal) ease-out both;
}

.login-form {
  display: grid;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}
.login-form :deep(input) {
  height: 52px;
  border-color: var(--color-border);
  background: rgb(3 11 27 / 0.48);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.035);
}
.login-form :deep(input:hover) {
  border-color: var(--color-border-strong);
}
.login-form :deep(input:focus) {
  border-color: var(--color-accent);
  box-shadow:
    0 0 0 1px var(--color-accent-soft),
    0 0 24px var(--color-accent-glow),
    inset 0 1px 0 rgb(255 255 255 / 0.06);
}
.form-options {
  display: flex;
  min-height: 28px;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  color: var(--color-foreground-secondary);
  font-size: var(--text-small);
}
.form-options button {
  min-height: 44px;
  color: var(--color-primary-300);
  transition: color var(--transition-duration-fast) ease-out;
}
.form-options button:hover {
  color: var(--color-accent-hover);
}
.remember-control {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
}
.remember-control input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}
.remember-control .checkbox-visual {
  position: relative;
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: rgb(3 11 27 / 0.56);
  transition:
    border-color var(--transition-duration-fast) ease-out,
    background-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-fast) ease-out;
}
.remember-control input:checked + .checkbox-visual {
  border-color: var(--color-accent);
  background: var(--color-primary-600);
  box-shadow: 0 0 12px var(--color-accent-glow);
}
.remember-control input:checked + .checkbox-visual::after {
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  content: '';
  transform: rotate(45deg);
}
.remember-control input:focus-visible + .checkbox-visual {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.form-message {
  margin-top: calc(var(--spacing-sm) * -1);
  color: var(--color-info);
  font-size: var(--text-small);
}
.form-message--error {
  color: var(--color-error);
}

.register-agreement {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-sm);
  background: rgb(255 255 255 / 0.025);
}

.register-agreement .remember-control {
  align-items: flex-start;
  color: var(--color-foreground-secondary);
  line-height: 1.45;
}

.register-agreement .checkbox-visual {
  margin-top: 1px;
}

.control-label {
  min-width: 0;
}

.agreement-copy {
  flex: 1;
}

.register-agreement p {
  margin-top: var(--spacing-sm);
  padding-left: calc(18px + var(--spacing-sm));
  color: var(--color-error);
  font-size: var(--text-small);
  line-height: 1.4;
}

.field-reveal-enter-active,
.field-reveal-leave-active {
  transition:
    opacity var(--transition-duration-normal) ease-out,
    transform var(--transition-duration-normal) ease-out;
}

.field-reveal-enter-from,
.field-reveal-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.launcher-submit {
  min-height: 52px;
  border-color: color-mix(in srgb, var(--color-accent) 42%, transparent) !important;
  background: linear-gradient(
    105deg,
    var(--color-primary-600),
    var(--color-secondary-600),
    color-mix(in srgb, var(--color-player-o) 72%, var(--color-secondary-600))
  ) !important;
  text-transform: uppercase;
  letter-spacing: 0.08em !important;
}
.launcher-submit:hover {
  box-shadow:
    0 0 34px var(--color-accent-glow),
    0 0 34px var(--color-player-o-glow),
    var(--shadow-card) !important;
}

.social-divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}
.social-divider span {
  height: 1px;
  background: var(--color-border);
}
.social-divider p {
  color: var(--color-foreground-muted);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.social-logins {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.social-logins button {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-foreground-secondary);
  background: rgb(5 14 32 / 0.48);
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.04);
  transition:
    transform var(--transition-duration-fast) ease-out,
    color var(--transition-duration-fast) ease-out,
    border-color var(--transition-duration-fast) ease-out,
    box-shadow var(--transition-duration-normal) ease-out;
}
.social-logins button:hover {
  color: var(--color-foreground);
  border-color: var(--color-accent);
  box-shadow: var(--shadow-glow);
  transform: translateY(-2px) scale(1.02);
}
.social-logins button:active {
  transform: scale(0.98);
}
.social-logins b {
  font-size: var(--text-card);
}
.guest-entry {
  margin-top: var(--spacing-lg);
}
.guest-entry :deep(.base-button) {
  min-height: 48px;
  color: var(--color-foreground);
  font-size: var(--text-small);
}

.feature-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}
.feature-strip article {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  background: rgb(255 255 255 / 0.025);
}
.feature-strip article > span {
  display: grid;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  place-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  background: var(--color-accent-soft);
}
.feature-strip article:nth-child(2) > span {
  color: var(--color-warning-400);
  background: color-mix(in srgb, var(--color-warning-500) 12%, transparent);
}
.feature-strip article:nth-child(3) > span {
  color: var(--color-player-o-hover);
  background: var(--color-player-o-soft);
}
.feature-strip h2 {
  overflow: hidden;
  color: var(--color-foreground);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-overflow: ellipsis;
  text-transform: uppercase;
}
.feature-strip p {
  margin-top: 2px;
  overflow: hidden;
  color: var(--color-foreground-muted);
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-message {
  position: absolute;
  top: 112px;
  left: calc(500px + 8vw);
  width: 320px;
  padding: var(--spacing-xl);
  text-align: left;
  text-shadow: 0 2px 22px rgb(0 0 0 / 0.76);
}
.hero-message::before {
  position: absolute;
  z-index: -1;
  inset: -24px;
  background: radial-gradient(circle at 70% 70%, rgb(3 8 20 / 0.52), transparent 65%);
  content: '';
  filter: blur(var(--blur-sm));
}
.hero-message__eyebrow {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-sm);
  color: var(--color-warning-400) !important;
  font-size: var(--text-caption) !important;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.hero-message h2 {
  margin-top: var(--spacing-sm);
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.5rem, 3.2vw, 3.5rem);
  font-weight: 400;
  line-height: 0.9;
  letter-spacing: -0.035em;
}
.hero-message h2 em {
  color: var(--color-primary-200);
  font-style: normal;
  text-shadow: 0 0 24px var(--color-accent-glow);
}
.hero-message > p {
  margin-top: var(--spacing-lg);
  color: var(--color-foreground-secondary);
  font-size: var(--text-small);
  line-height: 1.65;
}
.hero-message > div {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  color: var(--color-foreground-muted);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.hero-message > div span {
  width: 48px;
  height: 1px;
  background: linear-gradient(90deg, var(--color-warning-400), transparent);
}

.launcher-footer {
  position: fixed;
  z-index: 10;
  right: var(--spacing-2xl);
  bottom: var(--spacing-lg);
  left: var(--spacing-2xl);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: rgb(255 255 255 / 0.48);
  font-size: 10px;
  letter-spacing: 0.06em;
}
.launcher-footer nav {
  display: flex;
  gap: var(--spacing-lg);
}
.launcher-footer a:hover {
  color: var(--color-foreground);
}

.success-overlay {
  position: fixed;
  z-index: 50;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(3 8 20 / 0.9);
  backdrop-filter: blur(var(--blur-lg));
  animation: success-in var(--transition-duration-normal) ease-out both;
}
.crystal-mark--success {
  display: grid;
  place-items: center;
  color: var(--color-accent-hover);
}
.success-overlay h2 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: var(--text-page);
  font-weight: 500;
}
.success-overlay p {
  margin-top: var(--spacing-sm);
  color: var(--color-primary-300);
  font-size: var(--text-small);
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@keyframes ambient-light {
  from {
    opacity: 0.68;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1.04);
  }
}
@keyframes cloud-drift {
  from {
    opacity: 0.34;
    transform: translate3d(-2%, 0, 0);
  }
  to {
    opacity: 0.7;
    transform: translate3d(7%, -3%, 0);
  }
}
@keyframes dust-rise {
  0% {
    opacity: 0;
    transform: translate3d(0, 12px, 0) scale(0.6);
  }
  25% {
    opacity: 0.7;
  }
  100% {
    opacity: 0;
    transform: translate3d(20px, -90px, 0) scale(1.2);
  }
}
@keyframes logo-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
@keyframes logo-shimmer {
  0%,
  58% {
    opacity: 0;
    transform: translateX(-120%);
  }
  70% {
    opacity: 0.8;
  }
  82%,
  100% {
    opacity: 0;
    transform: translateX(120%);
  }
}
@keyframes tab-reveal {
  from {
    opacity: 0;
    transform: scaleX(0.25);
  }
  to {
    opacity: 1;
    transform: scaleX(1);
  }
}
@keyframes success-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 1279px) {
  .hero-message {
    width: 300px;
  }
  .server-state {
    display: none;
  }
}

@media (max-width: 1023px) {
  .launcher__art {
    object-position: 68% center;
  }
  .launcher__shade {
    background: linear-gradient(
      90deg,
      rgb(3 9 24 / 0.86),
      rgb(3 9 24 / 0.55) 60%,
      rgb(3 9 24 / 0.28)
    );
  }
  .launcher__content {
    justify-content: center;
    padding-right: var(--spacing-xl);
    padding-left: var(--spacing-xl);
  }
  .login-panel {
    margin-left: 0;
  }
  .hero-message {
    display: none;
  }
}

@media (max-width: 639px) {
  .launcher {
    overflow-y: auto;
  }
  .launcher__art {
    object-position: 72% center;
  }
  .launcher__shade {
    background: rgb(3 9 24 / 0.68);
  }
  .launcher-bar {
    position: absolute;
    min-height: 64px;
    padding: var(--spacing-sm) var(--spacing-lg);
  }
  .season-badge {
    padding-right: var(--spacing-sm);
  }
  .season-badge small,
  .launcher-bar__actions > .bar-menu:first-of-type span,
  .launcher-bar__actions > .bar-icon,
  .bar-menu--settings {
    display: none;
  }
  .launcher__content {
    align-items: flex-start;
    padding: 80px var(--spacing-lg) 48px;
  }
  .login-panel {
    max-width: 480px;
  }
  .login-panel {
    padding: var(--spacing-lg);
  }
  .brand-kicker {
    display: none;
  }
  .crystal-mark {
    width: 64px;
    height: 64px;
  }
  .brand-lockup h1 {
    font-size: var(--text-section);
  }
  .brand-subtitle {
    font-size: 9px;
  }
  .auth-tabs {
    margin-top: var(--spacing-lg);
  }
  .login-form {
    margin-top: var(--spacing-lg);
  }
  .feature-strip {
    grid-template-columns: 1fr;
  }
  .feature-strip article {
    justify-content: flex-start;
  }
  .launcher-footer {
    display: none;
  }
}

@media (max-height: 840px) and (min-width: 1024px) {
  .launcher__content {
    align-items: flex-start;
    overflow-y: auto;
  }
  .crystal-mark {
    width: 58px;
    height: 58px;
  }
  .brand-kicker {
    display: none;
  }
  .brand-lockup h1 {
    font-size: var(--text-section);
  }
  .auth-tabs,
  .login-form,
  .social-divider {
    margin-top: var(--spacing-lg);
  }
  .feature-strip {
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
  }
}

@media (prefers-reduced-motion: reduce) {
  .launcher__ambient,
  .launcher__clouds,
  .launcher__particles span,
  .crystal-mark,
  .crystal-mark::after,
  .auth-tabs a[aria-current='page']::after {
    animation: none;
  }
  .social-logins button:hover {
    transform: none;
  }
}
</style>

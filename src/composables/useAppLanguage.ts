import { readonly, ref } from 'vue'

export type LanguageCode = 'en' | 'vi'

const LANGUAGE_STORAGE_KEY = 'gocaro.language'

export const APP_LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
] as const satisfies ReadonlyArray<{ code: LanguageCode; label: string }>

function storedLanguage(): LanguageCode {
  if (typeof window === 'undefined') return 'en'
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'vi' ? 'vi' : 'en'
}

const language = ref<LanguageCode>(storedLanguage())

function applyLanguage(nextLanguage: LanguageCode): void {
  if (typeof document !== 'undefined') document.documentElement.lang = nextLanguage
}

function setLanguage(nextLanguage: LanguageCode): void {
  language.value = nextLanguage
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage)
  }
  applyLanguage(nextLanguage)
}

/**
 * Lightweight application-wide translator. Keeping the selected language in
 * this module makes every component reactive without introducing a second
 * locale store or requiring callers to pass the language through props.
 */
function t(english: string, vietnamese: string): string {
  return language.value === 'vi' ? vietnamese : english
}

function rankName(name: string): string {
  if (language.value !== 'vi') return name
  return (
    {
      Iron: 'Sắt',
      Bronze: 'Đồng',
      Silver: 'Bạc',
      Gold: 'Vàng',
      Platinum: 'Bạch kim',
      Diamond: 'Kim cương',
      Master: 'Cao thủ',
      Grandmaster: 'Đại cao thủ',
    } as Record<string, string>
  )[name] ?? name
}

const VIETNAMESE_ERROR_MESSAGES: Record<string, string> = {
  'You are not signed in.': 'Bạn chưa đăng nhập.',
  'Ranked play requires a saved account.': 'Đấu xếp hạng yêu cầu tài khoản đã lưu.',
  'Matchmaking failed. Please try again.': 'Tìm trận thất bại. Vui lòng thử lại.',
  'Connection lost. Please try again.': 'Mất kết nối. Vui lòng thử lại.',
  'Security verification failed or expired. Please try again.':
    'Xác thực bảo mật thất bại hoặc đã hết hạn. Vui lòng thử lại.',
  'You declined the match.': 'Bạn đã từ chối trận đấu.',
  'The match was cancelled because nobody accepted in time.':
    'Trận đấu bị huỷ vì không ai chấp nhận kịp thời gian.',
  'Matchmaking is locked because too many matches were abandoned.':
    'Tìm trận đang bị khoá do bỏ trận quá nhiều lần.',
  'Failed to join the room.': 'Không thể vào phòng.',
  'This room is no longer available.': 'Phòng này không còn khả dụng.',
  'This room is full.': 'Phòng này đã đầy.',
  'It is not your turn.': 'Chưa đến lượt của bạn.',
  'That cell is already occupied.': 'Ô này đã có quân.',
  'The match is no longer active.': 'Trận đấu không còn hoạt động.',
  'ITEM_LOCKED': 'Vật phẩm đã bị khóa.',
  'INSUFFICIENT_COINS': 'Không đủ xu.',
  'ALREADY_OWNED': 'Bạn đã sở hữu vật phẩm này.',
  'NOT_FOUND': 'Không tìm thấy vật phẩm.',
  'INVALID_SLOT': 'Khe trang bị không hợp lệ.',
  'EQUIP_FAILED': 'Không thể trang bị vật phẩm.',
}

const ENGLISH_ERROR_MESSAGES: Record<string, string> = {
  'ITEM_LOCKED': 'Item is locked.',
  'INSUFFICIENT_COINS': 'Not enough coins.',
  'ALREADY_OWNED': 'Item already owned.',
  'NOT_FOUND': 'Item not found.',
  'INVALID_SLOT': 'Invalid equipment slot.',
  'EQUIP_FAILED': 'Failed to equip item.',
}

function errorText(messageOrCode: string | null | undefined): string {
  if (!messageOrCode) return ''

  if (language.value === 'vi') {
    return VIETNAMESE_ERROR_MESSAGES[messageOrCode] ?? messageOrCode
  }

  return ENGLISH_ERROR_MESSAGES[messageOrCode] ?? messageOrCode
}

applyLanguage(language.value)

export function useAppLanguage() {
  return {
    language: readonly(language),
    languageOptions: APP_LANGUAGE_OPTIONS,
    setLanguage,
    t,
    rankName,
    errorText,
  }
}

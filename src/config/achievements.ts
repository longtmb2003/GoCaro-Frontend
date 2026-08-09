import { Trophy, Star, Flame, Award, Crown, Swords, Medal, Users, ShieldCheck, Sparkles, BookOpen, PawPrint } from 'lucide-vue-next'
import type { Component } from 'vue'

/**
 * Presentation only. What an achievement actually pays out lives in the
 * database — `shop_items.unlock_achievement` points a free item at the
 * achievement that unlocks it, and the evaluator grants it on unlock. Nothing
 * here should carry a reward figure of its own: a number written here would be
 * a promise the backend never makes.
 */
export interface AchievementDef {
  id: string
  icon: Component
  name: { en: string; vi: string }
  desc: { en: string; vi: string }
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_win',
    icon: Star,
    name: { en: 'First Blood', vi: 'Chiến thắng đầu' },
    desc: { en: 'Win your first match', vi: 'Giành chiến thắng trận đầu tiên' },
  },
  {
    id: 'win_streak_5',
    icon: Flame,
    name: { en: 'On Fire', vi: 'Chuỗi thắng 5' },
    desc: { en: 'Win 5 matches in a row', vi: 'Thắng 5 trận liên tiếp' },
  },
  {
    id: 'ranked_50_wins',
    icon: Award,
    name: { en: 'Veteran', vi: 'Lão tướng' },
    desc: { en: 'Win 50 ranked matches', vi: 'Thắng 50 trận xếp hạng' },
  },
  {
    id: 'ranked_100_wins',
    icon: Crown,
    name: { en: 'Master', vi: 'Bậc thầy' },
    desc: { en: 'Win 100 ranked matches', vi: 'Thắng 100 trận xếp hạng' },
  },
  {
    id: 'first_tournament',
    icon: Swords,
    name: { en: 'Gladiator', vi: 'Võ sĩ giác đấu' },
    desc: { en: 'Join a tournament', vi: 'Tham gia một giải đấu' },
  },
  {
    id: 'first_tournament_win',
    icon: Medal,
    name: { en: 'Tournament Victor', vi: 'Thắng giải đấu' },
    desc: { en: 'Win a tournament match', vi: 'Thắng một trận trong giải đấu' },
  },
  {
    id: 'tournament_champion',
    icon: Trophy,
    name: { en: 'Champion', vi: 'Nhà vô địch' },
    desc: { en: 'Win a tournament', vi: 'Vô địch một giải đấu' },
  },
  {
    id: 'first_friend',
    icon: Users,
    name: { en: 'Social Butterfly', vi: 'Kết bạn' },
    desc: { en: 'Add your first friend', vi: 'Kết bạn lần đầu tiên' },
  },
  {
    id: 'rank_silver',
    icon: ShieldCheck,
    name: { en: 'Silver Rank', vi: 'Huy chương Bạc' },
    desc: { en: 'Reach Silver rank', vi: 'Đạt mốc xếp hạng Silver' },
  },
  {
    id: 'rank_gold',
    icon: ShieldCheck,
    name: { en: 'Gold Rank', vi: 'Huy chương Vàng' },
    desc: { en: 'Reach Gold rank', vi: 'Đạt mốc xếp hạng Gold' },
  },
  {
    id: 'rank_diamond',
    icon: ShieldCheck,
    name: { en: 'Diamond Rank', vi: 'Huy chương Kim Cương' },
    desc: { en: 'Reach Diamond rank', vi: 'Đạt mốc xếp hạng Diamond' },
  },
  // The three below are the only achievements the database currently pays out
  // for (migrations 000025 and 000027), so leaving them off the page hid every
  // reward the game actually gives.
  {
    id: 'collect_3_spirits',
    icon: PawPrint,
    name: { en: 'Beastmaster', vi: 'Ngự thú sư' },
    desc: { en: 'Collect 3 different spirits', vi: 'Sưu tầm 3 linh thú khác nhau' },
  },
  {
    id: 'collect_all_common',
    icon: BookOpen,
    name: { en: 'Collector', vi: 'Nhà sưu tầm' },
    desc: { en: 'Collect every common spirit', vi: 'Sưu tầm toàn bộ linh thú thường' },
  },
  {
    id: 'first_evolution',
    icon: Sparkles,
    name: { en: 'Evolved', vi: 'Tiến hóa' },
    desc: { en: 'Evolve a spirit for the first time', vi: 'Tiến hóa linh thú lần đầu' },
  },
]

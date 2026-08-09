import { createShareLink } from '@/api/share'
import { useToast } from '@/composables/useToast'
import { useAppLanguage } from '@/composables/useAppLanguage'

interface ShareOptions {
  title: string
  text: string
  matchId?: string
}

export function useShareLink() {
  const { addToast } = useToast()
  const { t } = useAppLanguage()

  async function share(options: ShareOptions): Promise<void> {
    const link = await createShareLink(options.matchId)
    const url = `${window.location.origin}/share/${link.token}`
    const nativeShare = (
      navigator.share as ((data: ShareData) => Promise<void>) | undefined
    )?.bind(navigator)

    if (nativeShare) {
      try {
        await nativeShare({ title: options.title, text: options.text, url })
        addToast(t('Link shared successfully!', 'Đã chia sẻ liên kết thành công!'), 'success')
      } catch {
        // Dismissing the system share sheet is not an application error. The
        // unused server link remains harmless and cannot grant a reward.
      }
      return
    }

    await navigator.clipboard.writeText(url)
    addToast(t('Link copied to clipboard!', 'Đã sao chép liên kết vào bộ nhớ tạm!'), 'info')
  }

  return { share }
}

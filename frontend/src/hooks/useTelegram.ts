import { useEffect, useState } from 'react'

declare global {
  interface Window {
    Telegram: {
      WebApp: {
        ready(): void
        expand(): void
        close(): void
        colorScheme: 'light' | 'dark'
        themeParams: Record<string, string>
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
          }
        }
        onEvent(event: string, callback: () => void): void
        offEvent(event: string, callback: () => void): void
        BackButton: { show(): void; hide(): void; onClick(fn: () => void): void; offClick(fn: () => void): void }
        MainButton: {
          show(): void; hide(): void; setText(t: string): void
          onClick(fn: () => void): void; offClick(fn: () => void): void
          showProgress(leave: boolean): void; hideProgress(): void
        }
        HapticFeedback: {
          impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
          notificationOccurred(type: 'error' | 'success' | 'warning'): void
          selectionChanged(): void
        }
      }
    }
  }
}

export function useTelegram() {
  const tg = window.Telegram?.WebApp
  const [theme, setTheme] = useState<'light' | 'dark'>(tg?.colorScheme ?? 'dark')

  useEffect(() => {
    if (!tg) return
    tg.ready()
    tg.expand()

    const handleThemeChange = () => setTheme(tg.colorScheme)
    tg.onEvent('themeChanged', handleThemeChange)
    return () => tg.offEvent('themeChanged', handleThemeChange)
  }, [tg])

  const user = tg?.initDataUnsafe?.user
  const haptic = tg?.HapticFeedback

  return { tg, theme, user, haptic }
}

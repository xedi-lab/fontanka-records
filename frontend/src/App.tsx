import { useEffect, createContext, useContext, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTelegram } from './hooks/useTelegram'
import { BottomNav } from './components/BottomNav'
import { Home } from './pages/Home'
import { Studios } from './pages/Studios'
import { Booking } from './pages/Booking'
import { Profile } from './pages/Profile'
import { upsertUser } from './api'

interface AppCtx {
  telegramId: number | null
}

const AppContext = createContext<AppCtx>({ telegramId: null })
export const useAppContext = () => useContext(AppContext)

export function App() {
  const { theme, user } = useTelegram()
  const [telegramId, setTelegramId] = useState<number | null>(null)

  // Sync theme with Telegram
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
  }, [theme])

  // Register user on open
  useEffect(() => {
    if (!user) return
    upsertUser({
      telegram_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
    })
      .then(() => setTelegramId(user.id))
      .catch(() => setTelegramId(user.id)) // allow offline use too
  }, [user])

  return (
    <AppContext.Provider value={{ telegramId }}>
      <div className="min-h-screen dark:bg-[#0d0d0d] bg-[#f5f5f5] dark:text-white text-gray-900 transition-colors">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/studios" element={<Studios />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </AppContext.Provider>
  )
}

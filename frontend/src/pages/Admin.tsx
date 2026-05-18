import { useEffect, useState } from 'react'
import { getAdminBookings, confirmBooking, cancelBooking } from '../api'
import { STUDIOS } from '../data'
import { useAppContext } from '../App'

type View = 'dashboard' | 'bookings'
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'cancelled'

interface RawBooking {
  id: number
  studio_id: string
  service_title: string
  booking_date: string
  booking_time: string
  total_price: number
  prepay_amount: number
  status: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Ожидает',      color: 'text-yellow-400' },
  confirmed: { label: 'Подтверждена', color: 'text-green-400' },
  completed: { label: 'Завершена',    color: 'text-white/40' },
  cancelled: { label: 'Отменена',     color: 'text-red-400' },
}

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'all',       label: 'Все' },
  { id: 'pending',   label: 'Ожидают' },
  { id: 'confirmed', label: 'Подтверждены' },
  { id: 'cancelled', label: 'Отменены' },
]

export function Admin() {
  const { refreshPending } = useAppContext()
  const [view, setView] = useState<View>('dashboard')
  const [bookings, setBookings] = useState<RawBooking[]>([])
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    getAdminBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const pendingCount = bookings.filter(b => b.status === 'pending').length
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length
  const totalRevenue = bookings
    .filter(b => b.status !== 'cancelled')
    .reduce((sum, b) => sum + b.total_price, 0)

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  const handleConfirm = async (id: number) => {
    setActing(id)
    try {
      const updated = await confirmBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b))
      refreshPending()
    } catch {} finally { setActing(null) }
  }

  const handleCancel = async (id: number) => {
    setActing(id)
    try {
      const updated = await cancelBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b))
      refreshPending()
    } catch {} finally { setActing(null) }
  }

  if (view === 'bookings') {
    return (
      <div className="pb-nav animate-fade-in">
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="dark:text-white/60 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold dark:text-white text-gray-900">Заявки</h1>
          </div>
          {pendingCount > 0 && (
            <div className="ml-auto w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
              <span className="text-black text-xs font-bold">{pendingCount}</span>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-purple-600 text-white'
                  : 'dark:bg-white/10 bg-black/10 dark:text-white/60 text-gray-500'
              }`}
            >
              {f.label}
              {f.id === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 text-yellow-400 font-bold">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 space-y-3">
          {loading ? (
            <div className="text-center py-12 dark:text-white/30 text-gray-400 text-sm">Загружаем...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 dark:text-white/30 text-gray-400 text-sm">Записей нет</div>
          ) : (
            filtered
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map(b => {
                const studio = STUDIOS.find(s => s.id === b.studio_id)
                const st = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-white/40' }
                const isActing = acting === b.id

                return (
                  <div key={b.id} className="p-4 rounded-2xl dark:bg-white/5 bg-black/5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="font-semibold dark:text-white text-gray-900 text-sm">{b.service_title}</div>
                        <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: studio?.color ?? '#888' }} />
                          {studio?.name ?? `Студия ${b.studio_id}`}
                          <span className="dark:text-white/20 text-gray-300">·</span>
                          ID #{b.id}
                        </div>
                      </div>
                      <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs dark:text-white/60 text-gray-500 mb-2">
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {b.booking_date}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        {b.booking_time}
                      </div>
                      <div className="ml-auto font-semibold dark:text-white text-gray-900">
                        {b.total_price.toLocaleString()} ₽
                      </div>
                    </div>

                    <div className="text-xs dark:text-white/40 text-gray-400 mb-3">
                      Предоплата: <span className="dark:text-white/70 text-gray-600 font-medium">{b.prepay_amount.toLocaleString()} ₽</span>
                    </div>

                    {b.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleConfirm(b.id)} disabled={isActing}
                          className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50">
                          {isActing ? '...' : '✅ Подтвердить'}
                        </button>
                        <button onClick={() => handleCancel(b.id)} disabled={isActing}
                          className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50">
                          {isActing ? '...' : '❌ Отменить'}
                        </button>
                      </div>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => handleCancel(b.id)} disabled={isActing}
                        className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50">
                        {isActing ? '...' : '❌ Отменить'}
                      </button>
                    )}
                  </div>
                )
              })
          )}
        </div>
      </div>
    )
  }

  // Dashboard view
  return (
    <div className="pb-nav animate-fade-in">
      <div className="px-4 pt-6 pb-5">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">Панель управления</h1>
        <p className="text-sm dark:text-white/50 text-gray-500 mt-1">Фонтанка Рэкордс</p>
      </div>

      {/* Quick stats */}
      <div className="px-4 grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-2xl dark:bg-white/5 bg-black/5 text-center">
          <div className="text-2xl font-black dark:text-white text-gray-900">{pendingCount}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-400 mt-0.5">Ожидают</div>
        </div>
        <div className="p-3 rounded-2xl dark:bg-white/5 bg-black/5 text-center">
          <div className="text-2xl font-black dark:text-white text-gray-900">{confirmedCount}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-400 mt-0.5">Подтверждены</div>
        </div>
        <div className="p-3 rounded-2xl dark:bg-white/5 bg-black/5 text-center">
          <div className="text-lg font-black dark:text-white text-gray-900">{(totalRevenue / 1000).toFixed(0)}к</div>
          <div className="text-[10px] dark:text-white/40 text-gray-400 mt-0.5">Выручка ₽</div>
        </div>
      </div>

      {/* Menu tiles */}
      <div className="px-4 grid grid-cols-2 gap-3">

        {/* Заявки — рабочий */}
        <button
          onClick={() => setView('bookings')}
          className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left active:scale-95 transition-transform"
        >
          {pendingCount > 0 && (
            <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
          <div className="text-2xl mb-3">📋</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Заявки</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Подтверждение и отмена</div>
        </button>

        {/* Аналитика — заглушка */}
        <div className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left opacity-60">
          <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full dark:bg-white/10 bg-black/10 dark:text-white/40 text-gray-400">Скоро</span>
          <div className="text-2xl mb-3">📊</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Аналитика</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Статистика и графики</div>
        </div>

        {/* База клиентов — заглушка */}
        <div className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left opacity-60">
          <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full dark:bg-white/10 bg-black/10 dark:text-white/40 text-gray-400">Скоро</span>
          <div className="text-2xl mb-3">👥</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">База клиентов</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Все пользователи</div>
        </div>

        {/* Рассылки — заглушка */}
        <div className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left opacity-60">
          <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full dark:bg-white/10 bg-black/10 dark:text-white/40 text-gray-400">Скоро</span>
          <div className="text-2xl mb-3">📣</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Рассылки</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Сообщения всем клиентам</div>
        </div>

        {/* Акции — заглушка */}
        <div className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left opacity-60">
          <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full dark:bg-white/10 bg-black/10 dark:text-white/40 text-gray-400">Скоро</span>
          <div className="text-2xl mb-3">🎁</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Акции</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Скидки и спецпредложения</div>
        </div>

        {/* Прогрев — заглушка */}
        <div className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left opacity-60">
          <span className="absolute top-3 right-3 text-[9px] px-1.5 py-0.5 rounded-full dark:bg-white/10 bg-black/10 dark:text-white/40 text-gray-400">Скоро</span>
          <div className="text-2xl mb-3">🔥</div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Прогрев</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Авто-напоминания клиентам</div>
        </div>

      </div>
    </div>
  )
}

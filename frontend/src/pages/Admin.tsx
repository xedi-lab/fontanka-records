import { useEffect, useState } from 'react'
import { getAdminBookings, confirmBooking, cancelBooking } from '../api'
import { STUDIOS, SERVICES } from '../data'

type Status = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed'

const FILTERS: { id: Status; label: string }[] = [
  { id: 'all',       label: 'Все' },
  { id: 'pending',   label: 'Ожидают' },
  { id: 'confirmed', label: 'Подтверждены' },
  { id: 'cancelled', label: 'Отменены' },
]

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Ожидает',      color: 'text-yellow-400' },
  confirmed: { label: 'Подтверждена', color: 'text-green-400' },
  completed: { label: 'Завершена',    color: 'text-white/40' },
  cancelled: { label: 'Отменена',     color: 'text-red-400' },
}

interface RawBooking {
  id: number
  studio_id: string
  service_id: string
  service_title: string
  booking_date: string
  booking_time: string
  total_price: number
  prepay_amount: number
  status: string
  created_at: string
  user_id: number
}

export function Admin() {
  const [bookings, setBookings] = useState<RawBooking[]>([])
  const [filter, setFilter] = useState<Status>('pending')
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    getAdminBookings()
      .then(setBookings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter)

  const handleConfirm = async (id: number) => {
    setActing(id)
    try {
      const updated = await confirmBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b))
    } catch {} finally { setActing(null) }
  }

  const handleCancel = async (id: number) => {
    setActing(id)
    try {
      const updated = await cancelBooking(id)
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: updated.status } : b))
    } catch {} finally { setActing(null) }
  }

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <div className="pb-nav animate-fade-in">
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">Админ</h1>
          <p className="text-sm dark:text-white/50 text-gray-500 mt-1">Управление записями</p>
        </div>
        {pendingCount > 0 && (
          <div className="w-7 h-7 rounded-full bg-yellow-400 flex items-center justify-center">
            <span className="text-black text-xs font-bold">{pendingCount}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1">
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
              <span className="ml-1.5 text-yellow-400">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
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
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold dark:text-white text-gray-900 text-sm">
                        {b.service_title}
                      </div>
                      <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: studio?.color ?? '#888' }}
                        />
                        {studio?.name ?? `Студия ${b.studio_id}`}
                        <span className="dark:text-white/20 text-gray-300">·</span>
                        ID #{b.id}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${st.color}`}>{st.label}</span>
                  </div>

                  {/* Date / time / price */}
                  <div className="flex items-center gap-4 text-xs dark:text-white/60 text-gray-500 mb-3">
                    <div className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
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

                  {/* Prepay */}
                  <div className="text-xs dark:text-white/40 text-gray-400 mb-3">
                    Предоплата: <span className="dark:text-white/70 text-gray-600 font-medium">{b.prepay_amount.toLocaleString()} ₽</span>
                  </div>

                  {/* Actions */}
                  {b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(b.id)}
                        disabled={isActing}
                        className="flex-1 py-2 rounded-xl bg-green-500/20 text-green-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {isActing ? '...' : '✅ Подтвердить'}
                      </button>
                      <button
                        onClick={() => handleCancel(b.id)}
                        disabled={isActing}
                        className="flex-1 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {isActing ? '...' : '❌ Отменить'}
                      </button>
                    </div>
                  )}

                  {b.status === 'confirmed' && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={isActing}
                      className="w-full py-2 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium active:scale-95 transition-transform disabled:opacity-50"
                    >
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

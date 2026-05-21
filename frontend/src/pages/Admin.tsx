import { useEffect, useState } from 'react'
import { getAdminBookings, confirmBooking, cancelBooking, verifyOwnerPin } from '../api'
import { STUDIOS } from '../data'
import { useAppContext } from '../App'
import { Mic2, Lock, X } from 'lucide-react'
import { OwnerDashboard } from './OwnerDashboard'

type View = 'dashboard' | 'bookings' | 'owner' | 'pin'
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


export function Admin() {
  const { refreshPending } = useAppContext()
  const [view, setView] = useState<View>('dashboard')
  const [bookings, setBookings] = useState<RawBooking[]>([])
  const [filter, setFilter] = useState<FilterStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState<number | null>(null)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [pinLoading, setPinLoading] = useState(false)

  const handlePinDigit = (d: string) => {
    if (pin.length >= 4) return
    const next = pin + d
    setPin(next)
    setPinError(false)
    if (next.length === 4) {
      setPinLoading(true)
      verifyOwnerPin(next)
        .then(() => { setView('owner'); setPin('') })
        .catch(() => { setPinError(true); setPin('') })
        .finally(() => setPinLoading(false))
    }
  }

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

  if (view === 'owner') {
    return <OwnerDashboard onBack={() => setView('dashboard')} />
  }

  if (view === 'pin') {
    return (
      <div className="pb-nav flex flex-col" style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #111111 0%, #0a0a0a 50%, #0d0d0d 100%)' }}>
        {/* Ambient glow orbs */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '5%', left: '20%', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(200,200,255,0.03) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Close */}
        <div className="flex justify-end px-5 pt-5" style={{ position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => { setView('dashboard'); setPin('') }}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} color="rgba(255,255,255,0.4)" />
          </button>
        </div>

        {/* Logo + identity */}
        <div className="flex flex-col items-center" style={{ flex: 1, justifyContent: 'center', gap: 0, position: 'relative', zIndex: 1, paddingBottom: 24 }}>
          {/* Logo ring */}
          <div style={{ position: 'relative', marginBottom: 20 }}>
            {/* Outer glow ring */}
            <div style={{ position: 'absolute', inset: -6, borderRadius: '50%', background: 'conic-gradient(from 0deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03), rgba(255,255,255,0.15), rgba(255,255,255,0.03), rgba(255,255,255,0.15))', }} />
            <div style={{ position: 'absolute', inset: -5, borderRadius: '50%', background: '#0d0d0d' }} />
            <img
              src="/assets/logo.jpg"
              alt="logo"
              style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', display: 'block', position: 'relative', boxShadow: '0 0 0 1px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.12), 0 8px 32px rgba(0,0,0,0.6)' }}
            />
            {/* Lock badge */}
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #1a1a1a, #111)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              <Lock size={11} color="rgba(255,255,255,0.6)" />
            </div>
          </div>

          {/* Title */}
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6 }}>Санкт-Петербург</p>
          <h2 style={{ color: 'white', fontSize: 20, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Фонтанка Рэкордс</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
            <div style={{ height: 1, width: 24, background: 'rgba(255,255,255,0.15)' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase' }}>Режим владельца</p>
            <div style={{ height: 1, width: 24, background: 'rgba(255,255,255,0.15)' }} />
          </div>

          {/* PIN dots */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
            {[0,1,2,3].map(i => {
              const filled = pin.length > i
              const err = filled && pinError
              return (
                <div key={i} style={{
                  width: filled ? 14 : 12,
                  height: filled ? 14 : 12,
                  borderRadius: '50%',
                  background: err ? '#f87171' : filled ? 'white' : 'transparent',
                  border: err ? 'none' : filled ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                  boxShadow: filled && !err ? '0 0 12px rgba(255,255,255,0.5)' : 'none',
                  transition: 'all 0.15s ease',
                }} />
              )
            })}
          </div>

          <div style={{ height: 22, display: 'flex', alignItems: 'center' }}>
            {pinError && <p style={{ color: '#f87171', fontSize: 12, letterSpacing: '0.05em' }}>Неверный PIN-код</p>}
            {pinLoading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Проверяем...</p>}
          </div>
        </div>

        {/* Numpad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '0 28px 12px', position: 'relative', zIndex: 1 }}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((d, i) => {
            if (d === '') return <div key={i} />
            const isBackspace = d === '⌫'
            return (
              <button
                key={i}
                disabled={pinLoading}
                onClick={() => isBackspace ? setPin(p => p.slice(0, -1)) : handlePinDigit(d)}
                style={{
                  height: 68,
                  borderRadius: 18,
                  background: 'transparent',
                  border: 'none',
                  color: isBackspace ? 'rgba(255,255,255,0.35)' : 'white',
                  fontSize: isBackspace ? 22 : 28,
                  fontWeight: isBackspace ? 400 : 300,
                  letterSpacing: isBackspace ? 0 : '0.02em',
                  cursor: 'pointer',
                  opacity: pinLoading ? 0.4 : 1,
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.1s ease',
                  boxShadow: 'none',
                }}
              >
                {d}
              </button>
            )
          })}
        </div>

        <p style={{ color: 'rgba(255,255,255,0.12)', fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', paddingBottom: 12 }}>
          Гороховая 70 · Санкт-Петербург
        </p>
      </div>
    )
  }

  if (view === 'bookings') {
    const now = new Date()
    const upcoming = bookings
      .filter(b => (b.status === 'confirmed' || b.status === 'pending') &&
        new Date(`${b.booking_date}T${b.booking_time}`) >= now)
      .sort((a, b) =>
        new Date(`${a.booking_date}T${a.booking_time}`).getTime() -
        new Date(`${b.booking_date}T${b.booking_time}`).getTime()
      )[0] ?? null

    const tabCounts = {
      pending: bookings.filter(b => b.status === 'pending').length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
    }

    const TABS: { id: FilterStatus; label: string; accent?: string }[] = [
      { id: 'pending',   label: 'Ожидают',      accent: 'text-yellow-400' },
      { id: 'confirmed', label: 'Подтверждены', accent: 'text-green-400' },
      { id: 'cancelled', label: 'Отменены',     accent: 'text-red-400' },
    ]

    const sortedFiltered = (filter === 'all' ? bookings : bookings.filter(b => b.status === filter))
      .sort((a, b) => new Date(`${a.booking_date}T${a.booking_time}`).getTime() - new Date(`${b.booking_date}T${b.booking_time}`).getTime())

    return (
      <div className="pb-nav page-enter flex flex-col" style={{ minHeight: '100dvh' }}>
        <div className="px-4 pt-6 pb-4 flex items-center gap-3">
          <button onClick={() => setView('dashboard')} className="text-white/60">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Заявки</h1>
        </div>

        {/* Tab tiles */}
        <div className="px-4 grid grid-cols-3 gap-2 mb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`py-3 rounded-2xl text-center transition-all active:scale-95 ${
                filter === t.id ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5'
              }`}
            >
              <div className={`text-xl font-black ${filter === t.id ? (t.accent ?? 'text-white') : 'text-white'}`}>
                {tabCounts[t.id as keyof typeof tabCounts]}
              </div>
              <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{t.label}</div>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="px-4 space-y-3 stagger flex-1">
          {loading ? (
            <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
          ) : sortedFiltered.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">Записей нет</div>
          ) : (
            sortedFiltered.map(b => {
              const studio = STUDIOS.find(s => s.id === b.studio_id)
              const st = STATUS_LABELS[b.status] ?? { label: b.status, color: 'text-white/40' }
              const isActing = acting === b.id

              return (
                <div key={b.id} className="p-4 rounded-2xl bg-white/5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white text-sm">{b.service_title}</div>
                      <div className="text-xs text-white/50 mt-0.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: studio?.color ?? '#888' }} />
                        {studio?.name ?? `Студия ${b.studio_id}`}
                        <span className="text-white/20">·</span>
                        #{b.id}
                      </div>
                    </div>
                    <span className={`text-xs font-medium flex-shrink-0 ${st.color}`}>{st.label}</span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-white/50 mb-2">
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
                    <div className="ml-auto font-semibold text-white">
                      {b.total_price.toLocaleString()} ₽
                    </div>
                  </div>

                  <div className="text-xs text-white/30 mb-3">
                    Предоплата: <span className="text-white/60 font-medium">{b.prepay_amount.toLocaleString()} ₽</span>
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

        {/* Nearest booking block */}
        <div className="px-4 pt-4 pb-2 mt-2">
          <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Ближайшая запись</div>
          {upcoming ? (
            <div className="p-3 rounded-2xl bg-white/5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex-shrink-0 overflow-hidden">
                <img
                  src={STUDIOS.find(s => s.id === upcoming.studio_id)?.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{upcoming.service_title}</div>
                <div className="text-xs text-white/40 mt-0.5">
                  {upcoming.booking_date} · {upcoming.booking_time} · Студия {upcoming.studio_id}
                </div>
              </div>
              <span className={`text-xs font-medium flex-shrink-0 ${STATUS_LABELS[upcoming.status]?.color ?? 'text-white/40'}`}>
                {STATUS_LABELS[upcoming.status]?.label}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 text-center text-xs text-white/30">
              Ближайших заявок пока нет
            </div>
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
      <div className="px-4 grid grid-cols-2 gap-3 stagger">
        <button
          onClick={() => setView('bookings')}
          className="relative p-5 rounded-3xl dark:bg-white/5 bg-black/5 text-left active:scale-95 transition-transform"
        >
          {pendingCount > 0 && (
            <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
          <div className="dark:text-white/70 text-gray-600 mb-3"><Mic2 size={22} strokeWidth={1.5} /></div>
          <div className="font-bold dark:text-white text-gray-900 text-sm">Заявки</div>
          <div className="text-xs dark:text-white/40 text-gray-400 mt-0.5">Подтверждение и отмена</div>
        </button>

        <button
          onClick={() => setView('pin')}
          className="relative p-5 rounded-3xl bg-white/5 border border-white/10 text-left active:scale-95 transition-transform"
        >
          <div className="text-white/70 mb-3"><Lock size={22} strokeWidth={1.5} /></div>
          <div className="font-bold text-white text-sm">Режим владельца</div>
          <div className="text-xs text-white/40 mt-0.5">Статистика, сотрудники, экспорт</div>
        </button>
      </div>
    </div>
  )
}

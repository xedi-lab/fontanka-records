import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import { useAppContext } from '../App'
import { getUserBookings, cancelBooking } from '../api'
import { SERVICES, STUDIOS } from '../data'
import type { Booking } from '../types'

const STATUS_LABELS: Record<Booking['status'], { label: string; color: string }> = {
  pending:   { label: 'Ожидает',      color: 'text-yellow-400' },
  confirmed: { label: 'Подтверждена', color: 'text-green-400' },
  completed: { label: 'Завершена',    color: 'text-white/40' },
  cancelled: { label: 'Отменена',     color: 'text-red-400' },
}

export function Profile() {
  const { user } = useTelegram()
  const { telegramId } = useAppContext()
  const { myBookings, addBooking } = useBookingStore()
  const navigate = useNavigate()
  const [apiBookings, setApiBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!telegramId) return
    setLoading(true)
    getUserBookings(telegramId)
      .then((data: any[]) => {
        const mapped: Booking[] = data.map(b => ({
          id: String(b.id),
          studioId: b.studio_id,
          serviceId: b.service_id,
          date: b.booking_date,
          time: b.booking_time,
          totalPrice: b.total_price,
          prepayAmount: b.prepay_amount,
          status: b.status,
          createdAt: b.created_at,
        }))
        setApiBookings(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [telegramId])

  // Merge API bookings with local store (deduplicate by id)
  const allIds = new Set(apiBookings.map(b => b.id))
  const combined = [
    ...apiBookings,
    ...myBookings.filter(b => !allIds.has(b.id)),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const upcoming = combined.filter(b => b.status === 'pending' || b.status === 'confirmed')
  const history  = combined.filter(b => b.status === 'completed' || b.status === 'cancelled')

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelBooking(Number(bookingId))
      setApiBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
    } catch {}
  }

  return (
    <div className="pb-nav animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">Профиль</h1>
      </div>

      {/* User card */}
      <div className="mx-4 mb-5 p-4 rounded-2xl dark:bg-white/5 bg-black/5 flex items-center gap-3">
        {user?.photo_url
          ? <img src={user.photo_url} alt="avatar" className="w-14 h-14 rounded-full object-cover" />
          : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{user ? user.first_name[0] : '?'}</span>
            </div>
          )
        }
        <div>
          <div className="font-bold dark:text-white text-gray-900">
            {user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Гость'}
          </div>
          {user?.username && <div className="text-sm dark:text-white/50 text-gray-500">@{user.username}</div>}
        </div>
      </div>

      {/* Upcoming */}
      <Section title="Предстоящие записи">
        {loading ? (
          <div className="text-center py-6 dark:text-white/30 text-gray-400 text-sm">Загружаем...</div>
        ) : upcoming.length === 0 ? (
          <EmptyState emoji="🎤" text="Нет активных записей" action="Записаться" onAction={() => navigate('/booking')} />
        ) : (
          upcoming.map(b => <BookingCard key={b.id} booking={b} onCancel={handleCancel} />)
        )}
      </Section>

      {history.length > 0 && (
        <Section title="История">
          {history.map(b => <BookingCard key={b.id} booking={b} />)}
        </Section>
      )}

      {/* Contacts */}
      <Section title="Контакты">
        <div className="space-y-2">
          <ContactRow emoji="📍" label="Адрес" value="Гороховая 70, СПб" />
          <ContactRow emoji="🕐" label="Работаем" value="Круглосуточно" />
          <ContactRow emoji="✈️" label="Telegram" value="@fontanka_records" />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="px-4 mb-2">
        <h2 className="text-sm font-semibold dark:text-white/40 text-gray-400 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="px-4 space-y-2">{children}</div>
    </div>
  )
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel?: (id: string) => void }) {
  const service = SERVICES.find(s => s.id === booking.serviceId)
  const studio = STUDIOS.find(s => s.id === booking.studioId)
  const status = STATUS_LABELS[booking.status]
  const isActive = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <div className="p-4 rounded-2xl dark:bg-white/5 bg-black/5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-semibold dark:text-white text-gray-900 text-sm">
            {service?.title ?? booking.serviceId ?? '—'} · {service?.duration ?? ''}ч
          </div>
          <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5">
            {studio?.name ?? (booking.studioId ? `Студия ${booking.studioId}` : '—')}
          </div>
        </div>
        <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
      </div>

      <div className="flex items-center gap-4 text-xs dark:text-white/60 text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {booking.date}
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {booking.time}
        </div>
        <div className="ml-auto font-semibold dark:text-white text-gray-900">
          {booking.totalPrice.toLocaleString()} ₽
        </div>
      </div>

      {isActive && onCancel && (
        <button
          onClick={() => onCancel(booking.id)}
          className="mt-3 text-xs text-red-400 hover:text-red-300 transition-colors"
        >
          Отменить запись
        </button>
      )}
    </div>
  )
}

function EmptyState({ emoji, text, action, onAction }: { emoji: string; text: string; action: string; onAction: () => void }) {
  return (
    <div className="py-8 text-center">
      <div className="text-4xl mb-2">{emoji}</div>
      <p className="text-sm dark:text-white/40 text-gray-400 mb-4">{text}</p>
      <button onClick={onAction} className="px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-semibold active:scale-95 transition-transform">
        {action}
      </button>
    </div>
  )
}

function ContactRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-lg">{emoji}</span>
      <div>
        <div className="text-xs dark:text-white/40 text-gray-400">{label}</div>
        <div className="text-sm font-medium dark:text-white text-gray-900">{value}</div>
      </div>
    </div>
  )
}

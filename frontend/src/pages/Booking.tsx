import { useState, useEffect, useRef } from 'react'
import { Mic2, Sliders, Wind, Key, Package } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format, addDays, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import { STUDIOS, SERVICES, SERVICE_CATEGORIES } from '../data'
import { useBookingStore } from '../store/bookingStore'
import { useTelegram } from '../hooks/useTelegram'
import { useAppContext } from '../App'
import { createBooking, getAvailableSlots } from '../api'
import type { ServiceCategory, Service, StudioId } from '../types'

type Step = 'service' | 'studio' | 'datetime' | 'confirm'
const ALL_STEPS: Step[] = ['service', 'studio', 'datetime', 'confirm']
const ALL_LABELS = ['Услуга', 'Зал', 'Дата и время', 'Подтверждение']

function getDates(count = 14): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(new Date(), i))
}

export function Booking() {
  const navigate = useNavigate()
  const { haptic } = useTelegram()
  const { telegramId } = useAppContext()
  const store = useBookingStore()

  const [step, setStep] = useState<Step>('service')
  const [activeCategory, setActiveCategory] = useState<ServiceCategory>('record')
  const [localDate, setLocalDate] = useState<Date>(new Date())
  const [localTime, setLocalTime] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const STEPS = store.selectedStudio
    ? ALL_STEPS.filter(s => s !== 'studio')
    : ALL_STEPS
  const STEP_LABELS = store.selectedStudio
    ? ALL_LABELS.filter((_, i) => ALL_STEPS[i] !== 'studio')
    : ALL_LABELS

  const stepIndex = STEPS.indexOf(step)
  const filteredServices = SERVICES.filter(s => s.category === activeCategory)
  const dates = getDates()

  // Load available slots when studio + date change
  useEffect(() => {
    if (!store.selectedStudio || step !== 'datetime') return
    setLoadingSlots(true)
    setLocalTime(null)
    const dateStr = format(localDate, 'yyyy-MM-dd')
    getAvailableSlots(store.selectedStudio, dateStr)
      .then(setSlots)
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [store.selectedStudio, localDate, step])

  const canProceed = () => {
    if (step === 'service') return !!store.selectedService
    if (step === 'studio') return !!store.selectedStudio
    if (step === 'datetime') return !!localDate && !!localTime
    return true
  }

  const next = () => {
    if (!canProceed()) return
    haptic?.impactOccurred('light')
    const nextStep = STEPS[stepIndex + 1]
    if (nextStep) setStep(nextStep)
  }

  const back = () => {
    haptic?.impactOccurred('light')
    if (stepIndex === 0) navigate(-1)
    else setStep(STEPS[stepIndex - 1])
  }

  const confirm = async () => {
    if (!store.selectedService || !store.selectedStudio || !localTime) return
    setSubmitting(true)
    haptic?.notificationOccurred('success')

    const dateStr = format(localDate, 'yyyy-MM-dd')
    const payload = {
      studio_id: store.selectedStudio,
      service_id: store.selectedService.id,
      service_title: `${store.selectedService.title} ${store.selectedService.duration}ч`,
      duration_hours: store.selectedService.duration,
      booking_date: dateStr,
      booking_time: localTime,
      total_price: store.selectedService.price,
      prepay_amount: Math.ceil(store.selectedService.price * store.selectedService.prepayPercent / 100),
    }

    try {
      if (telegramId) {
        const booking = await createBooking(telegramId, payload)
        store.addBooking({
          id: String(booking.id),
          studioId: booking.studio_id,
          serviceId: booking.service_id,
          date: booking.booking_date,
          time: booking.booking_time,
          totalPrice: booking.total_price,
          prepayAmount: booking.prepay_amount,
          status: booking.status,
          createdAt: booking.created_at,
        })
      } else {
        // offline fallback
        store.addBooking({
          id: Math.random().toString(36).slice(2),
          studioId: store.selectedStudio,
          serviceId: store.selectedService.id,
          date: dateStr,
          time: localTime,
          totalPrice: store.selectedService.price,
          prepayAmount: Math.ceil(store.selectedService.price * 0.5),
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
    } catch {
      // still show success to user, retry logic can be added later
    }

    store.resetBooking()
    setSubmitting(false)
    setSuccess(true)
  }

  if (success) {
    return <SuccessScreen onDone={() => { setSuccess(false); setStep('service'); navigate('/profile') }} onHome={() => { setSuccess(false); setStep('service'); navigate('/') }} />
  }

  return (
    <div className="pb-nav animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={back} className="w-9 h-9 rounded-full dark:bg-white/10 bg-black/10 flex items-center justify-center">
          <svg className="w-4 h-4 dark:text-white text-gray-900" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex-1">
          <div className="text-xs dark:text-white/40 text-gray-400 mb-1">Шаг {stepIndex + 1} из {STEPS.length}</div>
          <h1 className="text-lg font-bold dark:text-white text-gray-900">{STEP_LABELS[stepIndex]}</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-4 mb-5">
        {STEPS.map((s, i) => (
          <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${i <= stepIndex ? 'bg-white' : 'dark:bg-white/15 bg-black/10'}`} />
        ))}
      </div>

      {/* Step: Service */}
      {step === 'service' && (
        <div className="animate-fade-in">
          <div className="flex gap-2 px-4 mb-4 overflow-x-auto pb-1">
            {SERVICE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { haptic?.selectionChanged(); setActiveCategory(cat.id as ServiceCategory) }}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors
                  ${activeCategory === cat.id
                    ? 'bg-white text-black'
                    : 'dark:bg-white/10 bg-black/10 dark:text-white/70 text-gray-600'}`}
              >
                <span className="flex items-center">
                  {cat.id === 'record'  && <Mic2 size={14} strokeWidth={2} />}
                  {cat.id === 'studio'  && <Sliders size={14} strokeWidth={2} />}
                  {cat.id === 'voice'   && <Wind size={14} strokeWidth={2} />}
                  {cat.id === 'rent'    && <Key size={14} strokeWidth={2} />}
                  {cat.id === 'package' && <Package size={14} strokeWidth={2} />}
                </span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
          <div className="px-4 space-y-3">
            {filteredServices.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                selected={store.selectedService?.id === service.id}
                onSelect={() => { haptic?.selectionChanged(); store.setService(service) }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Step: Studio */}
      {step === 'studio' && (
        <div className="px-4 space-y-3 animate-fade-in">
          {STUDIOS.map(studio => (
            <button
              key={studio.id}
              onClick={() => { haptic?.selectionChanged(); store.setStudio(studio.id as StudioId) }}
              className="w-full text-left rounded-2xl overflow-hidden transition-all active:scale-[0.98]"
              style={store.selectedStudio === studio.id ? { boxShadow: '0 0 0 2px rgba(255,255,255,0.8)' } : {}}
            >
              <div className={`rounded-2xl overflow-hidden dark:bg-white/5 bg-black/5`}>
                <div className="relative h-32">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
                  <div className="absolute left-4 bottom-4">
                    <div className="text-white font-bold">{studio.name}</div>
                    <div className="text-white/70 text-xs">{studio.tagline}</div>
                  </div>
                  {store.selectedStudio === studio.id && (
                    <div className="absolute right-4 top-4 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step: DateTime */}
      {step === 'datetime' && (
        <div className="animate-fade-in">
          <div className="px-4 mb-5">
            <p className="text-xs font-semibold dark:text-white/40 text-gray-400 uppercase tracking-wider mb-3">Выберите дату</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map(date => {
                const isSelected = isSameDay(date, localDate)
                const isToday = isSameDay(date, new Date())
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => { haptic?.selectionChanged(); setLocalDate(date) }}
                    className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl transition-colors min-w-[52px]
                      ${isSelected ? 'bg-white text-black' : 'dark:bg-white/10 bg-black/10 dark:text-white text-gray-900'}`}
                  >
                    <span className="text-[10px] font-medium uppercase opacity-70">
                      {isToday ? 'сег' : format(date, 'EEE', { locale: ru }).slice(0, 3)}
                    </span>
                    <span className="text-lg font-bold leading-tight">{format(date, 'd')}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4">
            <p className="text-xs font-semibold dark:text-white/40 text-gray-400 uppercase tracking-wider mb-3">Время начала</p>
            {loadingSlots ? (
              <div className="text-center py-6 dark:text-white/40 text-gray-400 text-sm">Загружаем слоты...</div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && (haptic?.selectionChanged(), setLocalTime(slot.time))}
                    disabled={!slot.available}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${!slot.available ? 'opacity-30 cursor-not-allowed dark:bg-white/5 bg-black/5 dark:text-white text-gray-900' :
                        localTime === slot.time
                          ? 'bg-white text-black'
                          : 'dark:bg-white/10 bg-black/10 dark:text-white text-gray-900'}`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            ) : (
              /* Fallback static slots if API not yet connected */
              <div className="grid grid-cols-4 gap-2">
                {['10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'].map(t => (
                  <button
                    key={t}
                    onClick={() => { haptic?.selectionChanged(); setLocalTime(t) }}
                    className={`py-2.5 rounded-xl text-sm font-semibold transition-colors
                      ${localTime === t ? 'bg-white text-black' : 'dark:bg-white/10 bg-black/10 dark:text-white text-gray-900'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step: Confirm */}
      {step === 'confirm' && store.selectedService && store.selectedStudio && (
        <div className="px-4 animate-fade-in">
          <div className="dark:bg-white/5 bg-black/5 rounded-3xl overflow-hidden mb-4">
            <div className="relative h-40">
              <img
                src={STUDIOS.find(s => s.id === store.selectedStudio)!.images[1]}
                alt="Studio"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-3 left-4 text-white">
                <div className="font-bold">Студия {store.selectedStudio}</div>
                <div className="text-white/70 text-sm">Гороховая 70</div>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <ConfirmRow label="Услуга" value={`${store.selectedService.title} · ${store.selectedService.duration}ч`} />
              <ConfirmRow label="Дата" value={format(localDate, 'd MMMM yyyy', { locale: ru })} />
              <ConfirmRow label="Время" value={`${localTime}`} />
              <div className="pt-2 border-t dark:border-white/10 border-black/10">
                <ConfirmRow label="Итого" value={`${store.selectedService.price.toLocaleString()} ₽`} bold />
                <ConfirmRow
                  label="Предоплата 50%"
                  value={`${Math.ceil(store.selectedService.price * 0.5).toLocaleString()} ₽`}
                  accent
                />
              </div>
            </div>
          </div>

          <p className="text-xs dark:text-white/40 text-gray-400 text-center mb-4">
            После подтверждения с тобой свяжется администратор для оплаты предоплаты
          </p>

          <button
            onClick={confirm}
            disabled={submitting}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all
              ${submitting ? 'opacity-60 bg-white/20 text-white/40' : 'bg-white text-black active:scale-95 shadow-lg shadow-white/20'}`}
          >
            {submitting ? 'Отправляем...' : 'Подтвердить запись'}
          </button>
        </div>
      )}

      {/* Bottom CTA */}
      {step !== 'confirm' && (
        <div className="fixed bottom-[72px] left-0 right-0 px-4 pb-3">
          <button
            onClick={next}
            disabled={!canProceed()}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all
              ${canProceed()
                ? 'bg-white text-black active:scale-95 shadow-lg shadow-white/20'
                : 'bg-white/20 text-white/40 cursor-not-allowed'}`}
          >
            Далее
          </button>
        </div>
      )}
    </div>
  )
}

function ServiceCard({ service, selected, onSelect }: { service: Service; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 rounded-2xl transition-all active:scale-[0.98]
        ${selected ? 'bg-white/10 ring-1 ring-white/40' : 'dark:bg-white/5 bg-black/5'}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-semibold dark:text-white text-gray-900 text-sm">
            {service.title} · {service.duration}ч
          </div>
          <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5 line-clamp-1">
            {service.description}
          </div>
        </div>
        <div className="text-right ml-3">
          <div className="font-bold dark:text-white text-gray-900 text-sm">{service.price.toLocaleString()} ₽</div>
          <div className="text-[10px] dark:text-white/40 text-gray-400">50% предоплата</div>
        </div>
        {selected && (
          <div className="ml-3 w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  )
}

function ConfirmRow({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm dark:text-white/50 text-gray-500">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold dark:text-white text-gray-900' : accent ? 'font-semibold dark:text-white text-gray-900' : 'dark:text-white text-gray-900'}`}>
        {value}
      </span>
    </div>
  )
}

function SuccessScreen({ onDone, onHome }: { onDone: () => void; onHome: () => void }) {
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      ringRef.current?.classList.add('success-ring-animate')
    }, 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      {/* Glow ring + check */}
      <div className="relative mb-8">
        <div ref={ringRef} className="success-ring w-28 h-28 rounded-full border-2 border-white/20 flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center"
            style={{ boxShadow: '0 0 40px rgba(255,255,255,0.15), 0 0 80px rgba(255,255,255,0.08)' }}>
            <svg className="w-9 h-9 text-white success-check" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        {/* Orbiting dot */}
        <div className="absolute inset-0 success-orbit">
          <div className="w-2 h-2 rounded-full bg-white absolute -top-1 left-1/2 -translate-x-1/2"
            style={{ boxShadow: '0 0 8px rgba(255,255,255,0.8)' }} />
        </div>
      </div>

      <h2 className="text-2xl font-black dark:text-white text-gray-900 mb-2 tracking-tight">
        Запись создана
      </h2>
      <p className="text-sm dark:text-white/50 text-gray-500 mb-10 max-w-xs">
        Мы уже знаем о тебе. Напомним за день до сессии — просто приходи и твори.
      </p>

      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={onDone}
          className="w-full py-4 rounded-2xl font-bold text-black bg-white active:scale-95 transition-transform"
          style={{ boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
        >
          Мои записи
        </button>
        <button
          onClick={onHome}
          className="w-full py-3.5 rounded-2xl font-medium dark:text-white/60 text-gray-500 dark:bg-white/5 bg-black/5 active:scale-95 transition-transform"
        >
          На главную
        </button>
      </div>
    </div>
  )
}

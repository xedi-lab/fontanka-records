import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { STUDIOS } from '../data'

export function Home() {
  const { user, haptic } = useTelegram()
  const navigate = useNavigate()
  const [heroIndex, setHeroIndex] = useState(0)

  const heroImages = [
    '/assets/studio-a-2.jpg',
    '/assets/studio-b-1.jpg',
    '/assets/studio-c-1.jpg',
  ]

  useEffect(() => {
    const t = setInterval(() => setHeroIndex(i => (i + 1) % heroImages.length), 4000)
    return () => clearInterval(t)
  }, [])

  const handleBook = () => {
    haptic?.impactOccurred('medium')
    navigate('/booking')
  }

  return (
    <div className="pb-nav animate-fade-in">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden grain-overlay" style={{ minHeight: '75vw', maxHeight: 420 }}>
        {/* Background slideshow */}
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Studio"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}

        {/* Dark overlay — stronger at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/30 to-black/90" />

        {/* Glow orb behind logo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }} />
        </div>

        {/* Logo — floating + glowing */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
          <div className="logo-float mb-4">
            <img
              src="/assets/logo.jpg"
              alt="Фонтанка Рэкордс"
              className="w-24 h-24 rounded-full object-cover"
              style={{ boxShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1)' }}
            />
          </div>
          <div className="relative">
            <h1 className="text-shimmer text-2xl font-black tracking-widest uppercase text-center">
              Фонтанка Рэкордс
            </h1>
            <span className="diamond-glint">✦</span>
          </div>
          <p className="text-white/50 text-xs tracking-[0.2em] uppercase mt-1 text-center">
            Гороховая 70 · Санкт-Петербург
          </p>
        </div>

        {/* Slideshow dots */}
        <div className="absolute bottom-4 right-4 flex gap-1.5 z-10">
          {heroImages.map((_, i) => (
            <div key={i} className={`rounded-full transition-all duration-300 ${i === heroIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
          ))}
        </div>

        {/* Bottom edge fade */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0d0d0d] to-transparent z-10" />
      </div>

      <div className="px-4 space-y-6 -mt-2 relative z-20">

        {/* Greeting + CTA */}
        <div>
          <p className="text-sm dark:text-white/50 text-gray-500 mb-1">
            {user ? `Привет, ${user.first_name} 👋` : 'Добро пожаловать'}
          </p>
          <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-4">
            Три студии — три настроения
          </h2>

          <button
            onClick={handleBook}
            className="w-full py-4 rounded-2xl font-bold text-black text-base
              bg-white active:scale-95 transition-all
              relative overflow-hidden"
            style={{ boxShadow: '0 0 30px rgba(255,255,255,0.25), 0 4px 20px rgba(0,0,0,0.3)' }}
          >
            <span className="relative z-10">Записаться</span>
            {/* shimmer effect on button */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent
              -translate-x-full animate-[shimmer_2s_ease-in-out_infinite]"
              style={{ animation: 'shimmer 2.5s ease-in-out infinite' }}
            />
          </button>
        </div>

        {/* Studios */}
        <div>
          <h3 className="text-xs font-semibold dark:text-white/40 text-gray-400 uppercase tracking-widest mb-3">
            Наши залы
          </h3>
          <div className="space-y-3">
            {STUDIOS.map((studio) => (
              <button
                key={studio.id}
                onClick={() => { haptic?.selectionChanged(); navigate('/studios') }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl
                  dark:bg-white/5 bg-black/5
                  active:scale-[0.98] transition-all border border-transparent
                  hover:border-white/10"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-1 right-1.5 text-white font-black text-xs opacity-80">{studio.id}</span>
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold dark:text-white text-gray-900 text-sm">{studio.name}</div>
                  <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5 truncate">{studio.tagline}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {studio.features.slice(0, 2).map(f => (
                      <span key={f} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: studio.color + '22', color: studio.color }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="w-7 h-7 rounded-full dark:bg-white/5 bg-black/5 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 dark:text-white/40 text-black/40" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Info grid */}
        <div>
          <h3 className="text-xs font-semibold dark:text-white/40 text-gray-400 uppercase tracking-widest mb-3">
            О студии
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: '📍', title: 'Адрес', sub: 'Гороховая 70' },
              { emoji: '🕐', title: 'Режим работы', sub: '0:00 — 24:00' },
              { emoji: '💳', title: 'Предоплата', sub: '50% при записи' },
              { emoji: '🎛️', title: '3 студии', sub: 'A, B, C на выбор' },
            ].map(({ emoji, title, sub }) => (
              <div key={title}
                className="p-3.5 rounded-2xl dark:bg-white/5 bg-black/5 border border-white/5">
                <div className="text-xl mb-1.5">{emoji}</div>
                <div className="text-xs font-semibold dark:text-white text-gray-900">{title}</div>
                <div className="text-xs dark:text-white/40 text-gray-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

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
      {/* Hero */}
      <div className="relative h-72 overflow-hidden">
        {heroImages.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Studio"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === heroIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

        {/* Logo + title */}
        <div className="absolute bottom-5 left-5 flex items-center gap-3">
          <img src="/assets/logo.jpg" alt="Logo" className="w-10 h-10 rounded-full object-cover" />
          <div>
            <div className="text-white font-bold text-lg leading-tight">Фонтанка Рэкордс</div>
            <div className="text-white/60 text-xs">Гороховая 70, Санкт-Петербург</div>
          </div>
        </div>

        {/* Dots */}
        <div className="absolute bottom-5 right-5 flex gap-1.5">
          {heroImages.map((_, i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i === heroIndex ? 'bg-white' : 'bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold dark:text-white text-gray-900">
            {user ? `Привет, ${user.first_name} 👋` : 'Добро пожаловать 👋'}
          </h1>
          <p className="text-sm dark:text-white/50 text-gray-500 mt-1">
            Три студии — три настроения. Запишись прямо сейчас.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={handleBook}
          className="w-full py-4 rounded-2xl font-bold text-black text-base
            bg-white text-black
            active:scale-95 transition-transform shadow-lg shadow-white/20"
        >
          Записаться
        </button>

        {/* Studios quick-pick */}
        <div>
          <h2 className="text-base font-semibold dark:text-white text-gray-900 mb-3">Наши залы</h2>
          <div className="space-y-3">
            {STUDIOS.map((studio) => (
              <button
                key={studio.id}
                onClick={() => { haptic?.selectionChanged(); navigate('/studios') }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl
                  dark:bg-white/5 bg-black/5
                  dark:hover:bg-white/10 hover:bg-black/10
                  active:scale-[0.98] transition-all"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-end p-1.5">
                    <span className="text-white font-black text-xs opacity-80">{studio.id}</span>
                  </div>
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
                <svg className="w-4 h-4 dark:text-white/30 text-black/30 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-2 gap-3">
          <InfoCard
            emoji="📍"
            title="Адрес"
            subtitle="Гороховая 70"
          />
          <InfoCard
            emoji="🕐"
            title="Режим работы"
            subtitle="0:00 — 24:00"
          />
          <InfoCard
            emoji="💳"
            title="Предоплата"
            subtitle="50% при записи"
          />
          <InfoCard
            emoji="🎛️"
            title="3 студии"
            subtitle="A, B, C на выбор"
          />
        </div>
      </div>
    </div>
  )
}

function InfoCard({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="p-3 rounded-2xl dark:bg-white/5 bg-black/5">
      <div className="text-xl mb-1">{emoji}</div>
      <div className="text-xs font-semibold dark:text-white text-gray-900">{title}</div>
      <div className="text-xs dark:text-white/50 text-gray-500 mt-0.5">{subtitle}</div>
    </div>
  )
}

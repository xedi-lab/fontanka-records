import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { STUDIOS } from '../data'
import { useTelegram } from '../hooks/useTelegram'
import { useBookingStore } from '../store/bookingStore'
import type { Studio } from '../types'

export function Studios() {
  const [selected, setSelected] = useState<Studio | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)
  const navigate = useNavigate()
  const { haptic } = useTelegram()
  const { setStudio } = useBookingStore()
  const touchStartX = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Lock body scroll when sheet open
  useEffect(() => {
    document.body.style.overflow = selected ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [selected])

  // Auto-advance photos every 3s
  useEffect(() => {
    if (!selected) return
    intervalRef.current = setInterval(() => {
      setPhotoIndex(i => (i + 1) % selected.images.length)
    }, 3000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [selected])

  const resetInterval = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (!selected) return
    intervalRef.current = setInterval(() => {
      setPhotoIndex(i => (i + 1) % selected.images.length)
    }, 3000)
  }

  const openStudio = (studio: Studio) => {
    haptic?.impactOccurred('light')
    setSelected(studio)
    setPhotoIndex(0)
  }

  const close = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setSelected(null)
  }

  const goTo = (i: number) => {
    setPhotoIndex(i)
    resetInterval()
  }

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!selected) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        setPhotoIndex(i => (i + 1) % selected.images.length)
      } else {
        setPhotoIndex(i => (i - 1 + selected.images.length) % selected.images.length)
      }
      resetInterval()
    }
  }

  return (
    <div className="pb-nav animate-fade-in">
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold dark:text-white text-gray-900">Залы</h1>
        <p className="text-sm dark:text-white/50 text-gray-500 mt-1">Три настроения — один адрес</p>
      </div>

      <div className="px-4 space-y-4">
        {STUDIOS.map((studio) => (
          <button
            key={studio.id}
            onClick={() => openStudio(studio)}
            className="w-full text-left rounded-3xl overflow-hidden dark:bg-white/5 bg-black/5 active:scale-[0.98] transition-transform"
          >
            <div className="relative h-48">
              <img src={studio.images[0]} alt={studio.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-white font-black text-3xl opacity-20 leading-none">{studio.id}</span>
                    <div className="text-white font-bold text-lg leading-tight">{studio.name}</div>
                    <div className="text-white/70 text-sm">{studio.tagline}</div>
                  </div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/15 border border-white/25">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-1.5">
                {studio.features.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium bg-white/10 text-white/70 border border-white/10">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <>
          {/* Backdrop — z-40, below nav (z-50) */}
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            onClick={close}
            onTouchMove={e => e.preventDefault()}
          />

          {/* Sheet — z-40, bottom:0, nav sits on top */}
          <div
            className="fixed left-0 right-0 bottom-0 z-40 dark:bg-[#111] bg-white rounded-t-3xl flex flex-col animate-slide-up"
            style={{ maxHeight: '90vh' }}
          >
            {/* Photo gallery */}
            <div
              className="relative flex-shrink-0 rounded-t-3xl overflow-hidden"
              style={{ height: '52vw', minHeight: 180, maxHeight: 240 }}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {selected.images.map((src, i) => (
                <img key={src} src={src} alt={selected.name}
                  className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === photoIndex ? 'opacity-100' : 'opacity-0'}`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <button onClick={close}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center z-10">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {selected.images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
                  {selected.images.map((_, i) => (
                    <button key={i} onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full ${i === photoIndex ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable content — pb accounts for nav bar */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-5"
              style={{
                overscrollBehavior: 'contain',
                WebkitOverflowScrolling: 'touch',
                paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold dark:text-white text-gray-900">{selected.name}</h2>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selected.color }} />
              </div>
              <p className="text-sm dark:text-white/60 text-gray-600 leading-relaxed mb-4">
                {selected.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-5">
                {selected.features.map(f => (
                  <span key={f} className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ backgroundColor: selected.color + '18', color: selected.color }}>
                    {f}
                  </span>
                ))}
              </div>

              <button
                onClick={() => { if (selected) setStudio(selected.id); close(); navigate('/booking') }}
                className="w-full py-4 rounded-2xl font-bold text-white text-base active:scale-95 transition-transform"
                style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}bb)` }}
              >
                Записаться в {selected.name}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

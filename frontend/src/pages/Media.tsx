import { useNavigate } from 'react-router-dom'
import { useTelegram } from '../hooks/useTelegram'
import { ARTICLES } from '../data'
import { ArrowRight } from 'lucide-react'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function Media() {
  const navigate = useNavigate()
  const { haptic } = useTelegram()

  const [featured, ...rest] = ARTICLES

  return (
    <div className="pb-nav">
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-black dark:text-white text-gray-900 tracking-tight">Медиа</h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Интервью, гайды и истории из студии</p>
      </div>

      <div className="px-4 space-y-4 mt-2 stagger">
        {/* Featured */}
        <button
          onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${featured.id}`) }}
          className="w-full text-left rounded-2xl overflow-hidden dark:bg-white/5 bg-black/5 active:scale-[0.98] transition-all"
        >
          <div className="relative h-52 w-full">
            <img src={featured.cover} alt={featured.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest
              px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
              {featured.tag}
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-lg font-black text-white leading-tight">{featured.title}</h2>
              <p className="text-xs text-white/60 mt-1 line-clamp-2">{featured.subtitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-white/40">{formatDate(featured.date)}</span>
                <span className="text-white/20">·</span>
                <span className="text-[10px] text-white/40">{featured.readTime} мин</span>
              </div>
            </div>
          </div>
        </button>

        {/* Rest */}
        {rest.map(article => (
          <button
            key={article.id}
            onClick={() => { haptic?.impactOccurred('light'); navigate(`/media/${article.id}`) }}
            className="w-full flex gap-3 p-3 rounded-2xl dark:bg-white/5 bg-black/5 active:scale-[0.98] transition-all text-left"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
              <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0 py-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-400">
                {article.tag}
              </span>
              <h3 className="text-sm font-bold dark:text-white text-gray-900 mt-0.5 leading-tight">{article.title}</h3>
              <p className="text-xs dark:text-white/50 text-gray-500 mt-1 line-clamp-2">{article.subtitle}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] dark:text-white/30 text-gray-400">{formatDate(article.date)}</span>
                <span className="dark:text-white/20 text-gray-300">·</span>
                <span className="text-[10px] dark:text-white/30 text-gray-400">{article.readTime} мин</span>
              </div>
            </div>
            <div className="flex items-center self-center flex-shrink-0">
              <ArrowRight size={16} className="dark:text-white/20 text-black/20" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

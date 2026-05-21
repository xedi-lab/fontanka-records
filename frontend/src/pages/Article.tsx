import { useParams, useNavigate } from 'react-router-dom'
import { ARTICLES } from '../data'
import { ChevronLeft, Clock } from 'lucide-react'
import { useTelegram } from '../hooks/useTelegram'
import type { ArticleBlock } from '../types'

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Block({ block }: { block: ArticleBlock }) {
  if (block.type === 'paragraph') {
    return (
      <p className="text-sm dark:text-white/80 text-gray-700 leading-relaxed">
        {block.text}
      </p>
    )
  }
  if (block.type === 'heading') {
    return (
      <h3 className="text-base font-bold dark:text-white text-gray-900 mt-2">
        {block.text}
      </h3>
    )
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="border-l-2 border-white/30 pl-4 my-1">
        <p className="text-sm dark:text-white/60 text-gray-500 italic leading-relaxed">
          «{block.text}»
        </p>
      </blockquote>
    )
  }
  if (block.type === 'qa') {
    return (
      <div className="rounded-2xl dark:bg-white/5 bg-black/5 p-4 space-y-2">
        <p className="text-sm font-semibold dark:text-white text-gray-900">
          — {block.question}
        </p>
        <p className="text-sm dark:text-white/70 text-gray-600 leading-relaxed">
          {block.answer}
        </p>
      </div>
    )
  }
  return null
}

export function Article() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { haptic } = useTelegram()

  const article = ARTICLES.find(a => a.id === id)

  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="dark:text-white/40 text-gray-400 text-sm">Статья не найдена</p>
        <button onClick={() => navigate('/media')} className="mt-4 text-sm dark:text-white text-gray-900 underline">
          Вернуться
        </button>
      </div>
    )
  }

  return (
    <div className="pb-nav">
      {/* Cover */}
      <div className="relative h-64 w-full">
        <img src={article.cover} alt={article.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/50" />

        {/* Back button */}
        <button
          onClick={() => { haptic?.impactOccurred('light'); navigate(-1) }}
          className="absolute top-4 left-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm
            border border-white/10 flex items-center justify-center z-10"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>

        {/* Tag */}
        <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest
          px-2.5 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
          {article.tag}
        </span>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-xl font-black text-white leading-tight">{article.title}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white/50">{formatDate(article.date)}</span>
            <span className="text-white/20">·</span>
            <Clock size={10} className="text-white/40" />
            <span className="text-xs text-white/50">{article.readTime} мин чтения</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-4">
        <p className="text-sm dark:text-white/50 text-gray-500 leading-relaxed italic">
          {article.subtitle}
        </p>

        <div className="w-8 h-px dark:bg-white/10 bg-black/10" />

        {article.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <div className="pt-4 pb-2">
          <button
            onClick={() => { haptic?.impactOccurred('light'); navigate('/media') }}
            className="flex items-center gap-2 text-sm dark:text-white/40 text-gray-400"
          >
            <ChevronLeft size={16} />
            Все материалы
          </button>
        </div>
      </div>
    </div>
  )
}

const ROW1 = [
  'SLAVA MARLOW', 'Toxi$', 'LIZER', 'MAYOT', 'SODA LUV', 'Дора',
  'ДЖИЗУС', 'AUGUST', 'blago white', 'Bushido Zho', 'YUNG TRAPPA', 'DopeVvs',
]

const ROW2 = [
  'FRIENDLY THUG 52 NGG', 'ALBLAK 52', 'Telly Grave', 'УГАДАЙКТО', 'КУОК',
  'Cudea', 'KOUT', 'Josodo', 'Lottery Billz', 'Hofmannita', '044 Rose',
  'Loco OG Rocka', 'Молодой Платон', 'Ian Hopeless', 'D.masta',
]

function TickerRow({ artists, reverse }: { artists: string[]; reverse?: boolean }) {
  const doubled = [...artists, ...artists]
  return (
    <div className="overflow-hidden">
      <div className={`flex gap-3 ${reverse ? 'ticker-reverse' : 'ticker-forward'}`}
        style={{ width: 'max-content' }}>
        {doubled.map((name, i) => (
          <span key={i} className="flex items-center gap-3 flex-shrink-0">
            <span className="text-xs font-semibold tracking-widest uppercase dark:text-white/50 text-gray-500 whitespace-nowrap">
              {name}
            </span>
            <span className="dark:text-white/20 text-gray-300 text-xs">✦</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export function ArtistsTicker() {
  return (
    <div>
      <h3 className="text-xs font-semibold dark:text-white/40 text-gray-400 uppercase tracking-widest mb-3 px-0">
        Работали с нами
      </h3>
      <div className="space-y-2 -mx-4 overflow-hidden">
        <TickerRow artists={ROW1} />
        <TickerRow artists={ROW2} reverse />
      </div>
    </div>
  )
}

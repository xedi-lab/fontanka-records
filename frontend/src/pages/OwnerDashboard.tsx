import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, Users, Download, UserPlus,
  Pencil, Trash2, X, Check, ChevronLeft,
  BarChart2, Building2, FileDown,
} from 'lucide-react'
import {
  getAdminStats, getEmployees, createEmployee,
  updateEmployee, deleteEmployee, getExportUrl,
  type Employee,
} from '../api'

type SubView = null | 'overview' | 'studios' | 'employees' | 'export'

const fmtFull = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}к` : String(Math.round(n))

interface Stats {
  revenue: { today: number; week: number; month: number; total: number }
  total_clients: number
  by_studio: { id: string; count: number; revenue: number }[]
  by_service: { title: string; count: number; revenue: number }[]
  peak_hours: { hour: number; count: number }[]
  daily: { date: string; revenue: number; count: number }[]
  statuses: Record<string, number>
}

function EmptyForm(): Omit<Employee, 'id' | 'created_at'> {
  return { name: '', telegram_id: null, role: 'Сотрудник', hourly_rate: 0, revenue_percent: 0 }
}

export function OwnerDashboard({ onBack }: { onBack: () => void }) {
  const [subView, setSubView] = useState<SubView>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {}).finally(() => setLoadingStats(false))
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  if (subView === 'overview') return <OverviewView stats={stats} loading={loadingStats} onBack={() => setSubView(null)} />
  if (subView === 'studios') return <StudiosView stats={stats} onBack={() => setSubView(null)} />
  if (subView === 'employees') return <EmployeesView employees={employees} setEmployees={setEmployees} stats={stats} onBack={() => setSubView(null)} />
  if (subView === 'export') return <ExportView employees={employees} stats={stats} onBack={() => setSubView(null)} />

  // Main tile grid
  const pending = stats?.statuses['pending'] ?? '—'
  const monthRev = stats ? fmtFull(stats.revenue.month) : '—'
  const empCount = employees.length

  return (
    <div className="pb-nav animate-fade-in">
      <div className="px-4 pt-6 pb-5 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50 active:scale-95"><ChevronLeft size={20} /></button>
        <div>
          <h1 className="text-xl font-bold text-white">Режим владельца</h1>
          <p className="text-xs text-white/40">Фонтанка Рэкордс</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-4 grid grid-cols-3 gap-2 mb-5">
        <div className="p-3 rounded-2xl bg-white/5 text-center">
          <div className="text-xl font-black text-white">{stats ? fmt(stats.revenue.today) : '—'}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Сегодня ₽</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 text-center">
          <div className="text-xl font-black text-white">{stats?.total_clients ?? '—'}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Клиентов</div>
        </div>
        <div className="p-3 rounded-2xl bg-white/5 text-center">
          <div className="text-xl font-black text-white">{stats?.statuses['completed'] ?? '—'}</div>
          <div className="text-[10px] text-white/40 mt-0.5">Завершено</div>
        </div>
      </div>

      {/* Tiles */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <Tile
          icon={<TrendingUp size={22} strokeWidth={1.5} />}
          title="Аналитика"
          sub={`За месяц: ${monthRev}`}
          onClick={() => setSubView('overview')}
        />
        <Tile
          icon={<Building2 size={22} strokeWidth={1.5} />}
          title="Залы & Услуги"
          sub={`${stats?.by_studio.reduce((s, x) => s + x.count, 0) ?? '—'} записей`}
          onClick={() => setSubView('studios')}
        />
        <Tile
          icon={<Users size={22} strokeWidth={1.5} />}
          title="Сотрудники"
          sub={`${empCount} чел. в команде`}
          onClick={() => setSubView('employees')}
        />
        <Tile
          icon={<FileDown size={22} strokeWidth={1.5} />}
          title="Выгрузка"
          sub="CSV отчёты"
          onClick={() => setSubView('export')}
        />
      </div>
    </div>
  )
}

function Tile({ icon, title, sub, badge, onClick }: {
  icon: React.ReactNode; title: string; sub: string
  badge?: string | number; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="relative p-5 rounded-3xl bg-white/5 border border-white/5 text-left active:scale-95 transition-transform"
    >
      {badge !== undefined && (
        <span className="absolute top-3 right-3 min-w-[20px] h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
      <div className="text-white/60 mb-3">{icon}</div>
      <div className="font-bold text-white text-sm">{title}</div>
      <div className="text-xs text-white/40 mt-0.5">{sub}</div>
    </button>
  )
}

function SubHeader({ title, sub, onBack }: { title: string; sub?: string; onBack: () => void }) {
  return (
    <div className="px-4 pt-6 pb-4 flex items-center gap-3">
      <button onClick={onBack} className="text-white/50 active:scale-95"><ChevronLeft size={20} /></button>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-white/40">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Overview ────────────────────────────────────────────────────────────────

function OverviewView({ stats, loading, onBack }: { stats: Stats | null; loading: boolean; onBack: () => void }) {
  return (
    <div className="pb-nav animate-fade-in">
      <SubHeader title="Аналитика" sub="Выручка и активность" onBack={onBack} />
      <div className="px-4 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Сегодня', value: fmtFull(stats.revenue.today) },
                { label: 'За неделю', value: fmtFull(stats.revenue.week) },
                { label: 'За месяц', value: fmtFull(stats.revenue.month) },
                { label: 'За всё время', value: fmtFull(stats.revenue.total) },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-2xl bg-white/5">
                  <div className="text-xs text-white/40 mb-1">{label}</div>
                  <div className="text-base font-black text-white">{value}</div>
                </div>
              ))}
            </div>

            {stats.daily.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5">
                <div className="text-xs text-white/40 mb-3 flex items-center gap-2">
                  <TrendingUp size={14} /> Выручка за 30 дней
                </div>
                <ResponsiveContainer width="100%" height={140}>
                  <AreaChart data={stats.daily} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickFormatter={fmt} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                      formatter={(v: number) => [fmtFull(v), 'Выручка']}
                      labelFormatter={l => l.slice(5)}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2} fill="url(#rv)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {stats.peak_hours.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/5">
                <div className="text-xs text-white/40 mb-3">Часы пик</div>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={stats.peak_hours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }} tickFormatter={h => `${h}:00`} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                      itemStyle={{ color: '#fff', fontSize: 12 }}
                      formatter={(v: number) => [v, 'Записей']}
                      labelFormatter={h => `${h}:00`}
                    />
                    <Bar dataKey="count" fill="rgba(255,255,255,0.3)" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-white/30 text-sm">Нет данных</div>
        )}
      </div>
    </div>
  )
}

// ─── Studios & Services ───────────────────────────────────────────────────────

function StudiosView({ stats, onBack }: { stats: Stats | null; onBack: () => void }) {
  return (
    <div className="pb-nav animate-fade-in">
      <SubHeader title="Залы & Услуги" sub="Распределение загрузки" onBack={onBack} />
      <div className="px-4 space-y-4">
        {!stats ? (
          <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
        ) : (
          <>
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Залы</h3>
              <div className="space-y-2">
                {['A', 'B', 'C'].map(id => {
                  const s = stats.by_studio.find(x => x.id === id)
                  const maxRev = Math.max(...stats.by_studio.map(x => x.revenue), 1)
                  const pct = s ? (s.revenue / maxRev) * 100 : 0
                  return (
                    <div key={id} className="p-4 rounded-2xl bg-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-white text-sm">Студия {id}</span>
                        <span className="text-xs text-white/40">{s?.count ?? 0} записей</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-sm font-semibold text-white">{fmtFull(s?.revenue ?? 0)}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Топ услуг</h3>
              <div className="space-y-2">
                {stats.by_service.map(s => {
                  const maxCnt = Math.max(...stats.by_service.map(x => x.count), 1)
                  return (
                    <div key={s.title} className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">{s.title}</div>
                        <div className="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                          <div className="h-full bg-white/40 rounded-full" style={{ width: `${(s.count / maxCnt) * 100}%` }} />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-white/40">{s.count}×</div>
                        <div className="text-xs font-medium text-white">{fmt(s.revenue)} ₽</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Employees ────────────────────────────────────────────────────────────────

function EmployeesView({ employees, setEmployees, stats, onBack }: {
  employees: Employee[]
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>
  stats: Stats | null
  onBack: () => void
}) {
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [newEmp, setNewEmp] = useState<Omit<Employee, 'id' | 'created_at'> | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSaveNew = async () => {
    if (!newEmp || !newEmp.name.trim() || !newEmp.telegram_id) return
    setSaving(true)
    try {
      const emp = await createEmployee(newEmp)
      setEmployees(prev => [...prev, emp])
      setNewEmp(null)
    } catch {} finally { setSaving(false) }
  }

  const handleSaveEdit = async () => {
    if (!editingEmp) return
    setSaving(true)
    try {
      const { id, created_at, ...rest } = editingEmp
      const updated = await updateEmployee(id, rest)
      setEmployees(prev => prev.map(e => e.id === id ? updated : e))
      setEditingEmp(null)
    } catch {} finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteEmployee(id)
      setEmployees(prev => prev.filter(e => e.id !== id))
    } catch {}
  }

  return (
    <div className="pb-nav animate-fade-in">
      <SubHeader title="Сотрудники" sub={`${employees.length} чел. в команде`} onBack={onBack} />
      <div className="px-4 space-y-3">
        {employees.map(emp => (
          <div key={emp.id} className="p-4 rounded-2xl bg-white/5">
            {editingEmp?.id === emp.id ? (
              <EmployeeForm
                value={editingEmp}
                onChange={v => setEditingEmp({ ...editingEmp, ...v })}
                onSave={handleSaveEdit}
                onCancel={() => setEditingEmp(null)}
                saving={saving}
              />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-white text-sm">{emp.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{emp.role}</div>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-white/60">
                    <span>Ставка: <b className="text-white">{emp.hourly_rate.toLocaleString()} ₽/ч</b></span>
                    <span>Выручка: <b className="text-white">{emp.revenue_percent}%</b></span>
                  </div>
                  <div className="text-xs text-white/30 mt-1">TG ID: {emp.telegram_id}</div>
                  {stats && (
                    <div className="text-xs text-green-400 mt-1">
                      ≈ {(stats.revenue.month * emp.revenue_percent / 100).toLocaleString('ru-RU')} ₽ за месяц
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-2">
                  <button onClick={() => setEditingEmp(emp)}
                    className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 active:scale-95">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(emp.id)}
                    className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400 active:scale-95">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {newEmp ? (
          <div className="p-4 rounded-2xl bg-white/5">
            <EmployeeForm
              value={newEmp}
              onChange={v => setNewEmp({ ...newEmp, ...v })}
              onSave={handleSaveNew}
              onCancel={() => setNewEmp(null)}
              saving={saving}
            />
          </div>
        ) : (
          <button
            onClick={() => setNewEmp(EmptyForm())}
            className="w-full py-3.5 rounded-2xl border border-white/10 border-dashed
              text-white/40 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <UserPlus size={16} /> Добавить сотрудника
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

function ExportView({ employees, stats, onBack }: { employees: Employee[]; stats: Stats | null; onBack: () => void }) {
  const handleExport = (type: 'bookings' | 'financial') => {
    const a = document.createElement('a')
    a.href = getExportUrl(type)
    a.download = `${type}.csv`
    a.click()
  }

  return (
    <div className="pb-nav animate-fade-in">
      <SubHeader title="Выгрузка" sub="CSV для Excel и Google Sheets" onBack={onBack} />
      <div className="px-4 space-y-3">
        <p className="text-sm text-white/40">Файлы открываются в Excel и Google Sheets.</p>

        {[
          { type: 'bookings' as const, title: 'Все бронирования', sub: 'ID, клиент, студия, дата, сумма, статус' },
          { type: 'financial' as const, title: 'Финансовый отчёт', sub: 'Дата, студия, услуга, выручка по каждой записи' },
        ].map(({ type, title, sub }) => (
          <button key={type} onClick={() => handleExport(type)}
            className="w-full p-4 rounded-2xl bg-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Download size={18} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-white text-sm">{title}</div>
              <div className="text-xs text-white/40 mt-0.5">{sub}</div>
            </div>
            <span className="text-xs text-white/30 flex-shrink-0">CSV</span>
          </button>
        ))}

        {employees.length > 0 && (
          <div className="p-4 rounded-2xl bg-white/5 mt-2">
            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Расчёт по сотрудникам</h3>
            <div className="space-y-3">
              {employees.map(emp => {
                const monthRev = stats?.revenue.month ?? 0
                const empShare = monthRev * (emp.revenue_percent / 100)
                return (
                  <div key={emp.id} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-white">{emp.name}</div>
                      <div className="text-xs text-white/40">{emp.role} · {emp.revenue_percent}% от выручки месяца</div>
                    </div>
                    <div className="text-sm font-semibold text-green-400">
                      {empShare.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                )
              })}
              <div className="border-t border-white/10 pt-2 flex justify-between">
                <span className="text-xs text-white/40">Выручка за месяц</span>
                <span className="text-sm font-bold text-white">{fmtFull(stats?.revenue.month ?? 0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Employee Form ────────────────────────────────────────────────────────────

function EmployeeForm({ value, onChange, onSave, onCancel, saving }: {
  value: Omit<Employee, 'id' | 'created_at'>
  onChange: (v: Partial<Omit<Employee, 'id' | 'created_at'>>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const inp = 'w-full px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30'
  const canSave = !!value.name.trim() && !!value.telegram_id

  return (
    <div className="space-y-2">
      <input className={inp} placeholder="Имя сотрудника" value={value.name}
        onChange={e => onChange({ name: e.target.value })} />
      <input className={inp} placeholder="Должность" value={value.role}
        onChange={e => onChange({ role: e.target.value })} />
      <input
        className={`${inp} ${!value.telegram_id ? 'ring-1 ring-yellow-500/50' : ''}`}
        placeholder="Telegram ID (обязательно)" type="number"
        value={value.telegram_id ?? ''}
        onChange={e => onChange({ telegram_id: e.target.value ? Number(e.target.value) : null })}
      />
      {!value.telegram_id && (
        <p className="text-xs text-yellow-400/80 px-1">Узнать ID: написать @userinfobot в Telegram</p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <input className={inp} placeholder="Ставка ₽/ч" type="number"
          value={value.hourly_rate || ''}
          onChange={e => onChange({ hourly_rate: Number(e.target.value) })} />
        <input className={inp} placeholder="% от выручки" type="number" step="0.1"
          value={value.revenue_percent || ''}
          onChange={e => onChange({ revenue_percent: Number(e.target.value) })} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !canSave}
          className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-40">
          <Check size={14} /> {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button onClick={onCancel}
          className="w-10 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

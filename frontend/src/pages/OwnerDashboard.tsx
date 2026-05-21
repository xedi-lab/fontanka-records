import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, Users, Download, UserPlus,
  Pencil, Trash2, X, Check, ChevronLeft,
} from 'lucide-react'
import {
  getAdminStats, getEmployees, createEmployee,
  updateEmployee, deleteEmployee, getExportUrl,
  type Employee,
} from '../api'

type Tab = 'overview' | 'studios' | 'employees' | 'export'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview',   label: 'Обзор' },
  { id: 'studios',    label: 'Залы & Услуги' },
  { id: 'employees',  label: 'Сотрудники' },
  { id: 'export',     label: 'Выгрузка' },
]

const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}к` : String(n)
const fmtFull = (n: number) => n.toLocaleString('ru-RU') + ' ₽'

interface Stats {
  revenue: { today: number; week: number; month: number; total: number }
  total_clients: number
  by_studio: { id: string; count: number; revenue: number }[]
  by_service: { title: string; count: number; revenue: number }[]
  peak_hours: { hour: number; count: number }[]
  daily: { date: string; revenue: number; count: number }[]
  statuses: Record<string, number>
}

function EmptyEmployeeForm(): Omit<Employee, 'id' | 'created_at'> {
  return { name: '', telegram_id: null, role: 'Сотрудник', hourly_rate: 0, revenue_percent: 0 }
}

export function OwnerDashboard({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  const [editingEmp, setEditingEmp] = useState<Employee | null>(null)
  const [newEmp, setNewEmp] = useState<Omit<Employee, 'id' | 'created_at'> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false))
    getEmployees().then(setEmployees).catch(() => {})
  }, [])

  const handleSaveNew = async () => {
    if (!newEmp || !newEmp.name.trim()) return
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

  const handleExport = (type: 'bookings' | 'financial') => {
    const url = getExportUrl(type)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}.csv`
    a.click()
  }

  return (
    <div className="pb-nav animate-fade-in">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-white/50">
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Режим владельца</h1>
          <p className="text-xs text-white/40">Фонтанка Рэкордс</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 mb-4 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-black' : 'bg-white/10 text-white/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="px-4 space-y-4">
          {loadingStats ? (
            <div className="text-center py-12 text-white/30 text-sm">Загружаем...</div>
          ) : stats ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Сегодня', value: fmtFull(stats.revenue.today) },
                  { label: 'За неделю', value: fmtFull(stats.revenue.week) },
                  { label: 'За месяц', value: fmtFull(stats.revenue.month) },
                  { label: 'Всего', value: fmtFull(stats.revenue.total) },
                ].map(({ label, value }) => (
                  <div key={label} className="p-4 rounded-2xl bg-white/5">
                    <div className="text-xs text-white/40 mb-1">{label}</div>
                    <div className="text-lg font-black text-white">{value}</div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-2xl bg-white/5 flex items-center gap-4">
                <Users size={20} className="text-white/40" />
                <div>
                  <div className="text-xs text-white/40">Клиентов в базе</div>
                  <div className="text-xl font-black text-white">{stats.total_clients}</div>
                </div>
                <div className="ml-auto">
                  <div className="text-xs text-white/40">Завершено</div>
                  <div className="text-xl font-black text-white">{stats.statuses['completed'] ?? 0}</div>
                </div>
              </div>

              {/* Revenue chart */}
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
                      <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        tickFormatter={d => d.slice(5)} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        tickFormatter={fmt} />
                      <Tooltip
                        contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                        labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                        itemStyle={{ color: '#fff', fontSize: 12 }}
                        formatter={(v: number) => [fmtFull(v), 'Выручка']}
                        labelFormatter={l => l.slice(5)}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#ffffff" strokeWidth={2}
                        fill="url(#rv)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Peak hours */}
              {stats.peak_hours.length > 0 && (
                <div className="p-4 rounded-2xl bg-white/5">
                  <div className="text-xs text-white/40 mb-3">Часы пик</div>
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={stats.peak_hours} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="hour" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 9 }}
                        tickFormatter={h => `${h}:00`} />
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
      )}

      {/* Studios & Services */}
      {tab === 'studios' && (
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
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div className="h-full bg-white/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-sm font-semibold text-white">{fmtFull(s?.revenue ?? 0)}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Услуги</h3>
                <div className="space-y-2">
                  {stats.by_service.map(s => {
                    const maxCnt = Math.max(...stats.by_service.map(x => x.count), 1)
                    const pct = (s.count / maxCnt) * 100
                    return (
                      <div key={s.title} className="p-3 rounded-xl bg-white/5 flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{s.title}</div>
                          <div className="h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                            <div className="h-full bg-white/40 rounded-full" style={{ width: `${pct}%` }} />
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
      )}

      {/* Employees */}
      {tab === 'employees' && (
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
                    <div className="flex gap-4 mt-2 text-xs text-white/60">
                      <span>Ставка: <b className="text-white">{emp.hourly_rate.toLocaleString()} ₽/ч</b></span>
                      <span>% от выручки: <b className="text-white">{emp.revenue_percent}%</b></span>
                    </div>
                    {emp.telegram_id && (
                      <div className="text-xs text-white/30 mt-1">TG: {emp.telegram_id}</div>
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
              onClick={() => setNewEmp(EmptyEmployeeForm())}
              className="w-full py-3 rounded-2xl border border-white/10 border-dashed
                text-white/40 text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <UserPlus size={16} /> Добавить сотрудника
            </button>
          )}
        </div>
      )}

      {/* Export */}
      {tab === 'export' && (
        <div className="px-4 space-y-3">
          <p className="text-sm text-white/40 mb-2">Файлы скачиваются в формате CSV — открываются в Excel и Google Sheets.</p>

          {[
            { type: 'bookings' as const, title: 'Все бронирования', sub: 'ID, клиент, студия, дата, сумма, статус' },
            { type: 'financial' as const, title: 'Финансовый отчёт', sub: 'Дата, студия, услуга, выручка по каждой записи' },
          ].map(({ type, title, sub }) => (
            <button
              key={type}
              onClick={() => handleExport(type)}
              className="w-full p-4 rounded-2xl bg-white/5 flex items-center gap-4 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Download size={18} className="text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm">{title}</div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{sub}</div>
              </div>
              <span className="text-xs text-white/30 flex-shrink-0">CSV</span>
            </button>
          ))}

          <div className="mt-4 p-4 rounded-2xl bg-white/5">
            <h3 className="text-xs text-white/40 uppercase tracking-widest mb-3">Отчёт по сотрудникам</h3>
            {employees.length === 0 ? (
              <p className="text-sm text-white/30">Сотрудников нет. Добавьте во вкладке «Сотрудники».</p>
            ) : (
              <div className="space-y-2">
                {employees.map(emp => {
                  const totalRevenue = stats?.revenue.total ?? 0
                  const empRevenue = totalRevenue * (emp.revenue_percent / 100)
                  return (
                    <div key={emp.id} className="flex items-center justify-between py-1">
                      <div>
                        <div className="text-sm text-white">{emp.name}</div>
                        <div className="text-xs text-white/40">{emp.role} · {emp.revenue_percent}% от выручки</div>
                      </div>
                      <div className="text-sm font-semibold text-white">
                        {empRevenue.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-white/10 pt-2 flex justify-between">
                  <span className="text-xs text-white/40">Общая выручка</span>
                  <span className="text-sm font-bold text-white">{fmtFull(stats?.revenue.total ?? 0)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EmployeeForm({
  value, onChange, onSave, onCancel, saving,
}: {
  value: Omit<Employee, 'id' | 'created_at'>
  onChange: (v: Partial<Omit<Employee, 'id' | 'created_at'>>) => void
  onSave: () => void
  onCancel: () => void
  saving: boolean
}) {
  const inp = 'w-full px-3 py-2 rounded-xl bg-white/10 text-white text-sm placeholder-white/30 outline-none focus:ring-1 focus:ring-white/30'
  return (
    <div className="space-y-2">
      <input className={inp} placeholder="Имя" value={value.name}
        onChange={e => onChange({ name: e.target.value })} />
      <input className={inp} placeholder="Должность" value={value.role}
        onChange={e => onChange({ role: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <input className={inp} placeholder="Ставка ₽/ч" type="number"
          value={value.hourly_rate || ''}
          onChange={e => onChange({ hourly_rate: Number(e.target.value) })} />
        <input className={inp} placeholder="% выручки" type="number" step="0.1"
          value={value.revenue_percent || ''}
          onChange={e => onChange({ revenue_percent: Number(e.target.value) })} />
      </div>
      <input className={inp} placeholder="Telegram ID (необязательно)" type="number"
        value={value.telegram_id ?? ''}
        onChange={e => onChange({ telegram_id: e.target.value ? Number(e.target.value) : null })} />
      <div className="flex gap-2 pt-1">
        <button onClick={onSave} disabled={saving || !value.name.trim()}
          className="flex-1 py-2 rounded-xl bg-white text-black text-sm font-semibold flex items-center justify-center gap-1 disabled:opacity-50">
          <Check size={14} /> {saving ? 'Сохраняем...' : 'Сохранить'}
        </button>
        <button onClick={onCancel}
          className="w-10 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white/60">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

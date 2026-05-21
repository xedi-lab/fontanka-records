import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE_URL })

export async function upsertUser(user: {
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
}) {
  const { data } = await api.post('/api/users/upsert', user)
  return data
}

export async function createBooking(telegramId: number, booking: {
  studio_id: string
  service_id: string
  service_title: string
  duration_hours: number
  booking_date: string
  booking_time: string
  total_price: number
  prepay_amount: number
}) {
  const { data } = await api.post(`/api/bookings/${telegramId}`, booking)
  return data
}

export async function getUserBookings(telegramId: number) {
  const { data } = await api.get(`/api/bookings/${telegramId}`)
  return data
}

export async function cancelBooking(bookingId: number) {
  const { data } = await api.patch(`/api/bookings/${bookingId}/cancel`)
  return data
}

export async function getAdminBookings(date?: string) {
  const params = date ? `?date=${date}` : ''
  const { data } = await api.get(`/api/bookings/admin/all${params}`)
  return data
}

export async function confirmBooking(bookingId: number) {
  const { data } = await api.patch(`/api/bookings/${bookingId}/confirm`)
  return data
}

export async function getAvailableSlots(studioId: string, date: string) {
  const { data } = await api.get(`/api/slots/${studioId}/${date}`)
  return data.slots as { time: string; available: boolean }[]
}

const secret = () => ({ headers: { 'x-admin-secret': import.meta.env.VITE_ADMIN_SECRET ?? '' } })

export async function verifyOwnerPin(pin: string) {
  const { data } = await api.post('/api/admin/owner/verify', { pin }, secret())
  return data as { ok: boolean }
}

export async function getAdminStats() {
  const { data } = await api.get('/api/admin/stats', secret())
  return data
}

export interface Employee {
  id: number
  name: string
  telegram_id?: number | null
  role: string
  hourly_rate: number
  revenue_percent: number
  created_at: string
}

export async function getEmployees() {
  const { data } = await api.get('/api/admin/employees', secret())
  return data as Employee[]
}

export async function createEmployee(e: Omit<Employee, 'id' | 'created_at'>) {
  const { data } = await api.post('/api/admin/employees', e, secret())
  return data as Employee
}

export async function updateEmployee(id: number, e: Omit<Employee, 'id' | 'created_at'>) {
  const { data } = await api.put(`/api/admin/employees/${id}`, e, secret())
  return data as Employee
}

export async function deleteEmployee(id: number) {
  await api.delete(`/api/admin/employees/${id}`, secret())
}

export function getExportUrl(type: 'bookings' | 'financial') {
  const s = import.meta.env.VITE_ADMIN_SECRET ?? ''
  const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
  return `${base}/api/admin/export/${type}`
}

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

export async function getAvailableSlots(studioId: string, date: string) {
  const { data } = await api.get(`/api/slots/${studioId}/${date}`)
  return data.slots as { time: string; available: boolean }[]
}

import { create } from 'zustand'
import type { Service, StudioId, Booking } from '../types'

interface BookingStore {
  selectedService: Service | null
  selectedStudio: StudioId | null
  selectedDate: Date | null
  selectedTime: string | null
  myBookings: Booking[]

  setService(s: Service | null): void
  setStudio(id: StudioId | null): void
  setDate(d: Date | null): void
  setTime(t: string | null): void
  resetBooking(): void
  addBooking(b: Booking): void
}

export const useBookingStore = create<BookingStore>((set) => ({
  selectedService: null,
  selectedStudio: null,
  selectedDate: null,
  selectedTime: null,
  myBookings: [],

  setService: (s) => set({ selectedService: s }),
  setStudio: (id) => set({ selectedStudio: id }),
  setDate: (d) => set({ selectedDate: d }),
  setTime: (t) => set({ selectedTime: t }),
  resetBooking: () => set({ selectedService: null, selectedStudio: null, selectedDate: null, selectedTime: null }),
  addBooking: (b) => set((state) => ({ myBookings: [b, ...state.myBookings] })),
}))

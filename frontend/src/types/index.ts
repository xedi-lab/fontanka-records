export type StudioId = 'A' | 'B' | 'C'

export interface Studio {
  id: StudioId
  name: string
  tagline: string
  description: string
  features: string[]
  color: string
  images: string[]
}

export type ServiceCategory = 'record' | 'studio' | 'voice' | 'rent' | 'package'

export interface Service {
  id: string
  category: ServiceCategory
  title: string
  description: string
  duration: number
  price: number
  prepayPercent: number
}

export interface TimeSlot {
  time: string
  available: boolean
}

export interface Booking {
  id: string
  studioId: StudioId
  serviceId: string
  date: string
  time: string
  totalPrice: number
  prepayAmount: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
}

export interface BookingState {
  selectedService: Service | null
  selectedStudio: StudioId | null
  selectedDate: Date | null
  selectedTime: string | null
}

export interface ArticleBlock {
  type: 'paragraph' | 'heading' | 'quote' | 'qa'
  text?: string
  question?: string
  answer?: string
}

export interface Article {
  id: string
  title: string
  subtitle: string
  cover: string
  date: string
  readTime: number
  tag: string
  blocks: ArticleBlock[]
}

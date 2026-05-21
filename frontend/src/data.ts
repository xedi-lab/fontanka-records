import type { Studio, Service } from './types'

export const STUDIOS: Studio[] = [
  {
    id: 'A',
    name: 'Студия A',
    tagline: 'Флагман. Максимум пространства.',
    description: 'Просторная лофт-мансарда с профессиональным oборудованием и неоновой атмосферой. Скошенный потолок, большой монитор, зона отдыха с диваном и ТВ. Для больших проектов и команд, которым нужно место для идей.',
    features: ['Просторная мансарда', 'Curved монитор', 'Зона отдыха + ТВ', 'Мультиколор неон', 'Профессиональный звукорежиссёр'],
    color: '#ffffff',
    images: ['/assets/studio-a-1.jpg', '/assets/studio-a-2.jpg'],
  },
  {
    id: 'B',
    name: 'Студия B',
    tagline: 'Профессиональная запись.',
    description: 'Классический студийный зал с акустической обработкой, микрофонными стойками и тёплым красно-синим светом. Окно с жалюзи, диван, живые растения. Создана для серьёзной работы со звуком.',
    features: ['Акустическая обработка', 'Микрофонные стойки', 'Зона отдыха', 'Окно с жалюзи', 'Тёплая атмосфера'],
    color: '#ffffff',
    images: ['/assets/studio-b-1.jpg', '/assets/studio-b-2.jpg'],
  },
  {
    id: 'C',
    name: 'Студия C',
    tagline: 'Минимализм. Полная концентрация.',
    description: 'Компактная мансарда в бетонном стиле с синим неоном. Только ты, твой звук и чистое пространство без лишнего. Для тех, кто приходит работать — и делает это.',
    features: ['Бетонный минимализм', 'Синий неон', 'Акустические панели', 'Диван для отдыха', 'Компактно и уютно'],
    color: '#ffffff',
    images: ['/assets/studio-c-1.jpg', '/assets/studio-c-2.jpg'],
  },
]

export const SERVICES: Service[] = [
  // Запись со звукорежиссёром
  { id: 'rec-1', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 1, price: 1765, prepayPercent: 50 },
  { id: 'rec-2', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 2, price: 3530, prepayPercent: 50 },
  { id: 'rec-3', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 3, price: 5295, prepayPercent: 50 },
  { id: 'rec-4', category: 'record', title: 'Запись', description: 'Профессиональная запись со звукорежиссёром', duration: 4, price: 7060, prepayPercent: 50 },

  // Работа на студии
  { id: 'std-1', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 1, price: 2425, prepayPercent: 50 },
  { id: 'std-2', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 2, price: 4850, prepayPercent: 50 },
  { id: 'std-3', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 3, price: 7275, prepayPercent: 50 },
  { id: 'std-4', category: 'studio', title: 'Работа на студии', description: 'Монтаж, сведение и мастеринг со звукорежиссёром', duration: 4, price: 9700, prepayPercent: 50 },

  // Обучение
  { id: 'edu-1', category: 'studio', title: 'Обучение', description: 'Работа в Ableton Live, Logic Pro, FL Studio — для новичков и продолжающих', duration: 3, price: 10780, prepayPercent: 50 },

  // Вокал и голос
  { id: 'voc-1', category: 'voice', title: 'Вокал', description: 'Раскроем твой голос, отработаем подачу, чувство ритма и разбор трека', duration: 1, price: 3300, prepayPercent: 50 },
  { id: 'voc-2', category: 'voice', title: 'Ораторское мастерство', description: 'Развитие голоса, дикции и харизмы в индивидуальном занятии', duration: 1, price: 3300, prepayPercent: 50 },

  // Аренда без звукорежиссёра
  { id: 'rent-1', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа в студии без звукорежиссёра', duration: 1, price: 1215, prepayPercent: 50 },
  { id: 'rent-2', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа в студии без звукорежиссёра', duration: 2, price: 2430, prepayPercent: 50 },
  { id: 'rent-3', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа в студии без звукорежиссёра', duration: 3, price: 3645, prepayPercent: 50 },
  { id: 'rent-4', category: 'rent', title: 'Аренда студии', description: 'Самостоятельная работа в студии без звукорежиссёра', duration: 4, price: 4860, prepayPercent: 50 },

  // Пакеты
  { id: 'pkg-6', category: 'package', title: 'Пакет 6 часов', description: 'Выгодный пакет аренды на 6 часов', duration: 6, price: 6600, prepayPercent: 50 },
  { id: 'pkg-10', category: 'package', title: 'Пакет 10 часов', description: 'Выгодный пакет аренды на 10 часов', duration: 10, price: 9900, prepayPercent: 50 },
  { id: 'pkg-15', category: 'package', title: 'Пакет 15 часов', description: 'Выгодный пакет аренды на 15 часов', duration: 15, price: 13200, prepayPercent: 50 },
  { id: 'pkg-20', category: 'package', title: 'Пакет 20 часов', description: 'Максимальный пакет аренды на 20 часов', duration: 20, price: 15400, prepayPercent: 50 },
]

export const SERVICE_CATEGORIES = [
  { id: 'record', label: 'Запись' },
  { id: 'studio', label: 'Продакшн' },
  { id: 'voice', label: 'Голос' },
  { id: 'rent', label: 'Аренда' },
  { id: 'package', label: 'Пакеты' },
] as const

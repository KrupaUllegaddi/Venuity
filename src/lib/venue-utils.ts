export interface VenueSeatingSpec {
  total_capacity?: string | number | null
  available_chairs?: number | null
  fixed_chairs?: number | null
  balcony?: boolean | null
}

export interface VenueAudioSpec {
  wireless_microphones?: number | null
  podium_microphones?: number | null
  headset_microphones?: number | null
  microphones_total?: number | null
  subwoofer_speakers?: number | null
  top_speakers?: number | null
  centre_field_speakers?: number | null
  monitor_speakers?: number | null
  speakers_total?: number | null
  sound_console?: boolean | null
}

export interface VenueVisualSpec {
  led_screen?: string | null
  led_par_26?: number | null
  par_lights?: number | null
  warm_led_par_lights?: string | boolean | null
  projectors?: number | null
  computer_system?: number | null
}

export interface VenueStageSpec {
  available?: boolean | null
  size?: string | null
}

export interface VenueFacilitiesSpec {
  ac?: string | boolean | null
  wifi?: boolean | null
  wifi_routers?: number | null
  cctv?: boolean | null
  cctv_cameras?: number | null
  sound_console?: boolean | null
  green_rooms?: number | null
  sofas?: number | null
  swamiji_sofas?: number | null
  large_tables?: number | null
  small_tables?: number | null
  pillars?: string | null
  entrances?: number | null
  exits?: number | null
  computer_system?: number | null
}

export interface VenueSpecifications {
  seating?: VenueSeatingSpec
  audio?: VenueAudioSpec
  visual?: VenueVisualSpec
  stage?: VenueStageSpec
  facilities?: VenueFacilitiesSpec
  [key: string]: unknown
}

export const VENUE_FALLBACK_IMAGES: Record<string, string> = {
  AUDITORIUM: '/images/venues/auditorium/front-view.jpeg',
  SEMINAR_HALL: '/images/venues/cse-seminar-hall/frontview.jpeg',
  GALLERY: '/images/venues/gallery/front-view.jpeg',
  CONFERENCE_ROOM:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDgH94m_tmBGTb1vXF-cyOcvnIqu7pezPKPFsMVjI-zRxdMhnBg-u7uiMFYwRTi6WmKq3Ccs4u3EiKkGjkoG_aDUMXI4k-bqgfloe6x30Fe_6tRYNoppg37FUzDEWWKLdJvid3YJuiai11oratjLHHVCxW4wk1tCSC1FBqncKo8ImEXnhAe_4hP4DdPN6MbS0o-VIbAmICuoO414hmhcx7ZCknhP8CjKbQwRSmWb2-BPe-j0N-31iNj_w',
  CLASSROOM:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCBx6xcT2aWWiRVsCfVB9p4LIaqhPsI4zLLHZnwe0VkKoeetXLnrRYCpZlHVqpyjuiGhlElbpa3acCUdC9GB4xwHUIe0lIlPQ71T-eQRFWk05EHNoipfU3NDHBCLW7SxrVbPGfarOWlzizviMbhrx9uW5SUXjN1cJXohPDyjfpIkvpBfi7DM5x4Y-twHoKtxMu0ZXEvbZfFfhzoe2SzTANw78Sj1mtxaoIHBJ5bTfobZT-H8T7qQ65jBw',
  OTHER:
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBldDKWXNoZDYg39N6uAsxsSuZIQuJJruXeBslHsal2kgJSW3gEb1k5ziuYgcOW_sA9eUT4DH1kqBxsib0k83cb4qYkb66oX3MFw_olp6_qQpLDzkcliokMz3sJhb5WjmZQQ7JVwTMpOC_XnEYzeEmEvEmj32Eqjvj3BlhgOCznF7D3nWSkTfZpV3l1un4sV3saOn6ZjrK_IT9wSqa2qrXav9kIkCvX2EITeERL04V_R1ME0guonBCDEA',
}

export const KNOWN_VENUE_GALLERIES: Record<string, string[]> = {
  auditorium: [
    '/images/venues/auditorium/front-view.jpeg',
    '/images/venues/auditorium/stage-view.jpeg',
    '/images/venues/auditorium/audience-view.jpeg',
  ],
  'cse-seminar-hall': [
    '/images/venues/cse-seminar-hall/frontview.jpeg',
    '/images/venues/cse-seminar-hall/sideview.jpeg',
    '/images/venues/cse-seminar-hall/backview.jpeg',
  ],
  gallery: [
    '/images/venues/gallery/front-view.jpeg',
    '/images/venues/gallery/side-view.jpeg',
    '/images/venues/gallery/back-view.jpeg',
  ],
}

interface VenueLike {
  name?: string | null
  slug?: string | null
  type?: string | null
  image_url?: string | null
  images?: string[] | null
}

/**
 * Returns primary display image for a venue, prioritizing image_url,
 * then recognized slugs/names, then type fallbacks.
 */
export function getVenueImageUrl(venue?: VenueLike | null): string {
  if (!venue) return VENUE_FALLBACK_IMAGES.OTHER

  if (venue.image_url && venue.image_url.trim().length > 0) {
    return venue.image_url
  }

  const slug = (venue.slug || '').toLowerCase()
  const name = (venue.name || '').toLowerCase()

  if (slug === 'auditorium' || slug.includes('auditorium') || name.includes('auditorium')) {
    return '/images/venues/auditorium/front-view.jpeg'
  }
  if (
    slug === 'cse-seminar-hall' ||
    slug.includes('cse') ||
    name.includes('cse') ||
    name.includes('seminar hall a')
  ) {
    return '/images/venues/cse-seminar-hall/frontview.jpeg'
  }
  if (slug === 'gallery' || name.includes('gallery')) {
    return '/images/venues/gallery/front-view.jpeg'
  }

  const typeKey = (venue.type || 'OTHER').toUpperCase()
  return VENUE_FALLBACK_IMAGES[typeKey] || VENUE_FALLBACK_IMAGES.OTHER
}

/**
 * Returns complete image gallery array for a venue.
 */
export function getVenueImages(venue?: VenueLike | null): string[] {
  if (!venue) return [VENUE_FALLBACK_IMAGES.OTHER]

  if (Array.isArray(venue.images) && venue.images.length > 0) {
    return venue.images
  }

  const slug = (venue.slug || '').toLowerCase()
  const name = (venue.name || '').toLowerCase()

  if (slug.includes('auditorium') || name.includes('auditorium')) {
    return KNOWN_VENUE_GALLERIES.auditorium
  }
  if (slug.includes('cse') || name.includes('cse') || name.includes('seminar hall a')) {
    return KNOWN_VENUE_GALLERIES['cse-seminar-hall']
  }
  if (slug.includes('gallery') || name.includes('gallery')) {
    return KNOWN_VENUE_GALLERIES.gallery
  }

  const primary = getVenueImageUrl(venue)
  return [primary]
}

/**
 * Formats a specification value for display.
 * CRITICAL: If value is null, undefined, or empty, returns 'Not specified'. Never returns 0 for missing data.
 */
export function formatSpecValue(value: unknown, suffix?: string): string {
  if (value === null || value === undefined || value === '') {
    return 'Not specified'
  }

  if (typeof value === 'boolean') {
    return value ? 'Available' : 'Not available'
  }

  if (typeof value === 'number') {
    return `${value}${suffix ? ' ' + suffix : ''}`
  }

  if (typeof value === 'string') {
    return `${value}${suffix ? ' ' + suffix : ''}`
  }

  return String(value)
}


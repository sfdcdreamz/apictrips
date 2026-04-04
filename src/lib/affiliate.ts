/**
 * Affiliate link generators for hotel/flight booking platforms.
 * Replace the placeholder affiliate IDs with real ones from each program.
 */

const BOOKING_COM_AFFILIATE_ID = process.env.NEXT_PUBLIC_BOOKING_AFFILIATE_ID || 'apictrips'
const MMT_AFFILIATE_ID = process.env.NEXT_PUBLIC_MMT_AFFILIATE_ID || 'apictrips'
const AGODA_AFFILIATE_ID = process.env.NEXT_PUBLIC_AGODA_AFFILIATE_ID || '0'

export interface AffiliateLink {
  platform: 'Booking.com' | 'MakeMyTrip' | 'Agoda'
  url: string
  icon: string
  label: string
}

/**
 * Generate tracked booking links for a destination.
 * Returns links for hotels (Booking.com, Agoda) and flights (MakeMyTrip).
 */
export function buildAffiliateLinks(destination: string, checkIn?: string, checkOut?: string): AffiliateLink[] {
  const encodedDest = encodeURIComponent(destination)

  const links: AffiliateLink[] = []

  // Booking.com hotel search
  const bookingParams = new URLSearchParams({
    ss: destination,
    aid: BOOKING_COM_AFFILIATE_ID,
    ...(checkIn && { checkin: checkIn }),
    ...(checkOut && { checkout: checkOut }),
  })
  links.push({
    platform: 'Booking.com',
    url: `https://www.booking.com/searchresults.html?${bookingParams.toString()}`,
    icon: '🏨',
    label: 'Find hotels',
  })

  // MakeMyTrip hotel search (India-focused)
  links.push({
    platform: 'MakeMyTrip',
    url: `https://www.makemytrip.com/hotels/hotel-listing/?topCityCode=${encodedDest}&af_id=${MMT_AFFILIATE_ID}`,
    icon: '✈️',
    label: 'Search on MMT',
  })

  // Agoda (popular in Asia)
  links.push({
    platform: 'Agoda',
    url: `https://www.agoda.com/search?city=${encodedDest}&tag=${AGODA_AFFILIATE_ID}`,
    icon: '🛎️',
    label: 'Search on Agoda',
  })

  return links
}

import { buildAffiliateLinks } from '@/lib/affiliate'

interface Props {
  destination: string
  checkIn?: string
  checkOut?: string
}

export default function AffiliateBookingLinks({ destination, checkIn, checkOut }: Props) {
  const links = buildAffiliateLinks(destination, checkIn, checkOut)

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Book for {destination}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {links.map((link) => (
          <a
            key={link.platform}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-center group"
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs font-medium text-gray-700 group-hover:text-emerald-700 transition-colors leading-tight">
              {link.platform}
            </span>
            <span className="text-xs text-gray-400">{link.label}</span>
          </a>
        ))}
      </div>
      <p className="text-xs text-gray-300 mt-2 text-center">
        APIcTrips may earn a commission on bookings.
      </p>
    </div>
  )
}

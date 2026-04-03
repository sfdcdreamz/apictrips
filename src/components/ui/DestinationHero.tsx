import Image from 'next/image'

const HEIGHT_CLASSES = {
  sm: 'h-36',
  md: 'h-48',
  lg: 'h-64',
}

function getFallbackGradient(destination: string): string {
  const gradients = [
    'from-violet-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-orange-400 to-rose-500',
    'from-blue-500 to-indigo-600',
    'from-pink-500 to-purple-600',
  ]
  const index = destination.charCodeAt(0) % gradients.length
  return gradients[index]
}

interface DestinationHeroProps {
  imageUrl: string
  destination: string
  height: 'sm' | 'md' | 'lg'
}

export default function DestinationHero({ imageUrl, destination, height }: DestinationHeroProps) {
  const heightClass = HEIGHT_CLASSES[height]

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={destination}
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${getFallbackGradient(destination)}`} />
      )}
      {/* Dark gradient overlay bottom-to-top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
    </div>
  )
}

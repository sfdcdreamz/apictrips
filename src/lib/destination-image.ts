export async function getDestinationImage(destination: string): Promise<string> {
  const key = process.env.UNSPLASH_ACCESS_KEY
  if (!key || key === 'your_key_here') return ''

  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(destination + ',travel')}&orientation=landscape&content_filter=high`
    const res = await fetch(url, {
      headers: { Authorization: `Client-ID ${key}` },
      next: { revalidate: 120 },
    })
    if (!res.ok) return ''
    const data = await res.json()
    return (data?.urls?.regular as string) ?? ''
  } catch {
    return ''
  }
}

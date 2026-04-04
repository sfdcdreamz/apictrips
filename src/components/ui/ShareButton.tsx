'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  url: string
  title?: string
  text?: string
  label?: string
  className?: string
}

export default function ShareButton({ url, title = 'Trip link', text = '', label = 'Share', className }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function handleClick() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, text: text ? `${text}\n${url}` : url, url })
      } catch {
        // user cancelled
      }
    } else {
      setOpen(o => !o)
    }
  }

  function whatsapp() {
    const msg = text ? `${text}\n${url}` : url
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    setOpen(false)
  }

  function email() {
    const body = text ? `${text}\n\n${url}` : url
    window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`)
    setOpen(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleClick}
        className={className ?? 'py-1.5 px-3 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors'}
      >
        {copied ? 'Copied!' : label}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-44 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <button
            onClick={whatsapp}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 flex items-center gap-2"
          >
            <span className="text-green-600">💬</span> WhatsApp
          </button>
          <button
            onClick={email}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2 border-t border-gray-100"
          >
            <span className="text-blue-600">✉️</span> Email
          </button>
          <button
            onClick={copyLink}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100"
          >
            <span>🔗</span> Copy link
          </button>
        </div>
      )}
    </div>
  )
}

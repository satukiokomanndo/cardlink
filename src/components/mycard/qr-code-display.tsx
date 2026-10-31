'use client'

import { useEffect, useRef } from 'react'

interface Props {
  value: string
  size?: number
}

export default function QRCodeDisplay({ value, size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    async function generate() {
      try {
        const QRCode = (await import('qrcode')).default
        if (!cancelled && canvasRef.current) {
          await QRCode.toCanvas(canvasRef.current, value, {
            width: size,
            margin: 2,
            errorCorrectionLevel: 'M',
          })
        }
      } catch (err) {
        console.error('QR generation error:', err)
      }
    }
    generate()
    return () => { cancelled = true }
  }, [value, size])

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />
}

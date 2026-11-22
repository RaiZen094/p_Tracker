import { useEffect, useRef } from 'react'

// An architectural elevation drawn in the appointment card's coordinate system.
export function BankDrawing() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const scale = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = 400 * scale
    canvas.height = 210 * scale
    const c = canvas.getContext('2d')
    if (!c) return
    c.scale(scale, scale)
    c.strokeStyle = '#e3dfac'
    c.fillStyle = '#245546'
    c.lineWidth = 0.95
    c.lineJoin = 'round'
    function line(...coords: number[]) {
      if (!c) return
      c.beginPath()
      c.moveTo(coords[0], coords[1])
      for (let i = 2; i < coords.length; i += 2)
        c.lineTo(coords[i], coords[i + 1])
      c.stroke()
    }
    function poly(...coords: number[]) {
      if (!c) return
      c.beginPath()
      c.moveTo(coords[0], coords[1])
      for (let i = 2; i < coords.length; i += 2)
        c.lineTo(coords[i], coords[i + 1])
      c.closePath()
      c.fill()
      c.stroke()
    }
    // Fine construction lines around the elevation.
    c.globalAlpha = 0.25
    c.setLineDash([3, 5])
    for (const x of [27, 60, 169, 283, 365]) line(x, 5, x, 203)
    for (const y of [36, 82, 170, 196]) line(4, y, 395, y)
    c.setLineDash([])
    c.globalAlpha = 0.85
    poly(52, 83, 282, 83, 282, 174, 52, 174)
    poly(282, 83, 347, 61, 347, 150, 282, 174)
    for (let x = 68; x < 265; x += 38) {
      poly(x, 108, x + 20, 108, x + 20, 166, x, 166)
      line(x + 3, 163, x + 3, 111, x + 17, 111, x + 17, 163)
      line(x + 10, 112, x + 10, 163)
      line(x + 4, 135, x + 16, 135)
    }
    for (let i = 0; i < 4; i++) {
      const x = 290 + i * 14,
        y = 94 - i * 4.8
      poly(x, y, x + 7, y - 2.5, x + 7, y + 47, x, y + 50)
    }
    for (let i = 0; i < 6; i++) {
      const x = 51 + i * 44
      poly(x - 4, 83, x + 15, 83, x + 15, 88, x - 4, 88)
      poly(x - 2, 88, x + 13, 88, x + 11, 92, x, 92)
      poly(x, 92, x + 10, 92, x + 12, 165, x - 2, 165)
      for (let j = 1; j <= 3; j++) line(x + j * 2, 94, x + j * 3 - 2, 163)
      poly(x - 2, 165, x + 13, 165, x + 14, 169, x - 3, 169)
      poly(x - 5, 169, x + 16, 169, x + 16, 173, x - 5, 173)
    }
    poly(39, 74, 284, 74, 284, 85, 39, 85)
    line(40, 78, 284, 78)
    for (let x = 42; x < 283; x += 6) line(x, 80, x, 84)
    poly(284, 74, 353, 50, 353, 61, 284, 85)
    poly(37, 73, 163, 18, 289, 73)
    poly(51, 69, 163, 22, 274, 69)
    poly(68, 65, 163, 26, 257, 65)
    poly(163, 18, 225, 4, 355, 49, 289, 73)
    for (let i = 1; i < 23; i++) {
      const f = i / 24
      line(164 + f * 123, 19 + f * 53, 225 + f * 129, 6 + f * 43)
    }
    c.beginPath()
    c.arc(163, 49, 9, 0, 2 * Math.PI)
    c.stroke()
    c.beginPath()
    c.arc(163, 49, 6, 0, 2 * Math.PI)
    c.stroke()
    line(163, 44, 163, 49, 167, 51)
    for (let i = 0; i < 3; i++) {
      const x = 43 - i * 6,
        y = 174 + i * 5,
        right = 288 + i * 6
      poly(x, y, right, y, right, y + 5, x, y + 5)
      poly(right, y, right + 66, y - 23, right + 66, y - 18, right, y + 5)
    }
    line(10, 190, 310, 190, 380, 165)
  }, [])
  return <canvas ref={ref} className="bank-drawing" aria-hidden="true" />
}

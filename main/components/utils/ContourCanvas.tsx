'use client'
import { useEffect, useRef } from 'react'

type Options = {
  showFps?: boolean
  maxFps?: number // 0 uncapped
  thresholdIncrement?: number
  thickLineThresholdMultiple?: number
  resolution?: number
  baseZOffset?: number
  lineColor?: string
}

// Minimal port of the AVM canvas effect for React
export const ContourCanvas = ({
  showFps = false,
  maxFps = 0,
  thresholdIncrement = 6,
  thickLineThresholdMultiple = 4,
  resolution = 8,
  baseZOffset = 0.00025,
  lineColor = '#EDEDED40'
}: Options) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const fpsRef = useRef<HTMLSpanElement | null>(null)

  useEffect(() => {
    let running = true
    let ctx: CanvasRenderingContext2D | null = null
    let zOffset = 0
    let cols = 0
    let rows = 0
    let currentThreshold = 0
    let frameValues: number[] = []
    const inputValues: number[][] = []
    const zBoostValues: number[][] = []
    let noiseMin = 100
    let noiseMax = 0
    let noiseMod: any

    const mousePos = { x: -999, y: -999 }

    function init() {
      // local perlin noise implementation to avoid remote imports during build
      noiseMod = require('./perlin')
      const canvas = canvasRef.current
      if (!canvas) return
      const context = canvas.getContext('2d')
      if (!context) return
      ctx = context
      sizeCanvas()
      window.addEventListener('resize', sizeCanvas)
      canvas.addEventListener('mousemove', (e) => {
        mousePos.x = e.offsetX
        mousePos.y = e.offsetY
      })
      animate()
    }

    function sizeCanvas() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container || !ctx) return
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      cols = Math.floor(canvas.width / resolution) + 1
      rows = Math.floor(canvas.height / resolution) + 1
      for (let y = 0; y < rows; y++) {
        zBoostValues[y] = []
        for (let x = 0; x <= cols; x++) zBoostValues[y][x] = 0
      }
    }

    function mouseOffset() {
      const x = Math.floor(mousePos.x / resolution)
      const y = Math.floor(mousePos.y / resolution)
      if (!inputValues[y] || inputValues[y][x] === undefined) return
      const incrementValue = 0.0025
      const radius = 5
      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          const distanceSquared = i * i + j * j
          const radiusSquared = radius * radius
          if (distanceSquared <= radiusSquared && zBoostValues[y + i]?.[x + j] !== undefined) {
            zBoostValues[y + i][x + j] += incrementValue * (1 - distanceSquared / radiusSquared)
          }
        }
      }
    }

    function generateNoise() {
      for (let y = 0; y < rows; y++) {
        inputValues[y] = []
        for (let x = 0; x <= cols; x++) {
          // Fractal Brownian Motion: multiple octaves for more jagged detail
          const n1 = noiseMod.noise(x * 0.03, y * 0.03, zOffset + zBoostValues[y]?.[x])
          const n2 = noiseMod.noise(x * 0.06, y * 0.06, zOffset * 1.25 + zBoostValues[y]?.[x]) * 0.4
          const n3 = noiseMod.noise(x * 0.12, y * 0.12, zOffset * 1.6 + zBoostValues[y]?.[x]) * 0.2
          const value = (n1 + n2 + n3) * 100
          inputValues[y][x] = value
          if (value < noiseMin) noiseMin = value
          if (value > noiseMax) noiseMax = value
          if (zBoostValues[y]?.[x] > 0) zBoostValues[y][x] *= 0.99
        }
      }
    }

    function linInterpolate(x0: number, x1: number, y0 = 0, y1 = 1) {
      if (x0 === x1) return 0
      return y0 + ((y1 - y0) * (currentThreshold - x0)) / (x1 - x0)
    }

    function binaryToType(nw: number, ne: number, se: number, sw: number) {
      const a = [nw, ne, se, sw]
      return a.reduce((res, x) => (res << 1) | x)
    }

    function line(from: number[], to: number[]) {
      if (!ctx) return
      ctx.moveTo(from[0], from[1])
      ctx.lineTo(to[0], to[1])
    }

    function placeLines(gridValue: number, x: number, y: number) {
      const nw = inputValues[y][x]
      const ne = inputValues[y][x + 1]
      const se = inputValues[y + 1][x + 1]
      const sw = inputValues[y + 1][x]
      let a: number[] | undefined,
        b: number[] | undefined,
        c: number[] | undefined,
        d: number[] | undefined

      switch (gridValue) {
        case 1:
        case 14:
          c = [x * resolution + resolution * linInterpolate(sw, se), y * resolution + resolution]
          d = [x * resolution, y * resolution + resolution * linInterpolate(nw, sw)]
          line(d, c)
          break
        case 2:
        case 13:
          b = [x * resolution + resolution, y * resolution + resolution * linInterpolate(ne, se)]
          c = [x * resolution + resolution * linInterpolate(sw, se), y * resolution + resolution]
          line(b, c)
          break
        case 3:
        case 12:
          b = [x * resolution + resolution, y * resolution + resolution * linInterpolate(ne, se)]
          d = [x * resolution, y * resolution + resolution * linInterpolate(nw, sw)]
          line(d, b)
          break
        case 11:
        case 4:
          a = [x * resolution + resolution * linInterpolate(nw, ne), y * resolution]
          b = [x * resolution + resolution, y * resolution + resolution * linInterpolate(ne, se)]
          line(a, b)
          break
        case 5:
          a = [x * resolution + resolution * linInterpolate(nw, ne), y * resolution]
          b = [x * resolution + resolution, y * resolution + resolution * linInterpolate(ne, se)]
          c = [x * resolution + resolution * linInterpolate(sw, se), y * resolution + resolution]
          d = [x * resolution, y * resolution + resolution * linInterpolate(nw, sw)]
          line(d, a)
          line(c, b)
          break
        case 6:
        case 9:
          a = [x * resolution + resolution * linInterpolate(nw, ne), y * resolution]
          c = [x * resolution + resolution * linInterpolate(sw, se), y * resolution + resolution]
          line(c, a)
          break
        case 7:
        case 8:
          a = [x * resolution + resolution * linInterpolate(nw, ne), y * resolution]
          d = [x * resolution, y * resolution + resolution * linInterpolate(nw, sw)]
          line(d, a)
          break
        case 10:
          a = [x * resolution + resolution * linInterpolate(nw, ne), y * resolution]
          b = [x * resolution + resolution, y * resolution + resolution * linInterpolate(ne, se)]
          c = [x * resolution + resolution * linInterpolate(sw, se), y * resolution + resolution]
          d = [x * resolution, y * resolution + resolution * linInterpolate(nw, sw)]
          line(a, b)
          line(c, d)
          break
        default:
          break
      }
    }

    function renderAtThreshold() {
      if (!ctx) return
      ctx.beginPath()
      // Alternate styles per threshold for variation: solid, dashed, dotted
      const stepIndex = Math.floor(currentThreshold / thresholdIncrement)
      const alpha = 0.18 + 0.4 * ((stepIndex % 5) / 5)
      ctx.strokeStyle = `rgba(237,237,237,${alpha})`
      if (stepIndex % 7 === 0) {
        ctx.setLineDash([10, 8])
      } else if (stepIndex % 5 === 0) {
        ctx.setLineDash([2, 6]) // dotted
      } else {
        ctx.setLineDash([])
      }
      const isThick = currentThreshold % (thresholdIncrement * thickLineThresholdMultiple) === 0
      ctx.lineWidth = isThick ? 2.5 : 1
      for (let y = 0; y < inputValues.length - 1; y++) {
        for (let x = 0; x < inputValues[y].length - 1; x++) {
          const above = inputValues[y][x] > currentThreshold
          if (above && inputValues[y][x + 1] > currentThreshold && inputValues[y + 1][x + 1] > currentThreshold && inputValues[y + 1][x] > currentThreshold) continue
          const below = !above
          if (below && inputValues[y][x + 1] < currentThreshold && inputValues[y + 1][x + 1] < currentThreshold && inputValues[y + 1][x] < currentThreshold) continue
          const gridValue = binaryToType(
            inputValues[y][x] > currentThreshold ? 1 : 0,
            inputValues[y][x + 1] > currentThreshold ? 1 : 0,
            inputValues[y + 1][x + 1] > currentThreshold ? 1 : 0,
            inputValues[y + 1][x] > currentThreshold ? 1 : 0
          )
          placeLines(gridValue, x, y)
        }
      }
      ctx.stroke()
      ctx.setLineDash([])
    }

    function drawGrid() {
      if (!ctx || !canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const spacing = Math.max(80, rect.width / 12)
      ctx.save()
      ctx.lineWidth = 0.7
      ctx.strokeStyle = 'rgba(237,237,237,0.12)'
      ctx.setLineDash([2, 10])
      ctx.beginPath()
      for (let x = 0; x <= rect.width; x += spacing) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, rect.height)
      }
      for (let y = 0; y <= rect.height; y += spacing) {
        ctx.moveTo(0, y)
        ctx.lineTo(rect.width, y)
      }
      ctx.stroke()
      ctx.setLineDash([])

      // draw pluses at intersections (subtle)
      ctx.strokeStyle = 'rgba(237,237,237,0.25)'
      for (let y = 0; y <= rect.height; y += spacing) {
        for (let x = 0; x <= rect.width; x += spacing) {
          ctx.beginPath()
          ctx.moveTo(x - 4, y)
          ctx.lineTo(x + 4, y)
          ctx.moveTo(x, y - 4)
          ctx.lineTo(x, y + 4)
          ctx.stroke()
        }
      }
      ctx.restore()
    }

    // (omitted) Claude logo previously rendered here; removed per design direction

    function animate() {
      if (!running || !ctx) return
      const start = performance.now()
      setTimeout(() => {
        const end = performance.now()
        const frame = Math.round(1000 / (end - start))
        frameValues.push(frame)
        if (frameValues.length > 60 && showFps && fpsRef.current) {
          fpsRef.current.innerText = String(Math.round(frameValues.reduce((a, b) => a + b) / frameValues.length))
          frameValues = []
        }
        requestAnimationFrame(animate)
      }, 1000 / (maxFps || 60))

      // draw
      mouseOffset()
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      // Slightly more aggressive global motion with subtle oscillation
      zOffset += baseZOffset * (1.5 + Math.sin(performance.now() * 0.0003) * 0.5)
      generateNoise()
      const roundedNoiseMin = Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement
      const roundedNoiseMax = Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement
      for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += thresholdIncrement) {
        currentThreshold = threshold
        renderAtThreshold()
      }
      noiseMin = 100
      noiseMax = 0

      // Draw grid and pluses at highest canvas z-index; auth card has CSS z-index higher than canvas container
      drawGrid()
    }

    init()

    return () => {
      running = false
      window.removeEventListener('resize', () => {})
    }
  }, [showFps, maxFps, thresholdIncrement, thickLineThresholdMultiple, resolution, baseZOffset, lineColor])

  return (
    <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      {showFps ? (
        <span ref={fpsRef} style={{ position: 'absolute', top: 8, right: 8, fontSize: 12, opacity: 0.6 }} />
      ) : null}
    </div>
  )
}

export default ContourCanvas

// Helper renderers (declared after component to keep closure small)
function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, lw = 1) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = lw
  ctx.beginPath()
  ctx.moveTo(x - size, y)
  ctx.lineTo(x + size, y)
  ctx.moveTo(x, y - size)
  ctx.lineTo(x, y + size)
  ctx.stroke()
  ctx.restore()
}

// These functions are attached to window via prototype hacks inside the effect above
// but we re-declare them here for TS. They will be bound via closure when used.
function noop() {}

// Type augmentations for closures created in useEffect
declare global {
  interface Window {
    __contour_helpers?: any
  }
}


'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const PARTICLE_COUNT = 200
const CONNECT_DISTANCE = 120
const MOUSE_RADIUS = 150
const MOUSE_FORCE = 0.02
const CENTER_CLEAR_X = 0.25
const CENTER_CLEAR_Y = 0.2
const CENTER_PUSH_FORCE = 0.08

export default function NeuralNetworkBg() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000)
    camera.position.z = 300

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const velocities = new Float32Array(PARTICLE_COUNT * 3)

    const cyanColor = new THREE.Color('#00ffff')
    const purpleColor = new THREE.Color('#bf00ff')

    const clearW = width * CENTER_CLEAR_X
    const clearH = height * CENTER_CLEAR_Y

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3
      let px, py
      do {
        px = (Math.random() - 0.5) * width * 0.8
        py = (Math.random() - 0.5) * height * 0.8
      } while (Math.abs(px) < clearW && Math.abs(py) < clearH)
      positions[i3] = px
      positions[i3 + 1] = py
      positions[i3 + 2] = (Math.random() - 0.5) * 200

      velocities[i3] = (Math.random() - 0.5) * 0.5
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.5
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2

      const t = Math.random()
      const color = cyanColor.clone().lerp(purpleColor, t)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }

    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    const maxLines = PARTICLE_COUNT * 10
    const linePositions = new Float32Array(maxLines * 6)
    const lineColors = new Float32Array(maxLines * 6)
    const lineGeometry = new THREE.BufferGeometry()
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
    lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3))

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial)
    scene.add(lines)

    const mouse = { x: 9999, y: 9999 }

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onMouseLeave = () => {
      mouse.x = 9999
      mouse.y = 9999
    }

    container.addEventListener('mousemove', onMouseMove)
    container.addEventListener('mouseleave', onMouseLeave)

    let frameCount = 0
    let animId: number

    const animate = () => {
      animId = requestAnimationFrame(animate)
      if (document.hidden) return

      frameCount++

      const mouseWorld = new THREE.Vector3(
        mouse.x * width * 0.4,
        mouse.y * height * 0.4,
        0
      )

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3

        const dx = positions[i3] - mouseWorld.x
        const dy = positions[i3 + 1] - mouseWorld.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * MOUSE_FORCE
          velocities[i3] += (dx / dist) * force
          velocities[i3 + 1] += (dy / dist) * force
        }

        const ax = Math.abs(positions[i3])
        const ay = Math.abs(positions[i3 + 1])
        if (ax < clearW && ay < clearH) {
          const escapeX = positions[i3] === 0 ? 1 : Math.sign(positions[i3])
          const escapeY = positions[i3 + 1] === 0 ? 1 : Math.sign(positions[i3 + 1])
          const penetrationX = (clearW - ax) / clearW
          const penetrationY = (clearH - ay) / clearH
          velocities[i3] += escapeX * penetrationX * CENTER_PUSH_FORCE
          velocities[i3 + 1] += escapeY * penetrationY * CENTER_PUSH_FORCE
        }

        velocities[i3] *= 0.98
        velocities[i3 + 1] *= 0.98
        velocities[i3 + 2] *= 0.98

        positions[i3] += velocities[i3]
        positions[i3 + 1] += velocities[i3 + 1]
        positions[i3 + 2] += velocities[i3 + 2]

        const boundX = width * 0.4
        const boundY = height * 0.4
        const boundZ = 100

        if (positions[i3] > boundX) { positions[i3] = boundX; velocities[i3] *= -0.5 }
        if (positions[i3] < -boundX) { positions[i3] = -boundX; velocities[i3] *= -0.5 }
        if (positions[i3 + 1] > boundY) { positions[i3 + 1] = boundY; velocities[i3 + 1] *= -0.5 }
        if (positions[i3 + 1] < -boundY) { positions[i3 + 1] = -boundY; velocities[i3 + 1] *= -0.5 }
        if (positions[i3 + 2] > boundZ) { positions[i3 + 2] = boundZ; velocities[i3 + 2] *= -0.5 }
        if (positions[i3 + 2] < -boundZ) { positions[i3 + 2] = -boundZ; velocities[i3 + 2] *= -0.5 }
      }

      particleGeometry.attributes.position.needsUpdate = true

      if (frameCount % 2 === 0) {
        let lineIndex = 0
        for (let i = 0; i < PARTICLE_COUNT && lineIndex < maxLines; i++) {
          for (let j = i + 1; j < PARTICLE_COUNT && lineIndex < maxLines; j++) {
            const i3 = i * 3
            const j3 = j * 3
            const dx = positions[i3] - positions[j3]
            const dy = positions[i3 + 1] - positions[j3 + 1]
            const dz = positions[i3 + 2] - positions[j3 + 2]
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

            if (dist < CONNECT_DISTANCE) {
              const alpha = 1 - dist / CONNECT_DISTANCE
              const li = lineIndex * 6

              linePositions[li] = positions[i3]
              linePositions[li + 1] = positions[i3 + 1]
              linePositions[li + 2] = positions[i3 + 2]
              linePositions[li + 3] = positions[j3]
              linePositions[li + 4] = positions[j3 + 1]
              linePositions[li + 5] = positions[j3 + 2]

              lineColors[li] = colors[i3] * alpha
              lineColors[li + 1] = colors[i3 + 1] * alpha
              lineColors[li + 2] = colors[i3 + 2] * alpha
              lineColors[li + 3] = colors[j3] * alpha
              lineColors[li + 4] = colors[j3 + 1] * alpha
              lineColors[li + 5] = colors[j3 + 2] * alpha

              lineIndex++
            }
          }
        }

        for (let i = lineIndex * 6; i < linePositions.length; i++) {
          linePositions[i] = 0
          lineColors[i] = 0
        }

        lineGeometry.attributes.position.needsUpdate = true
        lineGeometry.attributes.color.needsUpdate = true
        lineGeometry.setDrawRange(0, lineIndex * 2)
      }

      renderer.render(scene, camera)
    }

    animate()

    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
      container.removeEventListener('mousemove', onMouseMove)
      container.removeEventListener('mouseleave', onMouseLeave)
      particleGeometry.dispose()
      particleMaterial.dispose()
      lineGeometry.dispose()
      lineMaterial.dispose()
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'auto',
      }}
    />
  )
}

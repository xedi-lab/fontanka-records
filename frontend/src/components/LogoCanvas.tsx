import { useRef, useEffect, useState, Suspense, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import type { RootState } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

class ErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(err: Error, info: ErrorInfo) { console.error('LogoCanvas error:', err, info) }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function ButterflyMesh() {
  const meshRef = useRef<THREE.Mesh>(null)
  const [texture, setTexture] = useState<THREE.Texture | null>(null)

  useEffect(() => {
    const img = new Image()
    img.src = '/assets/logo.jpg'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        const b = (data[i] + data[i + 1] + data[i + 2]) / 3
        data[i] = 255; data[i + 1] = 255; data[i + 2] = 255
        data[i + 3] = Math.min(255, b * 1.8)
      }
      ctx.putImageData(imageData, 0, 0)
      setTexture(new THREE.CanvasTexture(canvas))
    }
  }, [])

  useFrame((state: RootState) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 1.2) * 0.04)
    }
  })

  if (!texture) return null

  return (
    <Float speed={2} rotationIntensity={0.15} floatIntensity={1.2}>
      <mesh ref={meshRef}>
        <planeGeometry args={[2.8, 1.575]} />
        <meshBasicMaterial map={texture} alphaMap={texture} transparent color="#ffffff" toneMapped={false} />
      </mesh>
    </Float>
  )
}

const StaticFallback = () => (
  <div className="logo-float">
    <img src="/assets/logo.jpg" alt="Фонтанка Рэкордс" className="w-24 h-24 rounded-full object-cover"
      style={{ boxShadow: '0 0 40px rgba(255,255,255,0.3), 0 0 80px rgba(255,255,255,0.1)' }} />
  </div>
)

export function LogoCanvas() {
  return (
    <ErrorBoundary fallback={<StaticFallback />}>
      <div style={{
        width: 240, height: 135,
        filter: 'drop-shadow(0 0 18px rgba(255,255,255,0.8)) drop-shadow(0 0 40px rgba(255,255,255,0.4))',
      }}>
        <Canvas
          camera={{ position: [0, 0, 2.4], fov: 50 }}
          gl={{ alpha: true, antialias: true, toneMapping: THREE.NoToneMapping }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <ButterflyMesh />
          </Suspense>
        </Canvas>
      </div>
    </ErrorBoundary>
  )
}

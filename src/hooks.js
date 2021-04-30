import { useFrame } from '@react-three/fiber'
import { useEffect } from 'react'

export function useDefaultCamera(camera) {
  useEffect(() => {
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  useFrame(({ gl, scene }) => {
    gl.render(scene, camera)
  }, 1)
}

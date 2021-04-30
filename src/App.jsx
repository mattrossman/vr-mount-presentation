import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Environment, useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { css, apply } from 'twind/css'
import { styled } from '@twind/react'
import { proxy, subscribe } from 'valtio'
import { a, useTransition } from '@react-spring/web'
import * as THREE from 'three'
import { useDefaultCamera } from './hooks'

const state = proxy({
  progress: 0,
})

const overlay = apply`absolute h-screen w-screen top-0 left-0`

function Info({ start, end, ...props }) {
  const [visible, setVisible] = useState(false)
  const transition = useTransition(visible, {
    from: { position: 'fixed', width: '100%', height: '100%', opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 0 },
    config: { tension: 400 },
  })
  useEffect(() => {
    const updateVisibility = () => {
      const shouldBeVisible = start <= state.progress && state.progress < end
      if (visible != shouldBeVisible) setVisible(shouldBeVisible)
    }
    updateVisibility()
    const unsubscribe = subscribe(state, updateVisibility)
    return unsubscribe
  }, [visible])
  return transition((style, visible) => visible && <a.div style={style} {...props} />)
}

export default function App() {
  const scrollable = useRef()
  const onScroll = () => {
    const el = scrollable.current
    state.progress = el.scrollTop / (el.scrollHeight - el.offsetHeight)
  }
  useEffect(() => void onScroll(), [])
  return (
    <div tw="overflow-hidden text-white font-poppins">
      <div ref={scrollable} onScroll={onScroll} id="foo" tw={[overlay, 'z-10 overflow-y-scroll']}>
        <div tw={['relative pointer-events-none', css({ height: '10000px' })]}>
          <Info start={0} end={1 / 6 - 0.1}>
            <div tw="p-32 flex justify-between h-full">
              <div>
                <h1 tw="font-bold text(6xl primary)">Assignment 5</h1>
                <h2 tw="font-semibold text(3xl secondary)">Interactive Presentation</h2>
              </div>
              <div tw="text-right">
                <h1 tw="font-bold text(3xl primary)">Matt Rossman</h1>
                <h2 tw="font-semibold text(xl secondary)">May 2021</h2>
              </div>
            </div>
          </Info>
          <Info start={1 / 6} end={2 / 6}>
            <div tw="p-32 flex justify-between h-full">
              <h1 tw="font-bold text(6xl primary)">Design</h1>
              <div tw="text-right">
                <h1 tw="font-bold text(3xl primary)">Matt Rossman</h1>
                <h2 tw="font-semibold text(xl secondary)">May 2021</h2>
              </div>
            </div>
          </Info>
        </div>
      </div>
      <div tw={overlay}>
        <Canvas concurrent>
          <color attach="background" args={['black']} />
          <Suspense fallback={null}>
            <Model />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </div>
    </div>
  )
}

function Model() {
  const root = useRef()
  const t = useRef(0)
  const { scene, animations } = useGLTF('Assignment5.glb')
  const duration = animations.reduce((acc, clip) => Math.max(acc, clip.duration), 0) - 1e-9
  const { actions, mixer } = useAnimations(animations, root)
  useEffect(() => void Object.values(actions).forEach((action) => action.play()), [])
  useFrame(() => mixer.setTime((t.current = THREE.MathUtils.lerp(t.current, state.progress * duration, 0.1))))
  const camera = scene.getObjectByProperty('isCamera', true)
  useDefaultCamera(camera)
  return <primitive object={scene} ref={root} />
}

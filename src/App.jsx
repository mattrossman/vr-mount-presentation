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
const gradient = css`
  background: radial-gradient(rgba(0, 0, 0, 0.92), rgba(0, 0, 0, 1));
`

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

const pages = [
  <div tw="p-32 flex justify-between h-full">
    <div>
      <h1 tw="font-bold text(6xl)">Assignment 5</h1>
      <h2 tw="font-semibold text(3xl gray-400)">Interactive Presentation</h2>
    </div>
    <div tw="text-right">
      <h1 tw="font-bold text(3xl)">Matt Rossman</h1>
      <h2 tw="font-semibold text(xl gray-400)">May 2021</h2>
    </div>
  </div>,
  <div tw="p-32 flex justify-between h-full">
    <h1 tw="font-bold text(6xl)">Design</h1>
    <div tw="max-w-xl text-lg">
      The device is a mount that interfaces a standalone VR headset with an articulating monitor arm. This is is valuable for developers who
      need to rapidly switch between using a VR device and a desktop computer without repeatedly taking the headset on and off.
    </div>
  </div>,
  <div tw="p-32 flex justify-between h-full">
    <h1 tw="font-bold text(6xl)">Articulation</h1>
    <div tw="max-w-xl text-right text-lg">
      Adjust the monitor arm to place the headset comfortably in front of your face, or detach the headset entirely for room scale testing.
    </div>
  </div>,
  <div tw="p-32 flex justify-between h-full">
    <h1 tw="font-bold text(6xl)">Exploded View</h1>
    <div tw="max-w-xl">
      <p tw="text-2xl font-semibold mb-2">Meeting the 5-3-2-1 Rule:</p>
      <ul tw="list-disc text-lg">
        <li tw="ml-4">Minimum 5 parts (26 parts total)</li>
        <li tw="ml-4">Minimum 3 parts made (5 parts made)</li>
        <li tw="ml-4">Minimum 2 parts purchase (21 parts purchase)</li>
        <li tw="ml-4">1 electronic project (6 electronic parts)</li>
      </ul>
    </div>
  </div>,
  <div tw="p-32 flex justify-between h-full">
    <h1 tw="font-bold text(6xl)">Interactive</h1>
    <div tw="max-w-xl text-right font-semibold text-xl">
      Mount the headset to charge and transfer USB 2.0 data. <br />A light bar indicates the headset charge status.
    </div>
  </div>,
]

export default function App() {
  const scrollable = useRef()
  const onScroll = () => {
    const el = scrollable.current
    state.progress = el.scrollTop / (el.scrollHeight - el.offsetHeight)
  }
  useEffect(() => void onScroll(), [])
  const pageDuration = 1 / 6
  return (
    <div tw={[gradient, 'h-screen overflow-hidden text-white font-poppins']}>
      <div ref={scrollable} onScroll={onScroll} id="foo" tw={[overlay, 'z-10 overflow-y-scroll']}>
        <div tw={['relative pointer-events-none', css({ height: '20000px' })]}>
          {pages.map((page, i) => (
            <Info key={i} start={i * pageDuration} end={(i + 1) * pageDuration - pageDuration * 0.1}>
              {page}
            </Info>
          ))}
          <Info start={0.99} end={1 + 1e9}>
            <div tw="p-64 flex flex-col justify-center h-full">
              <h1 tw="text-8xl font-bold">Fin.</h1>
            </div>
          </Info>
        </div>
      </div>
      <div tw={overlay}>
        <Canvas concurrent>
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

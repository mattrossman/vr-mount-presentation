import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Environment, useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, createPortal, useFrame } from '@react-three/fiber'
import { css, apply } from 'twind/css'
import { proxy, subscribe } from 'valtio'
import { a, useTransition } from '@react-spring/web'
import * as THREE from 'three'
import { useDefaultCamera } from './hooks'
import { useLayoutEffect } from 'react'
window.THREE = THREE

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
    <div tw={['h-screen overflow-hidden text-white font-poppins bg-black']}>
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
  const light = useRef()
  const t = useRef(0)
  const { scene, nodes, animations } = useGLTF('Assignment5.glb')
  const lightWindow = nodes['Light_Window']
  const duration = animations.reduce((acc, clip) => Math.max(acc, clip.duration), 0) - 1e-9
  const { actions, mixer } = useAnimations(animations, root)
  useEffect(() => void Object.values(actions).forEach((action) => action.play()), [])
  useFrame(() => mixer.setTime((t.current = THREE.MathUtils.lerp(t.current, state.progress * duration, 0.1))))
  const camera = scene.getObjectByProperty('isCamera', true)
  useDefaultCamera(camera)
  useLayoutEffect(() => {
    lightWindow.material.transparent = true
    lightWindow.material.opacity = 0.7
    lightWindow.material.color.set(0)

    const green = [0, 1, 0]
    const red = [1, 0, 0]
    const colorTimes = [60 / 24, 61 / 24, 97 / 24, 107 / 24]
    const colorVals = [...green, ...red, ...red, ...green]
    const intensityTimes = [0, 59 / 24, 60 / 24, 89 / 24, 90 / 24]
    const intensityVals = [1, 1, 0, 0, 1]

    const clipMaterial = new THREE.AnimationClip('clipMaterial', undefined, [
      new THREE.ColorKeyframeTrack('.material.emissive', colorTimes, colorVals),
      new THREE.NumberKeyframeTrack('.material.emissiveIntensity', intensityTimes, intensityVals),
    ])
    const clipLight = new THREE.AnimationClip('clipLight', undefined, [
      new THREE.ColorKeyframeTrack('.color', colorTimes, colorVals),
      new THREE.ColorKeyframeTrack(
        '.intensity',
        intensityTimes,
        intensityVals.map((x) => x * 5)
      ),
    ])
    mixer.clipAction(clipMaterial, lightWindow).play()
    mixer.clipAction(clipLight, light.current).play()
  }, [mixer])
  return (
    <group>
      <primitive object={scene} ref={root} />
      {createPortal(<rectAreaLight position-z={-0.02} args={[undefined, undefined, 1, 0.5]} ref={light} />, lightWindow)}
    </group>
  )
}

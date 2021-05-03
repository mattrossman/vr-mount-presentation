import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Box, Environment, useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, createPortal, events, useFrame } from '@react-three/fiber'
import { css, apply } from 'twind/css'
import { proxy, subscribe, useSnapshot, ref } from 'valtio'
import { a, useTransition } from '@react-spring/web'
import * as THREE from 'three'
import { useDefaultCamera } from './hooks'
import { useLayoutEffect } from 'react'
import { ResizeObserver } from '@juggle/resize-observer'

class State {
  progress = 0
  tooltip = null
  loaded = false
  get exploded() {
    return this.progress >= 60 / 120 && this.progress < 80 / 120
  }
  get activeTooltip() {
    return this.exploded ? this.tooltip : null
  }
}

const state = proxy(new State())

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

const pageLayout = apply(
  `flex justify-between h-full`,
  css`
    padding: 5%;
    filter: drop-shadow(0px 0px 4px black);
  `
)

const pages = [
  <div tw={pageLayout}>
    <div>
      <h1 tw="font-bold text(6xl)">Assignment 5</h1>
      <h2 tw="font-semibold text(3xl gray-400)">Interactive Presentation</h2>
    </div>
    <div tw="text-right">
      <div tw="flex flex-col justify-between h-full">
        <div>
          <h1 tw="font-bold text(3xl)">Matt Rossman</h1>
          <h2 tw="font-semibold text(xl gray-400)">May 2021</h2>
        </div>
        <div tw="animate-bounce text(xl center)">
          Scroll to explore
          <br />▼
        </div>
      </div>
    </div>
  </div>,
  <div tw={pageLayout}>
    <h1 tw="font-bold text(6xl)">Design</h1>
    <div tw="max-w-xl text-lg">
      The device is a mount that interfaces a standalone VR headset with an articulating monitor arm. This is is valuable for developers who
      need to rapidly switch between using a VR device and a desktop computer without repeatedly taking the headset on and off.
    </div>
  </div>,
  <div tw={pageLayout}>
    <h1 tw="font-bold text(6xl)">Articulation</h1>
    <div tw="max-w-xl text-lg">
      Adjust the monitor arm to place the headset comfortably in front of your face, or detach the headset entirely for room scale testing.
    </div>
  </div>,
  <div tw={pageLayout}>
    <div>
      <h1 tw="font-bold text(6xl)">Exploded View</h1>
      <h2 tw="font-semibold text(2xl gray-400)">Mouse over for component labels</h2>
    </div>
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
  <div tw={pageLayout}>
    <h1 tw="font-bold text(6xl)">Interactive</h1>
    <div tw="max-w-xl text-lg">
      Mount the headset to transmit power and USB 2.0 data. <br />A colored light indicates charging progress.
    </div>
  </div>,
]

function Toolip() {
  const ref = useRef()
  useEffect(() => {
    const onMouseMove = (e) => {
      ref.current.style.left = e.x - 200 + 'px'
      ref.current.style.top = e.y + 40 + 'px'
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  })
  const snap = useSnapshot(state)
  const transition = useTransition(snap.activeTooltip, {
    from: { scale: 0, position: 'absolute' },
    enter: { scale: 1 },
    leave: { scale: 0 },
    config: { tension: 500 },
  })
  return (
    <div ref={ref} tw="fixed w-[400px] grid place-items-center">
      {transition(
        (style, tooltip) =>
          tooltip && (
            <a.span tw="bg-gray-100 text-black px-2 py-1 rounded whitespace-nowrap" style={style}>
              {tooltip}
            </a.span>
          )
      )}
    </div>
  )
}

export default function App() {
  const scrollable = useRef()
  const onScroll = () => {
    const el = scrollable.current
    const progress = el.scrollTop / (el.scrollHeight - el.offsetHeight)
    state.progress = THREE.MathUtils.clamp(progress, 0, 1)
  }
  useEffect(() => void onScroll(), [])
  const pageDuration = 1 / 6
  const snap = useSnapshot(state)
  return (
    <div tw="h-screen overflow-hidden w-full text-white font-poppins bg-black">
      <div tw={['transition-opacity', snap.loaded ? 'opacity-100' : 'opacity-0']}>
        <div ref={scrollable} onScroll={onScroll} id="foo" tw={[overlay, 'z-10 overflow-y-scroll']}>
          <div tw="relative pointer-events-none h-[15000px]">
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
          <Canvas concurrent onCreated={({ events }) => events.connect(scrollable.current)} resize={{ polyfill: ResizeObserver }}>
            <Suspense fallback={null}>
              <Model />
              <Environment files="3_panels_straight_4k.hdr" path="./" />
              <Backdrop />
            </Suspense>
          </Canvas>
        </div>
      </div>
      <div tw={['h-full transition-opacity', !snap.loaded ? 'opacity-100' : 'opacity-0']}>
        <Loading />
      </div>
      <Toolip />
    </div>
  )
}

function Loading() {
  return (
    <div tw="h-full w-full flex flex-col gap-2 justify-center items-center">
      <div
        tw={[
          'animate-spin border-4 border-gray-800 w-8 h-8 rounded-full',
          css`
            border-top-color: white;
          `,
        ]}
      />
      <p tw="animate-pulse">Loading</p>
    </div>
  )
}

function Backdrop() {
  return (
    <Box args={[100, 100, 100]} onPointerMove={() => (state.tooltip = null)}>
      <meshBasicMaterial visible={false} side={THREE.BackSide} />
    </Box>
  )
}

function Model() {
  const root = useRef()
  const light = useRef()
  const t = useRef(0)
  const { scene, nodes, animations } = useGLTF('./Assignment5.glb')
  window.nodes = nodes
  const lightWindow = nodes['Light_Window']
  const duration = animations.reduce((acc, clip) => Math.max(acc, clip.duration), 0) - 1e-9
  const { actions, mixer } = useAnimations(animations, root)
  useEffect(() => void Object.values(actions).forEach((action) => action.play()), [])
  useFrame(() => mixer.setTime((t.current = THREE.MathUtils.lerp(t.current, state.progress * duration, 0.1))))
  const camera = scene.getObjectByProperty('isCamera', true)
  useDefaultCamera(camera)
  useEffect(() => {
    const timeout = setTimeout(() => (state.loaded = true), 500)
    return () => clearTimeout(timeout)
  }, [])
  useLayoutEffect(() => {
    lightWindow.material.transparent = true
    lightWindow.material.opacity = 0.7
    lightWindow.material.color.set(0)
    lightWindow.material.roughness = 1
    lightWindow.material.metalness = 0

    const green = [0, 1, 0.1]
    const red = [1, 0, 0]
    const colorTimes = [60 / 24, 61 / 24, 95 / 24, 100 / 24]
    const colorVals = [...green, ...red, ...red, ...green]
    const intensityTimes = [0, 56 / 24, 58 / 24, 90 / 24, 91 / 24]
    const intensityVals = [1, 1, 0, 0, 1]

    const clipMaterial = new THREE.AnimationClip('clipMaterial', undefined, [
      new THREE.ColorKeyframeTrack('.material.emissive', colorTimes, colorVals, THREE.LinearInterpolant),
      new THREE.NumberKeyframeTrack(
        '.material.emissiveIntensity',
        intensityTimes,
        intensityVals.map((x) => x)
      ),
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

  const snap = useSnapshot(state)
  const onPointerMove = (e) => {
    if (state.exploded) {
      e.stopPropagation()
      let namedEl = e.intersections[0].object
      if (namedEl.name.match(/Assignment/)) namedEl = namedEl.parent
      let tooltip = namedEl.name.replace(/\d/g, '').replace(/_/g, ' ').trim()
      state.tooltip = tooltip
    }
  }
  return (
    <group>
      <primitive object={scene} ref={root} onPointerMove={snap.exploded && onPointerMove} />
      {createPortal(<rectAreaLight position-z={-0.02} args={[undefined, undefined, 1, 0.5]} ref={light} />, lightWindow)}
    </group>
  )
}

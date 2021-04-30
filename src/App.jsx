import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Environment, useAnimations, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { styled, css } from 'goober'
import { useSnapshot, proxy, subscribe } from 'valtio'
import { useScroll } from 'react-use-gesture'
import { a, useTransition } from '@react-spring/web'
import * as THREE from 'three'
import { useDefaultCamera } from './hooks'

const state = proxy({
  progress: 0,
})

const Overlay = styled('div')`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  overflow-y: scroll;
  color: white;
`

const ignorePointer = css`
  pointer-events: none;
`

const Fixed = styled('div')`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 100vw;
  pointer-events: none;
`

function Info({ start, end, ...props }) {
  const [visible, setVisible] = useState(false)
  const transition = useTransition(visible, {
    from: { position: 'absolute', width: '100%', height: '100%', opacity: 0 },
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
  const bind = useScroll(({ xy: [x, y], event: { target } }) => (state.progress = y / (target.scrollHeight - target.offsetHeight)))
  return (
    <div tw="h-screen">
      <Overlay {...bind()} id="foo">
        <div style={{ height: 10000 }} />
        <Fixed>
          <Info start={0} end={0.5}>
            <div style={{ padding: '10%' }}>
              <h1 style={{ fontSize: 48 }}>ASSIGNMENT 5</h1>
            </div>
          </Info>
        </Fixed>
      </Overlay>
      <Canvas concurrent className={ignorePointer}>
        <color attach="background" args={['black']} />
        <Suspense fallback={null}>
          <Model />
          <Environment preset="studio" />
        </Suspense>
      </Canvas>
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

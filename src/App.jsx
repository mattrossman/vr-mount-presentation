import { Suspense, useEffect, useMemo, useState } from 'react'
import { Environment, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { styled, css } from 'goober'
import { AnimationMixer } from 'three'
import { useSnapshot, proxy, subscribe } from 'valtio'
import { useScroll } from 'react-use-gesture'
import { a, useTransition } from '@react-spring/web'

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

function useCamera(root) {
  // Finds a camera in the passed hierarchy and uses it for scene rendering
  const camera = root.getObjectByProperty('isCamera', true)
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

function Model() {
  const { scene, animations } = useGLTF('Assignment5.glb')
  useCamera(scene)
  const { mixer, actions, duration } = useMemo(() => {
    const mixer = new AnimationMixer(scene)
    const actions = animations.map((clip) => mixer.clipAction(clip))
    actions.forEach((action) => {
      action.play()
      action.clampWhenFinished = true
    })
    const duration = animations.reduce((acc, clip) => Math.max(acc, clip.duration), 0) - 1e-9
    return { mixer, actions, duration }
  }, [animations])
  subscribe(state, () => {
    mixer.setTime(state.progress * duration)
  })
  return <primitive object={scene} />
}

import { Suspense, useEffect, useMemo } from 'react'
import { Environment, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { styled, css } from 'goober'
import { AnimationMixer } from 'three'
import { useSnapshot, proxy, subscribe } from 'valtio'
import { useScroll } from 'react-use-gesture'

const state = proxy({
  progress: 0,
})

const Wrapper = styled('div')`
  height: 100%;
  font-family: sans-serif;
`

const Overlay = styled('div')`
  position: absolute;
  height: 100%;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 1;
  overflow-y: scroll;
`

const Chunk = styled('div')`
  height: 100vh;
  width: 100%;
  margin-bottom: 50%;
  display: grid;
  place-content: center;
  font-weight: bold;
`

const ignorePointer = css`
  pointer-events: none;
`

export default function App() {
  const bind = useScroll(({ xy: [x, y], event: { target } }) => (state.progress = y / (target.scrollHeight - target.offsetHeight)))
  return (
    <Wrapper>
      <Overlay {...bind()} id="foo">
        <Chunk>
          <h1>Hello</h1>
        </Chunk>
        <Chunk>
          <h1>World.</h1>
        </Chunk>
        <Chunk>
          <h1>asdf.</h1>
        </Chunk>
      </Overlay>
      <Canvas concurrent className={ignorePointer}>
        <Suspense fallback={null}>
          <Model />
          <Environment preset="warehouse" />
        </Suspense>
      </Canvas>
    </Wrapper>
  )
}

function useCamera(root) {
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
  const { scene, animations } = useGLTF('animation.glb')
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

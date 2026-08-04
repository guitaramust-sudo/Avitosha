import {
  AnimatedSprite,
  Application,
  Assets,
  Sprite,
  type Texture,
} from 'pixi.js'
import { useEffect, useRef } from 'react'

import './Character.scss'

const frameModules = import.meta.glob<string>(
  '../../../images/Avitosha/*/*.png',
  {
    eager: true,
    import: 'default',
    query: '?url',
  },
)

const getAnimationFrames = (animation: string) =>
  Object.entries(frameModules)
    .filter(([path]) => path.includes(`/${animation}/`))
    .sort(([firstPath], [secondPath]) => {
      const firstFrame = Number(firstPath.match(/(\d+)\.png$/)?.[1] ?? 0)
      const secondFrame = Number(secondPath.match(/(\d+)\.png$/)?.[1] ?? 0)

      return firstFrame - secondFrame
    })
    .map(([, url]) => url)

interface AnimationDefinition {
  frames: string[]
  playback: 'frames' | 'procedural'
}

const animations: Record<'idle', AnimationDefinition> = {
  idle: {
    frames: getAnimationFrames('idle'),
    playback: 'procedural',
  },
}

export type CharacterAnimation = keyof typeof animations

interface CharacterProps {
  animation?: CharacterAnimation
  animationSpeed?: number
}

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 480

function Character({
  animation = 'idle',
  animationSpeed = 0.12,
}: CharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    let application: Application | undefined
    let disposed = false

    const initialize = async () => {
      const nextApplication = new Application()

      try {
        await nextApplication.init({
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio, 2),
        })

        if (disposed) {
          nextApplication.destroy({ removeView: true }, { children: true })
          return
        }

        application = nextApplication
        nextApplication.canvas.setAttribute('aria-label', 'Персонаж Авитоша')
        nextApplication.canvas.setAttribute('role', 'img')
        container.appendChild(nextApplication.canvas)

        const definition = animations[animation]
        const textures = await Promise.all(
          definition.frames.map((url) => Assets.load<Texture>(url)),
        )

        if (disposed) {
          return
        }

        const character =
          definition.playback === 'frames'
            ? new AnimatedSprite({
                textures,
                animationSpeed,
                autoPlay: true,
                loop: true,
              })
            : new Sprite(textures[0])
        const baseScale =
          Math.min(
            CANVAS_WIDTH / character.texture.width,
            CANVAS_HEIGHT / character.texture.height,
          ) * 1.03

        character.anchor.set(0.5)
        character.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        character.scale.set(baseScale)
        nextApplication.stage.addChild(character)

        if (definition.playback === 'procedural') {
          let elapsed = 0

          nextApplication.ticker.add((ticker) => {
            elapsed += ticker.deltaMS / 1000

            const breath = Math.sin((elapsed * Math.PI * 2) / 3.2)
            const sway = Math.sin((elapsed * Math.PI * 2) / 5.4)

            character.scale.set(
              baseScale * (1 + breath * 0.004),
              baseScale * (1 + breath * 0.008),
            )
            character.position.y = CANVAS_HEIGHT / 2 + breath * 1.5
            character.rotation = sway * 0.002
          })
        }
      } catch (error) {
        if (!disposed) {
          console.error('Не удалось загрузить анимацию персонажа', error)
          nextApplication.destroy({ removeView: true }, { children: true })
          application = undefined
        }
      }
    }

    void initialize()

    return () => {
      disposed = true
      application?.destroy({ removeView: true }, { children: true })
    }
  }, [animation, animationSpeed])

  return <div className="character" ref={containerRef} />
}

export default Character

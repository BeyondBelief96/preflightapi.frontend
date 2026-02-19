import { useEffect, useRef, useState } from 'react'

interface UseTypingEffectOptions {
  text: string
  speed?: number
}

export function useTypingEffect({ text, speed = 20 }: UseTypingEffectOptions) {
  const [displayedText, setDisplayedText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Respect prefers-reduced-motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      setDisplayedText(text)
      setIsComplete(true)
      return
    }

    setDisplayedText('')
    setIsComplete(false)
    let index = 0
    let lastTime = 0

    function step(time: number) {
      if (!lastTime) lastTime = time
      if (time - lastTime >= speed) {
        index++
        setDisplayedText(text.slice(0, index))
        lastTime = time
        if (index >= text.length) {
          setIsComplete(true)
          return
        }
      }
      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [text, speed])

  return { displayedText, isComplete }
}

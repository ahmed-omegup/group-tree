import { useRef } from 'react'

export const useHasBeenVisible = (isVisible: boolean) => {
  const hasBeenVisibleRef = useRef(isVisible)
  if (isVisible) hasBeenVisibleRef.current = true
  return hasBeenVisibleRef.current
}

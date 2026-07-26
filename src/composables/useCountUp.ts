import { ref, watch } from 'vue'

export function useCountUp(sourceValue: () => number, durationMs = 1000) {
  const displayValue = ref(sourceValue())

  watch(sourceValue, (newVal, oldVal) => {
    if (newVal === oldVal) return
    const startTime = performance.now()
    const startVal = displayValue.value
    
    const animate = (time: number) => {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / durationMs, 1)
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      
      displayValue.value = Math.floor(startVal + (newVal - startVal) * ease)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        displayValue.value = newVal
      }
    }
    requestAnimationFrame(animate)
  })

  return displayValue
}

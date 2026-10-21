import { useEffect, useRef, useState } from 'react'

/**
 * Estado de visibilidad de un elemento respecto al viewport.
 *
 * La página monta muchos lienzos WebGL (la escena grande y uno por cada
 * tarjeta). Mantenerlos todos vivos con su contexto de GPU es lo que
 * hace que la página «se trabe»: son decenas de contextos y capas que el
 * compositor tiene que combinar en cada fotograma.
 *
 * El hook avisa de dos cosas:
 *
 *  · `visible` → el elemento está en pantalla (sirve para **pausar** el bucle
 *    de render de las escenas animadas).
 *  · `near`    → el elemento está cerca del viewport (sirve para **montar o
 *    desmontar** el lienzo). Hay dos márgenes distintos para que el lienzo no
 *    se monte y desmonte continuamente al hacer scroll.
 */

/** Margen (px) para empezar a montar un lienzo. */
const MOUNT_MARGIN = 700
/** Margen (px) a partir del cual se desmonta y se libera el contexto. */
const UNMOUNT_MARGIN = 1200

export function useViewport<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [state, setState] = useState({ visible: false, near: false })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    let timer = 0

    const update = () => {
      const rect = element.getBoundingClientRect()
      const height = window.innerHeight || 1
      const visible = rect.bottom > 0 && rect.top < height

      setState((current) => {
        const near = current.near
          ? // ya montado: se mantiene hasta que esté muy lejos
            !(rect.bottom < -UNMOUNT_MARGIN && rect.top > height + UNMOUNT_MARGIN)
          : // todavía no montado: se monta al acercarse
            rect.bottom > -MOUNT_MARGIN && rect.top < height + MOUNT_MARGIN

        if (visible === current.visible && near === current.near) return current
        return { visible, near }
      })
    }

    // Se usa un temporizador y no `requestAnimationFrame`: en una pestaña
    // oculta el navegador congela los fotogramas y los lienzos nunca se
    // montarían. Comprobar cada 90 ms es imperceptible y mucho más barato.
    const schedule = () => {
      if (timer) return
      timer = window.setTimeout(() => {
        timer = 0
        update()
      }, 90)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return { ref, visible: state.visible, near: state.near }
}

/**
 * `true` cuando la pestaña está a la vista. En segundo plano el navegador
 * congela el `requestAnimationFrame`, pero conviene detener también el bucle
 * de render para no dejar la GPU ocupada.
 */
export function useDocumentVisible() {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  )

  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])

  return visible
}

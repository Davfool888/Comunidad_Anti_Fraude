import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css'
import App from './App.tsx'

/**
 * Sonda de desarrollo (`?probe`): en entornos sin ventana visible el
 * navegador congela los `ResizeObserver` y los lienzos 3D nunca se montan.
 * Con este parche se les da un tamaño inicial para poder inspeccionar la
 * escena desde la consola. Sólo actúa en desarrollo.
 */
if (import.meta.env.DEV && location.search.includes('probe')) {
  const Native = window.ResizeObserver
  class ProbeResizeObserver extends Native {
    callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      super(callback)
      this.callback = callback
    }
    observe(target: Element) {
      super.observe(target)
      const rect = target.getBoundingClientRect()
      this.callback(
        [
          {
            target,
            contentRect: {
              width: rect.width || 900,
              height: rect.height || 600,
              top: 0,
              left: 0,
            } as DOMRectReadOnly,
          } as unknown as ResizeObserverEntry,
        ],
        this,
      )
    }
  }
  window.ResizeObserver = ProbeResizeObserver as unknown as typeof ResizeObserver
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

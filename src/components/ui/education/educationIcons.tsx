/**
 * Iconos del Centro Educativo.
 *
 * Son formas simples y neutras: no reproducen logotipos de entidades reales
 * para que ninguna ilustración pueda confundirse con una comunicación real.
 */

export const educationIcons: Record<string, React.ReactNode> = {
  mail: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.4l8 5.2 8-5.2V6H4Zm16 12V8.9l-7.2 4.7a1 1 0 0 1-1.1 0L4 8.9V18h16Z" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2Zm2 4v2h12V7H6Zm0 4v2h8v-2H6Z" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3 6v2h18V6l-9-4ZM4 10v8H2v2h20v-2h-2v-8h-2v8h-3v-8h-2v8H9v-8H7v8H4v-8H2v8h2v-8h2v8h2v-8h2v8h2v-8h2v8h2v-8h-2v8h-2v-8h-2v8h-3v-8h-2v8H4v-8H2v8h2v-8Z" />
    </svg>
  ),
  receipt: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2V2Zm3 5v2h6V7H9Zm0 4v2h6v-2H9Z" />
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M3 3h2.2l2.3 11.4A2 2 0 0 0 9.5 16h7.9a2 2 0 0 0 2-1.6L21 7H6.4l.5 2.5H21l-1.6 7H9.5L7.2 5H3V3Zm6 15.5A1.8 1.8 0 1 1 9 18.3a1.8 1.8 0 0 1 0-.1Zm8 0a1.8 1.8 0 1 1-1.8 1.8 1.8 1.8 0 0 1 1.8-1.8Z" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4V4Zm2 0v2h2V4h-2Zm-6 6v2h14v-2H5Z" />
    </svg>
  ),
  key: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M14 2a6 6 0 0 0-5.7 8L2 16.3V22h5.7l1.3-1.3V19H11v-2h1.7l1.6-1.6A6 6 0 1 0 14 2Zm2.5 4.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </svg>
  ),
  link: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M10.6 13.4a1 1 0 0 0 1.4 0l3.6-3.6a3 3 0 0 0-4.2-4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 0 1 1.4 1.4l-3.6 3.6a1 1 0 0 0 0 1.4Zm2.8-2.8a1 1 0 0 0-1.4 0L8.4 14.2a1 1 0 0 1-1.4-1.4l3.6-3.6 1.4 1.4 1.5-1.5a3 3 0 0 0-4.2 4.2l-1.5 1.5 1.4 1.4 1.5-1.5a1 1 0 0 0 0 0Z" />
    </svg>
  ),
}

/** Iconos de la interfaz del centro (retroalimentación, progreso). */
export const educationUi = {
  check: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7 9.5 16.2Z" />
    </svg>
  ),
  cross: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 5.7 18.3 4.3 16.9 10.6 12 4.3 5.7 5.7 4.3 12 10.6l6.3-6.3 1.4 1.4Z" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M13.2 5.6 11.8 7l4 4H4v2h11.8l-4 4 1.4 1.4L19.8 12l-6.6-6.4Z" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M10.8 5.6 12.2 7l-4 4H20v2H8.2l4 4-1.4 1.4L4.2 12l6.6-6.4Z" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Zm-3 18h6v1H9v-1Z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3.5 5.4v6.1c0 4.6 3.7 9 8.5 10.5 4.8-1.5 8.5-5.9 8.5-10.5V5.4L12 2Zm-1.1 12.4-4-4 1.4-1.4 2.6 2.6 5.8-5.8 1.4 1.4-7.2 7.2Z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h-2V6h2v7Z" />
    </svg>
  ),
  flame: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2s1 3-1.5 5.5C8 10 7 11.5 7 14a5 5 0 0 0 10 0c0-1.8-.8-3.2-2-4.5.2 1.3-.5 2.2-1.2 2.5.6-2.3-.3-5.5-1.8-10Z" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10h-2a8 8 0 1 1-8-8V2Zm0 4a6 6 0 1 0 6 6h-2a4 4 0 1 1-4-4V6Zm1-4v5h4V2h-4Z" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M4 3h11a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H4V3Zm2 2v11h10a5 5 0 0 1 3 1V7a2 2 0 0 0-2-2H6Z" />
    </svg>
  ),
}

/**
 * Iconos del Centro de aprendizaje.
 *
 * Formas simples y neutras: no reproducen logotipos de entidades reales para
 * que ninguna ilustracion pueda confundirse con una comunicacion autentica.
 */

export const learningIcons: Record<string, React.ReactNode> = {
  detective: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M13.5 4a4.5 4.5 0 0 1 4.3 3.2l3.2 1.4-2.3 1.2-.6 3.6-2.2 1.1-.5 2.2-2.2-.4-1.6 1.5-1.5-1.6-2.2.5-1.1 2.2-3.6-.6L4.1 20l1.4-3.2A4.5 4.5 0 0 1 8 12a4.5 4.5 0 0 1 4.5-4.5V4Z" />
    </svg>
  ),
  branch: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M6 3a3 3 0 0 1 1 5.8V13a3 3 0 0 0 3 3h4.2A3 3 0 1 1 13 18h-3a5 5 0 0 1-5-5V8.8A3 3 0 0 1 6 3Zm12 12a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
    </svg>
  ),
  compare: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M11 3h2v18h-2V3ZM5 7h4v2H5V7Zm0 4h6v2H5v-2Zm0 4h4v2H5v-2Zm10-8h4v2h-4V7Zm0 4h6v2h-6v-2Zm0 4h4v2h-4v-2Z" />
    </svg>
  ),
  lab: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M9 2h6v2h-1v5.2l4.8 8.1A2 2 0 0 1 17 21H7a2 2 0 0 1-1.8-2.7L10 9.2V4H9V2Zm3 2v5.8L9.6 13h4.8L12 9.8V4h-3Z" />
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 11h-2V6h2v7Z" />
    </svg>
  ),
  scale: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 0 1 9 9h-2a7 7 0 1 0-14 0H3a9 9 0 0 1 9-9Zm0 2.2A6.8 6.8 0 0 0 5.2 12H12V5.2Zm0 11.6A6.8 6.8 0 0 0 18.8 12H12v4.8Z" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3.5 5.4v6.1c0 4.6 3.7 9 8.5 10.5 4.8-1.5 8.5-5.9 8.5-10.5V5.4L12 2Zm-1.1 12.4-4-4 1.4-1.4 2.6 2.6 5.8-5.8 1.4 1.4-7.2 7.2Z" />
    </svg>
  ),
  plan: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M9 3h11a2 2 0 0 1 2 2v11h-2V5H9V3Zm-2 4h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Zm0 2v10h9V9H7Z" />
    </svg>
  ),
  bulb: (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Zm-3 18h6v1H9v-1Z" />
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
  mail: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.4l8 5.2 8-5.2V6H4Zm16 12V8.9l-7.2 4.7a1 1 0 0 1-1.1 0L4 8.9V18h16Z" />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2Z" />
    </svg>
  ),
  bank: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 2 3 6v2h18V6l-9-4ZM4 10v8H2v2h20v-2h-2v-8h-2v8h-3v-8h-2v8H9v-8H7v8H4v-8H2v8h2v-8Z" />
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
  chart: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M4 20V10h4v10H4Zm6 0V4h4v16h-4Zm6 0v-7h4v7h-4Z" />
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
  user: (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z" />
    </svg>
  ),
}

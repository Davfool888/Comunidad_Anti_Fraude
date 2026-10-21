import { palette } from '../../lib/palette'

/** Isotipo: escudo blanco con check morado + wordmark en dos líneas. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg width="36" height="40" viewBox="0 0 34 38" fill="none" aria-hidden="true">
        <path
          d="M17 1.4 32.2 6.1v11.5c0 9.3-6.4 16.8-15.2 20.1C8.2 34.4 1.8 26.9 1.8 17.6V6.1L17 1.4Z"
          fill="#ffffff"
        />
        <path
          d="M17 5.6 28.1 9v8.6c0 6.9-4.6 12.4-11.1 14.9-6.5-2.5-11.1-8-11.1-14.9V9L17 5.6Z"
          fill={palette.grape700}
          opacity="0.14"
        />
        <path
          d="m10.9 18.3 4.4 4.5 8.5-9.1"
          stroke={palette.grape700}
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[15px] font-extrabold leading-[1.08] tracking-tight text-white">
        Escudo
        <br />
        Comunitario
      </span>
    </div>
  )
}

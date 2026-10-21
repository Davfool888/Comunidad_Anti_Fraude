/**
 * Paleta central de la marca. Solo estilos: ningún componente usa lógica con estos valores.
 * Escala azul-violeta con acentos verde (verificado) y cian (neón).
 */
export const palette = {
  ink: '#1c2b52',
  plum900: '#16224a',
  plum800: '#1e2c5c',
  plum700: '#33447e',
  grape900: '#3a3f8f',
  grape700: '#5b63d8',
  grape600: '#6a76e6',
  grape500: '#7b8bff',
  grape400: '#9db0ff',
  grape300: '#c3d1ff',
  grape200: '#e2e9ff',
  magenta: '#c026d3',
  neon300: '#9defff',
  neon400: '#5fe4ff',
  neon500: '#22b6e6',
  lime300: '#8bf0c9',
  lime400: '#57e3b0',
  lime500: '#2fc98f',
  lime600: '#1fae78',
  lime700: '#12885e',
  gold300: '#fcd34d',
  gold400: '#fbbf24',
  gold500: '#f59e0b',
  cream50: '#f8fbff',
  cream100: '#eef4fd',
  cream200: '#dfe9fb',
  mint50: '#f1fbff',
  mint100: '#dff5fd',
  mint200: '#c5ecfb',
  white: '#ffffff',
} as const

/** Sombreado de texto igual al degradado de la ilustración 3D. */
export const headingGradient =
  'linear-gradient(100deg, #ffffff 0%, #eef4ff 45%, #c3d1ff 100%)'

export const buttonGradient = 'linear-gradient(100deg, #57e3b0 0%, #2fc98f 100%)'

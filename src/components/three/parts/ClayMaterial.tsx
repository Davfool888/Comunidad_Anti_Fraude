import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { palette } from '../../../lib/palette'
import { getGrainTexture, getRadialTexture } from './textures'

/**
 * Material "clay": plástico suave tipo plastilina con acabado pulido.
 * `grain` añade micro-textura al mapa de rugosidad (reflejos realistas),
 * `anisotropy` da el brillo direccional tipo metal pulido.
 */
export type ClayPreset =
  | 'purple'
  | 'purpleDeep'
  | 'purpleLight'
  | 'pink'
  | 'lime'
  | 'limeDeep'
  | 'white'
  | 'ink'
  | 'screen'

const presets: Record<
  ClayPreset,
  { color: string; roughness: number; clearcoat: number; metalness?: number }
> = {
  purple: { color: palette.grape700, roughness: 0.34, clearcoat: 0.7 },
  purpleDeep: { color: palette.plum800, roughness: 0.4, clearcoat: 0.6 },
  purpleLight: { color: palette.grape400, roughness: 0.33, clearcoat: 0.7 },
  pink: { color: '#ff8fb4', roughness: 0.38, clearcoat: 0.5 },
  lime: { color: palette.lime500, roughness: 0.32, clearcoat: 0.7 },
  limeDeep: { color: palette.lime700, roughness: 0.36, clearcoat: 0.65 },
  white: { color: '#f8fbff', roughness: 0.38, clearcoat: 0.45 },
  ink: { color: palette.ink, roughness: 0.5, clearcoat: 0.35 },
  screen: { color: palette.plum900, roughness: 0.22, clearcoat: 0.85 },
}

export function ClayMaterial({
  preset = 'purple',
  vertexColors = false,
  grain = true,
  anisotropy = 0,
  ...rest
}: {
  preset?: ClayPreset
  vertexColors?: boolean
  grain?: boolean
  anisotropy?: number
  roughness?: number
  clearcoat?: number
  metalness?: number
}) {
  const { color, roughness, clearcoat, metalness = 0 } = presets[preset]
  const grainMap = grain ? getGrainTexture() : undefined

  return (
    <meshPhysicalMaterial
      color={color}
      vertexColors={vertexColors}
      roughnessMap={grainMap}
      anisotropy={anisotropy}
      roughness={rest.roughness ?? roughness}
      clearcoat={rest.clearcoat ?? clearcoat}
      clearcoatRoughness={0.22}
      metalness={rest.metalness ?? metalness}
      sheen={0.3}
      sheenColor={palette.grape300}    />
  )
}

/**
 * Halo suave dentro de la escena 3D (mezcla aditiva).
 * Aporta el resplandor neón que_depth en el diseño de referencia.
 */
export function SoftGlow({
  position = [0, 0, 0],
  scale = 1,
  color = palette.lime500,
  opacity = 0.55,
  aspect = 1,
}: {
  position?: [number, number, number]
  scale?: number
  color?: string
  opacity?: number
  aspect?: number
}) {
  const map = useMemo(() => getRadialTexture(), [])
  return (
    <mesh position={position} scale={[scale * aspect, scale, 1]} dispose={null}>
      <planeGeometry args={[2, 2]} />
      <meshBasicMaterial
        map={map}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

/**
 * Base de vidrio: repisa translúcida con tinte lima bajo los iconos.
 * Sólo estilo: no tiene estado ni interacción.
 */
export function GlassBase({
  position = [0, -0.82, 0],
  width = 1.5,
  depth = 0.9,
  color = palette.lime400,
  opacity = 0.16,
}: {
  position?: [number, number, number]
  width?: number
  depth?: number
  color?: string
  opacity?: number
}) {
  return (
    <group position={position}>
      <RoundedBox args={[width, 0.05, depth]} radius={0.025} smoothness={4}>
        <meshPhysicalMaterial
          color={color}
          roughness={0.06}
          metalness={0.05}
          transparent
          opacity={opacity}
          clearcoat={1}
          clearcoatRoughness={0.05}
        />
      </RoundedBox>
      {/* reflejo especular sobre el vidrio */}
      <SoftGlow
        position={[0, 0.04, 0]}
        scale={depth * 0.6}
        aspect={width / depth}
        color="#ffffff"
        opacity={0.34}
      />
    </group>
  )
}

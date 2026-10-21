import { useMemo } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { iso } from './palette'

/**
 * Suelo de la escena.
 *
 * La retícula no es una textura: se calcula en el fragment shader inyectado
 * en un `MeshStandardMaterial` (así el suelo sigue recibiendo sombras). El
 * degradado radial desvanece el azul a blanco y las juntas se dibujan con
 * líneas finas y suaves, no con un marco grueso.
 *
 * La losa es muy ancha a propósito: sus bordes quedan fuera del encuadre y
 * la bruma los disuelve, de modo que la rejilla parece infinita.
 */

/** Lado de una azuleja en unidades de mundo. */
export const TILE_SIZE = 4.8
/** Lado del suelo (25 × 25 azulejas). */
const GROUND_SIZE = TILE_SIZE * 25

/** Semiancho de la junta, en fracciones de azulejo. */
const LINE_HALF_WIDTH = 0.0095

function useGroundMaterial() {
  return useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.86,
      metalness: 0,
    })

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTile = { value: TILE_SIZE }
      shader.uniforms.uBase = { value: new THREE.Color('#f7fbff') }
      shader.uniforms.uTint = { value: new THREE.Color('#c6d9fa') }
      shader.uniforms.uLine = { value: new THREE.Color('#7ba4e8') }
      shader.uniforms.uCool = { value: new THREE.Color('#a9c8f4') }
      shader.uniforms.uWarm = { value: new THREE.Color('#c7b2f0') }
      shader.uniforms.uRadius = { value: 30 }

      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nout vec2 vGridPos;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n  vGridPos = position.xy;',
        )

      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          in vec2 vGridPos;
          uniform float uTile;
          uniform vec3 uBase;
          uniform vec3 uTint;
          uniform vec3 uLine;
          uniform vec3 uCool;
          uniform vec3 uWarm;
          uniform float uRadius;

          /** Junta de la retícula: línea fina con bordes suaves. */
          float nsGridLine(vec2 p, float size, float halfWidth) {
            vec2 cell = abs(fract(p / size - 0.5) - 0.5);
            float d = min(cell.x, cell.y);
            return 1.0 - smoothstep(0.0, halfWidth, d);
          }`,
        )
        .replace(
          '#include <map_fragment>',
          `
          {
            vec2 gp = vGridPos;

            // tinte direccional: azul arriba-izquierda → lavanda abajo-derecha
            float grad = clamp((gp.x - gp.y) / 48.0 + 0.5, 0.0, 1.0);
            vec3 wash = mix(uCool, uWarm, grad);

            // cada azulejo va partido en dos: mitad blanca y mitad azulada
            vec2 local = fract(gp / uTile) - 0.5;
            float diagonal = smoothstep(-0.06, 0.06, local.x + local.y);
            vec3 lightHalf = mix(uBase, wash, 0.22);
            vec3 darkHalf = mix(uTint, wash, 0.3);
            vec3 base = mix(darkHalf, lightHalf, diagonal);

            // gradiente radial: los bordes se desvanecen hacia el blanco
            float falloff = 1.0 - smoothstep(0.55, 1.0, length(gp) / uRadius);
            vec3 ground = mix(vec3(1.0), base, falloff);

            // juntas azules marcadas
            float line = nsGridLine(gp, uTile, ${LINE_HALF_WIDTH.toFixed(4)});
            ground = mix(ground, uLine, line * 0.72 * falloff);

            diffuseColor.rgb *= ground;
          }`,
        )
    }

    // fuerza la recompilación cuando cambian los uniformes
    material.customProgramCacheKey = () => 'ns-ground-grid'

    return material
  }, [])
}

/** Small raised slabs scattered over the grid: they break the monotony
 *  and give the plane a sense of scale, as in the reference. */
const DECOR_TILES: { position: [number, number, number]; size: number; accent: string }[] = [
  { position: [1.1, 0, 9.4], size: 2.1, accent: iso.neonCyanDeep },
  { position: [-4.6, 0, 10.2], size: 1.6, accent: iso.platformEdge },
  { position: [8.6, 0, 4.2], size: 1.7, accent: iso.platformEdge },
  { position: [-11.4, 0, -4.8], size: 1.5, accent: iso.platformEdge },
  { position: [4.9, 0, -9.4], size: 1.9, accent: iso.platformEdge },
]

/**
 * Vegetación suelta sobre la rejilla: matas, arbustos y florecillas.
 * Rompen la superficie del suelo y dan escala a la escena.
 */
const GROUND_PLANTS: {
  position: [number, number, number]
  kind: 'tuft' | 'bush' | 'flowers'
  scale: number
}[] = [
  { position: [-6.6, 0, 3.4], kind: 'tuft', scale: 1.2 },
  { position: [-1.9, 0, 4.6], kind: 'flowers', scale: 1 },
  { position: [2.9, 0, 2.4], kind: 'bush', scale: 0.8 },
  { position: [3.6, 0, -3.6], kind: 'tuft', scale: 1.1 },
  { position: [-4.6, 0, -4.4], kind: 'flowers', scale: 1.1 },
  { position: [7.6, 0, 2.4], kind: 'bush', scale: 0.9 },
  { position: [-9.2, 0, -3.4], kind: 'tuft', scale: 1 },
  { position: [0.6, 0, 7.6], kind: 'flowers', scale: 1.15 },
  { position: [-7.2, 0, 7.1], kind: 'tuft', scale: 1.25 },
  { position: [5.6, 0, -7.2], kind: 'bush', scale: 0.85 },
  { position: [9.2, 0, -1.2], kind: 'flowers', scale: 1 },
  { position: [-3.2, 0, 10.4], kind: 'tuft', scale: 1.3 },
  { position: [10.4, 0, 6.2], kind: 'tuft', scale: 1.15 },
  { position: [-11.4, 0, 1.4], kind: 'flowers', scale: 1.05 },
  { position: [2.2, 0, -10.6], kind: 'tuft', scale: 1.1 },
  { position: [-13.4, 0, -0.4], kind: 'bush', scale: 0.75 },
]

/** Vegetación suelta repartida por el suelo. */
function GroundDetails() {
  return (
    <group>
      {GROUND_PLANTS.map((plant, index) => {
        const [x, y, z] = plant.position
        if (plant.kind === 'bush') {
          return (
            <group key={index} position={[x, y, z]} scale={plant.scale}>
              <mesh position={[0, 0.15, 0]}>
                <sphereGeometry args={[0.25, 14, 10]} />
                <meshStandardMaterial color={iso.leafDark} roughness={0.86} />
              </mesh>
              <mesh position={[0.13, 0.1, 0.05]} scale={[0.68, 0.68, 0.68]}>
                <sphereGeometry args={[0.25, 12, 9]} />
                <meshStandardMaterial color={iso.leafMid} roughness={0.86} />
              </mesh>
            </group>
          )
        }
        if (plant.kind === 'flowers') {
          return (
            <group key={index} position={[x, y, z]} scale={plant.scale}>
              {[0, 1, 2].map((blade) => (
                <mesh
                  key={blade}
                  position={[blade * 0.07 - 0.07, 0.09, blade * 0.05 - 0.05]}
                  rotation={[0, 0, (blade - 1) * 0.4]}
                >
                  <coneGeometry args={[0.03, 0.27, 6]} />
                  <meshStandardMaterial color={iso.leafMid} roughness={0.9} />
                </mesh>
              ))}
              {[
                { p: [-0.05, 0.2, 0.02], c: '#ffb3d1' },
                { p: [0.06, 0.22, -0.03], c: '#ffe08a' },
                { p: [0.01, 0.19, 0.06], c: '#ffffff' },
              ].map((flower, i) => (
                <mesh key={i} position={flower.p as [number, number, number]}>
                  <sphereGeometry args={[0.045, 10, 8]} />
                  <meshStandardMaterial color={flower.c} roughness={0.6} />
                </mesh>
              ))}
            </group>
          )
        }
        return (
          <group key={index} position={[x, y, z]} scale={plant.scale}>
            {[
              { x: 0, z: 0, r: 0.16, h: 0.28 },
              { x: 0.07, z: 0.05, r: -0.3, h: 0.21 },
              { x: -0.06, z: 0.06, r: 0.35, h: 0.24 },
            ].map((blade, i) => (
              <mesh key={i} position={[blade.x, blade.h / 2, blade.z]} rotation={[0, 0, blade.r]}>
                <coneGeometry args={[0.025, blade.h, 6]} />
                <meshStandardMaterial color={iso.leafLight} roughness={0.9} />
              </mesh>
            ))}
          </group>
        )
      })}
    </group>
  )
}

export function Ground() {
  const material = useGroundMaterial()

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow material={material}>
        <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
      </mesh>

      {/* Vegetación suelta repartida por el suelo. */}
      <GroundDetails />

      {/* Small raised slabs scattered over the grid: they break the monotony
          and give the plane a sense of scale, as in the reference. */}
      {DECOR_TILES.map((tile) => (
        <group key={`${tile.position[0]}-${tile.position[2]}`} position={tile.position}>
          <RoundedBox args={[tile.size, 0.16, tile.size]} radius={0.1} smoothness={4} position={[0, 0.08, 0]}>
            <meshStandardMaterial color={iso.platform} roughness={0.6} />
          </RoundedBox>
          <RoundedBox args={[tile.size - 0.3, 0.08, tile.size - 0.3]} radius={0.06} smoothness={3} position={[0, 0.18, 0]}>
            <meshStandardMaterial color={tile.accent} roughness={0.5} />
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

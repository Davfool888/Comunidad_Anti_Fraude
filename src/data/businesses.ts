/**
 * Catálogo de comercios de la red.
 *
 * Cada barrio tiene sus propios comercios: la misma red de ciudad pero con
 * negocios distintos en cada comunidad. El tipo de negocio determina el
 * rótulo de neón y el **edificio 3D** que lo representa (ver
 * `three/network/arrangement.ts`).
 */

export type BusinessTemplate = {
  /** Tipo de negocio: "Panadería", "Farmácia"… */
  kind: string
  /** Rótulo grande del cartel de neón. */
  label: string
  /** Nombres posibles del comercio. */
  names: string[]
}

export const BUSINESS_CATALOG: BusinessTemplate[] = [
  {
    kind: 'Panadería',
    label: 'PANADERÍA',
    names: ['Panadería La Espiga', 'Panadería El Trigal', 'Panadería Doña Rosa'],
  },
  {
    kind: 'Farmácia',
    label: 'FARMACIA',
    names: ['Farmacia San Juan', 'Farmacia La Salud', 'Farmacia Santa Clara'],
  },
  {
    kind: 'Mercado',
    label: 'MERCADO',
    names: ['Mercado El Progreso', 'Supermercado La Esquina', 'Mercado Don Pedro'],
  },
  {
    kind: 'Eletrônicos',
    label: 'ELECTRÓNICA',
    names: ['Tecno Bogotá', 'Electro Hogar', 'Mundo Digital'],
  },
  {
    kind: 'Loja de Roupas',
    label: 'MODA',
    names: ['Boutique Loto', 'Moda Sema', 'Tienda Niza'],
  },
  {
    kind: 'Consultório',
    label: 'SERVICIOS',
    names: ['Consultorio Serra', 'Centro Médico Nueva Vida', 'Fisioterapia Vital'],
  },
  {
    kind: 'Floricultura',
    label: 'FLORISTERÍA',
    names: ['Floricultura Girasol', 'Jardín de Pétalos', 'Floristería María'],
  },
  {
    kind: 'Livraria',
    label: 'LIBRERÍA',
    names: ['Livraria El Lector', 'Librería Nacional', 'Libros y Cía'],
  },
  {
    kind: 'Cafetería',
    label: 'CAFETERÍA',
    names: ['Cafetería El Rincón', 'Café de Origen', 'Punto Café'],
  },
  {
    kind: 'Petshop',
    label: 'PETS & CUIDADO',
    names: ['Petshop Patitas', 'Mascotas Felices', 'Pet Shop Luna'],
  },
  {
    kind: 'Óptica',
    label: 'ÓPTICA',
    names: ['Óptica Visión', 'Lentes & Vistas', 'Centro Visual'],
  },
  {
    kind: 'Papelaria',
    label: 'PAPELERÍA',
    names: ['Papelería Arcoíris', 'Suministros Escolar', 'Copistería Unión'],
  },
]

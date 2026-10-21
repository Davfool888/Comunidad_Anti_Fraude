/**
 * Comunidades de barrio dentro de cada localidad de Bogotá.
 *
 * Fuente oficial: Secretaría Distrital de Planeación / Catastro Distrital.
 * Cada punto es un barrio (o sector) de la localidad; el tamaño del punto
 * es proporcional a la superficie y hay entre 4 y 10 por localidad,
 * repartidos con muestreo por punto más alejado.
 *
 * Generado automáticamente; no editar a mano.
 */

export type CommunityPoint = {
  id: string
  /** Nombre del barrio o sector. */
  name: string
  lat: number
  lng: number
  /** Radio del punto en el mapa (0.5 – 1.2). */
  radius: number
  /** Peso de la comunidad dentro de la red (0 – 1). */
  weight: number
  /** Superficie en hectáreas (0 si el dato no existe). */
  area: number
}

export type LocalidadCommunities = {
  /** Código de la localidad (LBOG01 … LBOG20). */
  code: string
  /** Número de barrios legalizados en la localidad. */
  total: number
  /** Superficie total en hectáreas. */
  area: number
  communities: CommunityPoint[]
}

export const COMUNIDADES: LocalidadCommunities[] = [
  {
    "code": "LBOG01",
    "total": 108,
    "area": 349.5,
    "communities": [
      {
        "id": "lbog01-0",
        "name": "Soratama",
        "lat": 4.74306,
        "lng": -74.01877,
        "radius": 1.2,
        "weight": 1,
        "area": 11.56
      },
      {
        "id": "lbog01-1",
        "name": "La Capilla San Isidro",
        "lat": 4.67092,
        "lng": -74.01512,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog01-2",
        "name": "La Cristalina",
        "lat": 4.71511,
        "lng": -74.04858,
        "radius": 0.85,
        "weight": 0.493,
        "area": 2.81
      },
      {
        "id": "lbog01-3",
        "name": "Canaima",
        "lat": 4.77489,
        "lng": -74.04072,
        "radius": 0.95,
        "weight": 0.648,
        "area": 4.86
      },
      {
        "id": "lbog01-4",
        "name": "Bellavista",
        "lat": 4.70375,
        "lng": -74.02221,
        "radius": 0.72,
        "weight": 0.321,
        "area": 1.19
      },
      {
        "id": "lbog01-5",
        "name": "El Toberin",
        "lat": 4.74491,
        "lng": -74.0467,
        "radius": 0.64,
        "weight": 0.202,
        "area": 0.47
      }
    ]
  },
  {
    "code": "LBOG02",
    "total": 20,
    "area": 32.8,
    "communities": [
      {
        "id": "lbog02-0",
        "name": "Pardo Rubio",
        "lat": 4.63325,
        "lng": -74.05738,
        "radius": 1.2,
        "weight": 1,
        "area": 7.9
      },
      {
        "id": "lbog02-1",
        "name": "Sureña",
        "lat": 4.67056,
        "lng": -74.01923,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog02-2",
        "name": "Juan Xiii",
        "lat": 4.64706,
        "lng": -74.05424,
        "radius": 0.82,
        "weight": 0.456,
        "area": 1.64
      },
      {
        "id": "lbog02-3",
        "name": "Bosques De Bellavista",
        "lat": 4.67515,
        "lng": -74.03008,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  },
  {
    "code": "LBOG03",
    "total": 24,
    "area": 149.1,
    "communities": [
      {
        "id": "lbog03-0",
        "name": "Lourdes Iii",
        "lat": 4.58828,
        "lng": -74.07568,
        "radius": 0.96,
        "weight": 0.661,
        "area": 5.99
      },
      {
        "id": "lbog03-1",
        "name": "La Paz Central",
        "lat": 4.60687,
        "lng": -74.06457,
        "radius": 0.89,
        "weight": 0.555,
        "area": 4.23
      },
      {
        "id": "lbog03-2",
        "name": "San Dionisio",
        "lat": 4.58187,
        "lng": -74.06759,
        "radius": 0.75,
        "weight": 0.35,
        "area": 1.68
      },
      {
        "id": "lbog03-3",
        "name": "Julio Cesar Turbay Ayala (Egipto Alto)",
        "lat": 4.59076,
        "lng": -74.06691,
        "radius": 1.2,
        "weight": 1,
        "area": 13.71
      }
    ]
  },
  {
    "code": "LBOG04",
    "total": 161,
    "area": 846.7,
    "communities": [
      {
        "id": "lbog04-0",
        "name": "Sagrada Familia Ii",
        "lat": 4.56796,
        "lng": -74.07823,
        "radius": 0.59,
        "weight": 0.133,
        "area": 0.17
      },
      {
        "id": "lbog04-1",
        "name": "Londres",
        "lat": 4.51942,
        "lng": -74.08713,
        "radius": 1.2,
        "weight": 1,
        "area": 9.61
      },
      {
        "id": "lbog04-2",
        "name": "La Peninsula",
        "lat": 4.54685,
        "lng": -74.10086,
        "radius": 0.76,
        "weight": 0.376,
        "area": 1.36
      },
      {
        "id": "lbog04-3",
        "name": "El Quindio Ii Alcaldia Menor: San Cristobal",
        "lat": 4.53982,
        "lng": -74.08163,
        "radius": 0.9,
        "weight": 0.568,
        "area": 3.1
      },
      {
        "id": "lbog04-4",
        "name": "San Isidro Sur",
        "lat": 4.56666,
        "lng": -74.10252,
        "radius": 0.64,
        "weight": 0.201,
        "area": 0.39
      },
      {
        "id": "lbog04-5",
        "name": "Calvo Sur Ii",
        "lat": 4.58672,
        "lng": -74.08267,
        "radius": 0.66,
        "weight": 0.235,
        "area": 0.53
      },
      {
        "id": "lbog04-6",
        "name": "Macarena Los Alpes",
        "lat": 4.55406,
        "lng": -74.0833,
        "radius": 1.09,
        "weight": 0.846,
        "area": 6.88
      },
      {
        "id": "lbog04-7",
        "name": "La Belleza Lote 230",
        "lat": 4.53355,
        "lng": -74.09373,
        "radius": 0.56,
        "weight": 0.079,
        "area": 0.06
      }
    ]
  },
  {
    "code": "LBOG05",
    "total": 183,
    "area": 771.8,
    "communities": [
      {
        "id": "lbog05-0",
        "name": "Antonio Jose De Sucre Iii",
        "lat": 4.489,
        "lng": -74.116,
        "radius": 1.2,
        "weight": 1,
        "area": 13.56
      },
      {
        "id": "lbog05-1",
        "name": "Daza Ii",
        "lat": 4.54079,
        "lng": -74.1122,
        "radius": 0.62,
        "weight": 0.167,
        "area": 0.38
      },
      {
        "id": "lbog05-2",
        "name": "El Bosque K-11",
        "lat": 4.47291,
        "lng": -74.08064,
        "radius": 1.14,
        "weight": 0.917,
        "area": 11.41
      },
      {
        "id": "lbog05-3",
        "name": "Buenos Aires",
        "lat": 4.51211,
        "lng": -74.08934,
        "radius": 0.76,
        "weight": 0.367,
        "area": 1.83
      },
      {
        "id": "lbog05-4",
        "name": "San Luis",
        "lat": 4.51617,
        "lng": -74.11967,
        "radius": 0.85,
        "weight": 0.504,
        "area": 3.44
      },
      {
        "id": "lbog05-5",
        "name": "El Jardin",
        "lat": 4.47053,
        "lng": -74.12745,
        "radius": 0.66,
        "weight": 0.229,
        "area": 0.71
      },
      {
        "id": "lbog05-6",
        "name": "El Refugio I Y Ii",
        "lat": 4.48873,
        "lng": -74.09698,
        "radius": 1.1,
        "weight": 0.863,
        "area": 10.09
      },
      {
        "id": "lbog05-7",
        "name": "Chico Sur Ii",
        "lat": 4.50476,
        "lng": -74.10498,
        "radius": 0.67,
        "weight": 0.241,
        "area": 0.79
      }
    ]
  },
  {
    "code": "LBOG06",
    "total": 6,
    "area": 108.8,
    "communities": [
      {
        "id": "lbog06-0",
        "name": "San Benito",
        "lat": 4.56448,
        "lng": -74.13585,
        "radius": 1.2,
        "weight": 1,
        "area": 41.98
      },
      {
        "id": "lbog06-1",
        "name": "Isla Del Sol",
        "lat": 4.58881,
        "lng": -74.15381,
        "radius": 0.92,
        "weight": 0.602,
        "area": 15.21
      },
      {
        "id": "lbog06-2",
        "name": "Villa Ximena",
        "lat": 4.57941,
        "lng": -74.14281,
        "radius": 0.64,
        "weight": 0.202,
        "area": 1.72
      },
      {
        "id": "lbog06-3",
        "name": "Tunalito",
        "lat": 4.56932,
        "lng": -74.12688,
        "radius": 0.59,
        "weight": 0.128,
        "area": 0.69
      }
    ]
  },
  {
    "code": "LBOG07",
    "total": 302,
    "area": 873.8,
    "communities": [
      {
        "id": "lbog07-0",
        "name": "San Luis",
        "lat": 4.62542,
        "lng": -74.18775,
        "radius": 0.59,
        "weight": 0.135,
        "area": 0.48
      },
      {
        "id": "lbog07-1",
        "name": "La Ilusion",
        "lat": 4.59758,
        "lng": -74.17468,
        "radius": 0.64,
        "weight": 0.2,
        "area": 1.05
      },
      {
        "id": "lbog07-2",
        "name": "El Toche",
        "lat": 4.6135,
        "lng": -74.21417,
        "radius": 0.69,
        "weight": 0.279,
        "area": 2.04
      },
      {
        "id": "lbog07-3",
        "name": "Tierra Gratis",
        "lat": 4.60386,
        "lng": -74.19556,
        "radius": 0.57,
        "weight": 0.099,
        "area": 0.26
      },
      {
        "id": "lbog07-4",
        "name": "El Recuerdo",
        "lat": 4.64305,
        "lng": -74.1979,
        "radius": 1.2,
        "weight": 1,
        "area": 26.3
      },
      {
        "id": "lbog07-5",
        "name": "San Bernardino Sec. Villa Emma",
        "lat": 4.62296,
        "lng": -74.20281,
        "radius": 0.69,
        "weight": 0.278,
        "area": 2.03
      },
      {
        "id": "lbog07-6",
        "name": "Claretiano",
        "lat": 4.61045,
        "lng": -74.18246,
        "radius": 0.57,
        "weight": 0.105,
        "area": 0.29
      },
      {
        "id": "lbog07-7",
        "name": "El Porvenir San Luis",
        "lat": 4.63751,
        "lng": -74.18287,
        "radius": 0.72,
        "weight": 0.31,
        "area": 2.52
      },
      {
        "id": "lbog07-8",
        "name": "San Pablo Ii Las Margaritas",
        "lat": 4.59737,
        "lng": -74.18608,
        "radius": 0.67,
        "weight": 0.245,
        "area": 1.58
      },
      {
        "id": "lbog07-9",
        "name": "La Primavera",
        "lat": 4.6076,
        "lng": -74.20542,
        "radius": 1.05,
        "weight": 0.79,
        "area": 16.41
      }
    ]
  },
  {
    "code": "LBOG08",
    "total": 139,
    "area": 786.7,
    "communities": [
      {
        "id": "lbog08-0",
        "name": "Lagos De Castilla 1",
        "lat": 4.64819,
        "lng": -74.14144,
        "radius": 0.71,
        "weight": 0.301,
        "area": 1.08
      },
      {
        "id": "lbog08-1",
        "name": "Guadalupe",
        "lat": 4.59602,
        "lng": -74.15114,
        "radius": 0.73,
        "weight": 0.334,
        "area": 1.33
      },
      {
        "id": "lbog08-2",
        "name": "Villa Clemencia Tierra Grata",
        "lat": 4.61881,
        "lng": -74.18398,
        "radius": 0.59,
        "weight": 0.123,
        "area": 0.18
      },
      {
        "id": "lbog08-3",
        "name": "Puente Vega",
        "lat": 4.65278,
        "lng": -74.17779,
        "radius": 0.85,
        "weight": 0.493,
        "area": 2.9
      },
      {
        "id": "lbog08-4",
        "name": "Floresta Del Sur",
        "lat": 4.61946,
        "lng": -74.12815,
        "radius": 1.2,
        "weight": 1,
        "area": 11.93
      },
      {
        "id": "lbog08-5",
        "name": "Llano Grande",
        "lat": 4.63324,
        "lng": -74.16266,
        "radius": 0.93,
        "weight": 0.611,
        "area": 4.46
      },
      {
        "id": "lbog08-6",
        "name": "Berlin",
        "lat": 4.61244,
        "lng": -74.16471,
        "radius": 0.76,
        "weight": 0.37,
        "area": 1.63
      }
    ]
  },
  {
    "code": "LBOG09",
    "total": 67,
    "area": 213.4,
    "communities": [
      {
        "id": "lbog09-0",
        "name": "Puente Grande Florencia",
        "lat": 4.69675,
        "lng": -74.1666,
        "radius": 1.2,
        "weight": 1,
        "area": 2.94
      },
      {
        "id": "lbog09-1",
        "name": "Paraiso Bavaria",
        "lat": 4.65318,
        "lng": -74.13199,
        "radius": 0.82,
        "weight": 0.459,
        "area": 0.62
      },
      {
        "id": "lbog09-2",
        "name": "San Jose Las Pistas",
        "lat": 4.68909,
        "lng": -74.12903,
        "radius": 0.62,
        "weight": 0.175,
        "area": 0.09
      },
      {
        "id": "lbog09-3",
        "name": "La Dulzura 2",
        "lat": 4.67221,
        "lng": -74.15052,
        "radius": 0.84,
        "weight": 0.484,
        "area": 0.69
      },
      {
        "id": "lbog09-4",
        "name": "Rincon De Modelia",
        "lat": 4.67142,
        "lng": -74.12451,
        "radius": 1,
        "weight": 0.719,
        "area": 1.52
      }
    ]
  },
  {
    "code": "LBOG10",
    "total": 104,
    "area": 572.7,
    "communities": [
      {
        "id": "lbog10-0",
        "name": "Engativa Centro El Cedro",
        "lat": 4.71809,
        "lng": -74.13906,
        "radius": 0.6,
        "weight": 0.139,
        "area": 1.03
      },
      {
        "id": "lbog10-1",
        "name": "El Salitre",
        "lat": 4.66059,
        "lng": -74.10206,
        "radius": 0.62,
        "weight": 0.173,
        "area": 1.6
      },
      {
        "id": "lbog10-2",
        "name": "Las Palmas Norte",
        "lat": 4.70583,
        "lng": -74.08876,
        "radius": 0.61,
        "weight": 0.163,
        "area": 1.41
      },
      {
        "id": "lbog10-3",
        "name": "Alamos",
        "lat": 4.69393,
        "lng": -74.11818,
        "radius": 0.55,
        "weight": 0.076,
        "area": 0.31
      },
      {
        "id": "lbog10-4",
        "name": "Palo Blanco",
        "lat": 4.68312,
        "lng": -74.09349,
        "radius": 0.78,
        "weight": 0.401,
        "area": 8.57
      },
      {
        "id": "lbog10-5",
        "name": "Garces Navas",
        "lat": 4.7119,
        "lng": -74.11945,
        "radius": 1.2,
        "weight": 1,
        "area": 53.35
      }
    ]
  },
  {
    "code": "LBOG11",
    "total": 251,
    "area": 996.3,
    "communities": [
      {
        "id": "lbog11-0",
        "name": "El Paraiso Los Doce Apostoles",
        "lat": 4.74969,
        "lng": -74.05615,
        "radius": 0.54,
        "weight": 0.054,
        "area": 0.17
      },
      {
        "id": "lbog11-1",
        "name": "Santa Cecilia Ii",
        "lat": 4.74145,
        "lng": -74.12912,
        "radius": 0.84,
        "weight": 0.479,
        "area": 13.37
      },
      {
        "id": "lbog11-2",
        "name": "Guaymaral Lotes 1,3 Y 4",
        "lat": 4.81646,
        "lng": -74.06108,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog11-3",
        "name": "Julio Florez",
        "lat": 4.68822,
        "lng": -74.07826,
        "radius": 0.73,
        "weight": 0.332,
        "area": 6.43
      },
      {
        "id": "lbog11-4",
        "name": "Costa Rica",
        "lat": 4.72873,
        "lng": -74.09076,
        "radius": 0.89,
        "weight": 0.554,
        "area": 17.85
      },
      {
        "id": "lbog11-5",
        "name": "Prado Veraniego",
        "lat": 4.71457,
        "lng": -74.05627,
        "radius": 1.2,
        "weight": 1,
        "area": 58.19
      },
      {
        "id": "lbog11-6",
        "name": "Las Lomitas",
        "lat": 4.78479,
        "lng": -74.06438,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog11-7",
        "name": "Londres",
        "lat": 4.75926,
        "lng": -74.09706,
        "radius": 0.67,
        "weight": 0.244,
        "area": 3.46
      },
      {
        "id": "lbog11-8",
        "name": "El Jardin Ltda",
        "lat": 4.79987,
        "lng": -74.04443,
        "radius": 1.13,
        "weight": 0.894,
        "area": 46.51
      },
      {
        "id": "lbog11-9",
        "name": "Tuna Alta Bellavista Suba",
        "lat": 4.74985,
        "lng": -74.07851,
        "radius": 0.57,
        "weight": 0.102,
        "area": 0.61
      }
    ]
  },
  {
    "code": "LBOG12",
    "total": 2,
    "area": 0.8,
    "communities": [
      {
        "id": "lbog12-0",
        "name": "Simon Bolivar Segundo",
        "lat": 4.68156,
        "lng": -74.07793,
        "radius": 1,
        "weight": 0.721,
        "area": 0.52
      },
      {
        "id": "lbog12-1",
        "name": "La Libertad",
        "lat": 4.67387,
        "lng": -74.0773,
        "radius": 0.85,
        "weight": 0.5,
        "area": 0.25
      },
      {
        "id": "lbog12-2",
        "name": "Benjamin Herrera",
        "lat": 4.65355,
        "lng": -74.07684,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog12-3",
        "name": "Concepcion Norte",
        "lat": 4.65712,
        "lng": -74.06327,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  },
  {
    "code": "LBOG13",
    "total": 1,
    "area": 0.5,
    "communities": [
      {
        "id": "lbog13-0",
        "name": "(Cama Vieja) Villa Del Clan",
        "lat": 4.63812,
        "lng": -74.0967,
        "radius": 0.98,
        "weight": 0.686,
        "area": 0.47
      },
      {
        "id": "lbog13-1",
        "name": "Estrella",
        "lat": 4.62349,
        "lng": -74.07751,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog13-2",
        "name": "Armenia",
        "lat": 4.61904,
        "lng": -74.07229,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog13-3",
        "name": "Salitre Sur-oriental",
        "lat": 4.64202,
        "lng": -74.10389,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  },
  {
    "code": "LBOG14",
    "total": 1,
    "area": 0.1,
    "communities": [
      {
        "id": "lbog14-0",
        "name": "La Pepita Predios Carrera 19a Calle 10",
        "lat": 4.60532,
        "lng": -74.08726,
        "radius": 0.73,
        "weight": 0.332,
        "area": 0.11
      },
      {
        "id": "lbog14-1",
        "name": "El Liston",
        "lat": 4.61244,
        "lng": -74.08363,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog14-2",
        "name": "Paloquemao",
        "lat": 4.61254,
        "lng": -74.08519,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog14-3",
        "name": "Santa Isabel Sur",
        "lat": 4.59527,
        "lng": -74.10039,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  },
  {
    "code": "LBOG15",
    "total": 4,
    "area": 17.3,
    "communities": [
      {
        "id": "lbog15-0",
        "name": "La Fraguita (Zona Invadida)",
        "lat": 4.59263,
        "lng": -74.10093,
        "radius": 0.87,
        "weight": 0.524,
        "area": 3.55
      },
      {
        "id": "lbog15-1",
        "name": "San Jorge Central Ii",
        "lat": 4.59216,
        "lng": -74.1168,
        "radius": 0.65,
        "weight": 0.217,
        "area": 0.61
      },
      {
        "id": "lbog15-2",
        "name": "Policarpa Salavarrieta",
        "lat": 4.587,
        "lng": -74.08821,
        "radius": 1.2,
        "weight": 1,
        "area": 12.93
      },
      {
        "id": "lbog15-3",
        "name": "Santa Clara",
        "lat": 4.59111,
        "lng": -74.09136,
        "radius": 0.59,
        "weight": 0.133,
        "area": 0.23
      }
    ]
  },
  {
    "code": "LBOG16",
    "total": 9,
    "area": 16.6,
    "communities": [
      {
        "id": "lbog16-0",
        "name": "El Arpa Y La Lira Puente Aranda",
        "lat": 4.61884,
        "lng": -74.11518,
        "radius": 0.59,
        "weight": 0.132,
        "area": 0.23
      },
      {
        "id": "lbog16-1",
        "name": "Camilo Torres",
        "lat": 4.62866,
        "lng": -74.09451,
        "radius": 0.57,
        "weight": 0.099,
        "area": 0.13
      },
      {
        "id": "lbog16-2",
        "name": "La Asuncion",
        "lat": 4.6029,
        "lng": -74.10565,
        "radius": 1.2,
        "weight": 1,
        "area": 13.2
      },
      {
        "id": "lbog16-3",
        "name": "Nuevo Tejar",
        "lat": 4.60922,
        "lng": -74.12513,
        "radius": 0.59,
        "weight": 0.126,
        "area": 0.21
      }
    ]
  },
  {
    "code": "LBOG17",
    "total": 1,
    "area": 10.6,
    "communities": [
      {
        "id": "lbog17-0",
        "name": "Egipto",
        "lat": 4.59168,
        "lng": -74.06884,
        "radius": 1.2,
        "weight": 1,
        "area": 10.63
      },
      {
        "id": "lbog17-1",
        "name": "Belen",
        "lat": 4.59151,
        "lng": -74.07259,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog17-2",
        "name": "La Concordia",
        "lat": 4.59777,
        "lng": -74.06846,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog17-3",
        "name": "Centro Administrativo",
        "lat": 4.59542,
        "lng": -74.07506,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  },
  {
    "code": "LBOG18",
    "total": 125,
    "area": 393.8,
    "communities": [
      {
        "id": "lbog18-0",
        "name": "Callejón De Santa Bárbara Iii",
        "lat": 4.55656,
        "lng": -74.11435,
        "radius": 0.58,
        "weight": 0.113,
        "area": 0.26
      },
      {
        "id": "lbog18-1",
        "name": "Nueva Esperanza",
        "lat": 4.53832,
        "lng": -74.10139,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog18-2",
        "name": "San Juanito",
        "lat": 4.57429,
        "lng": -74.12018,
        "radius": 0.67,
        "weight": 0.246,
        "area": 1.24
      },
      {
        "id": "lbog18-3",
        "name": "La Paz",
        "lat": 4.54198,
        "lng": -74.11547,
        "radius": 1.2,
        "weight": 1,
        "area": 20.43
      },
      {
        "id": "lbog18-4",
        "name": "Resurreccion V Menos",
        "lat": 4.56769,
        "lng": -74.11052,
        "radius": 0.59,
        "weight": 0.133,
        "area": 0.36
      },
      {
        "id": "lbog18-5",
        "name": "El Consuelo",
        "lat": 4.56246,
        "lng": -74.12422,
        "radius": 0.79,
        "weight": 0.412,
        "area": 3.47
      },
      {
        "id": "lbog18-6",
        "name": "Los Puentes",
        "lat": 4.54906,
        "lng": -74.10428,
        "radius": 0.7,
        "weight": 0.288,
        "area": 1.69
      }
    ]
  },
  {
    "code": "LBOG19",
    "total": 201,
    "area": 1309.1,
    "communities": [
      {
        "id": "lbog19-0",
        "name": "Santa Viviana Vista Hermosa",
        "lat": 4.5791,
        "lng": -74.17159,
        "radius": 0.71,
        "weight": 0.295,
        "area": 4.32
      },
      {
        "id": "lbog19-1",
        "name": "Brazuelos Santo Domingo",
        "lat": 4.49668,
        "lng": -74.12391,
        "radius": 0.63,
        "weight": 0.19,
        "area": 1.79
      },
      {
        "id": "lbog19-2",
        "name": "Sotavento Ii",
        "lat": 4.5437,
        "lng": -74.13675,
        "radius": 0.58,
        "weight": 0.114,
        "area": 0.64
      },
      {
        "id": "lbog19-3",
        "name": "El Paraiso",
        "lat": 4.55184,
        "lng": -74.16275,
        "radius": 1.01,
        "weight": 0.725,
        "area": 26.04
      },
      {
        "id": "lbog19-4",
        "name": "Paticos",
        "lat": 4.50891,
        "lng": -74.14814,
        "radius": 0.78,
        "weight": 0.404,
        "area": 8.09
      },
      {
        "id": "lbog19-5",
        "name": "Arborizadora Baja",
        "lat": 4.57459,
        "lng": -74.14702,
        "radius": 1.2,
        "weight": 1,
        "area": 49.53
      },
      {
        "id": "lbog19-6",
        "name": "La Primavera",
        "lat": 4.59582,
        "lng": -74.18175,
        "radius": 0.58,
        "weight": 0.118,
        "area": 0.69
      },
      {
        "id": "lbog19-7",
        "name": "El Recuerdo Sur",
        "lat": 4.5343,
        "lng": -74.15304,
        "radius": 0.71,
        "weight": 0.3,
        "area": 4.45
      },
      {
        "id": "lbog19-8",
        "name": "Santa Rosa Sur",
        "lat": 4.59075,
        "lng": -74.15475,
        "radius": 0.64,
        "weight": 0.203,
        "area": 2.05
      }
    ]
  },
  {
    "code": "LBOG20",
    "total": 0,
    "area": 0,
    "communities": [
      {
        "id": "lbog20-0",
        "name": "Las Animas",
        "lat": 4.14397,
        "lng": -74.18081,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog20-1",
        "name": "Las Palmas",
        "lat": 4.15003,
        "lng": -74.16095,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog20-2",
        "name": "Tunal Alto",
        "lat": 3.93479,
        "lng": -74.30876,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      },
      {
        "id": "lbog20-3",
        "name": "Capitolio",
        "lat": 4.03659,
        "lng": -74.3457,
        "radius": 0.81,
        "weight": 0.45,
        "area": 0
      }
    ]
  }
]

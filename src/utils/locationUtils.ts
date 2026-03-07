// Location management utility functions for Peru

export interface District {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
}

export interface Province {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
  districts: District[];
  isExpanded?: boolean;
}

export interface Department {
  id: string;
  name: string;
  isActive: boolean;
  order: number;
  provinces: Province[];
  isExpanded?: boolean;
}

// Complete Peru geographic data
const defaultPeruLocations: Department[] = [
  {
    id: 'amazonas',
    name: 'Amazonas',
    isActive: false,
    order: 1,
    isExpanded: false,
    provinces: [
      {
        id: 'chachapoyas',
        name: 'Chachapoyas',
        isActive: false,
        order: 1,
        districts: [
          { id: 'chachapoyas-dist', name: 'Chachapoyas', isActive: false, order: 1 },
          { id: 'asuncion', name: 'Asunción', isActive: false, order: 2 },
          { id: 'balsas', name: 'Balsas', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'ancash',
    name: 'Áncash',
    isActive: false,
    order: 2,
    isExpanded: false,
    provinces: [
      {
        id: 'huaraz',
        name: 'Huaraz',
        isActive: false,
        order: 1,
        districts: [
          { id: 'huaraz-dist', name: 'Huaraz', isActive: false, order: 1 },
          { id: 'cochabamba', name: 'Cochabamba', isActive: false, order: 2 },
          { id: 'colcabamba', name: 'Colcabamba', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'apurimac',
    name: 'Apurímac',
    isActive: false,
    order: 3,
    isExpanded: false,
    provinces: [
      {
        id: 'abancay',
        name: 'Abancay',
        isActive: false,
        order: 1,
        districts: [
          { id: 'abancay-dist', name: 'Abancay', isActive: false, order: 1 },
          { id: 'chacoche', name: 'Chacoche', isActive: false, order: 2 },
          { id: 'circa', name: 'Circa', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'arequipa',
    name: 'Arequipa',
    isActive: false,
    order: 4,
    isExpanded: false,
    provinces: [
      {
        id: 'arequipa-prov',
        name: 'Arequipa',
        isActive: false,
        order: 1,
        districts: [
          { id: 'arequipa-dist', name: 'Arequipa', isActive: false, order: 1 },
          { id: 'alto-selva-alegre', name: 'Alto Selva Alegre', isActive: false, order: 2 },
          { id: 'cayma', name: 'Cayma', isActive: false, order: 3 },
          { id: 'cerro-colorado', name: 'Cerro Colorado', isActive: false, order: 4 },
          { id: 'characato', name: 'Characato', isActive: false, order: 5 },
          { id: 'chiguata', name: 'Chiguata', isActive: false, order: 6 },
          { id: 'jacobo-hunter', name: 'Jacobo Hunter', isActive: false, order: 7 },
          { id: 'la-joya', name: 'La Joya', isActive: false, order: 8 },
          { id: 'mariano-melgar', name: 'Mariano Melgar', isActive: false, order: 9 },
          { id: 'miraflores', name: 'Miraflores', isActive: false, order: 10 },
          { id: 'mollebaya', name: 'Mollebaya', isActive: false, order: 11 },
          { id: 'paucarpata', name: 'Paucarpata', isActive: false, order: 12 },
          { id: 'pocsi', name: 'Pocsi', isActive: false, order: 13 },
          { id: 'polobaya', name: 'Polobaya', isActive: false, order: 14 },
          { id: 'quequeña', name: 'Quequeña', isActive: false, order: 15 },
          { id: 'sabandia', name: 'Sabandía', isActive: false, order: 16 },
          { id: 'sachaca', name: 'Sachaca', isActive: false, order: 17 },
          { id: 'san-juan-de-siguas', name: 'San Juan de Siguas', isActive: false, order: 18 },
          { id: 'san-juan-de-tarucani', name: 'San Juan de Tarucani', isActive: false, order: 19 },
          { id: 'santa-isabel-de-siguas', name: 'Santa Isabel de Siguas', isActive: false, order: 20 },
          { id: 'santa-rita-de-siguas', name: 'Santa Rita de Siguas', isActive: false, order: 21 },
          { id: 'socabaya', name: 'Socabaya', isActive: false, order: 22 },
          { id: 'tiabaya', name: 'Tiabaya', isActive: false, order: 23 },
          { id: 'uchumayo', name: 'Uchumayo', isActive: false, order: 24 },
          { id: 'vitor', name: 'Vitor', isActive: false, order: 25 },
          { id: 'yanahuara', name: 'Yanahuara', isActive: false, order: 26 },
          { id: 'yarabamba', name: 'Yarabamba', isActive: false, order: 27 },
          { id: 'yura', name: 'Yura', isActive: false, order: 28 }
        ]
      }
    ]
  },
  {
    id: 'ayacucho',
    name: 'Ayacucho',
    isActive: false,
    order: 5,
    isExpanded: false,
    provinces: [
      {
        id: 'huamanga',
        name: 'Huamanga',
        isActive: false,
        order: 1,
        districts: [
          { id: 'ayacucho-dist', name: 'Ayacucho', isActive: false, order: 1 },
          { id: 'acocro', name: 'Acocro', isActive: false, order: 2 },
          { id: 'acos-vinchos', name: 'Acos Vinchos', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'cajamarca',
    name: 'Cajamarca',
    isActive: false,
    order: 6,
    isExpanded: false,
    provinces: [
      {
        id: 'cajamarca-prov',
        name: 'Cajamarca',
        isActive: false,
        order: 1,
        districts: [
          { id: 'cajamarca-dist', name: 'Cajamarca', isActive: false, order: 1 },
          { id: 'asuncion-caj', name: 'Asunción', isActive: false, order: 2 },
          { id: 'chetilla', name: 'Chetilla', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'callao',
    name: 'Callao',
    isActive: false,
    order: 7,
    isExpanded: false,
    provinces: [
      {
        id: 'callao-prov',
        name: 'Callao',
        isActive: false,
        order: 1,
        districts: [
          { id: 'callao-dist', name: 'Callao', isActive: false, order: 1 },
          { id: 'bellavista', name: 'Bellavista', isActive: false, order: 2 },
          { id: 'carmen-de-la-legua', name: 'Carmen de la Legua Reynoso', isActive: false, order: 3 },
          { id: 'la-perla', name: 'La Perla', isActive: false, order: 4 },
          { id: 'la-punta', name: 'La Punta', isActive: false, order: 5 },
          { id: 'mi-peru', name: 'Mi Perú', isActive: false, order: 6 },
          { id: 'ventanilla', name: 'Ventanilla', isActive: false, order: 7 }
        ]
      }
    ]
  },
  {
    id: 'cusco',
    name: 'Cusco',
    isActive: false,
    order: 8,
    isExpanded: false,
    provinces: [
      {
        id: 'cusco-prov',
        name: 'Cusco',
        isActive: false,
        order: 1,
        districts: [
          { id: 'cusco-dist', name: 'Cusco', isActive: false, order: 1 },
          { id: 'ccorca', name: 'Ccorca', isActive: false, order: 2 },
          { id: 'poroy', name: 'Poroy', isActive: false, order: 3 },
          { id: 'san-jeronimo', name: 'San Jerónimo', isActive: false, order: 4 },
          { id: 'san-sebastian', name: 'San Sebastián', isActive: false, order: 5 },
          { id: 'santiago', name: 'Santiago', isActive: false, order: 6 },
          { id: 'saylla', name: 'Saylla', isActive: false, order: 7 },
          { id: 'wanchaq', name: 'Wanchaq', isActive: false, order: 8 }
        ]
      }
    ]
  },
  {
    id: 'huancavelica',
    name: 'Huancavelica',
    isActive: false,
    order: 9,
    isExpanded: false,
    provinces: [
      {
        id: 'huancavelica-prov',
        name: 'Huancavelica',
        isActive: false,
        order: 1,
        districts: [
          { id: 'huancavelica-dist', name: 'Huancavelica', isActive: false, order: 1 },
          { id: 'acobambilla', name: 'Acobambilla', isActive: false, order: 2 },
          { id: 'acoria', name: 'Acoria', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'huanuco',
    name: 'Huánuco',
    isActive: false,
    order: 10,
    isExpanded: false,
    provinces: [
      {
        id: 'huanuco-prov',
        name: 'Huánuco',
        isActive: false,
        order: 1,
        districts: [
          { id: 'huanuco-dist', name: 'Huánuco', isActive: false, order: 1 },
          { id: 'amarilis', name: 'Amarilis', isActive: false, order: 2 },
          { id: 'chinchao', name: 'Chinchao', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'ica',
    name: 'Ica',
    isActive: false,
    order: 11,
    isExpanded: false,
    provinces: [
      {
        id: 'ica-prov',
        name: 'Ica',
        isActive: false,
        order: 1,
        districts: [
          { id: 'ica-dist', name: 'Ica', isActive: false, order: 1 },
          { id: 'la-tinguiña', name: 'La Tinguiña', isActive: false, order: 2 },
          { id: 'los-aquijes', name: 'Los Aquijes', isActive: false, order: 3 },
          { id: 'ocucaje', name: 'Ocucaje', isActive: false, order: 4 },
          { id: 'pachacutec', name: 'Pachacutec', isActive: false, order: 5 },
          { id: 'parcona', name: 'Parcona', isActive: false, order: 6 },
          { id: 'pueblo-nuevo', name: 'Pueblo Nuevo', isActive: false, order: 7 },
          { id: 'salas', name: 'Salas', isActive: false, order: 8 },
          { id: 'san-jose-de-los-molinos', name: 'San José de los Molinos', isActive: false, order: 9 },
          { id: 'san-juan-bautista', name: 'San Juan Bautista', isActive: false, order: 10 },
          { id: 'santiago-ica', name: 'Santiago', isActive: false, order: 11 },
          { id: 'subtanjalla', name: 'Subtanjalla', isActive: false, order: 12 },
          { id: 'tate', name: 'Tate', isActive: false, order: 13 },
          { id: 'yauca-del-rosario', name: 'Yauca del Rosario', isActive: false, order: 14 }
        ]
      }
    ]
  },
  {
    id: 'junin',
    name: 'Junín',
    isActive: false,
    order: 12,
    isExpanded: false,
    provinces: [
      {
        id: 'huancayo',
        name: 'Huancayo',
        isActive: false,
        order: 1,
        districts: [
          { id: 'huancayo-dist', name: 'Huancayo', isActive: false, order: 1 },
          { id: 'carhuacallanga', name: 'Carhuacallanga', isActive: false, order: 2 },
          { id: 'chacapampa', name: 'Chacapampa', isActive: false, order: 3 },
          { id: 'chicche', name: 'Chicche', isActive: false, order: 4 },
          { id: 'chilca', name: 'Chilca', isActive: false, order: 5 },
          { id: 'chongos-alto', name: 'Chongos Alto', isActive: false, order: 6 },
          { id: 'chupuro', name: 'Chupuro', isActive: false, order: 7 },
          { id: 'colca', name: 'Colca', isActive: false, order: 8 },
          { id: 'cullhuas', name: 'Cullhuas', isActive: false, order: 9 },
          { id: 'el-tambo', name: 'El Tambo', isActive: false, order: 10 },
          { id: 'huacrapuquio', name: 'Huacrapuquio', isActive: false, order: 11 },
          { id: 'hualhuas', name: 'Hualhuas', isActive: false, order: 12 },
          { id: 'huancan', name: 'Huancán', isActive: false, order: 13 },
          { id: 'huasicancha', name: 'Huasicancha', isActive: false, order: 14 },
          { id: 'huayucachi', name: 'Huayucachi', isActive: false, order: 15 },
          { id: 'ingenio', name: 'Ingenio', isActive: false, order: 16 },
          { id: 'pariahuanca', name: 'Pariahuanca', isActive: false, order: 17 },
          { id: 'pilcomayo', name: 'Pilcomayo', isActive: false, order: 18 },
          { id: 'pucara', name: 'Pucará', isActive: false, order: 19 },
          { id: 'quichuay', name: 'Quichuay', isActive: false, order: 20 },
          { id: 'quilcas', name: 'Quilcas', isActive: false, order: 21 },
          { id: 'san-agustin', name: 'San Agustín', isActive: false, order: 22 },
          { id: 'san-jeronimo-de-tunan', name: 'San Jerónimo de Tunán', isActive: false, order: 23 },
          { id: 'saño', name: 'Saño', isActive: false, order: 24 },
          { id: 'sapallanga', name: 'Sapallanga', isActive: false, order: 25 },
          { id: 'sicaya', name: 'Sicaya', isActive: false, order: 26 },
          { id: 'santo-domingo-de-acobamba', name: 'Santo Domingo de Acobamba', isActive: false, order: 27 },
          { id: 'viques', name: 'Viques', isActive: false, order: 28 }
        ]
      }
    ]
  },
  {
    id: 'la-libertad',
    name: 'La Libertad',
    isActive: false,
    order: 13,
    isExpanded: false,
    provinces: [
      {
        id: 'trujillo',
        name: 'Trujillo',
        isActive: false,
        order: 1,
        districts: [
          { id: 'trujillo-dist', name: 'Trujillo', isActive: false, order: 1 },
          { id: 'el-porvenir', name: 'El Porvenir', isActive: false, order: 2 },
          { id: 'florencia-de-mora', name: 'Florencia de Mora', isActive: false, order: 3 },
          { id: 'huanchaco', name: 'Huanchaco', isActive: false, order: 4 },
          { id: 'la-esperanza', name: 'La Esperanza', isActive: false, order: 5 },
          { id: 'laredo', name: 'Laredo', isActive: false, order: 6 },
          { id: 'moche', name: 'Moche', isActive: false, order: 7 },
          { id: 'poroto', name: 'Poroto', isActive: false, order: 8 },
          { id: 'salaverry', name: 'Salaverry', isActive: false, order: 9 },
          { id: 'simbal', name: 'Simbal', isActive: false, order: 10 },
          { id: 'victor-larco-herrera', name: 'Víctor Larco Herrera', isActive: false, order: 11 }
        ]
      }
    ]
  },
  {
    id: 'lambayeque',
    name: 'Lambayeque',
    isActive: false,
    order: 14,
    isExpanded: false,
    provinces: [
      {
        id: 'chiclayo',
        name: 'Chiclayo',
        isActive: false,
        order: 1,
        districts: [
          { id: 'chiclayo-dist', name: 'Chiclayo', isActive: false, order: 1 },
          { id: 'chongoyape', name: 'Chongoyape', isActive: false, order: 2 },
          { id: 'eten', name: 'Eten', isActive: false, order: 3 },
          { id: 'eten-puerto', name: 'Eten Puerto', isActive: false, order: 4 },
          { id: 'jose-leonardo-ortiz', name: 'José Leonardo Ortiz', isActive: false, order: 5 },
          { id: 'la-victoria', name: 'La Victoria', isActive: false, order: 6 },
          { id: 'lagunas', name: 'Lagunas', isActive: false, order: 7 },
          { id: 'monsefu', name: 'Monsefú', isActive: false, order: 8 },
          { id: 'nueva-arica', name: 'Nueva Arica', isActive: false, order: 9 },
          { id: 'oyotun', name: 'Oyotún', isActive: false, order: 10 },
          { id: 'picsi', name: 'Picsi', isActive: false, order: 11 },
          { id: 'pimentel', name: 'Pimentel', isActive: false, order: 12 },
          { id: 'reque', name: 'Reque', isActive: false, order: 13 },
          { id: 'santa-rosa', name: 'Santa Rosa', isActive: false, order: 14 },
          { id: 'saña', name: 'Saña', isActive: false, order: 15 },
          { id: 'cayalti', name: 'Cayaltí', isActive: false, order: 16 },
          { id: 'patapo', name: 'Pátapo', isActive: false, order: 17 },
          { id: 'pomalca', name: 'Pomalca', isActive: false, order: 18 },
          { id: 'pucala', name: 'Pucalá', isActive: false, order: 19 },
          { id: 'tuman', name: 'Tumán', isActive: false, order: 20 }
        ]
      }
    ]
  },
  {
    id: 'lima',
    name: 'Lima',
    isActive: true,
    order: 15,
    isExpanded: false,
    provinces: [
      {
        id: 'lima-prov',
        name: 'Lima',
        isActive: true,
        order: 1,
        districts: [
          { id: 'lima-dist', name: 'Lima', isActive: true, order: 1 },
          { id: 'ancon', name: 'Ancón', isActive: true, order: 2 },
          { id: 'ate', name: 'Ate', isActive: true, order: 3 },
          { id: 'barranco', name: 'Barranco', isActive: true, order: 4 },
          { id: 'breña', name: 'Breña', isActive: true, order: 5 },
          { id: 'carabayllo', name: 'Carabayllo', isActive: true, order: 6 },
          { id: 'chaclacayo', name: 'Chaclacayo', isActive: true, order: 7 },
          { id: 'chorrillos', name: 'Chorrillos', isActive: true, order: 8 },
          { id: 'cieneguilla', name: 'Cieneguilla', isActive: true, order: 9 },
          { id: 'comas', name: 'Comas', isActive: true, order: 10 },
          { id: 'el-agustino', name: 'El Agustino', isActive: true, order: 11 },
          { id: 'independencia', name: 'Independencia', isActive: true, order: 12 },
          { id: 'jesus-maria', name: 'Jesús María', isActive: true, order: 13 },
          { id: 'la-molina', name: 'La Molina', isActive: true, order: 14 },
          { id: 'la-victoria-lima', name: 'La Victoria', isActive: true, order: 15 },
          { id: 'lince', name: 'Lince', isActive: true, order: 16 },
          { id: 'los-olivos', name: 'Los Olivos', isActive: true, order: 17 },
          { id: 'lurigancho', name: 'Lurigancho', isActive: true, order: 18 },
          { id: 'lurin', name: 'Lurín', isActive: true, order: 19 },
          { id: 'magdalena-del-mar', name: 'Magdalena del Mar', isActive: true, order: 20 },
          { id: 'magdalena-vieja', name: 'Pueblo Libre', isActive: true, order: 21 },
          { id: 'miraflores-lima', name: 'Miraflores', isActive: true, order: 22 },
          { id: 'pachacamac', name: 'Pachacamac', isActive: true, order: 23 },
          { id: 'pucusana', name: 'Pucusana', isActive: true, order: 24 },
          { id: 'puente-piedra', name: 'Puente Piedra', isActive: true, order: 25 },
          { id: 'punta-hermosa', name: 'Punta Hermosa', isActive: true, order: 26 },
          { id: 'punta-negra', name: 'Punta Negra', isActive: true, order: 27 },
          { id: 'rimac', name: 'Rímac', isActive: true, order: 28 },
          { id: 'san-bartolo', name: 'San Bartolo', isActive: true, order: 29 },
          { id: 'san-borja', name: 'San Borja', isActive: true, order: 30 },
          { id: 'san-isidro', name: 'San Isidro', isActive: true, order: 31 },
          { id: 'san-juan-de-lurigancho', name: 'San Juan de Lurigancho', isActive: true, order: 32 },
          { id: 'san-juan-de-miraflores', name: 'San Juan de Miraflores', isActive: true, order: 33 },
          { id: 'san-luis', name: 'San Luis', isActive: true, order: 34 },
          { id: 'san-martin-de-porres', name: 'San Martín de Porres', isActive: true, order: 35 },
          { id: 'san-miguel', name: 'San Miguel', isActive: true, order: 36 },
          { id: 'santa-anita', name: 'Santa Anita', isActive: true, order: 37 },
          { id: 'santa-maria-del-mar', name: 'Santa María del Mar', isActive: true, order: 38 },
          { id: 'santa-rosa-lima', name: 'Santa Rosa', isActive: true, order: 39 },
          { id: 'santiago-de-surco', name: 'Santiago de Surco', isActive: true, order: 40 },
          { id: 'surquillo', name: 'Surquillo', isActive: true, order: 41 },
          { id: 'villa-el-salvador', name: 'Villa El Salvador', isActive: true, order: 42 },
          { id: 'villa-maria-del-triunfo', name: 'Villa María del Triunfo', isActive: true, order: 43 }
        ]
      }
    ]
  },
  {
    id: 'loreto',
    name: 'Loreto',
    isActive: false,
    order: 16,
    isExpanded: false,
    provinces: [
      {
        id: 'maynas',
        name: 'Maynas',
        isActive: false,
        order: 1,
        districts: [
          { id: 'iquitos', name: 'Iquitos', isActive: false, order: 1 },
          { id: 'alto-nanay', name: 'Alto Nanay', isActive: false, order: 2 },
          { id: 'fernando-lores', name: 'Fernando Lores', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'madre-de-dios',
    name: 'Madre de Dios',
    isActive: false,
    order: 17,
    isExpanded: false,
    provinces: [
      {
        id: 'tambopata',
        name: 'Tambopata',
        isActive: false,
        order: 1,
        districts: [
          { id: 'tambopata-dist', name: 'Tambopata', isActive: false, order: 1 },
          { id: 'inambari', name: 'Inambari', isActive: false, order: 2 },
          { id: 'las-piedras', name: 'Las Piedras', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'moquegua',
    name: 'Moquegua',
    isActive: false,
    order: 18,
    isExpanded: false,
    provinces: [
      {
        id: 'mariscal-nieto',
        name: 'Mariscal Nieto',
        isActive: false,
        order: 1,
        districts: [
          { id: 'moquegua-dist', name: 'Moquegua', isActive: false, order: 1 },
          { id: 'carumas', name: 'Carumas', isActive: false, order: 2 },
          { id: 'cuchumbaya', name: 'Cuchumbaya', isActive: false, order: 3 },
          { id: 'samegua', name: 'Samegua', isActive: false, order: 4 },
          { id: 'san-cristobal', name: 'San Cristóbal', isActive: false, order: 5 },
          { id: 'torata', name: 'Torata', isActive: false, order: 6 }
        ]
      }
    ]
  },
  {
    id: 'pasco',
    name: 'Pasco',
    isActive: false,
    order: 19,
    isExpanded: false,
    provinces: [
      {
        id: 'pasco-prov',
        name: 'Pasco',
        isActive: false,
        order: 1,
        districts: [
          { id: 'chaupimarca', name: 'Chaupimarca', isActive: false, order: 1 },
          { id: 'huachon', name: 'Huachón', isActive: false, order: 2 },
          { id: 'huariaca', name: 'Huariaca', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'piura',
    name: 'Piura',
    isActive: false,
    order: 20,
    isExpanded: false,
    provinces: [
      {
        id: 'piura-prov',
        name: 'Piura',
        isActive: false,
        order: 1,
        districts: [
          { id: 'piura-dist', name: 'Piura', isActive: false, order: 1 },
          { id: 'castilla', name: 'Castilla', isActive: false, order: 2 },
          { id: 'catacaos', name: 'Catacaos', isActive: false, order: 3 },
          { id: 'cura-mori', name: 'Cura Mori', isActive: false, order: 4 },
          { id: 'el-tallan', name: 'El Tallán', isActive: false, order: 5 },
          { id: 'la-arena', name: 'La Arena', isActive: false, order: 6 },
          { id: 'la-union', name: 'La Unión', isActive: false, order: 7 },
          { id: 'las-lomas', name: 'Las Lomas', isActive: false, order: 8 },
          { id: 'tambo-grande', name: 'Tambo Grande', isActive: false, order: 9 }
        ]
      }
    ]
  },
  {
    id: 'puno',
    name: 'Puno',
    isActive: false,
    order: 21,
    isExpanded: false,
    provinces: [
      {
        id: 'puno-prov',
        name: 'Puno',
        isActive: false,
        order: 1,
        districts: [
          { id: 'puno-dist', name: 'Puno', isActive: false, order: 1 },
          { id: 'acora', name: 'Acora', isActive: false, order: 2 },
          { id: 'amantani', name: 'Amantaní', isActive: false, order: 3 },
          { id: 'atuncolla', name: 'Atuncolla', isActive: false, order: 4 },
          { id: 'capachica', name: 'Capachica', isActive: false, order: 5 },
          { id: 'chucuito', name: 'Chucuito', isActive: false, order: 6 },
          { id: 'coata', name: 'Coata', isActive: false, order: 7 },
          { id: 'huata', name: 'Huata', isActive: false, order: 8 },
          { id: 'mañazo', name: 'Mañazo', isActive: false, order: 9 },
          { id: 'paucarcolla', name: 'Paucarcolla', isActive: false, order: 10 },
          { id: 'pichacani', name: 'Pichacani', isActive: false, order: 11 },
          { id: 'plateria', name: 'Platería', isActive: false, order: 12 },
          { id: 'san-antonio', name: 'San Antonio', isActive: false, order: 13 },
          { id: 'tiquillaca', name: 'Tiquillaca', isActive: false, order: 14 },
          { id: 'vilque', name: 'Vilque', isActive: false, order: 15 }
        ]
      }
    ]
  },
  {
    id: 'san-martin',
    name: 'San Martín',
    isActive: false,
    order: 22,
    isExpanded: false,
    provinces: [
      {
        id: 'moyobamba',
        name: 'Moyobamba',
        isActive: false,
        order: 1,
        districts: [
          { id: 'moyobamba-dist', name: 'Moyobamba', isActive: false, order: 1 },
          { id: 'calzada', name: 'Calzada', isActive: false, order: 2 },
          { id: 'habana', name: 'Habana', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'tacna',
    name: 'Tacna',
    isActive: true,
    order: 23,
    isExpanded: false,
    provinces: [
      {
        id: 'tacna-prov',
        name: 'Tacna',
        isActive: true,
        order: 1,
        districts: [
          { id: 'tacna-dist', name: 'Tacna', isActive: true, order: 1 },
          { id: 'alto-alianza', name: 'Alto de la Alianza', isActive: true, order: 2 },
          { id: 'calana', name: 'Calana', isActive: true, order: 3 },
          { id: 'ciudad-nueva', name: 'Ciudad Nueva', isActive: true, order: 4 },
          { id: 'inclan', name: 'Inclán', isActive: true, order: 5 },
          { id: 'pachia', name: 'Pachía', isActive: true, order: 6 },
          { id: 'palca', name: 'Palca', isActive: true, order: 7 },
          { id: 'pocollay', name: 'Pocollay', isActive: true, order: 8 },
          { id: 'sama', name: 'Sama', isActive: true, order: 9 },
          { id: 'coronel-gregorio-albarracin-lanchipa', name: 'Coronel Gregorio Albarracín Lanchipa', isActive: true, order: 10 }
        ]
      },
      {
        id: 'candarave',
        name: 'Candarave',
        isActive: true,
        order: 2,
        districts: [
          { id: 'candarave-dist', name: 'Candarave', isActive: true, order: 1 },
          { id: 'cairani', name: 'Cairani', isActive: true, order: 2 },
          { id: 'camilaca', name: 'Camilaca', isActive: true, order: 3 },
          { id: 'curibaya', name: 'Curibaya', isActive: true, order: 4 },
          { id: 'huanuara', name: 'Huanuara', isActive: true, order: 5 },
          { id: 'quilahuani', name: 'Quilahuani', isActive: true, order: 6 }
        ]
      },
      {
        id: 'jorge-basadre',
        name: 'Jorge Basadre',
        isActive: true,
        order: 3,
        districts: [
          { id: 'locumba', name: 'Locumba', isActive: true, order: 1 },
          { id: 'ilabaya', name: 'Ilabaya', isActive: true, order: 2 },
          { id: 'ite', name: 'Ite', isActive: true, order: 3 }
        ]
      },
      {
        id: 'tarata',
        name: 'Tarata',
        isActive: true,
        order: 4,
        districts: [
          { id: 'tarata-dist', name: 'Tarata', isActive: true, order: 1 },
          { id: 'heroes-albarracin', name: 'Héroes Albarracín', isActive: true, order: 2 },
          { id: 'estique', name: 'Estique', isActive: true, order: 3 },
          { id: 'estique-pampa', name: 'Estique-Pampa', isActive: true, order: 4 },
          { id: 'sitajara', name: 'Sitajara', isActive: true, order: 5 },
          { id: 'susapaya', name: 'Susapaya', isActive: true, order: 6 },
          { id: 'tarucachi', name: 'Tarucachi', isActive: true, order: 7 },
          { id: 'ticaco', name: 'Ticaco', isActive: true, order: 8 }
        ]
      }
    ]
  },
  {
    id: 'tumbes',
    name: 'Tumbes',
    isActive: false,
    order: 24,
    isExpanded: false,
    provinces: [
      {
        id: 'tumbes-prov',
        name: 'Tumbes',
        isActive: false,
        order: 1,
        districts: [
          { id: 'tumbes-dist', name: 'Tumbes', isActive: false, order: 1 },
          { id: 'corrales', name: 'Corrales', isActive: false, order: 2 },
          { id: 'la-cruz', name: 'La Cruz', isActive: false, order: 3 }
        ]
      }
    ]
  },
  {
    id: 'ucayali',
    name: 'Ucayali',
    isActive: false,
    order: 25,
    isExpanded: false,
    provinces: [
      {
        id: 'coronel-portillo',
        name: 'Coronel Portillo',
        isActive: false,
        order: 1,
        districts: [
          { id: 'calleria', name: 'Callería', isActive: false, order: 1 },
          { id: 'campoverde', name: 'Campoverde', isActive: false, order: 2 },
          { id: 'iparia', name: 'Iparía', isActive: false, order: 3 }
        ]
      }
    ]
  }
];

// Get locations from localStorage or return defaults
export const getLocations = (): Department[] => {
  try {
    const stored = localStorage.getItem('peruLocations');
    if (stored) {
      const locations = JSON.parse(stored);
      // Ensure locations have all required properties
      return locations.map((dept: any) => ({
        ...dept,
        isExpanded: dept.isExpanded || false,
        provinces: dept.provinces.map((prov: any) => ({
          ...prov,
          isExpanded: prov.isExpanded || false,
          districts: prov.districts || []
        }))
      }));
    }
  } catch (error) {
    console.error('Error loading locations:', error);
  }
  
  // Initialize with default locations
  saveLocations(defaultPeruLocations);
  return defaultPeruLocations;
};

// Save locations to localStorage
export const saveLocations = (locations: Department[]): void => {
  try {
    localStorage.setItem('peruLocations', JSON.stringify(locations));
    
    // Dispatch event to notify components of location changes
    window.dispatchEvent(new CustomEvent('locationsChanged', { detail: locations }));
  } catch (error) {
    console.error('Error saving locations:', error);
  }
};

// Get only active departments (for public display)
export const getActiveDepartments = (): Department[] => {
  return getLocations()
    .filter(dept => dept.isActive)
    .sort((a, b) => a.order - b.order)
    .map(dept => ({
      ...dept,
      provinces: dept.provinces
        .filter(prov => prov.isActive)
        .sort((a, b) => a.order - b.order)
        .map(prov => ({
          ...prov,
          districts: prov.districts
            .filter(dist => dist.isActive)
            .sort((a, b) => a.order - b.order)
        }))
    }));
};

// Get active districts for genius selection
export const getActiveDistricts = (): Array<{
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
  fullName: string;
}> => {
  const activeDepartments = getActiveDepartments();
  const districts: Array<{
    departmentId: string;
    departmentName: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
    fullName: string;
  }> = [];

  activeDepartments.forEach(dept => {
    dept.provinces.forEach(prov => {
      prov.districts.forEach(dist => {
        districts.push({
          departmentId: dept.id,
          departmentName: dept.name,
          provinceId: prov.id,
          provinceName: prov.name,
          districtId: dist.id,
          districtName: dist.name,
          fullName: `${dist.name}, ${prov.name}, ${dept.name}`
        });
      });
    });
  });

  return districts.sort((a, b) => a.fullName.localeCompare(b.fullName));
};

// Toggle department status
export const toggleDepartmentStatus = (departmentId: string): void => {
  const locations = getLocations();
  const updatedLocations = locations.map(dept => 
    dept.id === departmentId ? { ...dept, isActive: !dept.isActive } : dept
  );
  
  saveLocations(updatedLocations);
};

// Toggle province status
export const toggleProvinceStatus = (departmentId: string, provinceId: string): void => {
  const locations = getLocations();
  const updatedLocations = locations.map(dept => 
    dept.id === departmentId 
      ? { 
          ...dept, 
          provinces: dept.provinces.map(prov =>
            prov.id === provinceId 
              ? { ...prov, isActive: !prov.isActive }
              : prov
          )
        }
      : dept
  );
  
  saveLocations(updatedLocations);
};

// Toggle district status
export const toggleDistrictStatus = (departmentId: string, provinceId: string, districtId: string): void => {
  const locations = getLocations();
  const updatedLocations = locations.map(dept => 
    dept.id === departmentId 
      ? { 
          ...dept, 
          provinces: dept.provinces.map(prov =>
            prov.id === provinceId 
              ? { 
                  ...prov, 
                  districts: prov.districts.map(dist =>
                    dist.id === districtId 
                      ? { ...dist, isActive: !dist.isActive }
                      : dist
                  )
                }
              : prov
          )
        }
      : dept
  );
  
  saveLocations(updatedLocations);
};

// Get department by ID
export const getDepartmentById = (id: string): Department | null => {
  const locations = getLocations();
  return locations.find(dept => dept.id === id) || null;
};

// Get province by ID
export const getProvinceById = (departmentId: string, provinceId: string): Province | null => {
  const department = getDepartmentById(departmentId);
  if (!department) return null;
  return department.provinces.find(prov => prov.id === provinceId) || null;
};

// Get district by ID
export const getDistrictById = (departmentId: string, provinceId: string, districtId: string): District | null => {
  const province = getProvinceById(departmentId, provinceId);
  if (!province) return null;
  return province.districts.find(dist => dist.id === districtId) || null;
};

// Export locations data
export const exportLocations = (): void => {
  const locations = getLocations();
  const dataStr = JSON.stringify(locations, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `ubicaciones_peru_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Get location statistics
export const getLocationStatistics = () => {
  const locations = getLocations();
  
  let totalDepartments = 0;
  let activeDepartments = 0;
  let totalProvinces = 0;
  let activeProvinces = 0;
  let totalDistricts = 0;
  let activeDistricts = 0;

  locations.forEach(dept => {
    totalDepartments++;
    if (dept.isActive) activeDepartments++;

    dept.provinces.forEach(prov => {
      totalProvinces++;
      if (prov.isActive) activeProvinces++;

      prov.districts.forEach(dist => {
        totalDistricts++;
        if (dist.isActive) activeDistricts++;
      });
    });
  });

  return {
    departments: { total: totalDepartments, active: activeDepartments },
    provinces: { total: totalProvinces, active: activeProvinces },
    districts: { total: totalDistricts, active: activeDistricts }
  };
};

// Search locations
export const searchLocations = (query: string): Array<{
  type: 'department' | 'province' | 'district';
  departmentId: string;
  departmentName: string;
  provinceId?: string;
  provinceName?: string;
  districtId?: string;
  districtName?: string;
  fullPath: string;
}> => {
  const locations = getLocations();
  const results: Array<{
    type: 'department' | 'province' | 'district';
    departmentId: string;
    departmentName: string;
    provinceId?: string;
    provinceName?: string;
    districtId?: string;
    districtName?: string;
    fullPath: string;
  }> = [];
  const lowercaseQuery = query.toLowerCase();

  locations.forEach(dept => {
    // Search departments
    if (dept.name.toLowerCase().includes(lowercaseQuery)) {
      results.push({
        type: 'department',
        departmentId: dept.id,
        departmentName: dept.name,
        fullPath: dept.name
      });
    }

    dept.provinces.forEach(prov => {
      // Search provinces
      if (prov.name.toLowerCase().includes(lowercaseQuery)) {
        results.push({
          type: 'province',
          departmentId: dept.id,
          departmentName: dept.name,
          provinceId: prov.id,
          provinceName: prov.name,
          fullPath: `${prov.name}, ${dept.name}`
        });
      }

      prov.districts.forEach(dist => {
        // Search districts
        if (dist.name.toLowerCase().includes(lowercaseQuery)) {
          results.push({
            type: 'district',
            departmentId: dept.id,
            departmentName: dept.name,
            provinceId: prov.id,
            provinceName: prov.name,
            districtId: dist.id,
            districtName: dist.name,
            fullPath: `${dist.name}, ${prov.name}, ${dept.name}`
          });
        }
      });
    });
  });

  return results.slice(0, 20); // Limit results
};

export interface HomeLocation {
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
}

export type CoverageType = 'all-department' | 'all-province' | 'my-district' | 'custom';

export const getAllDistrictsInDepartment = (departmentId: string): Array<{
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
}> => {
  const department = getDepartmentById(departmentId);
  if (!department) return [];

  const districts: Array<{
    departmentId: string;
    departmentName: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
  }> = [];

  department.provinces.forEach(prov => {
    if (prov.isActive) {
      prov.districts.forEach(dist => {
        if (dist.isActive) {
          districts.push({
            departmentId: department.id,
            departmentName: department.name,
            provinceId: prov.id,
            provinceName: prov.name,
            districtId: dist.id,
            districtName: dist.name
          });
        }
      });
    }
  });

  return districts;
};

export const getAllDistrictsInProvince = (departmentId: string, provinceId: string): Array<{
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
}> => {
  const department = getDepartmentById(departmentId);
  if (!department) return [];

  const province = department.provinces.find(p => p.id === provinceId);
  if (!province || !province.isActive) return [];

  const districts: Array<{
    departmentId: string;
    departmentName: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
  }> = [];

  province.districts.forEach(dist => {
    if (dist.isActive) {
      districts.push({
        departmentId: department.id,
        departmentName: department.name,
        provinceId: province.id,
        provinceName: province.name,
        districtId: dist.id,
        districtName: dist.name
      });
    }
  });

  return districts;
};

export const expandCoverageToDistricts = (
  homeLocation: HomeLocation,
  coverageType: CoverageType,
  customDistricts?: Array<{
    departmentId: string;
    departmentName: string;
    provinceId: string;
    provinceName: string;
    districtId: string;
    districtName: string;
  }>
): Array<{
  departmentId: string;
  departmentName: string;
  provinceId: string;
  provinceName: string;
  districtId: string;
  districtName: string;
}> => {
  switch (coverageType) {
    case 'all-department':
      return getAllDistrictsInDepartment(homeLocation.departmentId);

    case 'all-province':
      return getAllDistrictsInProvince(homeLocation.departmentId, homeLocation.provinceId);

    case 'my-district':
      return [{
        departmentId: homeLocation.departmentId,
        departmentName: homeLocation.departmentName,
        provinceId: homeLocation.provinceId,
        provinceName: homeLocation.provinceName,
        districtId: homeLocation.districtId,
        districtName: homeLocation.districtName
      }];

    case 'custom':
      return customDistricts || [];

    default:
      return [];
  }
};

export const formatCoverageDisplay = (
  coverageType: CoverageType,
  districtCount: number,
  locationName: string
): string => {
  switch (coverageType) {
    case 'all-department':
      return `Todo ${locationName} (${districtCount} distrito${districtCount !== 1 ? 's' : ''})`;

    case 'all-province':
      return `Toda provincia de ${locationName} (${districtCount} distrito${districtCount !== 1 ? 's' : ''})`;

    case 'my-district':
      return locationName;

    case 'custom':
      return `${districtCount} distrito${districtCount !== 1 ? 's' : ''} seleccionado${districtCount !== 1 ? 's' : ''}`;

    default:
      return '';
  }
};
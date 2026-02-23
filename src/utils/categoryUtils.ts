// Category management utility functions

export interface Subcategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  order: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  emoji: string;
  color: string;
  isActive: boolean;
  order: number;
  subcategories: Subcategory[];
  isExpanded?: boolean;
}

// Default categories data
const defaultCategories: Category[] = [
  {
    id: '1',
    name: 'Diseño y Creatividad',
    description: 'Servicios relacionados con diseño gráfico, branding e ilustración',
    icon: 'palette',
    emoji: '🎨',
    color: '#A0C4FF',
    isActive: true,
    order: 1,
    isExpanded: false,
    subcategories: [
      { id: '1-1', name: 'Diseño Gráfico', description: 'Logos, flyers, material publicitario', isActive: true, order: 1 },
      { id: '1-2', name: 'Branding', description: 'Identidad corporativa y marca', isActive: true, order: 2 },
      { id: '1-3', name: 'Ilustración', description: 'Ilustraciones digitales y tradicionales', isActive: true, order: 3 }
    ]
  },
  {
    id: '2',
    name: 'Servicios Técnicos',
    description: 'Reparaciones y servicios técnicos especializados',
    icon: 'wrench',
    emoji: '🔧',
    color: '#FFADAD',
    isActive: true,
    order: 2,
    isExpanded: false,
    subcategories: [
      { id: '2-1', name: 'Electricista', description: 'Instalaciones y reparaciones eléctricas', isActive: true, order: 1 },
      { id: '2-2', name: 'Gasfitería', description: 'Plomería y sistemas de agua', isActive: true, order: 2 },
      { id: '2-3', name: 'Técnico en Computadoras', description: 'Reparación y mantenimiento de PC', isActive: true, order: 3 },
      { id: '2-4', name: 'Aire Acondicionado', description: 'Instalación y reparación de sistemas de climatización', isActive: true, order: 4 }
    ]
  },
  {
    id: '3',
    name: 'Belleza y Estética',
    description: 'Servicios de belleza y cuidado personal',
    icon: 'sparkles',
    emoji: '💄',
    color: '#C0FDFB',
    isActive: true,
    order: 3,
    isExpanded: false,
    subcategories: [
      { id: '3-1', name: 'Maquillaje', description: 'Maquillaje para eventos y ocasiones especiales', isActive: true, order: 1 },
      { id: '3-2', name: 'Peluquería', description: 'Cortes, peinados y tratamientos capilares', isActive: true, order: 2 },
      { id: '3-3', name: 'Manicure y Pedicure', description: 'Cuidado de uñas y tratamientos', isActive: true, order: 3 },
      { id: '3-4', name: 'Barbería', description: 'Cortes y arreglos masculinos', isActive: true, order: 4 }
    ]
  },
  {
    id: '4',
    name: 'Servicios Profesionales',
    description: 'Consultores, asesores, diseñadores, programadores y más',
    icon: 'briefcase',
    emoji: '💼',
    color: '#FFD6A5',
    isActive: true,
    order: 4,
    isExpanded: false,
    subcategories: [
      { id: '4-1', name: 'Desarrollo Web', description: 'Creación de sitios web y aplicaciones', isActive: true, order: 1 },
      { id: '4-2', name: 'Marketing Digital', description: 'Estrategias de marketing online', isActive: true, order: 2 },
      { id: '4-3', name: 'Consultoría', description: 'Asesoría empresarial y profesional', isActive: true, order: 3 },
      { id: '4-4', name: 'Fotografía', description: 'Sesiones fotográficas profesionales', isActive: true, order: 4 }
    ]
  },
  {
    id: '5',
    name: 'Servicios para el Hogar',
    description: 'Limpieza, jardinería, pintura, remodelaciones',
    icon: 'home',
    emoji: '🏠',
    color: '#FDFD96',
    isActive: true,
    order: 5,
    isExpanded: false,
    subcategories: [
      { id: '5-1', name: 'Limpieza', description: 'Servicios de limpieza doméstica y comercial', isActive: true, order: 1 },
      { id: '5-2', name: 'Jardinería', description: 'Mantenimiento y diseño de jardines', isActive: true, order: 2 },
      { id: '5-3', name: 'Pintura', description: 'Pintura de interiores y exteriores', isActive: true, order: 3 },
      { id: '5-4', name: 'Carpintería', description: 'Trabajos en madera y muebles', isActive: true, order: 4 },
      { id: '5-5', name: 'Mudanzas', description: 'Servicios de mudanza y transporte', isActive: true, order: 5 }
    ]
  },
  {
    id: '6',
    name: 'Eventos y Entretenimiento',
    description: 'Músicos, animadores, fotógrafos, organizadores',
    icon: 'music',
    emoji: '🎵',
    color: '#E6E6FA',
    isActive: true,
    order: 6,
    isExpanded: false,
    subcategories: [
      { id: '6-1', name: 'DJ', description: 'Música para eventos y fiestas', isActive: true, order: 1 },
      { id: '6-2', name: 'Animadores', description: 'Entretenimiento para eventos infantiles', isActive: true, order: 2 },
      { id: '6-3', name: 'Catering', description: 'Servicios de comida para eventos', isActive: true, order: 3 },
      { id: '6-4', name: 'Decoración', description: 'Decoración para eventos especiales', isActive: true, order: 4 },
      { id: '6-5', name: 'Músicos', description: 'Música en vivo para eventos', isActive: true, order: 5 }
    ]
  },
  {
    id: '7',
    name: 'Salud y Bienestar',
    description: 'Nutricionistas, entrenadores personales, masajistas',
    icon: 'heart',
    emoji: '❤️',
    color: '#98FB98',
    isActive: true,
    order: 7,
    isExpanded: false,
    subcategories: [
      { id: '7-1', name: 'Psicología', description: 'Terapia y consulta psicológica', isActive: true, order: 1 },
      { id: '7-2', name: 'Nutrición', description: 'Planes alimentarios y asesoría nutricional', isActive: true, order: 2 },
      { id: '7-3', name: 'Fisioterapia', description: 'Rehabilitación y terapia física', isActive: true, order: 3 },
      { id: '7-4', name: 'Entrenamiento Personal', description: 'Rutinas de ejercicio personalizadas', isActive: true, order: 4 }
    ]
  }
];

// Get categories from localStorage or return defaults
export const getCategories = (): Category[] => {
  try {
    const stored = localStorage.getItem('categories');
    if (stored) {
      const categories = JSON.parse(stored);
      // Ensure categories have all required properties
      return categories.map((cat: any) => ({
        ...cat,
        isExpanded: cat.isExpanded || false,
        subcategories: cat.subcategories || []
      }));
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  }
  
  // Initialize with default categories
  saveCategories(defaultCategories);
  return defaultCategories;
};

// Save categories to localStorage
export const saveCategories = (categories: Category[]): void => {
  try {
    localStorage.setItem('categories', JSON.stringify(categories));
    
    // Dispatch event to notify components of category changes
    window.dispatchEvent(new CustomEvent('categoriesChanged', { detail: categories }));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
};

// Get only active categories (for public display)
export const getActiveCategories = (): Category[] => {
  return getCategories()
    .filter(cat => cat.isActive)
    .sort((a, b) => a.order - b.order)
    .map(cat => ({
      ...cat,
      subcategories: cat.subcategories
        .filter(sub => sub.isActive)
        .sort((a, b) => a.order - b.order)
    }));
};

// Get category by ID
export const getCategoryById = (id: string): Category | null => {
  const categories = getCategories();
  return categories.find(cat => cat.id === id) || null;
};

// Update category order
export const updateCategoryOrder = (categoryId: string, newOrder: number): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => 
    cat.id === categoryId ? { ...cat, order: newOrder } : cat
  );
  
  // Re-sort by order
  updatedCategories.sort((a, b) => a.order - b.order);
  
  saveCategories(updatedCategories);
};

// Reorder categories array
export const reorderCategories = (categories: Category[]): Category[] => {
  return categories
    .map((cat, index) => ({ ...cat, order: index + 1 }))
    .sort((a, b) => a.order - b.order);
};

// Add new category
export const addCategory = (category: Omit<Category, 'id' | 'order'>): Category => {
  const categories = getCategories();
  const newCategory: Category = {
    ...category,
    id: Date.now().toString(),
    order: categories.length + 1,
    isExpanded: false
  };
  
  const updatedCategories = [...categories, newCategory];
  saveCategories(updatedCategories);
  
  return newCategory;
};

// Update existing category
export const updateCategory = (categoryId: string, updates: Partial<Category>): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => 
    cat.id === categoryId ? { ...cat, ...updates } : cat
  );
  
  saveCategories(updatedCategories);
};

// Delete category
export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.filter(cat => cat.id !== categoryId);
  
  saveCategories(updatedCategories);
};

// Add subcategory to category
export const addSubcategory = (categoryId: string, subcategory: Omit<Subcategory, 'id' | 'order'>): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => {
    if (cat.id === categoryId) {
      const newSubcategory: Subcategory = {
        ...subcategory,
        id: `${categoryId}-${Date.now()}`,
        order: cat.subcategories.length + 1
      };
      
      return {
        ...cat,
        subcategories: [...cat.subcategories, newSubcategory]
      };
    }
    return cat;
  });
  
  saveCategories(updatedCategories);
};

// Delete subcategory
export const deleteSubcategory = (categoryId: string, subcategoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => 
    cat.id === categoryId 
      ? { 
          ...cat, 
          subcategories: cat.subcategories.filter(sub => sub.id !== subcategoryId)
        }
      : cat
  );
  
  saveCategories(updatedCategories);
};

// Toggle category status
export const toggleCategoryStatus = (categoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => 
    cat.id === categoryId ? { ...cat, isActive: !cat.isActive } : cat
  );
  
  saveCategories(updatedCategories);
};

// Toggle subcategory status
export const toggleSubcategoryStatus = (categoryId: string, subcategoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.map(cat => 
    cat.id === categoryId 
      ? { 
          ...cat, 
          subcategories: cat.subcategories.map(sub =>
            sub.id === subcategoryId 
              ? { ...sub, isActive: !sub.isActive }
              : sub
          )
        }
      : cat
  );
  
  saveCategories(updatedCategories);
};

// Export categories to JSON
export const exportCategories = (): void => {
  const categories = getCategories();
  const dataStr = JSON.stringify(categories, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `categorias_${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

// Import categories from JSON
export const importCategories = (file: File): Promise<Category[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const categories = JSON.parse(e.target?.result as string);
        saveCategories(categories);
        resolve(categories);
      } catch (error) {
        reject(new Error('Error al procesar el archivo JSON'));
      }
    };
    
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsText(file);
  });
};
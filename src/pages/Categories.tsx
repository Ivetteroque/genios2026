import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, Star, MapPin, MessageSquare, CheckCircle, ChevronDown, ChevronUp, ArrowLeft, Filter, X, ChevronRight } from 'lucide-react';
import { createSlug } from '../utils/commonUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { getActiveDepartments, Department, Province, District, getActiveDistricts } from '../utils/locationUtils';
import { getCurrentUser, isAuthenticated } from '../utils/authUtils';
import { handleWhatsAppContact } from '../utils/whatsappUtils';
import FavoriteButton from '../components/FavoriteButton';
import GeniusAvailabilityBadge from '../components/GeniusAvailabilityBadge';

interface Professional {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  subcategory: string;
  verified: boolean;
  available: boolean;
  description: string;
  phone: string;
  departmentId: string;
  provinceId: string;
  districtId: string;
}

const Categories: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<Province[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [locationFilters, setLocationFilters] = useState({
    department: '',
    province: '',
    district: ''
  });
  const [showLocationFilters, setShowLocationFilters] = useState(false);
  const [hasInitializedUserLocation, setHasInitializedUserLocation] = useState(false);

  // Mock professionals data with more variety and phone numbers
  const allProfessionals: Professional[] = [
    {
      id: '1',
      name: 'Ana Estilista',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.9,
      reviews: 23,
      category: 'Belleza y Estética',
      subcategory: 'Maquillaje',
      verified: true,
      available: true,
      description: 'Especialista en maquillaje para eventos y novias',
      phone: '51999123456',
      departmentId: 'tacna',
      provinceId: 'tacna-prov',
      districtId: 'tacna-dist'
    },
    {
      id: '2',
      name: 'Luis Técnico',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.8,
      reviews: 12,
      category: 'Servicios Técnicos',
      subcategory: 'Electricista',
      verified: true,
      available: false,
      description: 'Electricista certificado con 10 años de experiencia',
      phone: '51987654321',
      departmentId: 'tacna',
      provinceId: 'tacna-prov',
      districtId: 'ciudad-nueva'
    },
    {
      id: '3',
      name: 'Sofía Nutricionista',
      image: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 5.0,
      reviews: 33,
      category: 'Salud y Bienestar',
      subcategory: 'Nutrición',
      verified: true,
      available: true,
      description: 'Nutricionista especializada en planes personalizados',
      phone: '51976543210',
      departmentId: 'lima',
      provinceId: 'lima-prov',
      districtId: 'miraflores-lima'
    },
    {
      id: '4',
      name: 'Diego Desarrollador',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.7,
      reviews: 44,
      category: 'Servicios Profesionales',
      subcategory: 'Desarrollo Web',
      verified: true,
      available: true,
      description: 'Desarrollador full-stack especializado en React y Node.js',
      phone: '51965432109',
      departmentId: 'lima',
      provinceId: 'lima-prov',
      districtId: 'san-isidro'
    },
    {
      id: '5',
      name: 'Carmen Limpieza',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.8,
      reviews: 18,
      category: 'Servicios para el Hogar',
      subcategory: 'Limpieza',
      verified: true,
      available: true,
      description: 'Servicio de limpieza profesional para hogares y oficinas',
      phone: '51954321098',
      departmentId: 'tacna',
      provinceId: 'tacna-prov',
      districtId: 'alto-alianza'
    },
    {
      id: '6',
      name: 'Roberto DJ',
      image: 'https://images.pexels.com/photos/1587927/pexels-photo-1587927.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.9,
      reviews: 27,
      category: 'Eventos y Entretenimiento',
      subcategory: 'DJ',
      verified: true,
      available: true,
      description: 'DJ profesional para bodas, fiestas y eventos corporativos',
      phone: '51943210987',
      departmentId: 'tacna',
      provinceId: 'tacna-prov',
      districtId: 'pocollay'
    },
    {
      id: '7',
      name: 'María Diseñadora',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.6,
      reviews: 15,
      category: 'Diseño y Creatividad',
      subcategory: 'Diseño Gráfico',
      verified: true,
      available: true,
      description: 'Diseñadora gráfica especializada en branding e identidad corporativa',
      phone: '51932109876',
      departmentId: 'lima',
      provinceId: 'lima-prov',
      districtId: 'san-borja'
    },
    {
      id: '8',
      name: 'Carlos Gasfitero',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
      rating: 4.7,
      reviews: 21,
      category: 'Servicios Técnicos',
      subcategory: 'Gasfitería',
      verified: true,
      available: true,
      description: 'Gasfitero profesional para reparaciones e instalaciones',
      phone: '51921098765',
      departmentId: 'tacna',
      provinceId: 'tacna-prov',
      districtId: 'tacna-dist'
    }
  ];

  const [activeFilters, setActiveFilters] = useState({
    rating4Plus: false,
    availableToday: false,
    nearMe: false,
    verified: false,
    withWhatsapp: false
  });

  // Helper function to create URL-friendly category name
  const createCategorySlug = createSlug;

  // Helper function to find category by slug
  const findCategoryBySlug = (slug: string, categoriesList: Category[]) => {
    return categoriesList.find(cat => createCategorySlug(cat.name) === slug);
  };

  // Scroll to top when component mounts or category changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug]);

  // Load categories on component mount and listen for changes
  useEffect(() => {
    loadCategories();
    loadActiveDepartments();
    
    // Update current user state
    setCurrentUser(getCurrentUser());

    // Listen for category changes from admin panel
    const handleCategoriesChanged = (event: CustomEvent) => {
      loadCategories();
    };

    // Listen for location changes from admin panel
    const handleLocationsChanged = (event: CustomEvent) => {
      loadActiveDepartments();
    };
    
    // Listen for auth state changes
    const handleAuthStateChanged = () => {
      setCurrentUser(getCurrentUser());
      setHasInitializedUserLocation(false); // Reset to allow re-initialization
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
    window.addEventListener('locationsChanged', handleLocationsChanged as EventListener);
    window.addEventListener('authStateChanged', handleAuthStateChanged);

    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
      window.removeEventListener('locationsChanged', handleLocationsChanged as EventListener);
      window.removeEventListener('authStateChanged', handleAuthStateChanged);
    };
  }, []);

  // Update selected category when URL changes
  useEffect(() => {
    if (categorySlug && categories.length > 0) {
      const category = findCategoryBySlug(categorySlug, categories);
      setSelectedCategory(category || null);
    } else {
      setSelectedCategory(null);
    }
  }, [categorySlug, categories]);

  // Update available provinces when department changes
  useEffect(() => {
    if (locationFilters.department) {
      const department = activeDepartments.find(dept => dept.id === locationFilters.department);
      setAvailableProvinces(department?.provinces || []);
      
      // Reset province and district when department changes
      setLocationFilters(prev => ({
        ...prev,
        province: '',
        district: ''
      }));
    } else {
      setAvailableProvinces([]);
    }
  }, [locationFilters.department, activeDepartments]);

  // Update available districts when province changes
  useEffect(() => {
    if (locationFilters.province) {
      const province = availableProvinces.find(prov => prov.id === locationFilters.province);
      setAvailableDistricts(province?.districts || []);
      
      // Reset district when province changes
      setLocationFilters(prev => ({
        ...prev,
        district: ''
      }));
    } else {
      setAvailableDistricts([]);
    }
  }, [locationFilters.province, availableProvinces]);

  // Initialize location filters with user's location (only once)
  useEffect(() => {
    if (currentUser && currentUser.location && !hasInitializedUserLocation && activeDepartments.length > 0) {
      // Only set if no manual filters have been applied
      if (!locationFilters.department && !locationFilters.province && !locationFilters.district) {
        setLocationFilters({
          department: currentUser.location.departmentId,
          province: currentUser.location.provinceId,
          district: currentUser.location.districtId
        });
        setHasInitializedUserLocation(true);
        console.log('Initialized location filters with user location:', currentUser.location.fullName);
      }
    }
  }, [currentUser, activeDepartments, hasInitializedUserLocation, locationFilters]);

  // Filter professionals based on selected category and search
  useEffect(() => {
    let filtered = allProfessionals;

    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter(prof => prof.category === selectedCategory.name);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(prof =>
        prof.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prof.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply additional filters
    if (activeFilters.rating4Plus) {
      filtered = filtered.filter(prof => prof.rating >= 4.0);
    }
    if (activeFilters.availableToday) {
      filtered = filtered.filter(prof => prof.available);
    }
    if (activeFilters.verified) {
      filtered = filtered.filter(prof => prof.verified);
    }

    // Apply location filters
    if (locationFilters.department) {
      filtered = filtered.filter(prof => prof.departmentId === locationFilters.department);
    }
    if (locationFilters.province) {
      filtered = filtered.filter(prof => prof.provinceId === locationFilters.province);
    }
    if (locationFilters.district) {
      filtered = filtered.filter(prof => prof.districtId === locationFilters.district);
    }

    setFilteredProfessionals(filtered);
  }, [selectedCategory, searchTerm, activeFilters, locationFilters, allProfessionals]);

  const loadCategories = () => {
    const activeCategories = getActiveCategories();
    setCategories(activeCategories.map(cat => ({
      ...cat,
      isExpanded: false
    })));
  };

  const loadActiveDepartments = () => {
    const departments = getActiveDepartments();
    setActiveDepartments(departments);
  };

  const toggleCategoryAccordion = (categoryId: string) => {
    setCategories(categories.map(category => 
      category.id === categoryId 
        ? { ...category, isExpanded: !category.isExpanded }
        : category
    ));
  };

  const clearFilters = () => {
    setActiveFilters({
      rating4Plus: false,
      availableToday: false,
      nearMe: false,
      verified: false,
      withWhatsapp: false
    });
    setLocationFilters({
      department: '',
      province: '',
      district: ''
    });
  };

  // Handle WhatsApp contact
  const handleContactClick = (professional: Professional) => {
    handleWhatsAppContact(
      professional.id,
      professional.name,
      professional.category,
      professional.phone
    );
  };

  // Handle profile view click
  const handleProfileClick = (professionalId: string) => {
    // Navigate to profile page and scroll to top
    window.location.href = `/profile/${professionalId}`;
  };

  // Get available provinces for selected department
  const getAvailableProvinces = (): Province[] => {
    if (!locationFilters.department) return [];
    const department = activeDepartments.find(dept => dept.id === locationFilters.department);
    return department?.provinces || [];
  };

  // Get available districts for selected province
  const getAvailableDistricts = (): District[] => {
    if (!locationFilters.province) return [];
    const provinces = getAvailableProvinces();
    const province = provinces.find(prov => prov.id === locationFilters.province);
    return province?.districts || [];
  };

  // Handle location filter changes
  const handleLocationFilterChange = (level: 'department' | 'province' | 'district', value: string) => {
    setLocationFilters(prev => {
      const newFilters = { ...prev };
      
      if (level === 'department') {
        newFilters.department = value;
        newFilters.province = ''; // Reset province when department changes
        newFilters.district = ''; // Reset district when department changes
      } else if (level === 'province') {
        newFilters.province = value;
        newFilters.district = ''; // Reset district when province changes
      } else {
        newFilters.district = value;
      }
      
      return newFilters;
    });
  };

  // Clear location filters
  const clearLocationFilters = () => {
    setLocationFilters({
      department: '',
      province: '',
      district: ''
    });
  };

  // Check if any location filter is active
  const hasActiveLocationFilters = () => {
    return locationFilters.department || locationFilters.province || locationFilters.district;
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb and Back Button */}
        {selectedCategory && (
          <div className="mb-6">
            <Link 
              to="/"
              className="inline-flex items-center text-primary hover:text-primary-dark transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Link>
            <div className="flex items-center text-sm text-gray-600">
              <Link to="/" className="hover:text-primary transition-colors">Inicio</Link>
              <span className="mx-2">›</span>
              <Link to="/categories" className="hover:text-primary transition-colors">Categorías</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-800 font-medium">{selectedCategory.name}</span>
            </div>
          </div>
        )}

        {/* Category Header */}
        {selectedCategory && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center mb-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl mr-4"
                style={{ backgroundColor: selectedCategory.color }}
              >
                {selectedCategory.emoji}
              </div>
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-gray-800">
                  {selectedCategory.name}
                </h1>
                <p className="text-gray-600 mt-1">{selectedCategory.description}</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {filteredProfessionals.length} especialistas encontrados
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
              <h2 className="font-heading text-xl font-bold mb-4">📂 Filtros y Categorías</h2>
              
              <div className="space-y-2">
                {categories.map(category => (
                  <div key={category.id} className="overflow-hidden">
                    <button
                      onClick={() => toggleCategoryAccordion(category.id)}
                      className={`flex items-center justify-between w-full text-left font-medium transition-colors p-3 hover:bg-gray-50 ${
                        selectedCategory?.id === category.id ? 'bg-primary/10 text-primary' : 'text-text hover:text-primary'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{category.emoji}</span>
                        <span>{category.name}</span>
                      </div>
                      {category.subcategories.length > 0 && (
                        <ChevronRight 
                          className={`w-4 h-4 transition-transform ${
                            category.isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
                      )}
                    </button>
                    
                    {category.isExpanded && category.subcategories.length > 0 && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        <ul className="p-3 space-y-2">
                          {category.subcategories.map(sub => (
                            <li key={sub.id}>
                              <Link
                                to={`/categorias/${createCategorySlug(category.name)}`}
                                onClick={() => setSearchTerm(sub.name)}
                                className="text-text/60 hover:text-primary transition-colors block py-2 px-3 rounded hover:bg-white text-left w-full text-sm"
                              >
                                {sub.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8 text-text/60">
                  <p className="text-sm">No hay categorías disponibles</p>
                </div>
              )}

              
              {/* Location Filters */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowLocationFilters(!showLocationFilters)}
                  className="flex items-center justify-between w-full text-left font-medium transition-colors p-3 hover:bg-gray-50 text-text"
                >
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Filtrar por ubicación</span>
                  </div>
                  <ChevronRight 
                    className={`w-4 h-4 transition-transform ${
                      showLocationFilters ? 'rotate-90' : ''
                    }`} 
                  />
                </button>

                {showLocationFilters && (
                  <div className="bg-gray-50 border-t border-gray-200 p-3 space-y-3">
                    {/* Department Filter */}
                    <div>
                      <label className="block text-sm font-medium text-text/70 mb-1">
                        Departamento:
                      </label>
                      <select
                        value={locationFilters.department}
                        onChange={(e) => handleLocationFilterChange('department', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                      >
                        <option value="">Todos los departamentos</option>
                        {activeDepartments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Province Filter */}
                    {locationFilters.department && (
                      <div>
                        <label className="block text-sm font-medium text-text/70 mb-1">
                          Provincia:
                        </label>
                        <select
                          value={locationFilters.province}
                          onChange={(e) => handleLocationFilterChange('province', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                        >
                          <option value="">Todas las provincias</option>
                          {availableProvinces.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* District Filter */}
                    {locationFilters.province && (
                      <div>
                        <label className="block text-sm font-medium text-text/70 mb-1">
                          Distrito:
                        </label>
                        <select
                          value={locationFilters.district}
                          onChange={(e) => handleLocationFilterChange('district', e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 text-sm"
                        >
                          <option value="">Todos los distritos</option>
                          {availableDistricts.map(dist => (
                            <option key={dist.id} value={dist.id}>{dist.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Clear Location Filters */}
                    {hasActiveLocationFilters() && (
                      <button
                        onClick={clearLocationFilters}
                        className="text-red-500 hover:text-red-600 text-sm font-medium flex items-center"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Limpiar filtros de ubicación
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-3/4">
            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder={selectedCategory ? `Buscar en ${selectedCategory.name}...` : "Ej: peluquero, gasfitero, coach, DJ..."}
                  className="w-full pl-12 pr-4 py-3 rounded-full border border-text/10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-text/40" size={20} />
              </div>

              {/* Filters */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, rating4Plus: !prev.rating4Plus }))}
                  className={`flex items-center px-4 py-2 rounded-full text-sm ${
                    activeFilters.rating4Plus 
                      ? 'bg-primary text-text' 
                      : 'bg-text/5 text-text/60'
                  }`}
                >
                  <Star size={16} className="mr-1" />
                  4.0+
                </button>
                
                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, availableToday: !prev.availableToday }))}
                  className={`flex items-center px-4 py-2 rounded-full text-sm ${
                    activeFilters.availableToday 
                      ? 'bg-primary text-text' 
                      : 'bg-text/5 text-text/60'
                  }`}
                >
                  Disponible hoy
                </button>

                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, nearMe: !prev.nearMe }))}
                  className={`flex items-center px-4 py-2 rounded-full text-sm ${
                    activeFilters.nearMe 
                      ? 'bg-primary text-text' 
                      : 'bg-text/5 text-text/60'
                  }`}
                >
                  <MapPin size={16} className="mr-1" />
                  Cerca de mí
                </button>

                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, withWhatsapp: !prev.withWhatsapp }))}
                  className={`flex items-center px-4 py-2 rounded-full text-sm ${
                    activeFilters.withWhatsapp 
                      ? 'bg-primary text-text' 
                      : 'bg-text/5 text-text/60'
                  }`}
                >
                  <MessageSquare size={16} className="mr-1" />
                  Con WhatsApp
                </button>

                <button
                  onClick={() => setActiveFilters(prev => ({ ...prev, verified: !prev.verified }))}
                  className={`flex items-center px-4 py-2 rounded-full text-sm ${
                    activeFilters.verified 
                      ? 'bg-primary text-text' 
                      : 'bg-text/5 text-text/60'
                  }`}
                >
                  <CheckCircle size={16} className="mr-1" />
                  Verificados
                </button>

                {Object.values(activeFilters).some(Boolean) && (
                  <button
                    onClick={clearFilters}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    Limpiar todos los filtros
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map(professional => (
                <div key={professional.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={professional.image} 
                      alt={professional.name}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Status badges */}
                    <div className="absolute top-2 left-2 flex flex-col space-y-1">
                      {professional.verified && (
                        <div className="bg-success/80 text-text px-2 py-1 rounded-full text-sm backdrop-blur-sm">
                          ✓ Verificado
                        </div>
                      )}
                      <GeniusAvailabilityBadge geniusId={professional.id} />
                    </div>

                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2">
                      <FavoriteButton
                        genius={{
                          id: professional.id,
                          name: professional.name,
                          category: professional.category,
                          subcategory: professional.subcategory,
                          image: professional.image,
                          rating: professional.rating,
                          available: professional.available,
                          phone: professional.phone
                        }}
                        size="sm"
                        showTooltip={true}
                      />
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-heading font-bold text-lg mb-1">{professional.name}</h3>
                    <p className="text-text/60 text-sm mb-1">{professional.subcategory}</p>
                    <p className="text-text/50 text-xs mb-3">{professional.description}</p>
                    
                    <div className="flex items-center mb-4">
                      <Star className="text-primary" size={16} />
                      <span className="ml-1 font-medium">{professional.rating}</span>
                      <span className="text-text/40 text-sm ml-1">({professional.reviews} reseñas)</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleProfileClick(professional.id)}
                        className="flex-1 bg-primary text-text text-center py-2 rounded-full hover:bg-primary-dark transition-colors"
                      >
                        Ver perfil
                      </button>
                      <button 
                        onClick={() => handleContactClick(professional)}
                        className="flex-1 bg-secondary text-text text-center py-2 rounded-full hover:bg-secondary-dark transition-colors"
                      >
                        Contactar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* No results message */}
            {filteredProfessionals.length === 0 && (
              <div className="text-center py-12 text-text/60">
                <p className="text-lg font-medium mb-2">
                  {selectedCategory 
                    ? `No se encontraron especialistas en ${selectedCategory.name}` 
                    : 'No se encontraron profesionales'
                  }
                </p>
                <p>Intenta ajustar los filtros de búsqueda</p>
                {selectedCategory && (
                  <Link 
                    to="/categories"
                    className="inline-block mt-4 text-primary hover:text-primary-dark transition-colors"
                  >
                    Ver todas las categorías
                  </Link>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Categories;
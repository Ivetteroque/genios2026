import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Search, Star, MapPin, MessageSquare, CheckCircle, ArrowLeft, X, SlidersHorizontal } from 'lucide-react';
import { createSlug } from '../utils/commonUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { getActiveDepartments, Department, Province, District } from '../utils/locationUtils';
import { handleWhatsAppContact } from '../utils/whatsappUtils';
import FavoriteButton from '../components/FavoriteButton';
import GeniusAvailabilityBadge from '../components/GeniusAvailabilityBadge';
import { getPublicGeniusDirectory, DirectoryGenius } from '../services/publicGeniusDirectoryService';

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
  workLocations: Array<{ departmentId?: string; provinceId?: string; districtId?: string }>;
  /** Todo lo buscable, sin tildes ni mayúsculas. */
  searchText: string;
}

/** "Albañil" y "albanil" deben encontrar lo mismo. */
const normalizeText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/** Un perfil del directorio, en la forma que consume la tarjeta de resultados. */
const toProfessional = (genius: DirectoryGenius): Professional => ({
  id: genius.id,
  name: genius.full_name,
  image: genius.profile_photo,
  rating: genius.rating,
  reviews: genius.reviews_count,
  category: genius.category,
  subcategory: genius.subcategories[0] || genius.service_name || genius.category,
  verified: genius.is_verified,
  available: genius.is_available_today,
  description: genius.description,
  phone: genius.phone,
  departmentId: genius.home_location?.departmentId ?? '',
  provinceId: genius.home_location?.provinceId ?? '',
  districtId: genius.home_location?.districtId ?? '',
  workLocations: genius.work_locations ?? [],
  searchText: normalizeText([
    genius.full_name, genius.category, genius.service_name, genius.description, ...(genius.subcategories ?? []),
  ].filter(Boolean).join(' ')),
});

/**
 * Un genio coincide con el filtro de ubicación si vive ahí o si declaró esa
 * zona dentro de su cobertura de trabajo.
 */
const matchesLocation = (
  professional: Professional,
  level: 'departmentId' | 'provinceId' | 'districtId',
  value: string
): boolean => {
  if (!value) return true;
  if (professional[level] === value) return true;
  return professional.workLocations.some((location) => location?.[level] === value);
};

const SUPPORT_WHATSAPP = '51952719641';

const Categories: React.FC = () => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') ?? '');
  // Si se busca desde el menú estando ya en esta página, la URL cambia
  // (?q=...) y el buscador tiene que reflejarlo.
  const urlQuery = searchParams.get('q');
  useEffect(() => {
    if (urlQuery !== null) setSearchTerm(urlQuery);
  }, [urlQuery]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [filteredProfessionals, setFilteredProfessionals] = useState<Professional[]>([]);
  const [activeDepartments, setActiveDepartments] = useState<Department[]>([]);
  const [locationFilters, setLocationFilters] = useState({
    department: '',
    province: '',
    district: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Solo filtros que funcionan de verdad ("Cerca de mí" y "Con WhatsApp" no
  // filtraban nada: todos los genios tienen WhatsApp, y la cercanía va por
  // el filtro de ubicación).
  const [activeFilters, setActiveFilters] = useState({
    rating4Plus: false,
    availableToday: false,
    verified: false
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


    // Listen for category changes from admin panel
    const handleCategoriesChanged = () => {
      loadCategories();
    };

    // Listen for location changes from admin panel
    const handleLocationsChanged = () => {
      loadActiveDepartments();
    };
    

    window.addEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
    window.addEventListener('locationsChanged', handleLocationsChanged as EventListener);

    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
      window.removeEventListener('locationsChanged', handleLocationsChanged as EventListener);
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

  // (Antes se filtraba en silencio por el distrito guardado del cliente y
  // podía ver "sin resultados" sin saber por qué. Ahora la ubicación solo se
  // filtra si la persona la elige.)

  // Cargar el directorio público de genios desde Supabase
  useEffect(() => {
    let cancelled = false;

    const loadProfessionals = async () => {
      setIsLoadingProfessionals(true);
      setLoadError(false);
      try {
        const directory = await getPublicGeniusDirectory();
        if (!cancelled) setProfessionals(directory.map(toProfessional));
      } catch (error) {
        console.error('Error loading genius directory:', error);
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoadingProfessionals(false);
      }
    };

    loadProfessionals();
    return () => {
      cancelled = true;
    };
  }, []);

  // Filter professionals based on selected category and search
  useEffect(() => {
    let filtered = professionals;

    // Filter by selected category
    if (selectedCategory) {
      filtered = filtered.filter(prof => prof.category === selectedCategory.name);
    }

    // Filter by search term
    // Cada palabra tiene que aparecer en algún lado (sin tildes ni mayúsculas).
    const words = normalizeText(searchTerm).split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      filtered = filtered.filter(prof => words.every(word => prof.searchText.includes(word)));
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

    // Apply location filters (vive ahí o declaró la zona en su cobertura)
    filtered = filtered.filter(prof =>
      matchesLocation(prof, 'departmentId', locationFilters.department) &&
      matchesLocation(prof, 'provinceId', locationFilters.province) &&
      matchesLocation(prof, 'districtId', locationFilters.district)
    );

    setFilteredProfessionals(filtered);
  }, [selectedCategory, searchTerm, activeFilters, locationFilters, professionals]);

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

  const clearFilters = () => {
    setActiveFilters({
      rating4Plus: false,
      availableToday: false,
      verified: false
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

  // Check if any location filter is active
  const hasActiveLocationFilters = () => {
    return locationFilters.department || locationFilters.province || locationFilters.district;
  };

  // ─── Datos para la vista ────────────────────────────────────────────────
  const countByCategory = professionals.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
  // Primero las categorías que ya tienen genios; las vacías ("pronto") al final.
  const sortedCategories = [...categories].sort(
    (a, b) => Number((countByCategory[b.name] ?? 0) > 0) - Number((countByCategory[a.name] ?? 0) > 0)
  );
  const activeFilterCount =
    Object.values(activeFilters).filter(Boolean).length + (hasActiveLocationFilters() ? 1 : 0);
  const locationLabel = (() => {
    const dept = activeDepartments.find((d) => d.id === locationFilters.department);
    const prov = dept?.provinces.find((p) => p.id === locationFilters.province);
    const dist = prov?.districts.find((d) => d.id === locationFilters.district);
    return dist?.name ?? prov?.name ?? dept?.name ?? '';
  })();
  const whatYouSearch = searchTerm.trim() || selectedCategory?.name || '';
  const helpWhatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
    whatYouSearch
      ? `Hola, estoy buscando ${whatYouSearch} en Tacna y no encontré en Genios. ¿Me ayudan?`
      : 'Hola, estoy buscando a alguien en Genios y no lo encontré. ¿Me ayudan?'
  )}`;
  const resetAll = () => {
    clearFilters();
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Título */}
        <div className="mb-4">
          {selectedCategory && (
            <Link to="/categories" className="inline-flex items-center text-sm text-text/60 hover:text-text mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Todas las categorías
            </Link>
          )}
          <h1 className="font-heading text-2xl md:text-3xl font-semibold text-text">
            {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : 'Buscar genios'}
          </h1>
          {selectedCategory?.description && <p className="text-text/60 mt-1">{selectedCategory.description}</p>}
        </div>

        {/* Buscador */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text/40" size={20} />
          <input
            type="search"
            placeholder={selectedCategory ? `Buscar en ${selectedCategory.name}…` : 'Ej: gasfitero, maquillaje, clases de inglés…'}
            aria-label="Buscar genios"
            className="w-full h-12 pl-12 pr-12 rounded-full border border-gray-200 bg-white text-[16px] focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} aria-label="Borrar búsqueda" className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-text/40 hover:text-text">
              <X size={18} />
            </button>
          )}
        </div>

        {/* Categorías: se tocan para elegir. En el celular se deslizan de lado. */}
        <div className="-mx-4 px-4 overflow-x-auto pb-2 mb-2" role="navigation" aria-label="Categorías">
          <div className="flex gap-2 w-max">
            <Link
              to="/categories"
              className={`shrink-0 h-10 px-4 rounded-full border text-sm flex items-center transition-colors ${
                !selectedCategory ? 'bg-text text-white border-text' : 'bg-white border-gray-200 text-text/75 hover:border-primary'
              }`}
            >
              Todas
            </Link>
            {sortedCategories.map((category) => {
              const count = countByCategory[category.name] ?? 0;
              const active = selectedCategory?.id === category.id;
              return (
                <Link
                  key={category.id}
                  to={`/categorias/${createCategorySlug(category.name)}`}
                  aria-current={active ? 'page' : undefined}
                  className={`shrink-0 h-10 px-4 rounded-full border text-sm flex items-center gap-1.5 transition-colors ${
                    active ? 'bg-text text-white border-text' : 'bg-white border-gray-200 text-text/75 hover:border-primary'
                  }`}
                >
                  <span aria-hidden="true">{category.emoji}</span>
                  {category.name}
                  <span className={active ? 'text-white/70' : 'text-text/40'}>{count > 0 ? count : 'pronto'}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Especialidades de la categoría elegida */}
        {selectedCategory && selectedCategory.subcategories.length > 0 && (
          <div className="-mx-4 px-4 overflow-x-auto pb-2 mb-2">
            <div className="flex gap-2 w-max">
              {selectedCategory.subcategories.map((sub) => {
                const on = normalizeText(searchTerm) === normalizeText(sub.name);
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSearchTerm(on ? '' : sub.name)}
                    aria-pressed={on}
                    className={`shrink-0 h-9 px-3.5 rounded-full text-sm transition-colors ${
                      on ? 'bg-primary text-text font-medium' : 'bg-surface-blue text-text/70 hover:bg-primary/40'
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Barra de resultados + filtros */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <p className="text-sm text-text/60" aria-live="polite">
            {isLoadingProfessionals ? 'Buscando…' : `${filteredProfessionals.length} ${filteredProfessionals.length === 1 ? 'genio' : 'genios'}${locationLabel ? ` en ${locationLabel}` : ''}`}
          </p>
          <button
            onClick={() => setShowFilters(true)}
            className="shrink-0 inline-flex items-center gap-2 h-10 px-4 rounded-full border border-gray-200 bg-white text-sm font-medium text-text hover:border-primary"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="min-w-5 h-5 px-1.5 rounded-full bg-text text-white text-xs flex items-center justify-center">{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* Estado de carga */}
        {isLoadingProfessionals && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error de carga */}
        {!isLoadingProfessionals && loadError && (
          <div className="text-center py-12">
            <p className="text-lg font-medium text-text mb-2">No pudimos cargar los genios</p>
            <p className="text-text/60 mb-4">Revisa tu conexión e inténtalo de nuevo.</p>
            <button onClick={() => window.location.reload()} className="bg-primary text-text px-6 py-2.5 rounded-full hover:bg-primary-dark transition-colors">
              Reintentar
            </button>
          </div>
        )}

        {/* Resultados */}
        {!isLoadingProfessionals && !loadError && filteredProfessionals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProfessionals.map(professional => (
              <article key={professional.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <Link to={`/profile/${professional.id}`} className="relative block" aria-label={`Ver el perfil de ${professional.name}`}>
                  {professional.image ? (
                    <img src={professional.image} alt="" loading="lazy" decoding="async" className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-surface-blue flex items-center justify-center">
                      <span className="font-heading font-bold text-3xl text-ink-blue">{professional.name.trim().charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {professional.verified && (
                      <span className="bg-white/95 text-ink-blue px-2 py-1 rounded-full text-xs font-medium">✓ Verificado</span>
                    )}
                    <GeniusAvailabilityBadge geniusId={professional.id} />
                  </div>
                </Link>
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/profile/${professional.id}`} className="min-w-0">
                      <h3 className="font-heading font-semibold text-lg text-text truncate">{professional.name}</h3>
                      <p className="text-text/60 text-sm truncate">{professional.subcategory}</p>
                    </Link>
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
                  <p className="text-text/55 text-sm mt-2 line-clamp-2">{professional.description}</p>
                  <div className="flex items-center gap-1 mt-3 text-sm">
                    {professional.reviews > 0 ? (
                      <>
                        <Star className="text-amber-400 fill-amber-400" size={15} />
                        <span className="font-medium">{professional.rating}</span>
                        <span className="text-text/45">({professional.reviews} {professional.reviews === 1 ? 'reseña' : 'reseñas'})</span>
                      </>
                    ) : (
                      <span className="text-text/45">Nuevo en Genios</span>
                    )}
                  </div>
                  <div className="flex gap-2 pt-4 mt-auto">
                    <Link to={`/profile/${professional.id}`} className="flex-1 h-11 flex items-center justify-center rounded-full border border-gray-200 text-text font-medium hover:bg-surface-blue transition-colors">
                      Ver perfil
                    </Link>
                    <button
                      onClick={() => handleContactClick(professional)}
                      className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold transition-colors"
                    >
                      <MessageSquare size={16} /> WhatsApp
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Sin resultados: siempre una salida */}
        {!isLoadingProfessionals && !loadError && filteredProfessionals.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-8 sm:p-10 text-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-full bg-surface-blue flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-ink-blue" />
            </div>
            {activeFilterCount > 0 && professionals.length > 0 ? (
              <>
                <h2 className="font-heading text-xl font-semibold text-text mb-1">Ningún genio con esos filtros</h2>
                <p className="text-text/60 mb-5">Prueba quitando algunos filtros.</p>
                <button onClick={clearFilters} className="h-11 px-6 rounded-full bg-text text-white font-semibold">Quitar filtros</button>
              </>
            ) : (
              <>
                <h2 className="font-heading text-xl font-semibold text-text mb-1">
                  {whatYouSearch ? `Todavía no hay genios de “${whatYouSearch}”` : 'Todavía no hay genios aquí'}
                </h2>
                <p className="text-text/60 mb-6">Genios recién empieza en Tacna. Escríbenos y te ayudamos a encontrar a alguien.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a href={helpWhatsappUrl} target="_blank" rel="noopener noreferrer"
                    className="h-12 px-6 inline-flex items-center justify-center gap-2 rounded-full bg-green-500 hover:bg-green-600 text-white font-semibold">
                    <MessageSquare size={18} /> Te lo conseguimos
                  </a>
                  {(searchTerm || selectedCategory) && (
                    <Link to="/categories" onClick={resetAll} className="h-12 px-6 inline-flex items-center justify-center rounded-full border border-gray-200 text-text font-medium hover:bg-surface-blue">
                      Ver todos los genios
                    </Link>
                  )}
                </div>
              </>
            )}
            <p className="text-sm text-text/55 mt-6 pt-5 border-t border-gray-100">
              ¿Tú haces esto? <Link to="/ser-genio" className="text-ink-blue font-medium underline underline-offset-4">Únete como genio</Link>
            </p>
          </div>
        )}
      </div>

      {/* Panel de filtros: sube desde abajo en el celular, centrado en computadora */}
      {showFilters && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowFilters(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-heading text-lg font-semibold text-text">Filtros</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Cerrar filtros" className="p-2 -mr-2 rounded-lg text-text/40 hover:text-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 pb-4 overflow-y-auto space-y-6">
              <div>
                <p className="text-sm font-semibold text-text/80 mb-2">Mostrar solo</p>
                <div className="space-y-2">
                  {([
                    { key: 'availableToday', label: 'Disponibles hoy', icon: CheckCircle },
                    { key: 'verified', label: 'Con DNI verificado', icon: CheckCircle },
                    { key: 'rating4Plus', label: 'Con 4 estrellas o más', icon: Star },
                  ] as const).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveFilters(prev => ({ ...prev, [key]: !prev[key] }))}
                      aria-pressed={activeFilters[key]}
                      className={`w-full h-12 px-4 rounded-xl border flex items-center gap-3 text-left transition-colors ${
                        activeFilters[key] ? 'border-primary bg-primary/25 text-text font-medium' : 'border-gray-200 text-text/75'
                      }`}
                    >
                      <Icon className="w-5 h-5 text-ink-blue" />
                      <span className="flex-1">{label}</span>
                      <span className={`w-5 h-5 rounded-md border flex items-center justify-center ${activeFilters[key] ? 'bg-ink-blue border-ink-blue text-white' : 'border-gray-300'}`}>
                        {activeFilters[key] && '✓'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-text/80 mb-2 flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Zona</p>
                <div className="space-y-2">
                  <select
                    value={locationFilters.department}
                    onChange={(e) => handleLocationFilterChange('department', e.target.value)}
                    aria-label="Departamento"
                    className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[16px]"
                  >
                    <option value="">Cualquier departamento</option>
                    {activeDepartments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {locationFilters.department && (
                    <select
                      value={locationFilters.province}
                      onChange={(e) => handleLocationFilterChange('province', e.target.value)}
                      aria-label="Provincia"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[16px]"
                    >
                      <option value="">Cualquier provincia</option>
                      {getAvailableProvinces().map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                  {locationFilters.province && (
                    <select
                      value={locationFilters.district}
                      onChange={(e) => handleLocationFilterChange('district', e.target.value)}
                      aria-label="Distrito"
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-[16px]"
                    >
                      <option value="">Cualquier distrito</option>
                      {getAvailableDistricts().map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-gray-100" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
              <button onClick={clearFilters} className="flex-1 h-12 rounded-xl border border-gray-200 text-text font-medium">Limpiar</button>
              <button onClick={() => setShowFilters(false)} className="flex-[2] h-12 rounded-xl bg-text text-white font-semibold">
                Ver {filteredProfessionals.length} {filteredProfessionals.length === 1 ? 'genio' : 'genios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;

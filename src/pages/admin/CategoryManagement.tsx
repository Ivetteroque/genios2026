import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  GripVertical, 
  Eye,
  EyeOff,
  Upload,
  Palette,
  Tag,
  ChevronDown,
  ChevronRight,
  Search,
  Filter,
  Download,
  MoreVertical,
  Move,
  RefreshCw
} from 'lucide-react';
import {
  Category,
  Subcategory,
  getCategories,
  saveCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  deleteSubcategory,
  toggleCategoryStatus,
  toggleSubcategoryStatus,
  exportCategories,
  reorderCategories
} from '../../utils/categoryUtils';
import StatusBadge from '../../components/StatusBadge';
import LocationToggle from '../../components/LocationToggle';

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: '',
    icon: 'tag',
    emoji: '📋',
    color: '#A0C4FF',
    isActive: true,
    subcategories: []
  });

  const [newSubcategory, setNewSubcategory] = useState<Partial<Subcategory>>({
    name: '',
    description: '',
    isActive: true
  });

  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string | null>(null);

  const colorOptions = [
    '#A0C4FF', '#FFADAD', '#C0FDFB', '#FFD6A5', '#FDFD96', 
    '#E6E6FA', '#98FB98', '#F0E68C', '#DDA0DD', '#87CEEB'
  ];

  const emojiOptions = [
    '🎨', '🔧', '💄', '🏠', '🎵', '💻', '📱', '🚗', '🍳', '📚',
    '💡', '🔨', '✂️', '🎭', '📸', '🎯', '⚡', '🌟', '🎪', '💼'
  ];

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const loadedCategories = getCategories();
    setCategories(loadedCategories);
    setHasUnsavedChanges(false);
  };

  // Filter categories based on search and active filter
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterActive === 'all' || 
                         (filterActive === 'active' && category.isActive) ||
                         (filterActive === 'inactive' && !category.isActive);
    
    return matchesSearch && matchesFilter;
  }).sort((a, b) => a.order - b.order);

  // Mark changes as unsaved when categories are modified
  const markAsChanged = () => {
    setHasUnsavedChanges(true);
  };

  // Handle updating all changes
  const handleUpdateChanges = async () => {
    setIsUpdating(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save categories and dispatch event
      saveCategories(categories);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('categoriesChanged', { detail: categories }));
      
      setHasUnsavedChanges(false);
      
      // Show success message
      alert('✅ ¡Cambios actualizados exitosamente!\n\nTodas las modificaciones se han aplicado y están visibles en la página pública.');
      
    } catch (error) {
      console.error('Error updating categories:', error);
      alert('❌ Error al actualizar los cambios. Intenta nuevamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, categoryId: string) => {
    setDraggedItem(categoryId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, categoryId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(categoryId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e: React.DragEvent, targetCategoryId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetCategoryId) {
      setDraggedItem(null);
      setDragOverItem(null);
      return;
    }

    const draggedIndex = categories.findIndex(cat => cat.id === draggedItem);
    const targetIndex = categories.findIndex(cat => cat.id === targetCategoryId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Create new array with reordered items
    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(targetIndex, 0, draggedCategory);

    // Update order numbers
    const reorderedCategories = reorderCategories(newCategories);
    
    setCategories(reorderedCategories);
    markAsChanged();
    
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;

    const category = addCategory({
      name: newCategory.name,
      description: newCategory.description || '',
      icon: newCategory.icon || 'tag',
      emoji: newCategory.emoji || '📋',
      color: newCategory.color || '#A0C4FF',
      isActive: true,
      subcategories: []
    });

    loadCategories(); // Reload to get updated data
    setNewCategory({
      name: '',
      description: '',
      icon: 'tag',
      emoji: '📋',
      color: '#A0C4FF',
      isActive: true,
      subcategories: []
    });
    setShowAddModal(false);
    markAsChanged();
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory({ ...category });
    setShowEditModal(true);
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name) return;

    updateCategory(editingCategory.id, {
      name: newCategory.name,
      description: newCategory.description,
      emoji: newCategory.emoji,
      color: newCategory.color
    });

    loadCategories(); // Reload to get updated data
    setEditingCategory(null);
    setNewCategory({
      name: '',
      description: '',
      icon: 'tag',
      emoji: '📋',
      color: '#A0C4FF',
      isActive: true,
      subcategories: []
    });
    setShowEditModal(false);
    markAsChanged();
  };

  const handleDeleteCategory = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const confirmDelete = window.confirm(
      `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?\n\nEsta acción también eliminará todas sus subcategorías.`
    );

    if (confirmDelete) {
      deleteCategory(categoryId);
      loadCategories(); // Reload to get updated data
      markAsChanged();
    }
  };

  const handleToggleCategoryStatus = (categoryId: string) => {
    toggleCategoryStatus(categoryId);
    loadCategories(); // Reload to get updated data
    markAsChanged();
  };

  const handleToggleCategoryExpansion = (categoryId: string) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId 
        ? { ...cat, isExpanded: !cat.isExpanded }
        : cat
    ));
  };

  const handleAddSubcategory = () => {
    if (!newSubcategory.name || !selectedCategoryForSub) return;

    addSubcategory(selectedCategoryForSub, {
      name: newSubcategory.name,
      description: newSubcategory.description || '',
      isActive: true
    });

    loadCategories(); // Reload to get updated data
    setNewSubcategory({
      name: '',
      description: '',
      isActive: true
    });
    setShowSubcategoryModal(false);
    setSelectedCategoryForSub(null);
    markAsChanged();
  };

  const handleDeleteSubcategory = (categoryId: string, subcategoryId: string) => {
    const confirmDelete = window.confirm('¿Estás seguro de que quieres eliminar esta subcategoría?');
    
    if (confirmDelete) {
      deleteSubcategory(categoryId, subcategoryId);
      loadCategories(); // Reload to get updated data
      markAsChanged();
    }
  };

  const handleToggleSubcategoryStatus = (categoryId: string, subcategoryId: string) => {
    toggleSubcategoryStatus(categoryId, subcategoryId);
    loadCategories(); // Reload to get updated data
    markAsChanged();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-text">Gestión de Categorías</h1>
          <p className="text-text/60 mt-1">Administra las categorías y subcategorías de servicios</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportCategories}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-text rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* Update Changes Button */}
      {hasUnsavedChanges && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-orange-800">Cambios Pendientes</h3>
                <p className="text-orange-700 text-sm">
                  Tienes modificaciones sin aplicar. Actualiza para que sean visibles en la página pública.
                </p>
              </div>
            </div>
            
            <button
              onClick={handleUpdateChanges}
              disabled={isUpdating}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg ${
                isUpdating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-success hover:bg-success-dark text-white transform hover:scale-105'
              }`}
              style={{ fontFamily: 'Open Sans, sans-serif', fontWeight: '600' }}
            >
              {isUpdating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                  <span>Actualizando...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>🔄 Actualizar Cambios</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text/40 w-4 h-4" />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-text/60" />
              <select
                value={filterActive}
                onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
              >
                <option value="all">Todas</option>
                <option value="active">Activas</option>
                <option value="inactive">Inactivas</option>
              </select>
            </div>
          </div>

          <div className="text-text/60 text-sm">
            {filteredCategories.length} de {categories.length} categorías
          </div>
        </div>
      </div>

      {/* Drag & Drop Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Move className="w-5 h-5 text-blue-600" />
          <p className="text-blue-800 font-medium">Arrastra y suelta las categorías para reordenarlas</p>
        </div>
        <p className="text-blue-600 text-sm mt-1">
          El orden aquí se reflejará automáticamente en la página pública de categorías
        </p>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div 
                key={category.id} 
                className={`border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 ${
                  dragOverItem === category.id ? 'border-primary bg-primary/5 scale-105' : ''
                } ${
                  draggedItem === category.id ? 'opacity-50 scale-95' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, category.id)}
                onDragOver={(e) => handleDragOver(e, category.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, category.id)}
              >
                {/* Category Header */}
                <div className="p-4 bg-gray-50 flex items-center justify-between cursor-move">
                  <div className="flex items-center space-x-4">
                    <GripVertical className="w-5 h-5 text-text/40" />
                    
                    <button
                      onClick={() => handleToggleCategoryExpansion(category.id)}
                      className="text-text/60 hover:text-text transition-colors"
                    >
                      {category.isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>

                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: category.color }}
                    >
                      {category.emoji}
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-text">{category.name}</h3>
                      <p className="text-text/60 text-sm">{category.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-text/40">
                          Orden: {category.order}
                        </span>
                        <span className="text-xs text-text/40">•</span>
                        <span className="text-xs text-text/40">
                          {category.subcategories.length} subcategorías
                        </span>
                        <StatusBadge 
                          status={category.isActive ? 'active' : 'inactive'}
                          size="sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <LocationToggle
                      isActive={category.isActive}
                      onToggle={() => handleToggleCategoryStatus(category.id)}
                    />

                    <button
                      onClick={() => {
                        setSelectedCategoryForSub(category.id);
                        setShowSubcategoryModal(true);
                      }}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Añadir subcategoría"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Editar categoría"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {category.isExpanded && (
                  <div className="p-4 space-y-2">
                    {category.subcategories.length === 0 ? (
                      <div className="text-center py-8 text-text/60">
                        <p>No hay subcategorías en esta categoría</p>
                        <button
                          onClick={() => {
                            setSelectedCategoryForSub(category.id);
                            setShowSubcategoryModal(true);
                          }}
                          className="mt-2 text-primary hover:text-primary-dark transition-colors"
                        >
                          Añadir la primera subcategoría
                        </button>
                      </div>
                    ) : (
                      category.subcategories.map((subcategory) => (
                        <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-4 h-4 text-text/40" />
                            <div>
                              <h4 className="font-medium text-text">{subcategory.name}</h4>
                              <p className="text-text/60 text-sm">{subcategory.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <StatusBadge 
                              status={subcategory.isActive ? 'active' : 'inactive'}
                              size="sm"
                            />

                            <LocationToggle
                              isActive={subcategory.isActive}
                              onToggle={() => handleToggleSubcategoryStatus(category.id, subcategory.id)}
                              size="sm"
                            />
                            <button
                              onClick={() => handleDeleteSubcategory(category.id, subcategory.id)}
                              className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}

            {filteredCategories.length === 0 && (
              <div className="text-center py-12 text-text/60">
                <Tag className="w-12 h-12 mx-auto mb-4 text-text/40" />
                <p className="text-lg font-medium mb-2">No se encontraron categorías</p>
                <p>Intenta ajustar los filtros o crear una nueva categoría</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-xl font-bold text-text mb-4">Nueva Categoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  placeholder="Ej: Diseño y Creatividad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Descripción</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                  placeholder="Describe brevemente esta categoría..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Emoji</label>
                  <div className="grid grid-cols-5 gap-2">
                    {emojiOptions.slice(0, 10).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, emoji })}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          newCategory.emoji === emoji 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Color</label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.slice(0, 10).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                          newCategory.color === color 
                            ? 'border-gray-800' 
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.name}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  newCategory.name
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Crear Categoría
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-lg font-medium text-text/60 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {showEditModal && editingCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-xl font-bold text-text mb-4">Editar Categoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Descripción</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Emoji</label>
                  <div className="grid grid-cols-5 gap-2">
                    {emojiOptions.slice(0, 10).map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, emoji })}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          newCategory.emoji === emoji 
                            ? 'border-primary bg-primary/10' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text/80 mb-1">Color</label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.slice(0, 10).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={`w-8 h-8 rounded-lg border-2 transition-colors ${
                          newCategory.color === color 
                            ? 'border-gray-800' 
                            : 'border-gray-200'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleUpdateCategory}
                disabled={!newCategory.name}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  newCategory.name
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 rounded-lg font-medium text-text/60 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Subcategory Modal */}
      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="font-heading text-xl font-bold text-text mb-4">Nueva Subcategoría</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Nombre</label>
                <input
                  type="text"
                  value={newSubcategory.name}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                  placeholder="Ej: Diseño Gráfico"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text/80 mb-1">Descripción</label>
                <textarea
                  value={newSubcategory.description}
                  onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
                  placeholder="Describe esta subcategoría..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleAddSubcategory}
                disabled={!newSubcategory.name}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                  newSubcategory.name
                    ? 'bg-primary hover:bg-primary-dark text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Crear Subcategoría
              </button>
              <button
                onClick={() => {
                  setShowSubcategoryModal(false);
                  setSelectedCategoryForSub(null);
                }}
                className="flex-1 py-2 rounded-lg font-medium text-text/60 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
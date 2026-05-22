import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, GripVertical, ChevronRight, Search, Download, RefreshCw, X, Tag } from 'lucide-react';
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
  reorderCategories,
} from '../../utils/categoryUtils';

const inputClass =
  'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-text/20 focus:border-text/30 placeholder:text-text/25 text-text transition-colors';

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '', description: '', icon: 'tag', emoji: '📋', color: '#A0C4FF', isActive: true, subcategories: [],
  });

  const [newSubcategory, setNewSubcategory] = useState<Partial<Subcategory>>({
    name: '', description: '', isActive: true,
  });

  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string | null>(null);

  const colorOptions = ['#A0C4FF', '#FFADAD', '#C0FDFB', '#FFD6A5', '#FDFD96', '#E6E6FA', '#98FB98', '#F0E68C', '#DDA0DD', '#87CEEB'];
  const emojiOptions = ['🎨', '🔧', '💄', '🏠', '🎵', '💻', '📱', '🚗', '🍳', '📚', '💡', '🔨', '✂️', '🎭', '📸', '🎯', '⚡', '🌟', '🎪', '💼'];

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = () => {
    setCategories(getCategories());
    setHasUnsavedChanges(false);
  };

  const filteredCategories = categories
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFilter = filterActive === 'all' || (filterActive === 'active' && c.isActive) || (filterActive === 'inactive' && !c.isActive);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => a.order - b.order);

  const markAsChanged = () => setHasUnsavedChanges(true);

  const handleUpdateChanges = async () => {
    setIsUpdating(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      saveCategories(categories);
      window.dispatchEvent(new CustomEvent('categoriesChanged', { detail: categories }));
      setHasUnsavedChanges(false);
    } catch {
      alert('Error al actualizar los cambios.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) { setDraggedItem(null); setDragOverItem(null); return; }
    const from = categories.findIndex((c) => c.id === draggedItem);
    const to = categories.findIndex((c) => c.id === targetId);
    if (from === -1 || to === -1) return;
    const next = [...categories];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setCategories(reorderCategories(next));
    markAsChanged();
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;
    addCategory({ name: newCategory.name, description: newCategory.description || '', icon: newCategory.icon || 'tag', emoji: newCategory.emoji || '📋', color: newCategory.color || '#A0C4FF', isActive: true, subcategories: [] });
    loadCategories();
    setNewCategory({ name: '', description: '', icon: 'tag', emoji: '📋', color: '#A0C4FF', isActive: true, subcategories: [] });
    setShowAddModal(false);
    markAsChanged();
  };

  const handleUpdateCategory = () => {
    if (!editingCategory || !newCategory.name) return;
    updateCategory(editingCategory.id, { name: newCategory.name, description: newCategory.description, emoji: newCategory.emoji, color: newCategory.color });
    loadCategories();
    setEditingCategory(null);
    setShowEditModal(false);
    markAsChanged();
  };

  const handleDeleteCategory = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    if (!cat) return;
    if (window.confirm(`¿Eliminar "${cat.name}" y todas sus subcategorías?`)) {
      deleteCategory(id);
      loadCategories();
      markAsChanged();
    }
  };

  const handleAddSubcategory = () => {
    if (!newSubcategory.name || !selectedCategoryForSub) return;
    addSubcategory(selectedCategoryForSub, { name: newSubcategory.name, description: newSubcategory.description || '', isActive: true });
    loadCategories();
    setNewSubcategory({ name: '', description: '', isActive: true });
    setShowSubcategoryModal(false);
    setSelectedCategoryForSub(null);
    markAsChanged();
  };

  const handleDeleteSubcategory = (catId: string, subId: string) => {
    if (window.confirm('¿Eliminar esta subcategoría?')) {
      deleteSubcategory(catId, subId);
      loadCategories();
      markAsChanged();
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategory({ ...cat });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-lg font-semibold text-text">Categorías</h1>
          <p className="text-sm text-text/40 mt-0.5">Administra las categorías y subcategorías de servicios</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={exportCategories}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-text/55 bg-white border border-gray-200 hover:border-gray-300 hover:text-text transition-colors"
          >
            <Download style={{ width: '14px', height: '14px' }} />
            Exportar
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-white bg-text hover:bg-text/85 transition-colors"
          >
            <Plus style={{ width: '14px', height: '14px' }} />
            Nueva Categoría
          </button>
        </div>
      </div>

      {/* Unsaved changes notice */}
      {hasUnsavedChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-700">Tienes cambios sin publicar en la página pública.</p>
          <button
            onClick={handleUpdateChanges}
            disabled={isUpdating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors flex-shrink-0"
          >
            {isUpdating ? (
              <RefreshCw style={{ width: '13px', height: '13px' }} className="animate-spin" />
            ) : (
              <RefreshCw style={{ width: '13px', height: '13px' }} />
            )}
            {isUpdating ? 'Publicando...' : 'Publicar cambios'}
          </button>
        </div>
      )}

      {/* Search + filter bar */}
      <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text/25" />
          <input
            type="text"
            placeholder="Buscar categorías..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-text/15 focus:border-text/25 placeholder:text-text/25 transition-colors"
          />
        </div>
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-text/15 text-text/60 transition-colors"
        >
          <option value="all">Todas</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
        <span className="text-xs text-text/30 whitespace-nowrap ml-auto">
          {filteredCategories.length} de {categories.length}
        </span>
      </div>

      {/* Drag hint */}
      <p className="text-xs text-text/35 px-1">Arrastra las filas para cambiar el orden — se refleja en la página pública.</p>

      {/* Categories list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {filteredCategories.length === 0 ? (
          <div className="py-16 text-center">
            <Tag style={{ width: '32px', height: '32px' }} className="text-text/15 mx-auto mb-3" />
            <p className="text-sm text-text/40">No se encontraron categorías</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredCategories.map((category) => {
              const isExpanded = expandedIds.has(category.id);
              const isDragOver = dragOverItem === category.id;
              const isDragging = draggedItem === category.id;

              return (
                <div
                  key={category.id}
                  className={`transition-all duration-150 ${isDragOver ? 'bg-gray-50 ring-1 ring-inset ring-text/10' : ''} ${isDragging ? 'opacity-40' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, category.id)}
                  onDragOver={(e) => handleDragOver(e, category.id)}
                  onDragLeave={() => setDragOverItem(null)}
                  onDrop={(e) => handleDrop(e, category.id)}
                >
                  {/* Row */}
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    {/* Drag handle */}
                    <GripVertical style={{ width: '14px', height: '14px' }} className="text-text/15 flex-shrink-0 cursor-grab" />

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpanded(category.id)}
                      className="text-text/25 hover:text-text/55 transition-colors flex-shrink-0"
                    >
                      <ChevronRight
                        style={{ width: '14px', height: '14px', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 150ms' }}
                      />
                    </button>

                    {/* Emoji badge */}
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: `${category.color}40` }}
                    >
                      {category.emoji}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text truncate">{category.name}</p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${category.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text/40'}`}>
                          {category.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs text-text/35 truncate mt-0.5">{category.description}</p>
                      <p className="text-[10px] text-text/25 mt-0.5">
                        Orden {category.order} · {category.subcategories.length} subcategorías
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleCategoryStatus(category.id) || loadCategories() || markAsChanged()}
                        className="p-1.5 text-text/30 hover:text-text/60 hover:bg-gray-50 rounded-lg transition-colors"
                        title={category.isActive ? 'Desactivar' : 'Activar'}
                      >
                        <span className="text-[10px] font-medium">{category.isActive ? 'Off' : 'On'}</span>
                      </button>
                      <button
                        onClick={() => { setSelectedCategoryForSub(category.id); setShowSubcategoryModal(true); }}
                        className="p-1.5 text-text/30 hover:text-text/60 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Añadir subcategoría"
                      >
                        <Plus style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => openEditModal(category)}
                        className="p-1.5 text-text/30 hover:text-text/60 hover:bg-gray-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit style={{ width: '14px', height: '14px' }} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1.5 text-text/20 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 style={{ width: '14px', height: '14px' }} />
                      </button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div className="px-4 pb-3 pt-1 bg-gray-50/60">
                      {category.subcategories.length === 0 ? (
                        <div className="flex items-center gap-2 py-3 pl-10">
                          <p className="text-xs text-text/30">Sin subcategorías.</p>
                          <button
                            onClick={() => { setSelectedCategoryForSub(category.id); setShowSubcategoryModal(true); }}
                            className="text-xs text-text/45 underline underline-offset-1 hover:text-text/65 transition-colors"
                          >
                            Añadir
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1 pl-10">
                          {category.subcategories.map((sub) => (
                            <div key={sub.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-text truncate">{sub.name}</p>
                                {sub.description && <p className="text-[10px] text-text/35 truncate">{sub.description}</p>}
                              </div>
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${sub.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-text/40'}`}>
                                {sub.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                              <button
                                onClick={() => { toggleSubcategoryStatus(category.id, sub.id); loadCategories(); markAsChanged(); }}
                                className="p-1 text-text/25 hover:text-text/55 hover:bg-white rounded transition-colors"
                                title={sub.isActive ? 'Desactivar' : 'Activar'}
                              >
                                <span className="text-[9px] font-medium">{sub.isActive ? 'Off' : 'On'}</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSubcategory(category.id, sub.id)}
                                className="p-1 text-text/20 hover:text-red-400 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 style={{ width: '12px', height: '12px' }} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal */}
      {(showAddModal || showEditModal) && (
        <Modal
          title={showAddModal ? 'Nueva categoría' : 'Editar categoría'}
          onClose={() => { setShowAddModal(false); setShowEditModal(false); setEditingCategory(null); }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Nombre</label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className={inputClass}
                placeholder="Ej: Diseño y Creatividad"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Descripción</label>
              <textarea
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Describe brevemente esta categoría..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-text/45 mb-1.5">Emoji</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {emojiOptions.slice(0, 10).map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, emoji })}
                      className={`p-1.5 rounded-lg border text-base transition-colors ${newCategory.emoji === emoji ? 'border-text/30 bg-gray-100' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text/45 mb-1.5">Color</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-8 h-8 rounded-lg border-2 transition-colors ${newCategory.color === color ? 'border-text/40 scale-110' : 'border-transparent hover:border-gray-300'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={showAddModal ? handleAddCategory : handleUpdateCategory}
              disabled={!newCategory.name}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-text hover:bg-text/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {showAddModal ? 'Crear categoría' : 'Guardar cambios'}
            </button>
            <button
              onClick={() => { setShowAddModal(false); setShowEditModal(false); setEditingCategory(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-text/55 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}

      {/* Add Subcategory Modal */}
      {showSubcategoryModal && (
        <Modal
          title="Nueva subcategoría"
          onClose={() => { setShowSubcategoryModal(false); setSelectedCategoryForSub(null); }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Nombre</label>
              <input
                type="text"
                value={newSubcategory.name}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                className={inputClass}
                placeholder="Ej: Diseño Gráfico"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text/45 mb-1.5">Descripción</label>
              <textarea
                value={newSubcategory.description}
                onChange={(e) => setNewSubcategory({ ...newSubcategory, description: e.target.value })}
                rows={2}
                className={`${inputClass} resize-none`}
                placeholder="Describe esta subcategoría..."
              />
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={handleAddSubcategory}
              disabled={!newSubcategory.name}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-text hover:bg-text/85 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Crear subcategoría
            </button>
            <button
              onClick={() => { setShowSubcategoryModal(false); setSelectedCategoryForSub(null); }}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-text/55 hover:bg-gray-50 border border-gray-200 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="font-heading text-sm font-semibold text-text">{title}</h3>
        <button onClick={onClose} className="p-1 text-text/30 hover:text-text/60 transition-colors rounded-lg hover:bg-gray-50">
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

export default CategoryManagement;

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createSlug } from '../utils/commonUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories on component mount and listen for changes
  useEffect(() => {
    loadCategories();

    // Listen for category changes from admin panel
    const handleCategoriesChanged = (event: CustomEvent) => {
      loadCategories();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged as EventListener);

    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
    };
  }, []);

  const loadCategories = () => {
    const activeCategories = getActiveCategories();
    setCategories(activeCategories);
  };

  // Helper function to create URL-friendly category name
  const createCategorySlug = createSlug;

  return (
    <section id="categorias" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            🎯 ¿Qué necesitas hoy? Tenemos un genio para eso
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Explora nuestras categorías y encuentra exactamente el tipo de ayuda que estás buscando.
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {categories.map((category) => (
            <Link 
              key={category.id}
              to={`/categorias/${createCategorySlug(category.name)}`}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-primary/30 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{category.emoji}</span>
                  <span className="font-heading font-normal text-lg text-gray-600 group-hover:text-primary transition-colors">
                    {category.name}
                  </span>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  →
                </div>
              </div>
            </Link>
          ))}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg font-medium mb-2">No hay categorías disponibles</p>
            <p>Las categorías se están configurando. Vuelve pronto.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;
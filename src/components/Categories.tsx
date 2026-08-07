import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createSlug } from '../utils/commonUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();

    const handleCategoriesChanged = () => {
      loadCategories();
    };

    window.addEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
    return () => {
      window.removeEventListener('categoriesChanged', handleCategoriesChanged as EventListener);
    };
  }, []);

  const loadCategories = () => {
    setCategories(getActiveCategories());
  };

  return (
    <section id="categorias" className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text mb-3">
            ¿Qué necesitas hoy?
          </h2>
          <p className="text-base text-text/60 max-w-xl mx-auto">
            Elige una categoría y encuentra al genio que necesitas.
          </p>
        </div>

        {categories.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categorias/${createSlug(category.name)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-text/70 text-sm font-medium hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <span className="text-base leading-none">{category.emoji}</span>
                  <span>{category.name}</span>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link
                to="/categories"
                className="text-sm text-text/50 hover:text-primary transition-colors underline underline-offset-4"
              >
                Ver todas las categorías
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-text/50">
            <p className="text-base">Las categorías se están configurando. Vuelve pronto.</p>
          </div>
        )}
      </div>
    </section>
  );
};

export default Categories;

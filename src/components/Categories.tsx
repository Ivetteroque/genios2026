import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createSlug } from '../utils/commonUtils';
import { getActiveCategories, Category } from '../utils/categoryUtils';
import { Section, SectionHeader, Reveal } from './Section';

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
    <Section id="categorias" tone="blue">
      <SectionHeader
        tone="blue"
        eyebrow="Categorías"
        title="¿Qué necesitas hoy?"
        subtitle="Elige una categoría y encuentra al genio que necesitas."
      />

      {categories.length > 0 ? (
        <Reveal>
          <div className="flex flex-wrap gap-3 justify-center max-w-3xl mx-auto">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/categorias/${createSlug(category.name)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white bg-white text-text/75 text-sm font-medium hover:border-ink-blue/30 hover:text-ink-blue hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <span className="text-base leading-none">{category.emoji}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              to="/categories"
              className="text-sm text-ink-blue hover:text-text transition-colors underline underline-offset-4"
            >
              Ver todas las categorías
            </Link>
          </div>
        </Reveal>
      ) : (
        <div className="text-center py-12 text-text/60">
          <p className="text-base">Las categorías se están configurando. Vuelve pronto.</p>
        </div>
      )}
    </Section>
  );
};

export default Categories;

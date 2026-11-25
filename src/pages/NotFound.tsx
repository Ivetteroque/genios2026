import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

/** Cuando el enlace no existe: una salida clara en lugar de una página en blanco. */
const NotFound: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-12">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-5">
        <Compass className="w-8 h-8 text-ink-blue" />
      </div>
      <h1 className="font-heading text-2xl font-semibold text-text mb-2">No encontramos esta página</h1>
      <p className="text-text/60 mb-8">Puede que el enlace esté mal escrito o que la página ya no exista.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/categories" className="h-12 px-6 inline-flex items-center justify-center rounded-full bg-text text-white font-semibold">
          Buscar genios
        </Link>
        <Link to="/" className="h-12 px-6 inline-flex items-center justify-center rounded-full border border-gray-200 text-text font-medium hover:bg-surface-blue">
          Ir al inicio
        </Link>
      </div>
    </div>
  </div>
);

export default NotFound;

import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MessageCircle } from 'lucide-react';

/**
 * Pie de página solo con enlaces que llevan a algún lado. (Antes había redes
 * sociales, "Blog" y "Sobre nosotros" que no iban a ninguna parte, y dos fotos
 * de stock pesadas.) Las páginas legales se suman cuando estén escritas.
 */

const SUPPORT_WHATSAPP = '51952719641';

const Footer: React.FC = () => {
  const supportUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hola, tengo una consulta sobre Genios.')}`;
  const linkCls = 'text-white/75 hover:text-white transition-colors';

  return (
    <footer className="bg-brand-deep text-white border-t border-white/10 pt-14 md:pt-16 pb-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          <div className="max-w-xs">
            <Link to="/" className="flex items-center mb-3">
              <Briefcase className="text-primary mr-2" size={24} />
              <span className="font-heading font-bold text-xl">Genios</span>
            </Link>
            <p className="text-white/75">Porque el talento tacneño merece brillar. Encuentra a alguien de tu ciudad y escríbele directo.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
            <div>
              <h3 className="font-heading font-semibold mb-3">Para clientes</h3>
              <ul className="space-y-2">
                <li><Link to="/categories" className={linkCls}>Buscar genios</Link></li>
                <li><a href="/#como-funciona" className={linkCls}>Cómo funciona</a></li>
                <li><a href="/#faq" className={linkCls}>Preguntas frecuentes</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-3">Para genios</h3>
              <ul className="space-y-2">
                <li><Link to="/ser-genio" className={linkCls}>Ofrece tus servicios</Link></li>
                <li><Link to="/genius-profile" className={linkCls}>Mi panel</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-3">Ayuda</h3>
              <ul className="space-y-2">
                <li>
                  <a href={supportUrl} target="_blank" rel="noopener noreferrer" className={`${linkCls} inline-flex items-center gap-1.5`}>
                    <MessageCircle className="w-4 h-4 text-green-400" /> Escríbenos
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/15 mt-10 pt-6">
          <p className="text-white/55 text-sm">© {new Date().getFullYear()} Genios · Tacna, Perú</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

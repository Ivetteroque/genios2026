import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Briefcase } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary/10 text-text py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <Briefcase className="text-primary mr-2" size={24} />
              <span className="font-heading font-bold text-xl">Genios</span>
            </div>
            <div className="flex items-center space-x-4">
              <img 
                src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Equipo de trabajo" 
                className="w-24 h-24 rounded-lg object-cover"
              />
              <p className="text-text/60 max-w-xs">
                Conectamos talentos locales con personas que necesitan servicios profesionales de calidad.
              </p>
            </div>
            <div className="flex space-x-4 mt-6">
              <a href="#facebook" className="text-text/60 hover:text-primary transition-colors">
                <Facebook size={20} />
              </a>
              <a href="#twitter" className="text-text/60 hover:text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#instagram" className="text-text/60 hover:text-primary transition-colors">
                <Instagram size={20} />
              </a>
              <a href="#linkedin" className="text-text/60 hover:text-primary transition-colors">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Enlaces rápidos</h3>
              <ul className="space-y-2">
                <li><a href="#inicio" className="text-text/60 hover:text-primary transition-colors">Inicio</a></li>
                <li><a href="#como-funciona" className="text-text/60 hover:text-primary transition-colors">Cómo funciona</a></li>
                <li><a href="#categorias" className="text-text/60 hover:text-primary transition-colors">Categorías</a></li>
                <li><a href="#historias" className="text-text/60 hover:text-primary transition-colors">Historias</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#terminos" className="text-text/60 hover:text-primary transition-colors">Términos y condiciones</a></li>
                <li><a href="#privacidad" className="text-text/60 hover:text-primary transition-colors">Política de privacidad</a></li>
                <li><a href="#cookies" className="text-text/60 hover:text-primary transition-colors">Política de cookies</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-heading font-bold text-lg mb-4">Más información</h3>
              <ul className="space-y-2">
                <li><a href="#nosotros" className="text-text/60 hover:text-primary transition-colors">Sobre nosotros</a></li>
                <li><a href="#blog" className="text-text/60 hover:text-primary transition-colors">Blog</a></li>
                <li><a href="#contacto" className="text-text/60 hover:text-primary transition-colors">Contacto</a></li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="border-t border-text/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <img 
                src="https://images.pexels.com/photos/3184299/pexels-photo-3184299.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                alt="Equipo colaborativo" 
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
              <p className="text-text/60">
                ✨ Genios: Porque el talento tacneño merece brillar
              </p>
            </div>
            <p className="text-text/40 text-sm">
              © {new Date().getFullYear()} Genios. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer
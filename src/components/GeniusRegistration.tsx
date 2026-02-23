import React, { useState } from 'react';
import { Upload, MapPin, Check, X, Camera, Instagram, Facebook, MessageSquare } from 'lucide-react';

interface RegistrationStep {
  id: number;
  title: string;
  isCompleted: boolean;
}

const GeniusRegistration: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1 - Personal Data
    fullName: '',
    dni: '',
    email: '',
    whatsapp: '',
    
    // Step 2 - Profile & Location
    profilePhoto: '',
    workZone: '',
    
    // Step 3 - Service Details
    category: '',
    subcategory: '',
    serviceName: '',
    price: '',
    
    // Step 4 - Experience
    startYear: '',
    description: '',
    
    // Step 5 - Gallery & Social
    gallery: [] as string[],
    instagram: '',
    facebook: '',
    tiktok: '',
    whatsappEnabled: true
  });

  const steps: RegistrationStep[] = [
    { id: 1, title: 'Datos', isCompleted: currentStep > 1 },
    { id: 2, title: 'Perfil', isCompleted: currentStep > 2 },
    { id: 3, title: 'Servicio', isCompleted: currentStep > 3 },
    { id: 4, title: 'Experiencia', isCompleted: currentStep > 4 },
    { id: 5, title: 'Galería', isCompleted: false }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readers = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(results => {
      setFormData(prev => ({
        ...prev,
        gallery: [...prev.gallery, ...results].slice(0, 6)
      }));
    });
  };

  const removeGalleryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      gallery: prev.gallery.filter((_, i) => i !== index)
    }));
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center space-x-2 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-medium text-sm ${
              currentStep === step.id
                ? 'border-primary bg-primary text-white'
                : step.isCompleted
                ? 'border-success bg-success text-white'
                : 'border-gray-300 bg-white text-gray-400'
            }`}
          >
            {step.isCompleted ? (
              <Check className="w-5 h-5" />
            ) : (
              step.id
            )}
          </div>
          <div className="ml-2 text-xs font-medium text-gray-600">
            {step.title}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 ${
              step.isCompleted ? 'bg-success' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl font-bold text-text mb-2">
          👤 Datos Personales
        </h3>
        <p className="text-text/60 font-body">
          Información básica para verificar tu identidad
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          👤 Nombre completo:
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          placeholder="Ej: María Elena Rodríguez"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🆔 DNI (verificación):
        </label>
        <input
          type="text"
          name="dni"
          value={formData.dni}
          onChange={handleInputChange}
          maxLength={8}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          placeholder="12345678"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📧 Correo electrónico:
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          placeholder="maria@ejemplo.com"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📱 WhatsApp (con código):
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-primary/20 bg-gray-50 text-gray-500">
            +51
          </span>
          <input
            type="tel"
            name="whatsapp"
            value={formData.whatsapp}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-r-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
            placeholder="987654321"
            required
          />
        </div>
      </div>
      
      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
        <p className="text-sm text-text/80 font-body italic">
          🧠 No te preocupes, tus datos están protegidos. Solo usamos tu DNI para verificar que eres real.
        </p>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl font-bold text-text mb-2">
          📸 Perfil y Ubicación
        </h3>
        <p className="text-text/60 font-body">
          Tu foto y zona de trabajo
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          📸 Sube una foto clara y sonriente de ti
        </label>
        <div className="flex items-center space-x-4">
          {formData.profilePhoto ? (
            <div className="relative">
              <img
                src={formData.profilePhoto}
                alt="Profile preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-primary/20"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, profilePhoto: '' }))}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-primary/30 flex items-center justify-center bg-primary/5">
              <Camera className="w-8 h-8 text-primary/60" />
            </div>
          )}
          
          <label className="cursor-pointer bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
            <span>Seleccionar foto</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'profilePhoto')}
            />
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🗺️ Zona de trabajo:
        </label>
        <div className="relative">
          <select
            name="workZone"
            value={formData.workZone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 appearance-none"
          >
            <option value="">Selecciona una zona</option>
            <option value="san-martin">San Martín, Tacna</option>
            <option value="alto-alianza">Alto Alianza, Tacna</option>
            <option value="ciudad-nueva">Ciudad Nueva, Tacna</option>
            <option value="pocollay">Pocollay, Tacna</option>
            <option value="calana">Calana, Tacna</option>
            <option value="pachia">Pachía, Tacna</option>
          </select>
          <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
        <p className="text-sm text-text/80 font-body italic">
          💡 Tu foto inspira confianza. Es tu primera impresión como genio, ¡haz que cuente!
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl font-bold text-text mb-2">
          🧰 Tu Servicio
        </h3>
        <p className="text-text/60 font-body">
          Define qué ofreces y cómo te encuentran
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🧰 Categoría:
        </label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        >
          <option value="">Selecciona una categoría</option>
          <option value="belleza">Belleza y Cuidado Personal</option>
          <option value="tecnicos">Servicios Técnicos</option>
          <option value="profesionales">Servicios Profesionales</option>
          <option value="hogar">Servicios para el Hogar</option>
          <option value="eventos">Eventos y Entretenimiento</option>
          <option value="salud">Salud y Bienestar</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🔧 Subcategoría:
        </label>
        <select
          name="subcategory"
          value={formData.subcategory}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        >
          <option value="">Selecciona una subcategoría</option>
          {formData.category === 'belleza' && (
            <>
              <option value="peluqueria">Peluquería</option>
              <option value="maquillaje">Maquillaje</option>
              <option value="manicure">Manicure y Pedicure</option>
              <option value="barberia">Barbería</option>
            </>
          )}
          {formData.category === 'tecnicos' && (
            <>
              <option value="electricista">Electricista</option>
              <option value="gasfiteria">Gasfitería</option>
              <option value="tecnico-pc">Técnico en Computadoras</option>
              <option value="aire-acondicionado">Aire Acondicionado</option>
            </>
          )}
          {formData.category === 'profesionales' && (
            <>
              <option value="desarrollo-web">Desarrollo Web</option>
              <option value="diseno-grafico">Diseño Gráfico</option>
              <option value="marketing">Marketing Digital</option>
              <option value="consultoria">Consultoría</option>
            </>
          )}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🏷️ Nombre de tu servicio:
        </label>
        <input
          type="text"
          name="serviceName"
          value={formData.serviceName}
          onChange={handleInputChange}
          placeholder="Ej: Cortes modernos a domicilio"
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          💰 Precio aproximado (opcional):
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
            S/
          </span>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="40"
            className="w-full pl-8 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
          />
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
        <p className="text-sm text-text/80 font-body italic">
          ✨ Así aparecerás cuando te busquen. Sé claro, directo y describe lo que mejor haces.
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl font-bold text-text mb-2">
          📝 Tu Experiencia
        </h3>
        <p className="text-text/60 font-body">
          Cuéntanos sobre tu trayectoria
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          📅 ¿Desde cuándo trabajas en esto?:
        </label>
        <select
          name="startYear"
          value={formData.startYear}
          onChange={handleInputChange}
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
        >
          <option value="">Selecciona el año</option>
          {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          🗣️ Cuéntanos más sobre ti:
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          maxLength={500}
          placeholder="Describe tu experiencia, especialidad y qué te hace único..."
          className="w-full px-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 resize-none"
        />
        <p className="text-sm text-gray-500 text-right mt-1">
          {500 - formData.description.length} caracteres restantes
        </p>
      </div>

      <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
        <p className="text-sm text-text/80 font-body italic">
          🎤 Ejemplo inspirador: "Ayudo a mujeres a sentirse bellas para su gran día. 
          Llevo más de 4 años peinando novias y me especializo en estilos románticos."
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="font-heading text-xl font-bold text-text mb-2">
          📷 Galería y Redes Sociales
        </h3>
        <p className="text-text/60 font-body">
          Muestra tu trabajo y conecta con tus clientes
        </p>
      </div>

      <div>
        <label className="block font-heading text-lg font-semibold text-text mb-4">
          📷 Sube hasta 6 fotos de tus trabajos:
        </label>
        <div className="grid grid-cols-3 gap-4 mb-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg border-2 border-dashed border-primary/30 flex items-center justify-center relative bg-background hover:border-primary/50 transition-colors"
            >
              {formData.gallery[index] ? (
                <>
                  <img
                    src={formData.gallery[index]}
                    alt={`Trabajo ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-md"
                  >
                    <X size={14} />
                  </button>
                </>
              ) : (
                <label className="cursor-pointer text-center p-4 w-full h-full flex flex-col items-center justify-center hover:bg-primary/5 transition-colors rounded-lg">
                  <Upload className="mx-auto h-8 w-8 text-primary/60 mb-2" />
                  <span className="text-sm text-text/60 font-body">+ Añadir imagen {index + 1}</span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleFileUpload}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <label className="block font-heading text-lg font-semibold text-text mb-2">
          🌐 Redes Sociales (opcional):
        </label>
        
        <div className="space-y-3">
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pink-500" size={20} />
            <input
              type="text"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              placeholder="www.instagram.com/mi_trabajo"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-body"
            />
          </div>
          
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-600" size={20} />
            <input
              type="text"
              name="facebook"
              value={formData.facebook}
              onChange={handleInputChange}
              placeholder="www.facebook.com/mi_negocio"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-body"
            />
          </div>
          
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black font-bold text-sm">
              TT
            </div>
            <input
              type="text"
              name="tiktok"
              value={formData.tiktok}
              onChange={handleInputChange}
              placeholder="www.tiktok.com/@mi_usuario"
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 font-body"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block font-heading text-lg font-semibold text-text mb-3">
          📞 ¿Te pueden contactar por WhatsApp?
        </label>
        <div className="flex space-x-6">
          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
            <input
              type="radio"
              name="whatsappEnabled"
              checked={formData.whatsappEnabled === true}
              onChange={() => setFormData(prev => ({ ...prev, whatsappEnabled: true }))}
              className="text-primary focus:ring-primary"
            />
            <MessageSquare className="text-green-600" size={20} />
            <span className="font-body text-text font-medium">✔️ Sí, por WhatsApp</span>
          </label>
          <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-primary/20 hover:bg-primary/5 transition-colors">
            <input
              type="radio"
              name="whatsappEnabled"
              checked={formData.whatsappEnabled === false}
              onChange={() => setFormData(prev => ({ ...prev, whatsappEnabled: false }))}
              className="text-primary focus:ring-primary"
            />
            <span className="font-body text-text font-medium">❌ Solo por otros medios</span>
          </label>
        </div>
      </div>

      <div className="bg-success/10 border border-success/20 p-4 rounded-lg">
        <p className="text-sm text-text/80 font-body italic">
          ✅ Una imagen vale más que mil palabras. Tus fotos son tu mejor vitrina.
        </p>
      </div>
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    
    // Show success message
    alert('¡🎉 Registro completado exitosamente!\n\nTu perfil será revisado por nuestro equipo y activado en las próximas 24 horas.\n\n¡Bienvenido a la comunidad de Genios!');
    onClose();
  };

  const canContinue = () => {
    switch (currentStep) {
      case 1:
        return formData.fullName && formData.dni && formData.email && formData.whatsapp;
      case 2:
        return formData.profilePhoto && formData.workZone;
      case 3:
        return formData.category && formData.subcategory && formData.serviceName;
      case 4:
        return formData.startYear && formData.description;
      case 5:
        return true; // Step 5 is optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl font-bold text-text mb-2">
              🚀 REGISTRA TU PERFIL COMO GENIO
            </h2>
            <p className="font-body text-text/60">
              "Sabes hacer algo increíble. ¡Hazlo visible en todo Tacna!"
            </p>
          </div>

          {renderStepIndicator()}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-primary/10">
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-3 rounded-full border border-text/20 hover:bg-text/5 transition-colors font-body font-medium text-text"
                  >
                    ⬅ Atrás
                  </button>
                )}
                
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-full text-text/60 font-body hover:bg-text/5 transition-colors"
                >
                  ❌ Cancelar
                </button>
              </div>
              
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  disabled={!canContinue()}
                  className={`px-8 py-3 rounded-full font-body font-medium transition-colors ${
                    canContinue()
                      ? 'bg-secondary text-text hover:bg-secondary-dark shadow-md'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Continuar ➡
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-success text-text hover:bg-success-dark transition-colors font-body font-medium shadow-md"
                >
                  🎉 Finalizar Registro
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeniusRegistration;
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ChevronRight, Heart, LogIn, LogOut, MessageSquare, Pencil, Star, X } from 'lucide-react';
import { getFirstName } from '../utils/commonUtils';
import { getCurrentUser, logout, updateUser } from '../utils/authUtils';
import { getUserFavorites, FavoriteGenius } from '../utils/favoritesUtils';
import { getReviewsByClient, GeniusReview } from '../services/supabaseGeniusReviewsService';
import { getGeniusNamesByIds } from '../services/publicGeniusDirectoryService';
import { supabase } from '../lib/supabase';
import { openLogin } from '../utils/onboardingUtils';
import { showToast } from '../utils/toast';

/**
 * Panel del cliente: sus genios favoritos, sus reseñas y sus datos. Sin
 * botones de adorno (antes había "Contraseña" y "Conversemos" que no hacían
 * nada, y un teléfono inventado cuando no había uno guardado).
 */

const SUPPORT_WHATSAPP = '51952719641';

const Avatar: React.FC<{ name: string; image?: string; size?: string }> = ({ name, image, size = 'w-14 h-14' }) =>
  image ? (
    <img src={image} alt="" className={`${size} rounded-full object-cover shrink-0`} />
  ) : (
    <div className={`${size} rounded-full bg-primary/30 text-ink-blue font-heading font-semibold flex items-center justify-center shrink-0`}>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </div>
  );

const Stars: React.FC<{ value: number }> = ({ value }) => (
  <span className="flex items-center gap-0.5" aria-label={`${value} de 5 estrellas`}>
    {[...Array(5)].map((_, i) => (
      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`} fill={i < Math.round(value) ? 'currentColor' : 'none'} />
    ))}
  </span>
);

const ClientProfile: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [favoriteGenios, setFavoriteGenios] = useState<FavoriteGenius[]>([]);
  const [clientReviews, setClientReviews] = useState<GeniusReview[]>([]);
  const [geniusNames, setGeniusNames] = useState<Map<string, string>>(new Map());
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (currentUser) setFavoriteGenios(await getUserFavorites(currentUser.id));
  }, [currentUser]);

  const loadClientReviews = useCallback(async () => {
    if (!currentUser) return;
    const reviews = await getReviewsByClient(currentUser.id);
    setClientReviews(reviews);
    setGeniusNames(await getGeniusNamesByIds([...new Set(reviews.map((r) => r.reviewed_genius_id))]));
  }, [currentUser]);

  useEffect(() => {
    loadFavorites();
    loadClientReviews();
  }, [loadFavorites, loadClientReviews]);

  useEffect(() => {
    const onFavorites = () => loadFavorites();
    const onAuth = () => setCurrentUser(getCurrentUser());
    window.addEventListener('favoritesChanged', onFavorites);
    window.addEventListener('reviewsChanged', loadClientReviews);
    window.addEventListener('authStateChanged', onAuth);
    return () => {
      window.removeEventListener('favoritesChanged', onFavorites);
      window.removeEventListener('reviewsChanged', loadClientReviews);
      window.removeEventListener('authStateChanged', onAuth);
    };
  }, [loadFavorites, loadClientReviews]);

  // Sin sesión: invitación a entrar (antes redirigía al inicio sin explicar nada).
  if (!currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 pt-24 pb-12">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-6 h-6 text-ink-blue" />
          </div>
          <h1 className="font-heading text-xl font-semibold text-text mb-2">Entra para ver tus favoritos</h1>
          <p className="text-sm text-text/60 mb-6">Guarda a los genios que te gustan y deja reseñas de sus trabajos.</p>
          <button
            onClick={() => openLogin({ redirectTo: '/client-profile' })}
            className="w-full bg-text hover:bg-text/85 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Entrar con Google
          </button>
        </div>
      </div>
    );
  }

  const visibleReviews = clientReviews.slice(0, 3);
  const reviewDate = (r: GeniusReview) =>
    new Date(r.service_date ? `${r.service_date}T12:00:00` : r.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  const supportUrl = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent('Hola, necesito ayuda con mi cuenta de Genios.')}`;

  const reviewItem = (review: GeniusReview) => (
    <div key={review.id} className="px-4 py-4">
      <div className="flex items-center justify-between gap-3 mb-1">
        <Link to={`/profile/${review.reviewed_genius_id}`} className="text-sm font-medium text-text hover:underline truncate">
          {geniusNames.get(review.reviewed_genius_id) ?? 'Genio'}
        </Link>
        <span className="text-xs text-text/40 shrink-0">{reviewDate(review)}</span>
      </div>
      <div className="flex items-center gap-2 mb-1.5">
        <Stars value={review.rating} />
        {review.moderation_status !== 'visible' && (
          <span className="text-[11px] font-medium text-text/55 bg-gray-100 rounded-full px-2 py-0.5">En revisión</span>
        )}
      </div>
      <p className="text-sm text-text/65 leading-relaxed">“{review.comment}”</p>
      {review.images?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {review.images.map((img) => (
            <button key={img} onClick={() => setSelectedImage(img)} aria-label="Ver foto">
              <img src={img} alt="" className="w-12 h-12 rounded-lg object-cover hover:opacity-80" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFF] pt-20 pb-16">
      <div className="container mx-auto px-4 max-w-2xl space-y-6 pt-4">

        {/* Quién soy */}
        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
          <Avatar name={currentUser.name} image={currentUser.profileImage} />
          <div className="flex-1 min-w-0">
            <h1 className="font-heading text-xl font-semibold text-text truncate">Hola, {getFirstName(currentUser.name)}</h1>
            <p className="text-sm text-text/55 truncate">{currentUser.email}</p>
            {currentUser.phone && <p className="text-sm text-text/55">+51 {currentUser.phone}</p>}
          </div>
          <button onClick={() => setEditing(true)} className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full border border-gray-200 text-sm text-text/75 hover:bg-surface-blue">
            <Pencil className="w-3.5 h-3.5" /> Editar
          </button>
        </section>

        {/* Favoritos */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-text">Tus genios favoritos</h2>
            {favoriteGenios.length > 0 && <span className="text-sm text-text/45">{favoriteGenios.length}</span>}
          </div>
          {favoriteGenios.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {favoriteGenios.map((genius) => (
                <Link key={genius.id} to={`/profile/${genius.id}`}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {genius.image
                    ? <img src={genius.image} alt="" className="w-full h-28 object-cover" />
                    : <div className="w-full h-28 bg-surface-blue flex items-center justify-center font-heading text-2xl text-ink-blue">{genius.name.trim()[0]}</div>}
                  <div className="p-3">
                    <p className="text-sm font-medium text-text truncate">{genius.name}</p>
                    <p className="text-xs text-text/50 truncate">{genius.subcategory}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 py-10 px-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-3 text-text/20" />
              <p className="text-sm text-text/60 mb-4">Toca el corazón en el perfil de un genio para guardarlo aquí.</p>
              <Link to="/categories" className="inline-flex h-11 items-center px-5 rounded-full bg-text text-white text-sm font-semibold">Buscar genios</Link>
            </div>
          )}
        </section>

        {/* Reseñas */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold text-text">Tus reseñas</h2>
            {clientReviews.length > 3 && (
              <button onClick={() => setShowAllReviews(true)} className="text-sm text-ink-blue flex items-center gap-0.5">
                Ver todas <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {clientReviews.length > 0 ? (
            <div className="divide-y divide-gray-100 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {visibleReviews.map(reviewItem)}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 py-8 px-6 text-center">
              <Star className="w-8 h-8 mx-auto mb-3 text-text/20" />
              <p className="text-sm text-text/60">Cuando un genio te atienda, déjale una reseña desde su perfil. Ayuda a otros a elegir.</p>
            </div>
          )}
        </section>

        {/* ¿Ofreces algo? */}
        {!currentUser.isGenius && (
          <Link to="/ser-genio" className="flex items-center gap-4 bg-surface-rose rounded-2xl p-5 border border-secondary/40 hover:border-secondary">
            <Briefcase className="w-6 h-6 text-ink-rose shrink-0" />
            <span className="flex-1">
              <span className="block font-semibold text-text">¿Ofreces algún servicio?</span>
              <span className="block text-sm text-text/65">Crea tu perfil de genio gratis durante la beta.</span>
            </span>
            <ChevronRight className="w-5 h-5 text-text/40" />
          </Link>
        )}

        {/* Ayuda + salir */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a href={supportUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 h-12 inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-text font-medium hover:bg-surface-blue">
            <MessageSquare className="w-4 h-4 text-green-600" /> ¿Necesitas ayuda? Escríbenos
          </a>
          <button onClick={() => logout()}
            className="flex-1 sm:flex-none sm:px-6 h-12 inline-flex items-center justify-center gap-2 rounded-xl text-text/60 hover:text-text">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* Todas las reseñas */}
      {showAllReviews && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Tus reseñas">
          <div className="absolute inset-0" onClick={() => setShowAllReviews(false)} />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-heading text-base font-semibold text-text">Tus reseñas ({clientReviews.length})</h3>
              <button onClick={() => setShowAllReviews(false)} aria-label="Cerrar" className="p-1 text-text/40 hover:text-text"><X className="w-5 h-5" /></button>
            </div>
            <div className="divide-y divide-gray-100">{clientReviews.map(reviewItem)}</div>
          </div>
        </div>
      )}

      {/* Foto ampliada */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
          <button onClick={() => setSelectedImage(null)} aria-label="Cerrar" className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="w-6 h-6" /></button>
        </div>
      )}

      {editing && (
        <EditClientSheet
          name={currentUser.name}
          phone={currentUser.phone ?? ''}
          userId={currentUser.id}
          email={currentUser.email}
          onClose={() => setEditing(false)}
          onSaved={(name, phone) => {
            updateUser(currentUser.id, { name, phone });
            setCurrentUser({ ...currentUser, name, phone });
            setEditing(false);
          }}
        />
      )}
    </div>
  );
};

/** Editar nombre y celular. Se guarda de verdad (antes quedaba solo en el navegador). */
const EditClientSheet: React.FC<{
  name: string;
  phone: string;
  userId: string;
  email: string;
  onClose: () => void;
  onSaved: (name: string, phone: string) => void;
}> = ({ name: initialName, phone: initialPhone, userId, email, onClose, onSaved }) => {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = {
    name: !name.trim() ? 'Escribe tu nombre.' : '',
    phone: phone && phone.length !== 9 ? 'Tu celular debe tener 9 números (o déjalo vacío).' : '',
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.name || errors.phone) return;
    setSaving(true);
    const patch = { full_name: name.trim(), phone, updated_at: new Date().toISOString() };
    const updated = await supabase.from('client_profiles').update(patch).eq('id', userId).select('id');
    // Si todavía no existía su fila de cliente, se crea.
    const error = updated.error
      ?? (updated.data?.length ? null : (await supabase.from('client_profiles').insert({ id: userId, email, ...patch })).error);
    setSaving(false);
    if (error) {
      console.error('Error guardando los datos del cliente:', error);
      showToast('No se pudo guardar. Revisa tu conexión.', 'error');
      return;
    }
    showToast('Datos guardados');
    onSaved(name.trim(), phone);
  };

  const input = (invalid: boolean) =>
    `w-full h-12 px-4 rounded-xl border bg-white text-[16px] focus:outline-none focus:ring-2 ${invalid ? 'border-red-300 focus:ring-red-100' : 'border-gray-200 focus:ring-primary/40 focus:border-primary'}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label="Editar mis datos">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form onSubmit={save} noValidate className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 pb-8 sm:pb-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-text">Tus datos</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 -mr-2 text-text/40 hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        <div>
          <label htmlFor="client-name" className="block text-sm font-semibold text-text/85 mb-1.5">Nombre</label>
          <input id="client-name" className={input(tried && !!errors.name)} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          {tried && errors.name && <p role="alert" className="text-sm text-red-600 mt-1.5">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="client-phone" className="block text-sm font-semibold text-text/85 mb-1.5">Celular <span className="font-normal text-text/45">(opcional)</span></label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-surface-blue text-text/60">+51</span>
            <input id="client-phone" className={`${input(tried && !!errors.phone)} rounded-l-none`} value={phone} inputMode="numeric" autoComplete="tel-national"
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 9))} placeholder="987654321" />
          </div>
          {tried && errors.phone
            ? <p role="alert" className="text-sm text-red-600 mt-1.5">{errors.phone}</p>
            : <p className="text-sm text-text/50 mt-1.5">Solo para ayudarte si nos escribes. No lo ven los genios.</p>}
        </div>
        <button type="submit" disabled={saving} className="w-full h-12 rounded-xl bg-ink-blue hover:bg-[#355f9c] disabled:bg-gray-300 text-white font-semibold">
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
};

export default ClientProfile;

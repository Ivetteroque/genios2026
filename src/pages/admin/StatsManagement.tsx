import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserCheck,
  MessageCircle,
  Flag,
  Heart,
  Phone,
  Star,
  TrendingUp,
  RefreshCw,
  Loader2,
  CreditCard,
  MapPin,
  User,
  ArrowUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryStats {
  totalGenios: number;
  totalClients: number;
  newThisMonth: number;
  activeMemberships: number;
  betaMemberships: number;
  paidMemberships: number;
  expiredMemberships: number;
  totalWhatsappClicks: number;
  totalComments: number;
  totalReports: number;
  totalFavorites: number;
}

interface GeniusStatRow {
  id: string;
  full_name: string;
  category: string;
  profile_photo: string;
  profile_views: number;
  whatsapp_clicks: number;
  favorites_count: number;
  reviews_count: number;
}

interface CategoryStat {
  category: string;
  genius_count: number;
  favorites_count: number;
  whatsapp_clicks: number;
  reviews_count: number;
}

interface LocationStat {
  name: string;
  genius_count: number;
}

interface ActivityPeriod {
  label: string;
  clients: number;
  genios: number;
  comments: number;
  favorites: number;
  reports: number;
}

interface WhatsAppTrend {
  period: string;
  clicks: number;
}

// ─── Mini bar component ───────────────────────────────────────────────────────

const MiniBar: React.FC<{ value: number; max: number; color?: string }> = ({
  value, max, color = 'bg-blue-400',
}) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex-1 min-w-0">
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Section header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div className="mb-4">
    <h2 className="text-sm font-semibold text-text">{title}</h2>
    {sub && <p className="text-xs text-text/35 mt-0.5">{sub}</p>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const StatsManagement: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topGenios, setTopGenios] = useState<GeniusStatRow[]>([]);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [activity, setActivity] = useState<ActivityPeriod[]>([]);
  const [whatsappTrend, setWhatsappTrend] = useState<WhatsAppTrend[]>([]);
  const [topWhatsappGenios, setTopWhatsappGenios] = useState<{ name: string; category: string; clicks: number }[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000).toISOString();
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString();

    const [
      { count: totalGenios },
      { count: totalClients },
      { count: newGeniosMonth },
      { count: newClientsMonth },
      { count: activeMemberships },
      { count: betaMemberships },
      { count: paidMemberships },
      { count: expiredMemberships },
      { count: totalComments },
      { count: totalReports },
      { count: totalFavorites },
      { data: geniusRows },
      { data: favoriteAgg },
      { data: reviewAgg },
      { data: whatsappAgg },
      { data: locationRows },
      { data: clicksW1 },
      { data: clicksW2 },
      { data: clicksW3 },
      { data: clicksW4 },
    ] = await Promise.all([
      supabase.from('genius_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('client_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('genius_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('client_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('type', 'beta').eq('status', 'active'),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('type', 'annual').eq('status', 'active'),
      supabase.from('memberships').select('*', { count: 'exact', head: true }).eq('status', 'expired'),
      supabase.from('genius_reviews').select('*', { count: 'exact', head: true }),
      supabase.from('reports').select('*', { count: 'exact', head: true }),
      supabase.from('user_favorites').select('*', { count: 'exact', head: true }),
      supabase.from('genius_profiles').select('id, full_name, category, profile_photo, profile_views, whatsapp_clicks').order('whatsapp_clicks', { ascending: false }).limit(10),
      supabase.from('user_favorites').select('genius_id'),
      supabase.from('genius_reviews').select('reviewed_genius_id'),
      supabase.from('whatsapp_clicks').select('category, genius_id, genius_name'),
      supabase.from('genius_profiles').select('home_location, category').not('home_location', 'is', null),
      supabase.from('whatsapp_clicks').select('id').gte('clicked_at', weekAgo),
      supabase.from('whatsapp_clicks').select('id').gte('clicked_at', twoWeeksAgo).lt('clicked_at', weekAgo),
      supabase.from('whatsapp_clicks').select('id').gte('clicked_at', threeWeeksAgo).lt('clicked_at', twoWeeksAgo),
      supabase.from('whatsapp_clicks').select('id').gte('clicked_at', fourWeeksAgo).lt('clicked_at', threeWeeksAgo),
    ]);

    const totalWA = (whatsappAgg || []).length;

    setSummary({
      totalGenios: totalGenios || 0,
      totalClients: totalClients || 0,
      newThisMonth: (newGeniosMonth || 0) + (newClientsMonth || 0),
      activeMemberships: activeMemberships || 0,
      betaMemberships: betaMemberships || 0,
      paidMemberships: paidMemberships || 0,
      expiredMemberships: expiredMemberships || 0,
      totalWhatsappClicks: totalWA,
      totalComments: totalComments || 0,
      totalReports: totalReports || 0,
      totalFavorites: totalFavorites || 0,
    });

    // Top genios enriched with favorites + reviews
    const favMap = new Map<string, number>();
    (favoriteAgg || []).forEach(f => favMap.set(f.genius_id, (favMap.get(f.genius_id) || 0) + 1));

    const revMap = new Map<string, number>();
    (reviewAgg || []).forEach(r => revMap.set(r.reviewed_genius_id, (revMap.get(r.reviewed_genius_id) || 0) + 1));

    const enriched: GeniusStatRow[] = (geniusRows || []).map(g => ({
      id: g.id,
      full_name: g.full_name,
      category: g.category,
      profile_photo: g.profile_photo || '',
      profile_views: g.profile_views || 0,
      whatsapp_clicks: g.whatsapp_clicks || 0,
      favorites_count: favMap.get(g.id) || 0,
      reviews_count: revMap.get(g.id) || 0,
    }));
    setTopGenios(enriched);

    // Category stats
    const catMap = new Map<string, CategoryStat>();
    (geniusRows || []).forEach(g => {
      if (!g.category) return;
      const c = catMap.get(g.category) || { category: g.category, genius_count: 0, favorites_count: 0, whatsapp_clicks: 0, reviews_count: 0 };
      c.genius_count++;
      c.favorites_count += favMap.get(g.id) || 0;
      c.whatsapp_clicks += g.whatsapp_clicks || 0;
      c.reviews_count += revMap.get(g.id) || 0;
      catMap.set(g.category, c);
    });
    // Also pull categories from ALL genius profiles for genius_count
    const { data: allGenios } = await supabase.from('genius_profiles').select('id, category, whatsapp_clicks');
    const fullCatMap = new Map<string, CategoryStat>();
    (allGenios || []).forEach(g => {
      if (!g.category) return;
      const c = fullCatMap.get(g.category) || { category: g.category, genius_count: 0, favorites_count: 0, whatsapp_clicks: 0, reviews_count: 0 };
      c.genius_count++;
      c.whatsapp_clicks += g.whatsapp_clicks || 0;
      c.favorites_count += favMap.get(g.id) || 0;
      c.reviews_count += revMap.get(g.id) || 0;
      fullCatMap.set(g.category, c);
    });
    const sortedCats = Array.from(fullCatMap.values())
      .sort((a, b) => b.genius_count - a.genius_count)
      .slice(0, 10);
    setCategories(sortedCats);

    // Location stats (parse home_location jsonb)
    const locMap = new Map<string, number>();
    (locationRows || []).forEach(row => {
      const loc = row.home_location as { departmentName?: string } | null;
      if (loc?.departmentName) {
        locMap.set(loc.departmentName, (locMap.get(loc.departmentName) || 0) + 1);
      }
    });
    const sortedLocs = Array.from(locMap.entries())
      .map(([name, genius_count]) => ({ name, genius_count }))
      .sort((a, b) => b.genius_count - a.genius_count)
      .slice(0, 8);
    setLocations(sortedLocs);

    // WhatsApp trend (4 weeks)
    setWhatsappTrend([
      { period: 'Hace 4 sem', clicks: (clicksW4 || []).length },
      { period: 'Hace 3 sem', clicks: (clicksW3 || []).length },
      { period: 'Hace 2 sem', clicks: (clicksW2 || []).length },
      { period: 'Esta sem', clicks: (clicksW1 || []).length },
    ]);

    // Top WhatsApp genios from click events
    const waGeniusMap = new Map<string, { name: string; category: string; clicks: number }>();
    (whatsappAgg || []).forEach(w => {
      const entry = waGeniusMap.get(w.genius_id) || { name: w.genius_name, category: w.category, clicks: 0 };
      entry.clicks++;
      waGeniusMap.set(w.genius_id, entry);
    });
    const topWA = Array.from(waGeniusMap.values())
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);
    setTopWhatsappGenios(topWA);

    // Activity summary (current month vs prev month)
    const [
      { count: clientsThisMonth },
      { count: geniosThisMonth },
      { count: commentsThisMonth },
      { count: favThisMonth },
      { count: reportsThisMonth },
      { count: clientsLastMonth },
      { count: geniosLastMonth },
      { count: commentsLastMonth },
      { count: favLastMonth },
      { count: reportsLastMonth },
    ] = await Promise.all([
      supabase.from('client_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('genius_profiles').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('genius_reviews').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('user_favorites').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      supabase.from('client_profiles').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
      supabase.from('genius_profiles').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
      supabase.from('genius_reviews').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
      supabase.from('user_favorites').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
      supabase.from('reports').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', monthStart),
    ]);

    setActivity([
      {
        label: now.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
        clients: clientsThisMonth || 0,
        genios: geniosThisMonth || 0,
        comments: commentsThisMonth || 0,
        favorites: favThisMonth || 0,
        reports: reportsThisMonth || 0,
      },
      {
        label: new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
        clients: clientsLastMonth || 0,
        genios: geniosLastMonth || 0,
        comments: commentsLastMonth || 0,
        favorites: favLastMonth || 0,
        reports: reportsLastMonth || 0,
      },
    ]);

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-text/25" />
      </div>
    );
  }

  const s = summary!;

  const maxCatGenius = Math.max(...categories.map(c => c.genius_count), 1);
  const maxCatWA = Math.max(...categories.map(c => c.whatsapp_clicks), 1);
  const maxLocGenius = Math.max(...locations.map(l => l.genius_count), 1);
  const maxWATrend = Math.max(...whatsappTrend.map(t => t.clicks), 1);
  const maxTopWA = topGenios.reduce((m, g) => Math.max(m, g.whatsapp_clicks), 1);

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-base font-semibold text-text">Estadisticas</h1>
          <p className="text-xs text-text/35 mt-0.5">Vision general de actividad y crecimiento</p>
        </div>
        <button onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-text/50 hover:text-text/75 hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
          <RefreshCw className="w-3 h-3" />
          Actualizar
        </button>
      </div>

      {/* Summary cards */}
      <div>
        <SectionHeader title="Resumen general" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total genios',      value: s.totalGenios,          icon: UserCheck,    color: '' },
            { label: 'Total clientes',    value: s.totalClients,         icon: Users,        color: '' },
            { label: 'Nuevos este mes',   value: s.newThisMonth,         icon: TrendingUp,   color: 'text-green-600' },
            { label: 'Membresías activas',value: s.activeMemberships,    icon: Star,         color: 'text-amber-600' },
            { label: 'WhatsApp clicks',   value: s.totalWhatsappClicks,  icon: Phone,        color: 'text-green-600' },
            { label: 'Comentarios',       value: s.totalComments,        icon: MessageCircle,color: '' },
            { label: 'Favoritos',         value: s.totalFavorites,       icon: Heart,        color: '' },
            { label: 'Reportes',          value: s.totalReports,         icon: Flag,         color: s.totalReports > 0 ? 'text-red-500' : '' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] text-text/35 leading-tight">{label}</p>
                <Icon className="w-3.5 h-3.5 text-text/12 flex-shrink-0" />
              </div>
              <p className={`font-heading text-2xl font-semibold leading-none ${color || 'text-text'}`}>
                {value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion */}
      <div>
        <SectionHeader title="Conversion y membresías" sub="Estado de planes activos y vencidos" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Genios beta',       value: s.betaMemberships,   color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Convertidos a pago',value: s.paidMemberships,   color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Membresías vencidas',value: s.expiredMemberships,color: 'text-text/40',  bg: 'bg-gray-50' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-xl border border-gray-100 p-4 ${bg}`}>
              <p className="text-[10px] text-text/35 mb-3">{label}</p>
              <p className={`font-heading text-2xl font-semibold leading-none ${color}`}>{value}</p>
            </div>
          ))}
          {/* Conversion rate */}
          <div className="rounded-xl border border-gray-100 p-4 bg-white">
            <p className="text-[10px] text-text/35 mb-3">Tasa conversion beta → pago</p>
            <p className="font-heading text-2xl font-semibold leading-none text-text">
              {s.betaMemberships + s.paidMemberships > 0
                ? `${Math.round((s.paidMemberships / (s.betaMemberships + s.paidMemberships)) * 100)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top genios */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <SectionHeader title="Genios con mas contactos WhatsApp" />
          </div>
          {topGenios.filter(g => g.whatsapp_clicks > 0).length === 0 ? (
            <div className="px-5 py-8 text-center">
              <Phone className="w-6 h-6 text-text/10 mx-auto mb-2" />
              <p className="text-xs text-text/30">Sin clicks registrados aun.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {topGenios.filter(g => g.whatsapp_clicks > 0).slice(0, 6).map(g => (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  {g.profile_photo ? (
                    <img src={g.profile_photo} alt={g.full_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-text/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{g.full_name}</p>
                    <p className="text-[10px] text-text/35 truncate">{g.category}</p>
                  </div>
                  <MiniBar value={g.whatsapp_clicks} max={maxTopWA} color="bg-green-400" />
                  <span className="text-xs font-medium text-text/60 flex-shrink-0 w-8 text-right">{g.whatsapp_clicks}</span>
                </div>
              ))}
            </div>
          )}
          {/* Also show genios with most favorites */}
          <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/30">
            <p className="text-[10px] font-medium text-text/35 uppercase tracking-wide mb-3">Por favoritos</p>
            <div className="space-y-2">
              {[...topGenios].sort((a, b) => b.favorites_count - a.favorites_count).slice(0, 3).map(g => (
                <div key={g.id} className="flex items-center gap-2 text-xs">
                  <Heart className="w-3 h-3 text-red-300 flex-shrink-0" />
                  <span className="flex-1 truncate text-text/65">{g.full_name}</span>
                  <span className="text-text/40">{g.favorites_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <SectionHeader title="Categorias mas populares" />
          </div>
          {categories.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-xs text-text/30">Sin datos de categorías.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categories.map((cat, i) => (
                <div key={cat.category} className="flex items-center gap-3 px-5 py-2.5">
                  <span className="text-[10px] text-text/20 w-4 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{cat.category}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <MiniBar value={cat.genius_count} max={maxCatGenius} color="bg-blue-300" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 text-[10px] text-text/35">
                    <span className="flex items-center gap-1"><UserCheck className="w-2.5 h-2.5" />{cat.genius_count}</span>
                    <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5" />{cat.favorites_count}</span>
                    <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{cat.whatsapp_clicks}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* WhatsApp trend */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <SectionHeader title="Tendencia WhatsApp" sub="Clicks por semana (ultimas 4 semanas)" />
          <div className="flex items-end gap-3 h-24">
            {whatsappTrend.map((t, i) => {
              const pct = maxWATrend > 0 ? Math.max((t.clicks / maxWATrend) * 100, 4) : 4;
              const isLast = i === whatsappTrend.length - 1;
              return (
                <div key={t.period} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-medium text-text/60">{t.clicks}</span>
                  <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
                    <div
                      className={`w-full rounded-t-md transition-all duration-500 ${isLast ? 'bg-green-400' : 'bg-gray-200'}`}
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-text/30 text-center leading-tight">{t.period}</span>
                </div>
              );
            })}
          </div>
          {/* Top categories by WA clicks */}
          <div className="mt-5 pt-4 border-t border-gray-50 space-y-2">
            <p className="text-[10px] font-medium text-text/35 uppercase tracking-wide mb-2">Por categoria</p>
            {[...categories].sort((a, b) => b.whatsapp_clicks - a.whatsapp_clicks).slice(0, 4).map(cat => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-xs text-text/60 flex-1 truncate">{cat.category}</span>
                <MiniBar value={cat.whatsapp_clicks} max={maxCatWA} color="bg-green-300" />
                <span className="text-xs text-text/40 w-6 text-right flex-shrink-0">{cat.whatsapp_clicks}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <SectionHeader title="Ubicaciones mas activas" sub="Departamentos con mas genios registrados" />
          {locations.length === 0 ? (
            <div className="py-8 text-center">
              <MapPin className="w-6 h-6 text-text/10 mx-auto mb-2" />
              <p className="text-xs text-text/30">Sin datos de ubicacion aun.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locations.map((loc, i) => (
                <div key={loc.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-text/20 w-4 flex-shrink-0">{i + 1}</span>
                  <span className="text-xs text-text/70 w-28 flex-shrink-0 truncate">{loc.name}</span>
                  <MiniBar value={loc.genius_count} max={maxLocGenius} color="bg-blue-300" />
                  <span className="text-xs text-text/40 flex-shrink-0 w-6 text-right">{loc.genius_count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity comparison */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <SectionHeader title="Actividad de usuarios" sub="Comparacion mensual" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-5 py-2.5 text-[10px] font-medium text-text/35 uppercase tracking-wide">Periodo</th>
                {[
                  { icon: Users,         label: 'Clientes' },
                  { icon: UserCheck,     label: 'Genios' },
                  { icon: MessageCircle, label: 'Comentarios' },
                  { icon: Heart,         label: 'Favoritos' },
                  { icon: Flag,          label: 'Reportes' },
                ].map(({ icon: Icon, label }) => (
                  <th key={label} className="text-left px-4 py-2.5 text-[10px] font-medium text-text/35 uppercase tracking-wide">
                    <span className="flex items-center gap-1"><Icon className="w-3 h-3" />{label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activity.map((row, i) => (
                <tr key={row.label} className={i === 0 ? 'bg-gray-50/40' : ''}>
                  <td className="px-5 py-3 text-xs font-medium text-text capitalize">{row.label}</td>
                  {[row.clients, row.genios, row.comments, row.favorites, row.reports].map((val, j) => {
                    const prev = activity[1];
                    const prevVal = [prev?.clients, prev?.genios, prev?.comments, prev?.favorites, prev?.reports][j] || 0;
                    const up = i === 0 && val > prevVal;
                    return (
                      <td key={j} className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs">
                          <span className={i === 0 ? 'font-medium text-text' : 'text-text/40'}>{val}</span>
                          {i === 0 && up && <ArrowUp className="w-2.5 h-2.5 text-green-500" />}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp top genios from event table */}
      {topWhatsappGenios.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <SectionHeader title="Genios mas contactados (WhatsApp)" sub="Basado en eventos de click registrados" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {topWhatsappGenios.map((g, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xs font-semibold text-text/30 w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{g.name}</p>
                  <p className="text-[10px] text-text/40 truncate">{g.category}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Phone className="w-3 h-3 text-green-500" />
                  <span className="text-xs font-medium text-text/65">{g.clicks}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile views top */}
      {topGenios.some(g => g.profile_views > 0) && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <SectionHeader title="Perfiles mas vistos" />
          </div>
          <div className="divide-y divide-gray-50">
            {[...topGenios].sort((a, b) => b.profile_views - a.profile_views).filter(g => g.profile_views > 0).slice(0, 6).map(g => {
              const maxViews = Math.max(...topGenios.map(gg => gg.profile_views), 1);
              return (
                <div key={g.id} className="flex items-center gap-3 px-5 py-2.5">
                  {g.profile_photo ? (
                    <img src={g.profile_photo} alt={g.full_name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 text-text/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text truncate">{g.full_name}</p>
                    <p className="text-[10px] text-text/35">{g.category}</p>
                  </div>
                  <MiniBar value={g.profile_views} max={maxViews} color="bg-blue-300" />
                  <span className="text-xs text-text/50 flex-shrink-0 w-10 text-right">{g.profile_views} vis.</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsManagement;

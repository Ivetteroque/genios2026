import { supabase } from '../lib/supabase';

export type AvailabilityStatus = 'available' | 'full' | 'vacation';

export interface GeniusAvailability {
  id: string;
  genius_id: string;
  date: string;
  status: AvailabilityStatus;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySummary {
  available: number;
  full: number;
  vacation: number;
}

export const getAvailabilityForMonth = async (
  geniusId: string,
  year: number,
  month: number
): Promise<GeniusAvailability[]> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('genius_availability')
    .select('*')
    .eq('genius_id', geniusId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching availability:', error);
    throw error;
  }

  return data || [];
};

export const updateDayAvailability = async (
  geniusId: string,
  date: string,
  status: AvailabilityStatus
): Promise<void> => {
  const payload = {
    genius_id: geniusId,
    date,
    status,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('genius_availability')
    .upsert(payload, { onConflict: 'genius_id,date' });

  if (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
};

export const saveBulkAvailability = async (
  geniusId: string,
  availabilityArray: Array<{ date: string; status: AvailabilityStatus }>
): Promise<void> => {
  const payload = availabilityArray.map(item => ({
    genius_id: geniusId,
    date: item.date,
    status: item.status,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('genius_availability')
    .upsert(payload, { onConflict: 'genius_id,date' });

  if (error) {
    console.error('Error saving bulk availability:', error);
    throw error;
  }
};

export const deleteAvailabilityRecord = async (
  geniusId: string,
  date: string
): Promise<void> => {
  const { error } = await supabase
    .from('genius_availability')
    .delete()
    .eq('genius_id', geniusId)
    .eq('date', date);

  if (error) {
    console.error('Error deleting availability record:', error);
    throw error;
  }
};

export const getAvailabilitySummary = async (
  geniusId: string,
  year: number,
  month: number
): Promise<AvailabilitySummary> => {
  const availability = await getAvailabilityForMonth(geniusId, year, month);

  const summary: AvailabilitySummary = {
    available: 0,
    full: 0,
    vacation: 0
  };

  availability.forEach(item => {
    if (item.status === 'available') summary.available++;
    else if (item.status === 'full') summary.full++;
    else if (item.status === 'vacation') summary.vacation++;
  });

  return summary;
};

export const getTodayAvailability = async (
  geniusId: string
): Promise<GeniusAvailability | null> => {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('genius_availability')
    .select('*')
    .eq('genius_id', geniusId)
    .eq('date', today)
    .maybeSingle();

  if (error) {
    console.error('Error fetching today availability:', error);
    return null;
  }

  return data;
};

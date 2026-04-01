import { useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabase() {
  const query = useCallback(async (table, options = {}) => {
    let query = supabase.from(table);

    if (options.select) query = query.select(options.select);
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    if (options.limit) query = query.limit(options.limit);
    if (options.order) {
      const [column, ascending] = Array.isArray(options.order) ? options.order : [options.order, true];
      query = query.order(column, { ascending });
    }

    const { data, error } = await query;
    return { data, error };
  }, []);

  const insert = useCallback(async (table, data) => {
    const { data: result, error } = await supabase.from(table).insert([data]);
    return { data: result, error };
  }, []);

  const update = useCallback(async (table, id, data) => {
    const { data: result, error } = await supabase.from(table).update(data).eq('id', id);
    return { data: result, error };
  }, []);

  const remove = useCallback(async (table, id) => {
    const { error } = await supabase.from(table).delete().eq('id', id);
    return { error };
  }, []);

  return { query, insert, update, remove, supabase };
}


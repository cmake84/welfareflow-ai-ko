export const STORAGE_KEYS = {
  RESIDENTS: 'welfareflow_residents_v2',
  RECORDS: 'welfareflow_records_v2',
  TASKS: 'welfareflow_tasks_v2',
  MONTHLY_TASKS: 'welfareflow_monthly_tasks_v2',
  TIMELINE: 'welfareflow_timeline_v2',
  CASE_ITEMS: 'welfareflow_case_items_v2',
  PROGRAMS: 'welfareflow_programs_v2',
  HANDOVER: 'welfareflow_handover_v2',
  DOCUMENTS: 'welfareflow_documents_v2',
  STATS: 'welfareflow_stats_v2',
  STAFF: 'welfareflow_staff_v2',
};

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    const parsed = JSON.parse(item);
    // If defaultValue is an array, ensure parsed is also an array
    if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
      return defaultValue;
    }
    return parsed as T;
  } catch (err) {
    console.warn(`[storage] Failed to load key "${key}" from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[storage] Failed to save key "${key}" to localStorage:`, err);
  }
}

export function removeFromStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[storage] Failed to remove key "${key}" from localStorage:`, err);
  }
}

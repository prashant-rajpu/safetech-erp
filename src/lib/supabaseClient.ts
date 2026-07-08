import { createClient } from '@supabase/supabase-js'
import { ERP_SEED_TABLES } from './erpSeeds'
import { LEGACY_SEED_TABLES } from './legacySeeds'

// Simple postgrest builder mock that reads/writes from localStorage
class MockBuilder {
  table: string;
  filters: Array<(item: any) => boolean> = [];
  orderByField: string | null = null;
  orderByAsc: boolean = true;
  limitCount: number | null = null;
  isInsert = false;
  isUpdate = false;
  isDelete = false;
  isUpsert = false;
  upsertKey = 'id';
  isSingle = false;
  isMaybeSingle = false;
  payload: any = null;

  constructor(table: string) {
    this.table = table;
  }

  select(fields: string = '*') {
    return this;
  }

  insert(rows: any[]) {
    this.isInsert = true;
    this.payload = rows;
    return this;
  }

  update(row: any) {
    this.isUpdate = true;
    this.payload = row;
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  upsert(rows: any[] | any, opts?: { onConflict?: string }) {
    this.isUpsert = true;
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.upsertKey = opts?.onConflict || 'id';
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push(item => item[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push(item => item[col] !== val);
    return this;
  }

  in(col: string, vals: any[]) {
    this.filters.push(item => vals.includes(item[col]));
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push(item => item[col] >= val);
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push(item => item[col] <= val);
    return this;
  }

  ilike(col: string, val: string) {
    const cleanVal = val.replace(/%/g, '').toLowerCase();
    this.filters.push(item => String(item[col] || '').toLowerCase().includes(cleanVal));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderByField = col;
    this.orderByAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  // Support then for await syntax
  async then(onfulfilled?: (value: any) => any) {
    let data = JSON.parse(localStorage.getItem(`mock_db_${this.table}`) || '[]');

    if (this.isInsert) {
      const newRows = this.payload.map((r: any) => ({
        id: r.id || Math.random().toString(36).substring(2, 11),
        ...r
      }));
      data = [...data, ...newRows];
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      const result = { data: this.isSingle ? newRows[0] : newRows, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    }

    if (this.isUpsert) {
      const key = this.upsertKey;
      const saved: any[] = [];
      for (const r of this.payload) {
        const idx = data.findIndex((item: any) => item[key] !== undefined && item[key] === r[key]);
        if (idx >= 0) {
          data[idx] = { ...data[idx], ...r };
          saved.push(data[idx]);
        } else {
          const row = { id: r.id || Math.random().toString(36).substring(2, 11), ...r };
          data.push(row);
          saved.push(row);
        }
      }
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      const result = { data: this.isSingle ? saved[0] : saved, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    }

    if (this.isUpdate) {
      data = data.map((item: any) => {
        const matches = this.filters.every(f => f(item));
        if (matches) {
          return { ...item, ...this.payload };
        }
        return item;
      });
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(data));
      const result = { data: null, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    }

    if (this.isDelete) {
      const remaining = data.filter((item: any) => !this.filters.every(f => f(item)));
      localStorage.setItem(`mock_db_${this.table}`, JSON.stringify(remaining));
      const result = { data: null, error: null };
      return onfulfilled ? onfulfilled(result) : result;
    }

    // Read/Select query
    let filtered = data.filter((item: any) => this.filters.every(f => f(item)));
    if (this.orderByField) {
      filtered.sort((a: any, b: any) => {
        const valA = a[this.orderByField!];
        const valB = b[this.orderByField!];
        if (valA < valB) return this.orderByAsc ? -1 : 1;
        if (valA > valB) return this.orderByAsc ? 1 : -1;
        return 0;
      });
    }
    if (this.limitCount) {
      filtered = filtered.slice(0, this.limitCount);
    }

    let finalData: any = filtered;
    if (this.isSingle) {
      finalData = filtered[0] || null;
    } else if (this.isMaybeSingle) {
      finalData = filtered[0] || null;
    }

    const result = { data: finalData, error: null };
    return onfulfilled ? onfulfilled(result) : result;
  }
}

// Initial seed data for Precast Concrete Construction
// Seed localStorage, forced upgrade version v6 to capture new Production and Stockyard tables
const seedTable = (name: string, defaultData: any[], forceReset = false) => {
  const key = `mock_db_${name}`;
  if (!localStorage.getItem(key) || forceReset) {
    localStorage.setItem(key, JSON.stringify(defaultData));
  }
};

// Backend switch: when a real Supabase project is configured via env vars,
// use it directly (shared multi-device data). Otherwise fall back to the
// offline localStorage mock so the app runs with zero setup.
const REAL_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const REAL_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;
export const USE_REAL_BACKEND = !!(
  REAL_URL && REAL_URL.startsWith('https://') && REAL_URL.includes('.supabase.co') &&
  REAL_KEY && REAL_KEY.length > 20
);

const hasSeededV6 = USE_REAL_BACKEND || localStorage.getItem('mock_db_seeded_v10') === 'true';

if (!USE_REAL_BACKEND) {
// Legacy core tables (projects, fleet, dispatch, yard, users…) — see legacySeeds.ts
for (const [tableName, rows] of Object.entries(LEGACY_SEED_TABLES)) {
  seedTable(tableName, rows, !hasSeededV6);
}


// Full ERP module tables (Design, Planning, Production, QA/QC, Stockyard,
// Dispatch, Logistics, Administration) — see erpSeeds.ts
for (const [tableName, rows] of Object.entries(ERP_SEED_TABLES)) {
  seedTable(tableName, rows, !hasSeededV6);
}

localStorage.setItem('mock_db_seeded_v10', 'true');
}

// Offline mock client (default when no real backend is configured)
const mockSupabase = {
  auth: {
    async getSession() {
      return {
        data: {
          session: {
            user: { id: 'mock-admin-id', email: 'admin@safetech.ae' }
          }
        },
        error: null
      };
    },
    async signInWithPassword({ email, password }: any) {
      return {
        data: {
          user: { id: 'mock-admin-id', email: email || 'admin@safetech.ae' }
        },
        error: null
      };
    },
    onAuthStateChange(callback: any) {
      // Trigger login immediately
      setTimeout(() => {
        callback('SIGNED_IN', {
          user: { id: 'mock-admin-id', email: 'admin@safetech.ae' }
        });
      }, 50);
      return {
        data: {
          subscription: {
            unsubscribe() {}
          }
        }
      };
    },
    async signOut() {
      return { error: null };
    }
  },
  from(table: string) {
    return new MockBuilder(table);
  }
} as any;

// Real client when env vars are present (see .env.example); mock otherwise.
export const supabase = USE_REAL_BACKEND
  ? createClient(REAL_URL!, REAL_KEY!)
  : mockSupabase;

import { createClient } from '@supabase/supabase-js'
import { ERP_SEED_TABLES } from './erpSeeds'

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
const defaultProjects = [
  { id: 'p1', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', active: true },
  { id: 'p2', project_no: 'P25020', project_name: 'KHALIFA UNIVERSITY CLADDINGS', location: 'Abu Dhabi', active: true },
  { id: 'p3', project_no: 'P25027', project_name: 'BW PALM JEBEL ALI - P1', location: 'Jebel Ali', active: true },
  { id: 'p4', project_no: 'P25037', project_name: 'BW PALM JEBEL ALI - P2', location: 'Jebel Ali', active: true },
  { id: 'p5', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', location: 'DUBAI', active: true },
  { id: 'p6', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', active: true },
  { id: 'p7', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', active: true },
  { id: 'p8', project_no: 'P25045', project_name: 'ACERS BW', location: 'DUBAI', active: true },
  { id: 'p9', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', active: true }
];

const defaultTrailers = [
  { id: 't1', plate_no: '44292', supplier: 'Hil (AF)', type: 'Trailer - A-Frame', driver_name: 'Gurwinder Singh', driver_mobile: '056 3770181' },
  { id: 't2', plate_no: '45452', supplier: 'Hil (AF)', type: 'Trailer - A-Frame', driver_name: 'Babar', driver_mobile: '056 9406193' },
  { id: 't3', plate_no: '26142', supplier: 'Hil (AF)', type: 'Trailer - A-Frame', driver_name: 'Rajan', driver_mobile: '056 4688047' },
  { id: 't4', plate_no: '56305', supplier: 'Hil', type: 'Trailer - Flatbed', driver_name: 'Jaspreet singh', driver_mobile: '058 6589015' },
  { id: 't5', plate_no: '56493', supplier: 'Hil', type: 'Trailer - Flatbed', driver_name: 'Harmandeep Singh', driver_mobile: '056 6055409' },
  { id: 't6', plate_no: '32881', supplier: 'Hil', type: 'Trailer - Flatbed', driver_name: 'Ranjeet singh', driver_mobile: '058 6886987' },
  { id: 't7', plate_no: '87023', supplier: 'GPS Transport LLC', type: 'Trailer - Flatbed', driver_name: '', driver_mobile: '566996560' },
  { id: 't8', plate_no: '62349', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Khaled Ibrahim', driver_mobile: '058 2369395' },
  { id: 't9', plate_no: '19607', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Nzyad', driver_mobile: '052 1308021' },
  { id: 't10', plate_no: '39057', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Ayham Khaled', driver_mobile: '052 8164939' },
  { id: 't11', plate_no: '52769', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Zain Arshad', driver_mobile: '055 2782604' },
  { id: 't12', plate_no: '67828', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Mohamad', driver_mobile: '056 2140233' },
  { id: 't13', plate_no: '98751', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Nisar Ahmad', driver_mobile: '056 229 0791' },
  { id: 't14', plate_no: '82339', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Nazir', driver_mobile: '052 8109834' },
  { id: 't15', plate_no: '11649', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Awad', driver_mobile: '052 7987528' },
  { id: 't16', plate_no: '79169', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Mohammed Nore', driver_mobile: '055 9495590' },
  { id: 't17', plate_no: '70377', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Amar', driver_mobile: '058 8316199' },
  { id: 't18', plate_no: '10989', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Mohammad Ayoub', driver_mobile: '056 1475744' },
  { id: 't19', plate_no: '47414', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Muhamad', driver_mobile: '055 3461335' },
  { id: 't20', plate_no: '32437', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Abid Hussain', driver_mobile: '050 2143040' },
  { id: 't21', plate_no: '84198', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Ammar', driver_mobile: '055 9114187' },
  { id: 't22', plate_no: '82688', supplier: 'Diplomacy', type: 'Trailer - Flatbed', driver_name: 'Yaser abo Karshif', driver_mobile: '056 4575061' },
  { id: 't23', plate_no: '47681', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed', driver_name: 'Mosafer Janan', driver_mobile: '056 8478602' },
  { id: 't24', plate_no: '4476', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed', driver_name: 'Shamsu Allah', driver_mobile: '050 7781397' },
  { id: 't25', plate_no: '58380', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed', driver_name: 'Rehman', driver_mobile: '055 1170880' },
  { id: 't26', plate_no: '89371', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed', driver_name: 'Rakhmat', driver_mobile: '0563026427 / 0568909894' },
  { id: 't27', plate_no: '20990', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame', driver_name: 'Satwant Singh', driver_mobile: '052 2805133' },
  { id: 't28', plate_no: '15387', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame', driver_name: 'Supandeep Singh', driver_mobile: '054 5326158' },
  { id: 't29', plate_no: '43606', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame', driver_name: 'Dilbag Singh', driver_mobile: '056 1270263' },
  { id: 't30', plate_no: '47108', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Ranjit singh', driver_mobile: '056 5352034' },
  { id: 't31', plate_no: '85964', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame', driver_name: 'Jarman', driver_mobile: '055 7253128' },
  { id: 't32', plate_no: '80774', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: '', driver_mobile: '052 2489157' },
  { id: 't33', plate_no: '58838', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Balraj', driver_mobile: '056 9874370' },
  { id: 't34', plate_no: '37248', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Husandeep', driver_mobile: '055 6907850' },
  { id: 't35', plate_no: '88217', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Jugraj Singh', driver_mobile: '056 9292707' },
  { id: 't36', plate_no: '27951', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Dilbag Singh', driver_mobile: '056 7364924' },
  { id: 't37', plate_no: '52156', supplier: 'Ijad transport', type: 'Trailer - Flatbed', driver_name: 'Lovdeep Sinhg', driver_mobile: '052 5523371' },
  { id: 't38', plate_no: '67071', supplier: 'Ijad transport', type: 'Trailer - Flatbed', driver_name: 'Mohamed Shiraz', driver_mobile: '055 7441205' },
  { id: 't39', plate_no: '82471', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame', driver_name: 'Joga Singh', driver_mobile: '052 5369097' },
  { id: 't40', plate_no: '4517', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Naziab Hussain', driver_mobile: '052 7060933' },
  { id: 't41', plate_no: '29289', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Rihan Ali', driver_mobile: '050 9088714' },
  { id: 't42', plate_no: '39696', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Khayal Bar', driver_mobile: '055 1637899' },
  { id: 't43', plate_no: '88163', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Rukhsar Hussain', driver_mobile: '050 5903593' },
  { id: 't44', plate_no: '12874', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Qaiser Iqbal', driver_mobile: '052 4564374' },
  { id: 't45', plate_no: '29195', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed', driver_name: 'Abdulsattar', driver_mobile: '050 8321067' },
  { id: 't46', plate_no: '53148', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame', driver_name: 'Gurjant Singh', driver_mobile: '055 4048606' },
  { id: 't47', plate_no: '44264', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame', driver_name: 'Navjot', driver_mobile: '052 6595540' },
  { id: 't48', plate_no: '88083', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame', driver_name: 'Dilbag', driver_mobile: '055 4048596' },
  { id: 't49', plate_no: '93781', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame', driver_name: 'Amandip Singh', driver_mobile: '0528928745' },
  { id: 't50', plate_no: '97752', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed', driver_name: 'Anwarpreet', driver_mobile: '056 1090113' },
  { id: 't51', plate_no: '36171', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed', driver_name: 'Dharmpreet', driver_mobile: '055 9166412' },
  { id: 't52', plate_no: '33751', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed', driver_name: 'Jaskaran', driver_mobile: '056 5845925' },
  { id: 't53', plate_no: '84026', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed', driver_name: 'Sukchain', driver_mobile: '052 1660225' },
  { id: 't54', plate_no: '49921', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed', driver_name: 'Mandeep', driver_mobile: '050 5753168' },
  { id: 't55', plate_no: '73749', supplier: 'OMD Transport (GPS-40785)', type: 'Trailer - Flatbed', driver_name: 'Sami Ahmed', driver_mobile: '050 4167644' },
  { id: 't56', plate_no: '76477', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Muhanad Ali Aliarof', driver_mobile: '058 8875582' },
  { id: 't57', plate_no: '67622', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Abdul Karim Ismail', driver_mobile: '056 6075017' },
  { id: 't58', plate_no: '45059', supplier: 'OMD transport', type: 'Trailer - Flatbed', driver_name: 'Mohamad kashou', driver_mobile: '054 5522622' },
  { id: 't59', plate_no: '62598', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Huseen', driver_mobile: '056 6028701' },
  { id: 't60', plate_no: '12824', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Ahmad Alsayid Ahmad', driver_mobile: '050 1515917' },
  { id: 't61', plate_no: '90384', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Majd Mohammed', driver_mobile: '056 1319517' },
  { id: 't62', plate_no: '21010', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Aiham', driver_mobile: '055 5712710' },
  { id: 't63', plate_no: '37109', supplier: 'OMD Transport', type: 'Trailer - Flatbed', driver_name: 'Omar', driver_mobile: '052 6089005' },
  { id: 't64', plate_no: '17258', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Bashar AlSteif', driver_mobile: '054 4821146' },
  { id: 't65', plate_no: '80670', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Ahmed AlRifai', driver_mobile: '055 7305323' },
  { id: 't66', plate_no: '76937', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Hussein Ali Maroush', driver_mobile: '058 8899753' },
  { id: 't67', plate_no: '34632', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Muhand Ali jresh', driver_mobile: '050 3260125' },
  { id: 't68', plate_no: '83868', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame', driver_name: 'Osama Awad', driver_mobile: '052 7767714' },
  { id: 't69', plate_no: '64554', supplier: 'OMD transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame', driver_name: 'Naji', driver_mobile: '0505976631' },
  { id: 't70', plate_no: '87760', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame', driver_name: 'Ahmed Mohamad Shahada', driver_mobile: '056 6434168' },
  { id: 't71', plate_no: '52096', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame', driver_name: 'Olyan Aboud', driver_mobile: '058 2887199' },
  { id: 't72', plate_no: '94225', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame', driver_name: 'Yousuf', driver_mobile: '055 8475272' },
];

const defaultSuppliers = [
  { id: 's1', name: 'Safetech Logistics' },
  { id: 's2', name: 'Fast Concrete' },
  { id: 's3', name: 'United Logistics' }
];

// Seed 28 deliveries matching Delivery report Sample.pdf exactly for June 29, 2026
const defaultDeliveries = [
  { id: 'd1', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', trailer_id: 't1', element_type: 'HCS', element_count: 17, dn_no: 'SPBM-10368', volume_cum: 8.15, weight_tons: 20.37, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T07:15:00+04:00', remarks: 'BY CLIENT' },
  { id: 'd2', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't2', element_type: 'WL/PC', element_count: 7, dn_no: 'SPBM-10369', volume_cum: 11.15, weight_tons: 27.89, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T08:20:00+04:00', remarks: '' },
  { id: 'd3', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', location: 'DUBAI', trailer_id: 't3', element_type: 'WL', element_count: 8, dn_no: 'SPBM-10370', volume_cum: 12.50, weight_tons: 31.25, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T09:10:00+04:00', remarks: '' },
  { id: 'd4', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', trailer_id: 't4', element_type: 'HCS', element_count: 17, dn_no: 'SPBM-10371', volume_cum: 10.07, weight_tons: 25.18, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T10:00:00+04:00', remarks: '' },
  { id: 'd5', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't5', element_type: 'HCS', element_count: 14, dn_no: 'SPBM-10372', volume_cum: 4.02, weight_tons: 10.05, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T10:45:00+04:00', remarks: 'BY CLIENT' },
  { id: 'd6', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', trailer_id: 't6', element_type: 'HCS', element_count: 18, dn_no: 'SPBM-10373', volume_cum: 10.49, weight_tons: 26.23, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T11:30:00+04:00', remarks: '' },
  { id: 'd7', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't7', element_type: 'WL/PC', element_count: 13, dn_no: 'SPBM-10374', volume_cum: 9.40, weight_tons: 23.51, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T12:15:00+04:00', remarks: '' },
  { id: 'd8', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', trailer_id: 't1', element_type: 'HCS', element_count: 16, dn_no: 'SPBM-10375', volume_cum: 6.37, weight_tons: 15.93, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T13:00:00+04:00', remarks: 'BY CLIENT' },
  { id: 'd9', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't2', element_type: 'WL', element_count: 12, dn_no: 'SPBM-10376', volume_cum: 9.93, weight_tons: 24.82, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T13:40:00+04:00', remarks: '' },
  { id: 'd10', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', trailer_id: 't3', element_type: 'WL/PC', element_count: 7, dn_no: 'SPBM-10377', volume_cum: 11.85, weight_tons: 29.63, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T14:30:00+04:00', remarks: '' },
  { id: 'd11', project_no: 'P25045', project_name: 'ACERS BW', location: 'DUBAI', trailer_id: 't4', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10378', volume_cum: 7.66, weight_tons: 19.14, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T15:15:00+04:00', remarks: '' },
  { id: 'd12', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', trailer_id: 't5', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10379', volume_cum: 7.14, weight_tons: 17.84, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T16:00:00+04:00', remarks: '' },
  { id: 'd13', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't6', element_type: 'WL/PC', element_count: 5, dn_no: 'SPBM-10380', volume_cum: 11.64, weight_tons: 29.10, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T16:45:00+04:00', remarks: '' },
  { id: 'd14', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', trailer_id: 't7', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10381', volume_cum: 5.98, weight_tons: 14.95, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T17:30:00+04:00', remarks: '' },
  { id: 'd15', project_no: 'P25045', project_name: 'ACERS BW', location: 'DUBAI', trailer_id: 't1', element_type: 'BW', element_count: 5, dn_no: 'SPBM-10382', volume_cum: 5.68, weight_tons: 14.19, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T18:15:00+04:00', remarks: '' },
  { id: 'd16', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', trailer_id: 't2', element_type: 'HCS', element_count: 36, dn_no: 'SPBM-10383', volume_cum: 20.22, weight_tons: 50.54, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T19:00:00+04:00', remarks: '' },
  { id: 'd17', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', trailer_id: 't3', element_type: 'WL', element_count: 12, dn_no: 'SPBM-10384', volume_cum: 12.81, weight_tons: 32.03, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T20:00:00+04:00', remarks: '' },
  { id: 'd18', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', trailer_id: 't4', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10385', volume_cum: 5.67, weight_tons: 14.18, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T21:00:00+04:00', remarks: '' },
  { id: 'd19', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't5', element_type: 'WL/PC', element_count: 10, dn_no: 'SPBM-10386', volume_cum: 9.05, weight_tons: 22.62, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T22:00:00+04:00', remarks: '' },
  { id: 'd20', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', trailer_id: 't6', element_type: 'HCS', element_count: 14, dn_no: 'SPBM-10387', volume_cum: 4.70, weight_tons: 11.69, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-29T23:00:00+04:00', remarks: 'BY CLIENT' },
  { id: 'd21', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't7', element_type: 'HCS', element_count: 10, dn_no: 'SPBM-10387 A', volume_cum: 4.21, weight_tons: 10.52, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T00:15:00+04:00', remarks: '' },
  { id: 'd22', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', trailer_id: 't1', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10388', volume_cum: 6.37, weight_tons: 15.93, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T01:30:00+04:00', remarks: '' },
  { id: 'd23', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', location: 'DUBAI', trailer_id: 't2', element_type: 'HCS', element_count: 15, dn_no: 'SPBM-10389', volume_cum: 5.01, weight_tons: 12.41, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T02:30:00+04:00', remarks: '' },
  { id: 'd24', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', location: 'DUBAI', trailer_id: 't3', element_type: 'WL/PC', element_count: 14, dn_no: 'SPBM-10390', volume_cum: 12.13, weight_tons: 30.32, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T03:30:00+04:00', remarks: '' },
  { id: 'd25', project_no: 'P25045', project_name: 'ACERS BW', location: 'DUBAI', trailer_id: 't4', element_type: 'BW', element_count: 6, dn_no: 'SPBM-10391', volume_cum: 4.42, weight_tons: 11.05, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T04:15:00+04:00', remarks: '' },
  { id: 'd26', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', trailer_id: 't5', element_type: 'BW', element_count: 4, dn_no: 'SPBM-10392', volume_cum: 6.12, weight_tons: 15.30, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T04:50:00+04:00', remarks: '' },
  { id: 'd27', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', trailer_id: 't6', element_type: 'HCS', element_count: 17, dn_no: 'SPBM-10393', volume_cum: 8.42, weight_tons: 21.04, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T05:20:00+04:00', remarks: '' },
  { id: 'd28', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', trailer_id: 't7', element_type: 'HCS', element_count: 19, dn_no: 'SPBM-10394', volume_cum: 10.15, weight_tons: 25.36, delivery_date: '2026-06-29', delivery_timestamp: '2026-06-30T05:55:00+04:00', remarks: 'BY CLIENT' }
];

const defaultFleetStatus = [
  { id: 'fs1', trailer_id: 't1', status_text: 'Loading', site_location: 'Precast Yard', driver_name: 'Sajid Khan', driver_phone: '+971 50 123 4567', status_timestamp: new Date().toISOString() },
  { id: 'fs2', trailer_id: 't2', status_text: 'Transit', site_location: 'Al Barsha Road', driver_name: 'Muhammad Ali', driver_phone: '+971 55 987 6543', status_timestamp: new Date().toISOString() },
  { id: 'fs3', trailer_id: 't3', status_text: 'Unloading', site_location: 'Al Barsha Site', driver_name: 'Jaspreet Singh', driver_phone: '+971 56 345 6789', status_timestamp: new Date().toISOString() },
  { id: 'fs4', trailer_id: 't4', status_text: 'Idle', site_location: 'Jebel Ali Yard', driver_name: 'Tariq Mahmood', driver_phone: '+971 52 456 7890', status_timestamp: new Date().toISOString() }
];

const defaultUsers = [
  { id: 'mock-admin-id', email: 'admin@safetech.ae', role: 'admin' }
];

const defaultCustomers = [
  { id: 'cust1', name: 'Emaar Properties', email: 'info@emaar.ae', phone: '+971 4 367 3333', status: 'Active' },
  { id: 'cust2', name: 'Modon Properties', email: 'contact@modon.ae', phone: '+971 2 619 9999', status: 'Active' },
  { id: 'cust3', name: 'Damac Properties', email: 'sales@damac.ae', phone: '+971 4 373 1000', status: 'Active' }
];

const defaultConcreteGrades = [
  { id: 'cg1', grade: 'C45', grade_name: 'C45/55 OPC' },
  { id: 'cg2', grade: 'C50', grade_name: 'C50/60 Microsilica' },
  { id: 'cg3', grade: 'C60', grade_name: 'C60/75 SRC High Strength' },
  { id: 'cg4', grade: 'C70', grade_name: 'C70/85 High Performance' }
];

const defaultMixDesigns = [
  { id: 'md1', mix_code: 'MIX-C45-OPC', concrete_grade: 'C45', cement_type: 'OPC', w_c_ratio: 0.36 },
  { id: 'md2', mix_code: 'MIX-C50-MS', concrete_grade: 'C50', cement_type: 'OPC + Microsilica', w_c_ratio: 0.32 },
  { id: 'md3', mix_code: 'MIX-C60-SRC', concrete_grade: 'C60', cement_type: 'SRC', w_c_ratio: 0.28 }
];

const defaultElementTypes = [
  { id: 'et1', type_name: 'Wall Panel', type_code: 'WL' },
  { id: 'et2', type_name: 'Hollow Core Slab', type_code: 'HCS' },
  { id: 'et3', type_name: 'Boundary Wall', type_code: 'BW' },
  { id: 'et4', type_name: 'Precast Beam', type_code: 'BM' },
  { id: 'et5', type_name: 'Precast Column', type_code: 'CL' }
];

const defaultProductionBeds = [
  { id: 'pb1', bed_name: 'Bed 1', length_m: 120, width_m: 2.4, type: 'Prestressed Flatbed' },
  { id: 'pb2', bed_name: 'Bed 2', length_m: 120, width_m: 2.4, type: 'Prestressed Flatbed' },
  { id: 'pb3', bed_name: 'HCS Bed A', length_m: 150, width_m: 1.2, type: 'HCS Slipformer Bed' },
  { id: 'pb4', bed_name: 'HCS Bed B', length_m: 150, width_m: 1.2, type: 'HCS Slipformer Bed' }
];

const defaultMoulds = [
  { id: 'm1', mould_name: 'Mould A', type: 'Battery Mould', product_width_m: 3.5 },
  { id: 'm2', mould_name: 'Mould B', type: 'Tilting Table', product_width_m: 4.0 },
  { id: 'm3', mould_name: 'Mould C', type: 'Column Mould', product_width_m: 0.8 }
];

const defaultYardBays = [
  { id: 'yb1', bay_name: 'Bay 01', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb2', bay_name: 'Bay 02', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb3', bay_name: 'Bay 03', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb4', bay_name: 'Bay 05', capacity_pcs: 200, zone: 'Zone HCS' },
  { id: 'yb5', bay_name: 'HCS Zone 1', capacity_pcs: 300, zone: 'Zone HCS' },
  { id: 'yb6', bay_name: 'Bay 08', capacity_pcs: 100, zone: 'Zone Boundary Wall' }
];

const defaultCraneOperators = [
  { id: 'co1', name: 'Ramesh Kumar', license_no: 'CR-99231', status: 'Active' },
  { id: 'co2', name: 'Jamil Ahmed', license_no: 'CR-88231', status: 'Active' },
  { id: 'co3', name: 'Sukhwinder Singh', license_no: 'CR-77241', status: 'Active' }
];

const defaultQcInspectors = [
  { id: 'qi1', name: 'John Doe', certification_no: 'QC-ACI-101', status: 'Active' },
  { id: 'qi2', name: 'Sanjay Patel', certification_no: 'QC-PCI-202', status: 'Active' },
  { id: 'qi3', name: 'Hassan Al-Mansoori', certification_no: 'QC-PCI-303', status: 'Active' }
];

const defaultElementPlanning = [
  { id: 'ep1', project_no: 'P25044', drawing_number: 'DWG-ACERS-WL-101', revision: 'R0', element_type: 'WL/PC', quantity: 15, planned_casting_date: '2026-06-29', priority: 'High', assigned_bed: 'Bed 1', assigned_mould: 'Mould A', status: 'Planned' },
  { id: 'ep2', project_no: 'P25044', drawing_number: 'DWG-ACERS-WL-102', revision: 'R1', element_type: 'WL/PC', quantity: 8, planned_casting_date: '2026-06-30', priority: 'Medium', assigned_bed: 'Bed 1', assigned_mould: 'Mould A', status: 'Planned' },
  { id: 'ep3', project_no: 'P25035', drawing_number: 'DWG-BANIYAS-HCS-201', revision: 'R0', element_type: 'HCS', quantity: 45, planned_casting_date: '2026-06-29', priority: 'High', assigned_bed: 'HCS Bed A', assigned_mould: 'Mould C', status: 'Planned' },
  { id: 'ep4', project_no: 'P25035', drawing_number: 'DWG-BANIYAS-HCS-202', revision: 'R0', element_type: 'HCS', quantity: 24, planned_casting_date: '2026-07-01', priority: 'Low', assigned_bed: 'HCS Bed A', assigned_mould: 'Mould C', status: 'Planned' }
];

const defaultReinforcementTracking = [
  { id: 'r1', cage_id: 'CAGE-WL-101-01', element_code: '00-IW01-2502M-002', steel_weight_kg: 245.5, fabricator: 'Steel Fabricator Team A', inspection_status: 'Passed', status: 'Ready' },
  { id: 'r2', cage_id: 'CAGE-WL-101-02', element_code: '00-IW01-2502M-003', steel_weight_kg: 245.5, fabricator: 'Steel Fabricator Team A', inspection_status: 'Passed', status: 'Casting' },
  { id: 'r3', cage_id: 'CAGE-WL-102-01', element_code: '00-IW02-2502M-004', steel_weight_kg: 320.0, fabricator: 'Steel Fabricator Team B', inspection_status: 'Passed', status: 'Ready' },
  { id: 'r4', cage_id: 'CAGE-BW-001', element_code: '00-BW05-2502M-001', steel_weight_kg: 85.0, fabricator: 'Steel Fabricator Team C', inspection_status: 'Pending', status: 'Planned' }
];

const defaultQcInspections = [
  { id: 'q1', element_code: '00-IW01-2502M-002', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0021', inspector: 'John Doe', qc_result: 'PASSED' },
  { id: 'q2', element_code: '00-IW01-2502M-003', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0022', inspector: 'John Doe', qc_result: 'PASSED' },
  { id: 'q3', element_code: '00-IW02-2502M-004', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0023', inspector: 'Sanjay Patel', qc_result: 'PASSED' },
  { id: 'q4', element_code: '00-BW05-2502M-001', pre_pour_check: true, reinforcement_check: false, cover_check: true, embedded_items_check: false, dimensions_check: true, concrete_test_ref: 'N/A', inspector: 'Sanjay Patel', qc_result: 'FAILED' }
];

const defaultYardMovement = [
  { id: 'm1', element_code: '00-IW01-2502M-002', from_bay: 'Bed 1', to_bay: 'Bay 03', crane: 'Gantry Crane 1', operator: 'Ramesh Kumar', movement_time: '2026-06-26 14:30', remarks: 'Moved to storage bay' },
  { id: 'm2', element_code: '00-HC30-2502M-001', from_bay: 'HCS Bed A', to_bay: 'HCS Zone 1', crane: 'HCS Gantry', operator: 'Jamil Ahmed', movement_time: '2026-06-28 09:15', remarks: 'Moved to curing bay' }
];

const defaultDispatchPlanning = [
  { id: 'dp1', dispatch_no: 'DISP-2544-01', trailer_plate: '80774', driver_name: 'WAQAR', loading_time: '2026-06-29 06:30', departure_time: '2026-06-29 07:15', destination: 'THE ACRES - PHASE 1', status: 'In Transit' },
  { id: 'dp2', dispatch_no: 'DISP-2544-02', trailer_plate: '10934', driver_name: 'SAJID KHAN', loading_time: '2026-06-29 08:00', departure_time: '2026-06-29 08:45', destination: 'THE ACRES - PHASE 1', status: 'Loading' }
];


const defaultTraceability = [
  {
    id: 'tr1',
    element_code: '00-IW01-2502M-002',
    planning_timestamp: '2026-06-24 09:00',
    casting_timestamp: '2026-06-25 08:30',
    qc_timestamp: '2026-06-25 10:15',
    curing_timestamp: '2026-06-25 11:00',
    stockyard_timestamp: '2026-06-26 14:30',
    loading_timestamp: '2026-06-29 06:30',
    dispatch_timestamp: '2026-06-29 07:15',
    delivery_timestamp: '2026-06-29 09:30'
  },
  {
    id: 'tr2',
    element_code: '00-IW01-2502M-003',
    planning_timestamp: '2026-06-24 09:00',
    casting_timestamp: '2026-06-26 08:45',
    qc_timestamp: '2026-06-26 10:30',
    curing_timestamp: '2026-06-26 11:15',
    stockyard_timestamp: '2026-06-26 15:00',
    loading_timestamp: 'Pending',
    dispatch_timestamp: 'Pending',
    delivery_timestamp: 'Pending'
  },
  {
    id: 'tr3',
    element_code: '00-HC30-2502M-001',
    planning_timestamp: '2026-06-25 11:30',
    casting_timestamp: '2026-06-27 08:15',
    qc_timestamp: '2026-06-27 10:00',
    curing_timestamp: '2026-06-27 11:00',
    stockyard_timestamp: '2026-06-28 09:15',
    loading_timestamp: 'Pending',
    dispatch_timestamp: 'Pending',
    delivery_timestamp: 'Pending'
  }
];

const defaultMaintenanceLogs = [
  { id: 'ml1', equipment_type: 'Trailer', equipment_id: '80774', maintenance_date: '2026-06-20', description: 'Brake pad replacement and tire rotation', technician: 'Mufaddal Auto Shop', status: 'Completed' },
  { id: 'ml2', equipment_type: 'Crane', equipment_id: 'Gantry Crane 1', maintenance_date: '2026-06-22', description: 'Wire rope inspection and load testing', technician: 'Al-Nasr Crane Services', status: 'Completed' },
  { id: 'ml3', equipment_type: 'Mould', equipment_id: 'Mould A', maintenance_date: '2026-06-24', description: 'Magnetic shuttering strip cleaning and calibration', technician: 'Factory Maintenance Team', status: 'Completed' }
];

const defaultCastingLogs = [
  { id: 'c1', casting_id: 'CAST-250625-01', cast_date: '2026-06-25', shift: 'Day Shift', bed_mould_id: 'Bed 1', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99231', mix_design: 'MIX-C45-OPC', volume_cum: 3.12, weight_tons: 7.80, start_time: '07:30', finish_time: '08:45', qc_status: 'PASSED', remarks: 'Good pour' },
  { id: 'c2', casting_id: 'CAST-250626-01', cast_date: '2026-06-26', shift: 'Day Shift', bed_mould_id: 'Bed 1', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99232', mix_design: 'MIX-C45-OPC', volume_cum: 3.12, weight_tons: 7.80, start_time: '07:45', finish_time: '09:00', qc_status: 'PASSED', remarks: 'Regular pour' },
  { id: 'c3', casting_id: 'CAST-250627-01', cast_date: '2026-06-27', shift: 'Day Shift', bed_mould_id: 'HCS Bed A', supervisor: 'Muhammad Ali', concrete_grade: 'C60', batch_number: 'BATCH-99245', mix_design: 'MIX-C60-SRC', volume_cum: 1.50, weight_tons: 3.75, start_time: '08:00', finish_time: '09:30', qc_status: 'PASSED', remarks: 'Slipformer speed checked' },
  { id: 'c4', casting_id: 'CAST-250628-01', cast_date: '2026-06-28', shift: 'Night Shift', bed_mould_id: 'HCS Bed A', supervisor: 'Muhammad Ali', concrete_grade: 'C60', batch_number: 'BATCH-99250', mix_design: 'MIX-C60-SRC', volume_cum: 1.50, weight_tons: 3.75, start_time: '20:30', finish_time: '21:55', qc_status: 'PASSED', remarks: 'Tension strands inspected' },
  { id: 'c5', casting_id: 'CAST-250629-01', cast_date: '2026-06-29', shift: 'Day Shift', bed_mould_id: 'Mould B', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99261', mix_design: 'MIX-C45-OPC', volume_cum: 4.20, weight_tons: 10.50, start_time: '08:15', finish_time: '09:40', qc_status: 'PASSED', remarks: 'Battery mould tilt verified' },
  { id: 'c6', casting_id: 'CAST-250629-02', cast_date: '2026-06-29', shift: 'Day Shift', bed_mould_id: 'Mould C', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99262', mix_design: 'MIX-C45-OPC', volume_cum: 2.10, weight_tons: 5.25, start_time: '10:00', finish_time: '11:15', qc_status: 'PENDING', remarks: 'Pending concrete cube compression test result' }
];
const defaultStockyardInventory = [
  { id: 'sy1', element_code: '00-IW01-2502M-002', project_no: 'P25044', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.80, cast_date: '2026-06-25', bay_location: 'Bay 03', status: 'Delivered', curing_days: 4, remarks: 'Shipped on SPBM-10369' },
  { id: 'sy2', element_code: '00-IW01-2502M-003', project_no: 'P25044', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.80, cast_date: '2026-06-26', bay_location: 'Bay 03', status: 'Ready', curing_days: 3, remarks: 'Curing completed' },
  { id: 'sy3', element_code: '00-HC30-2502M-001', project_no: 'P25035', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', element_type: 'HCS', revision: 'R1', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.50, weight_tons: 3.75, cast_date: '2026-06-27', bay_location: 'HCS Zone 1', status: 'Curing', curing_days: 2, remarks: 'Curing (Critical)' },
  { id: 'sy4', element_code: '00-HC30-2502M-002', project_no: 'P25035', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', element_type: 'HCS', revision: 'R1', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.50, weight_tons: 3.75, cast_date: '2026-06-28', bay_location: 'HCS Zone 1', status: 'Curing', curing_days: 1, remarks: 'Curing (Critical)' },
  { id: 'sy5', element_code: '00-IW02-2502M-004', project_no: 'P25044', building: 'Building B', floor: 'Floor G', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3800, width_mm: 2600, thickness_mm: 250, volume_cum: 4.20, weight_tons: 10.50, cast_date: '2026-06-29', bay_location: 'Bay 05', status: 'Curing', curing_days: 0, remarks: 'Curing (Critical)' },
  { id: 'sy6', element_code: '00-BW05-2502M-001', project_no: 'P25010', building: 'Boundary Wall A', floor: 'G', zone: 'Zone 1', element_type: 'BW', revision: 'R0', length_mm: 3500, width_mm: 1200, thickness_mm: 100, volume_cum: 2.10, weight_tons: 5.25, cast_date: '2026-06-29', bay_location: 'Bay 08', status: 'Rejected', curing_days: 0, remarks: 'Awaiting QC release' }
];

const defaultCastingLogs_old = [
  { id: 'c1', cast_date: '2026-06-25', project_no: 'P25044', element_code: '00-IW01-2502M-002', element_type: 'WL/PC', volume_cum: 3.12, weight_tons: 7.80, concrete_grade: 'C45', bed_mould_id: 'Bed 1', qc_status: 'PASSED' },
  { id: 'c2', cast_date: '2026-06-26', project_no: 'P25044', element_code: '00-IW01-2502M-003', element_type: 'WL/PC', volume_cum: 3.12, weight_tons: 7.80, concrete_grade: 'C45', bed_mould_id: 'Bed 1', qc_status: 'PASSED' },
  { id: 'c3', cast_date: '2026-06-27', project_no: 'P25035', element_code: '00-HC30-2502M-001', element_type: 'HCS', volume_cum: 1.50, weight_tons: 3.75, concrete_grade: 'C60', bed_mould_id: 'HCS Bed A', qc_status: 'PASSED' },
  { id: 'c4', cast_date: '2026-06-28', project_no: 'P25035', element_code: '00-HC30-2502M-002', element_type: 'HCS', volume_cum: 1.50, weight_tons: 3.75, concrete_grade: 'C60', bed_mould_id: 'HCS Bed A', qc_status: 'PASSED' },
  { id: 'c5', cast_date: '2026-06-29', project_no: 'P25044', element_code: '00-IW02-2502M-004', element_type: 'WL/PC', volume_cum: 4.20, weight_tons: 10.50, concrete_grade: 'C45', bed_mould_id: 'Mould B', qc_status: 'PASSED' },
  { id: 'c6', cast_date: '2026-06-29', project_no: 'P25010', element_code: '00-BW05-2502M-001', element_type: 'WL/PC', volume_cum: 2.10, weight_tons: 5.25, concrete_grade: 'C45', bed_mould_id: 'Mould C', qc_status: 'PENDING' }
];

const defaultStockyardInventory_old = [
  { id: 'sy1', element_code: '00-IW01-2502M-002', cast_date: '2026-06-25', project_no: 'P25044', element_type: 'WL/PC', volume_cum: 3.12, weight_tons: 7.80, status: 'DISPATCHED', bay_location: 'Bay 03', curing_days: 4, remarks: 'Shipped on SPBM-10369' },
  { id: 'sy2', element_code: '00-IW01-2502M-003', cast_date: '2026-06-26', project_no: 'P25044', element_type: 'WL/PC', volume_cum: 3.12, weight_tons: 7.80, status: 'IN STOCK', bay_location: 'Bay 03', curing_days: 3, remarks: 'Curing completed' },
  { id: 'sy3', element_code: '00-HC30-2502M-001', cast_date: '2026-06-27', project_no: 'P25035', element_type: 'HCS', volume_cum: 1.50, weight_tons: 3.75, status: 'IN STOCK', bay_location: 'HCS Zone 1', curing_days: 2, remarks: 'Curing (Critical)' },
  { id: 'sy4', element_code: '00-HC30-2502M-002', cast_date: '2026-06-28', project_no: 'P25035', element_type: 'HCS', volume_cum: 1.50, weight_tons: 3.75, status: 'IN STOCK', bay_location: 'HCS Zone 1', curing_days: 1, remarks: 'Curing (Critical)' },
  { id: 'sy5', element_code: '00-IW02-2502M-004', cast_date: '2026-06-29', project_no: 'P25044', element_type: 'WL/PC', volume_cum: 4.20, weight_tons: 10.50, status: 'IN STOCK', bay_location: 'Bay 05', curing_days: 0, remarks: 'Curing (Critical)' },
  { id: 'sy6', element_code: '00-BW05-2502M-001', cast_date: '2026-06-29', project_no: 'P25010', element_type: 'WL/PC', volume_cum: 2.10, weight_tons: 5.25, status: 'IN STOCK', bay_location: 'Bay 08', curing_days: 0, remarks: 'Awaiting QC release' }
];

// Seed localStorage, forced upgrade version v6 to capture new Production and Stockyard tables
const seedTable = (name: string, defaultData: any[], forceReset = false) => {
  const key = `mock_db_${name}`;
  if (!localStorage.getItem(key) || forceReset) {
    localStorage.setItem(key, JSON.stringify(defaultData));
  }
};

const hasSeededV6 = localStorage.getItem('mock_db_seeded_v9') === 'true';

seedTable('projects', defaultProjects, !hasSeededV6);
seedTable('trailers', defaultTrailers, !hasSeededV6);
seedTable('suppliers', defaultSuppliers, !hasSeededV6);
seedTable('deliveries', defaultDeliveries, !hasSeededV6);
seedTable('fleet_status', defaultFleetStatus, !hasSeededV6);
seedTable('users', defaultUsers, !hasSeededV6);
seedTable('production_casting', defaultCastingLogs, !hasSeededV6);
seedTable('stockyard_inventory', defaultStockyardInventory, !hasSeededV6);
seedTable('customers', defaultCustomers, !hasSeededV6);
seedTable('concrete_grades', defaultConcreteGrades, !hasSeededV6);
seedTable('mix_designs', defaultMixDesigns, !hasSeededV6);
seedTable('element_types', defaultElementTypes, !hasSeededV6);
seedTable('production_beds', defaultProductionBeds, !hasSeededV6);
seedTable('moulds', defaultMoulds, !hasSeededV6);
seedTable('yard_bays', defaultYardBays, !hasSeededV6);
seedTable('crane_operators', defaultCraneOperators, !hasSeededV6);
seedTable('qc_inspectors', defaultQcInspectors, !hasSeededV6);
seedTable('element_planning', defaultElementPlanning, !hasSeededV6);
seedTable('reinforcement_tracking', defaultReinforcementTracking, !hasSeededV6);
seedTable('qc_inspections', defaultQcInspections, !hasSeededV6);
seedTable('yard_movement', defaultYardMovement, !hasSeededV6);
seedTable('dispatch_planning', defaultDispatchPlanning, !hasSeededV6);
seedTable('maintenance_logs', defaultMaintenanceLogs, !hasSeededV6);
seedTable('element_traceability', defaultTraceability, !hasSeededV6);

// Full ERP module tables (Design, Planning, Production, QA/QC, Stockyard,
// Dispatch, Logistics, Administration) — see erpSeeds.ts
for (const [tableName, rows] of Object.entries(ERP_SEED_TABLES)) {
  seedTable(tableName, rows, !hasSeededV6);
}

localStorage.setItem('mock_db_seeded_v9', 'true');

// Export mocked supabase client
export const supabase = {
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

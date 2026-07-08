// ─────────────────────────────────────────────────────────────────────────────
// Legacy core seed tables (projects, fleet, dispatch, yard, users…), extracted
// from supabaseClient.ts so ALL seed data lives in pure data modules that the
// SQL schema generator (and tests) can import without a browser environment.
// ─────────────────────────────────────────────────────────────────────────────

const projects_rows = [
  { id: 'p1', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', location: 'DUBAI', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p2', project_no: 'P25020', project_name: 'KHALIFA UNIVERSITY CLADDINGS', location: 'Abu Dhabi', client: 'Modon Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p3', project_no: 'P25027', project_name: 'BW PALM JEBEL ALI - P1', location: 'Jebel Ali', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p4', project_no: 'P25037', project_name: 'BW PALM JEBEL ALI - P2', location: 'Jebel Ali', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p5', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', location: 'DUBAI', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p6', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', location: 'DUBAI', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p7', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', location: 'DUBAI', client: 'Modon Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p8', project_no: 'P25045', project_name: 'ACERS BW', location: 'DUBAI', client: 'Emaar Properties', consultant: 'AECOM Middle East', status: 'Active', active: true },
  { id: 'p9', project_no: 'P25010', project_name: 'DAMAC MOROCCO', location: 'DUBAI', client: 'Damac Properties', consultant: 'AECOM Middle East', status: 'Active', active: true }
];

const trailers_rows = [
  { id: 't1', plate_no: '44292', supplier: 'Hil (AF)', type: 'Trailer - A-Frame' },
  { id: 't2', plate_no: '45452', supplier: 'Hil (AF)', type: 'Trailer - A-Frame' },
  { id: 't3', plate_no: '26142', supplier: 'Hil (AF)', type: 'Trailer - A-Frame' },
  { id: 't4', plate_no: '56305', supplier: 'Hil', type: 'Trailer - Flatbed' },
  { id: 't5', plate_no: '56493', supplier: 'Hil', type: 'Trailer - Flatbed' },
  { id: 't6', plate_no: '32881', supplier: 'Hil', type: 'Trailer - Flatbed' },
  { id: 't7', plate_no: '87023', supplier: 'GPS Transport LLC', type: 'Trailer - Flatbed' },
  { id: 't8', plate_no: '62349', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't9', plate_no: '19607', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't10', plate_no: '39057', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't11', plate_no: '52769', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't12', plate_no: '67828', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't13', plate_no: '98751', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't14', plate_no: '82339', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't15', plate_no: '11649', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't16', plate_no: '79169', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't17', plate_no: '70377', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't18', plate_no: '10989', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't19', plate_no: '47414', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't20', plate_no: '32437', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't21', plate_no: '84198', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't22', plate_no: '82688', supplier: 'Diplomacy', type: 'Trailer - Flatbed' },
  { id: 't23', plate_no: '47681', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed' },
  { id: 't24', plate_no: '4476', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed' },
  { id: 't25', plate_no: '58380', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed' },
  { id: 't26', plate_no: '89371', supplier: 'Noor Albayan LLC', type: 'Trailer - Flatbed' },
  { id: 't27', plate_no: '20990', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame' },
  { id: 't28', plate_no: '15387', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame' },
  { id: 't29', plate_no: '43606', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame' },
  { id: 't30', plate_no: '47108', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't31', plate_no: '85964', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame' },
  { id: 't32', plate_no: '80774', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't33', plate_no: '58838', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't34', plate_no: '37248', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't35', plate_no: '88217', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't36', plate_no: '27951', supplier: 'Ijad transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't37', plate_no: '52156', supplier: 'Ijad transport', type: 'Trailer - Flatbed' },
  { id: 't38', plate_no: '67071', supplier: 'Ijad transport', type: 'Trailer - Flatbed' },
  { id: 't39', plate_no: '82471', supplier: 'Ijad transport (AF)', type: 'Trailer - A Frame' },
  { id: 't40', plate_no: '4517', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't41', plate_no: '29289', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't42', plate_no: '39696', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't43', plate_no: '88163', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't44', plate_no: '12874', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't45', plate_no: '29195', supplier: 'Pendulum Star Transport', type: 'Trailer - Flatbed' },
  { id: 't46', plate_no: '53148', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame' },
  { id: 't47', plate_no: '44264', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame' },
  { id: 't48', plate_no: '88083', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame' },
  { id: 't49', plate_no: '93781', supplier: 'Bahadur Heavy Transport', type: 'Trailer - A-Frame' },
  { id: 't50', plate_no: '97752', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed' },
  { id: 't51', plate_no: '36171', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed' },
  { id: 't52', plate_no: '33751', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed' },
  { id: 't53', plate_no: '84026', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed' },
  { id: 't54', plate_no: '49921', supplier: 'Bahadur Heavy Transport', type: 'Trailer - Flatbed' },
  { id: 't55', plate_no: '73749', supplier: 'OMD Transport (GPS-40785)', type: 'Trailer - Flatbed' },
  { id: 't56', plate_no: '76477', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't57', plate_no: '67622', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't58', plate_no: '45059', supplier: 'OMD transport', type: 'Trailer - Flatbed' },
  { id: 't59', plate_no: '62598', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't60', plate_no: '12824', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't61', plate_no: '90384', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't62', plate_no: '21010', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't63', plate_no: '37109', supplier: 'OMD Transport', type: 'Trailer - Flatbed' },
  { id: 't64', plate_no: '17258', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't65', plate_no: '80670', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't66', plate_no: '76937', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't67', plate_no: '34632', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't68', plate_no: '83868', supplier: 'OMD transport (AF)', type: 'Trailer - A-Frame' },
  { id: 't69', plate_no: '64554', supplier: 'OMD transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame' },
  { id: 't70', plate_no: '87760', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame' },
  { id: 't71', plate_no: '52096', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame' },
  { id: 't72', plate_no: '94225', supplier: 'OMD Transport ( unit ) only', type: '( Unit ) Only To Safe-Tech A-frame' },
];

const suppliers_rows = [
  { id: 's1', name: 'Safetech Logistics', supplier_type: 'Transport', contact_person: 'Vikram Mehta', phone: '+971 50 112 3344', email: 'ops@safetechlogistics.ae', status: 'Active' },
  { id: 's2', name: 'Fast Concrete', supplier_type: 'Ready-Mix Concrete', contact_person: 'Omar Haddad', phone: '+971 52 445 6677', email: 'orders@fastconcrete.ae', status: 'Active' },
  { id: 's3', name: 'United Logistics', supplier_type: 'Transport', contact_person: 'Suresh Nair', phone: '+971 55 889 9001', email: 'dispatch@unitedlogistics.ae', status: 'Active' }
];

const deliveries_rows = [
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

const fleet_status_rows = [
  { id: 'fs1', trailer_id: 't1', status_text: 'Loading', site_location: 'Precast Yard', driver_name: 'Sajid Khan', driver_phone: '+971 50 123 4567', status_timestamp: new Date().toISOString() },
  { id: 'fs2', trailer_id: 't2', status_text: 'Transit', site_location: 'Al Barsha Road', driver_name: 'Muhammad Ali', driver_phone: '+971 55 987 6543', status_timestamp: new Date().toISOString() },
  { id: 'fs3', trailer_id: 't3', status_text: 'Unloading', site_location: 'Al Barsha Site', driver_name: 'Jaspreet Singh', driver_phone: '+971 56 345 6789', status_timestamp: new Date().toISOString() },
  { id: 'fs4', trailer_id: 't4', status_text: 'Idle', site_location: 'Jebel Ali Yard', driver_name: 'Tariq Mahmood', driver_phone: '+971 52 456 7890', status_timestamp: new Date().toISOString() }
];

const users_rows = [
  { id: 'mock-admin-id', email: 'admin@safetech.ae', role: 'admin' }
];

const customers_rows = [
  { id: 'cust1', name: 'Emaar Properties', contact_person: 'Khalid Rahman', email: 'info@emaar.ae', phone: '+971 4 367 3333', status: 'Active' },
  { id: 'cust2', name: 'Modon Properties', contact_person: 'Aisha Al Suwaidi', email: 'contact@modon.ae', phone: '+971 2 619 9999', status: 'Active' },
  { id: 'cust3', name: 'Damac Properties', contact_person: 'Imran Qureshi', email: 'sales@damac.ae', phone: '+971 4 373 1000', status: 'Active' }
];

const concrete_grades_rows = [
  { id: 'cg1', grade: 'C45', grade_name: 'C45/55 OPC' },
  { id: 'cg2', grade: 'C50', grade_name: 'C50/60 Microsilica' },
  { id: 'cg3', grade: 'C60', grade_name: 'C60/75 SRC High Strength' },
  { id: 'cg4', grade: 'C70', grade_name: 'C70/85 High Performance' }
];

const mix_designs_rows = [
  { id: 'md1', mix_code: 'MIX-C45-OPC', concrete_grade: 'C45', cement_type: 'OPC', w_c_ratio: 0.36 },
  { id: 'md2', mix_code: 'MIX-C50-MS', concrete_grade: 'C50', cement_type: 'OPC + Microsilica', w_c_ratio: 0.32 },
  { id: 'md3', mix_code: 'MIX-C60-SRC', concrete_grade: 'C60', cement_type: 'SRC', w_c_ratio: 0.28 }
];

const element_types_rows = [
  { id: 'et1', type_name: 'Wall Panel', type_code: 'WL' },
  { id: 'et2', type_name: 'Hollow Core Slab', type_code: 'HCS' },
  { id: 'et3', type_name: 'Boundary Wall', type_code: 'BW' },
  { id: 'et4', type_name: 'Precast Beam', type_code: 'BM' },
  { id: 'et5', type_name: 'Precast Column', type_code: 'CL' }
];

const production_beds_rows = [
  { id: 'pb1', bed_name: 'Bed 1', length_m: 120, width_m: 2.4, type: 'Prestressed Flatbed' },
  { id: 'pb2', bed_name: 'Bed 2', length_m: 120, width_m: 2.4, type: 'Prestressed Flatbed' },
  { id: 'pb3', bed_name: 'HCS Bed A', length_m: 150, width_m: 1.2, type: 'HCS Slipformer Bed' },
  { id: 'pb4', bed_name: 'HCS Bed B', length_m: 150, width_m: 1.2, type: 'HCS Slipformer Bed' }
];

const moulds_rows = [
  { id: 'm1', mould_name: 'Mould A', type: 'Battery Mould', product_width_m: 3.5 },
  { id: 'm2', mould_name: 'Mould B', type: 'Tilting Table', product_width_m: 4.0 },
  { id: 'm3', mould_name: 'Mould C', type: 'Column Mould', product_width_m: 0.8 }
];

const yard_bays_rows = [
  { id: 'yb1', bay_name: 'Bay 01', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb2', bay_name: 'Bay 02', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb3', bay_name: 'Bay 03', capacity_pcs: 150, zone: 'Zone Precast' },
  { id: 'yb4', bay_name: 'Bay 05', capacity_pcs: 200, zone: 'Zone HCS' },
  { id: 'yb5', bay_name: 'HCS Zone 1', capacity_pcs: 300, zone: 'Zone HCS' },
  { id: 'yb6', bay_name: 'Bay 08', capacity_pcs: 100, zone: 'Zone Boundary Wall' }
];

const crane_operators_rows = [
  { id: 'co1', name: 'Ramesh Kumar', license_no: 'CR-99231', status: 'Active' },
  { id: 'co2', name: 'Jamil Ahmed', license_no: 'CR-88231', status: 'Active' },
  { id: 'co3', name: 'Sukhwinder Singh', license_no: 'CR-77241', status: 'Active' }
];

const qc_inspectors_rows = [
  { id: 'qi1', name: 'John Doe', certification_no: 'QC-ACI-101', status: 'Active' },
  { id: 'qi2', name: 'Sanjay Patel', certification_no: 'QC-PCI-202', status: 'Active' },
  { id: 'qi3', name: 'Hassan Al-Mansoori', certification_no: 'QC-PCI-303', status: 'Active' }
];

const reinforcement_tracking_rows = [
  { id: 'r1', cage_id: 'CAGE-WL-101-01', element_code: '00-IW01-2502M-002', steel_weight_kg: 245.5, fabricator: 'Steel Fabricator Team A', inspection_status: 'Passed', status: 'Ready' },
  { id: 'r2', cage_id: 'CAGE-WL-101-02', element_code: '00-IW01-2502M-003', steel_weight_kg: 245.5, fabricator: 'Steel Fabricator Team A', inspection_status: 'Passed', status: 'Casting' },
  { id: 'r3', cage_id: 'CAGE-WL-102-01', element_code: '00-IW02-2502M-004', steel_weight_kg: 320.0, fabricator: 'Steel Fabricator Team B', inspection_status: 'Passed', status: 'Ready' },
  { id: 'r4', cage_id: 'CAGE-BW-001', element_code: '00-BW05-2502M-001', steel_weight_kg: 85.0, fabricator: 'Steel Fabricator Team C', inspection_status: 'Pending', status: 'Planned' }
];

const qc_inspections_rows = [
  { id: 'q1', element_code: '00-IW01-2502M-002', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0021', inspector: 'John Doe', qc_result: 'PASSED' },
  { id: 'q2', element_code: '00-IW01-2502M-003', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0022', inspector: 'John Doe', qc_result: 'PASSED' },
  { id: 'q3', element_code: '00-IW02-2502M-004', pre_pour_check: true, reinforcement_check: true, cover_check: true, embedded_items_check: true, dimensions_check: true, concrete_test_ref: 'TR-C45-0023', inspector: 'Sanjay Patel', qc_result: 'PASSED' },
  { id: 'q4', element_code: '00-BW05-2502M-001', pre_pour_check: true, reinforcement_check: false, cover_check: true, embedded_items_check: false, dimensions_check: true, concrete_test_ref: 'N/A', inspector: 'Sanjay Patel', qc_result: 'FAILED' }
];

const yard_movement_rows = [
  { id: 'm1', element_code: '00-IW01-2502M-002', from_bay: 'Bed 1', to_bay: 'Bay 03', crane: 'Gantry Crane 1', operator: 'Ramesh Kumar', movement_time: '2026-06-26 14:30', remarks: 'Moved to storage bay' },
  { id: 'm2', element_code: '00-HC30-2502M-001', from_bay: 'HCS Bed A', to_bay: 'HCS Zone 1', crane: 'HCS Gantry', operator: 'Jamil Ahmed', movement_time: '2026-06-28 09:15', remarks: 'Moved to curing bay' }
];

const maintenance_logs_rows = [
  { id: 'ml1', equipment_type: 'Trailer', equipment_id: '80774', maintenance_date: '2026-06-20', description: 'Brake pad replacement and tire rotation', technician: 'Mufaddal Auto Shop', status: 'Completed' },
  { id: 'ml2', equipment_type: 'Crane', equipment_id: 'Gantry Crane 1', maintenance_date: '2026-06-22', description: 'Wire rope inspection and load testing', technician: 'Al-Nasr Crane Services', status: 'Completed' },
  { id: 'ml3', equipment_type: 'Mould', equipment_id: 'Mould A', maintenance_date: '2026-06-24', description: 'Magnetic shuttering strip cleaning and calibration', technician: 'Factory Maintenance Team', status: 'Completed' }
];

const production_casting_rows = [
  { id: 'c1', casting_id: 'CAST-250625-01', cast_date: '2026-06-25', shift: 'Day Shift', bed_mould_id: 'Bed 1', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99231', mix_design: 'MIX-C45-OPC', volume_cum: 3.12, weight_tons: 7.80, start_time: '07:30', finish_time: '08:45', qc_status: 'PASSED', remarks: 'Good pour' },
  { id: 'c2', casting_id: 'CAST-250626-01', cast_date: '2026-06-26', shift: 'Day Shift', bed_mould_id: 'Bed 1', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99232', mix_design: 'MIX-C45-OPC', volume_cum: 3.12, weight_tons: 7.80, start_time: '07:45', finish_time: '09:00', qc_status: 'PASSED', remarks: 'Regular pour' },
  { id: 'c3', casting_id: 'CAST-250627-01', cast_date: '2026-06-27', shift: 'Day Shift', bed_mould_id: 'HCS Bed A', supervisor: 'Muhammad Ali', concrete_grade: 'C60', batch_number: 'BATCH-99245', mix_design: 'MIX-C60-SRC', volume_cum: 1.50, weight_tons: 3.75, start_time: '08:00', finish_time: '09:30', qc_status: 'PASSED', remarks: 'Slipformer speed checked' },
  { id: 'c4', casting_id: 'CAST-250628-01', cast_date: '2026-06-28', shift: 'Night Shift', bed_mould_id: 'HCS Bed A', supervisor: 'Muhammad Ali', concrete_grade: 'C60', batch_number: 'BATCH-99250', mix_design: 'MIX-C60-SRC', volume_cum: 1.50, weight_tons: 3.75, start_time: '20:30', finish_time: '21:55', qc_status: 'PASSED', remarks: 'Tension strands inspected' },
  { id: 'c5', casting_id: 'CAST-250629-01', cast_date: '2026-06-29', shift: 'Day Shift', bed_mould_id: 'Mould B', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99261', mix_design: 'MIX-C45-OPC', volume_cum: 4.20, weight_tons: 10.50, start_time: '08:15', finish_time: '09:40', qc_status: 'PASSED', remarks: 'Battery mould tilt verified' },
  { id: 'c6', casting_id: 'CAST-250629-02', cast_date: '2026-06-29', shift: 'Day Shift', bed_mould_id: 'Mould C', supervisor: 'Prashant Singh', concrete_grade: 'C45', batch_number: 'BATCH-99262', mix_design: 'MIX-C45-OPC', volume_cum: 2.10, weight_tons: 5.25, start_time: '10:00', finish_time: '11:15', qc_status: 'PENDING', remarks: 'Pending concrete cube compression test result' }
];

const stockyard_inventory_rows = [
  { id: 'sy1', element_code: '00-IW01-2502M-002', project_no: 'P25044', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.80, cast_date: '2026-06-25', bay_location: 'Bay 03', status: 'Delivered', curing_days: 4, remarks: 'Shipped on SPBM-10369' },
  { id: 'sy2', element_code: '00-IW01-2502M-003', project_no: 'P25044', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.80, cast_date: '2026-06-26', bay_location: 'Bay 03', status: 'Ready', curing_days: 3, remarks: 'Curing completed' },
  { id: 'sy3', element_code: '00-HC30-2502M-001', project_no: 'P25035', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', element_type: 'HCS', revision: 'R1', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.50, weight_tons: 3.75, cast_date: '2026-06-27', bay_location: 'HCS Zone 1', status: 'Curing', curing_days: 2, remarks: 'Curing (Critical)' },
  { id: 'sy4', element_code: '00-HC30-2502M-002', project_no: 'P25035', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', element_type: 'HCS', revision: 'R1', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.50, weight_tons: 3.75, cast_date: '2026-06-28', bay_location: 'HCS Zone 1', status: 'Curing', curing_days: 1, remarks: 'Curing (Critical)' },
  { id: 'sy5', element_code: '00-IW02-2502M-004', project_no: 'P25044', building: 'Building B', floor: 'Floor G', zone: 'Zone 1', element_type: 'WL/PC', revision: 'R0', length_mm: 3800, width_mm: 2600, thickness_mm: 250, volume_cum: 4.20, weight_tons: 10.50, cast_date: '2026-06-29', bay_location: 'Bay 05', status: 'Curing', curing_days: 0, remarks: 'Curing (Critical)' },
  { id: 'sy6', element_code: '00-BW05-2502M-001', project_no: 'P25010', building: 'Boundary Wall A', floor: 'G', zone: 'Zone 1', element_type: 'BW', revision: 'R0', length_mm: 3500, width_mm: 1200, thickness_mm: 100, volume_cum: 2.10, weight_tons: 5.25, cast_date: '2026-06-29', bay_location: 'Bay 08', status: 'Rejected', curing_days: 0, remarks: 'Awaiting QC release' }
];

const element_traceability_rows = [
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
    delivery_timestamp: '2026-06-29 09:30',
  erection_timestamp: '2026-06-29 14:00',
  completed_timestamp: 'Pending'
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
    delivery_timestamp: 'Pending',
  erection_timestamp: 'Pending',
  completed_timestamp: 'Pending'
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
    delivery_timestamp: 'Pending',
  erection_timestamp: 'Pending',
  completed_timestamp: 'Pending'
  }
];

export const LEGACY_SEED_TABLES: Record<string, any[]> = {
  projects: projects_rows,
  trailers: trailers_rows,
  suppliers: suppliers_rows,
  deliveries: deliveries_rows,
  fleet_status: fleet_status_rows,
  users: users_rows,
  customers: customers_rows,
  concrete_grades: concrete_grades_rows,
  mix_designs: mix_designs_rows,
  element_types: element_types_rows,
  production_beds: production_beds_rows,
  moulds: moulds_rows,
  yard_bays: yard_bays_rows,
  crane_operators: crane_operators_rows,
  qc_inspectors: qc_inspectors_rows,
  reinforcement_tracking: reinforcement_tracking_rows,
  qc_inspections: qc_inspections_rows,
  yard_movement: yard_movement_rows,
  maintenance_logs: maintenance_logs_rows,
  production_casting: production_casting_rows,
  stockyard_inventory: stockyard_inventory_rows,
  element_traceability: element_traceability_rows,
}

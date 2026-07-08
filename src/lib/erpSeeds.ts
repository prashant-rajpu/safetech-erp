// ─────────────────────────────────────────────────────────────────────────────
// ERP seed tables for the complete Safetech Precast Operations Control Panel.
// Every table below is registered into the localStorage mock DB by
// supabaseClient.ts. Business scope: Precast Concrete Manufacturing Operations
// only — Finance / Accounting / Payroll / Billing / Taxation / Procurement are
// intentionally excluded.
// ─────────────────────────────────────────────────────────────────────────────

// ── MASTER DATA ──────────────────────────────────────────────────────────────

const consultants = [
  { id: 'cons1', name: 'AECOM Middle East', contact_person: 'Eng. Rashid Al Habtoor', phone: '+971 4 439 1000', email: 'dubai@aecom.com', status: 'Active' },
  { id: 'cons2', name: 'Khatib & Alami', contact_person: 'Eng. Samir Khoury', phone: '+971 4 336 6666', email: 'info@khatibalami.com', status: 'Active' },
  { id: 'cons3', name: 'WSP Middle East', contact_person: 'Eng. Sarah Mitchell', phone: '+971 4 376 3400', email: 'me.info@wsp.com', status: 'Active' }
]

const reinforcementTypes = [
  { id: 'rt1', ref_code: 'B500B-12', description: 'High Yield Deformed Rebar Ø12mm B500B', unit: 'kg', standard: 'BS 4449', status: 'Active' },
  { id: 'rt2', ref_code: 'B500B-16', description: 'High Yield Deformed Rebar Ø16mm B500B', unit: 'kg', standard: 'BS 4449', status: 'Active' },
  { id: 'rt3', ref_code: 'MESH-A142', description: 'Welded Wire Mesh A142 (6mm @ 200mm)', unit: 'm2', standard: 'BS 4483', status: 'Active' },
  { id: 'rt4', ref_code: 'MESH-A252', description: 'Welded Wire Mesh A252 (8mm @ 200mm)', unit: 'm2', standard: 'BS 4483', status: 'Active' },
  { id: 'rt5', ref_code: 'STRAND-12.7', description: 'Prestressing Strand 12.7mm 7-wire Low Relaxation', unit: 'm', standard: 'ASTM A416', status: 'Active' }
]

const vehicles = [
  { id: 'v1', plate_no: '64554', type: 'Unit Head (A-Frame)', make: 'Mercedes Actros', model_year: '2022', owner: 'OMD Transport', status: 'Active' },
  { id: 'v2', plate_no: '87760', type: 'Unit Head (A-Frame)', make: 'MAN TGS', model_year: '2021', owner: 'OMD Transport', status: 'Active' },
  { id: 'v3', plate_no: '52096', type: 'Unit Head (A-Frame)', make: 'Volvo FH', model_year: '2023', owner: 'OMD Transport', status: 'Active' },
  { id: 'v4', plate_no: '94225', type: 'Unit Head (A-Frame)', make: 'Mercedes Actros', model_year: '2020', owner: 'OMD Transport', status: 'Active' },
  { id: 'v5', plate_no: 'SF-9911', type: 'Boom Truck 10T', make: 'Hino 700', model_year: '2019', owner: 'Safetech Own Fleet', status: 'Active' },
  { id: 'v6', plate_no: 'SF-7702', type: 'Flat Recovery Unit', make: 'Isuzu FVZ', model_year: '2018', owner: 'Safetech Own Fleet', status: 'Under Maintenance' }
]

const drivers = [
  { id: 'dr1', name: 'Gurwinder Singh', mobile: '056 3770181', license_no: 'DXB-882134', license_expiry: '2027-03-14', assigned_plate: '44292', status: 'Active' },
  { id: 'dr2', name: 'Babar', mobile: '056 9406193', license_no: 'DXB-771920', license_expiry: '2026-11-02', assigned_plate: '45452', status: 'Active' },
  { id: 'dr3', name: 'Rajan', mobile: '056 4688047', license_no: 'DXB-664401', license_expiry: '2027-01-19', assigned_plate: '26142', status: 'Active' },
  { id: 'dr4', name: 'Jaspreet Singh', mobile: '058 6589015', license_no: 'DXB-903311', license_expiry: '2026-09-27', assigned_plate: '56305', status: 'Active' },
  { id: 'dr5', name: 'Khaled Ibrahim', mobile: '058 2369395', license_no: 'DXB-550217', license_expiry: '2027-06-08', assigned_plate: '62349', status: 'Active' },
  { id: 'dr6', name: 'Satwant Singh', mobile: '052 2805133', license_no: 'DXB-449903', license_expiry: '2026-12-15', assigned_plate: '20990', status: 'Active' },
  { id: 'dr7', name: 'Sami Ahmed', mobile: '050 4167644', license_no: 'DXB-338812', license_expiry: '2027-02-22', assigned_plate: '73749', status: 'Active' },
  { id: 'dr8', name: 'Naji', mobile: '050 5976631', license_no: 'DXB-227744', license_expiry: '2026-10-30', assigned_plate: '64554', status: 'Active' }
]

// ── DESIGN ───────────────────────────────────────────────────────────────────

const drawings = [
  { id: 'dwg1', drawing_no: 'DWG-ACERS-WL-101', project_no: 'P25044', title: 'Internal Wall Panels — Block A Level 1', type: 'Shop Drawing', element_type: 'WL/PC', revision: 'R1', status: 'Approved', issued_date: '2026-06-10', received_date: '2026-06-08' },
  { id: 'dwg2', drawing_no: 'DWG-ACERS-WL-102', project_no: 'P25044', title: 'Internal Wall Panels — Block A Level 2', type: 'Shop Drawing', element_type: 'WL/PC', revision: 'R1', status: 'Approved', issued_date: '2026-06-14', received_date: '2026-06-12' },
  { id: 'dwg3', drawing_no: 'DWG-ACERS-WL-103', project_no: 'P25044', title: 'External Wall Panels — Block B Ground', type: 'Shop Drawing', element_type: 'WL/PC', revision: 'R0', status: 'For Approval', issued_date: '2026-06-27', received_date: '2026-06-25' },
  { id: 'dwg4', drawing_no: 'DWG-BANIYAS-HCS-201', project_no: 'P25035', title: 'Hollow Core Slabs — Block H Level 2', type: 'IFC Drawing', element_type: 'HCS', revision: 'R0', status: 'IFC', issued_date: '2026-06-05', received_date: '2026-06-03' },
  { id: 'dwg5', drawing_no: 'DWG-BANIYAS-HCS-202', project_no: 'P25035', title: 'Hollow Core Slabs — Block H Level 3', type: 'IFC Drawing', element_type: 'HCS', revision: 'R0', status: 'IFC', issued_date: '2026-06-18', received_date: '2026-06-16' },
  { id: 'dwg6', drawing_no: 'DWG-DAMAC-BW-301', project_no: 'P25010', title: 'Boundary Wall Panels — Zone A', type: 'Shop Drawing', element_type: 'BW', revision: 'R2', status: 'Approved', issued_date: '2026-06-01', received_date: '2026-05-29' },
  { id: 'dwg7', drawing_no: 'DWG-PJA-GA-001', project_no: 'P25027', title: 'General Arrangement — Villa Type A', type: 'GA Drawing', element_type: 'Mixed', revision: 'R0', status: 'For Approval', issued_date: '2026-06-29', received_date: '2026-06-28' },
  { id: 'dwg8', drawing_no: 'DWG-KU-CL-401', project_no: 'P25020', title: 'Cladding Panels — Facade North', type: 'Shop Drawing', element_type: 'CL', revision: 'R1', status: 'Superseded', issued_date: '2026-05-20', received_date: '2026-05-18' }
]

const drawingRevisions = [
  { id: 'rev1', drawing_no: 'DWG-ACERS-WL-101', revision: 'R0', rev_date: '2026-05-28', description: 'First issue for approval', status: 'Superseded', issued_by: 'Design Office' },
  { id: 'rev2', drawing_no: 'DWG-ACERS-WL-101', revision: 'R1', rev_date: '2026-06-10', description: 'Lifter positions revised per consultant comments', status: 'Current', issued_by: 'Design Office' },
  { id: 'rev3', drawing_no: 'DWG-ACERS-WL-102', revision: 'R0', rev_date: '2026-06-02', description: 'First issue for approval', status: 'Superseded', issued_by: 'Design Office' },
  { id: 'rev4', drawing_no: 'DWG-ACERS-WL-102', revision: 'R1', rev_date: '2026-06-14', description: 'MEP openings added — kitchen wall panels', status: 'Current', issued_by: 'Design Office' },
  { id: 'rev5', drawing_no: 'DWG-KU-CL-401', revision: 'R1', rev_date: '2026-05-20', description: 'Panel joint detail updated', status: 'Superseded', issued_by: 'Design Office' },
  { id: 'rev6', drawing_no: 'DWG-DAMAC-BW-301', revision: 'R2', rev_date: '2026-06-01', description: 'Coping detail + footing dowels revised', status: 'Current', issued_by: 'Design Office' }
]

const boqItems = [
  { id: 'boq1', project_no: 'P25044', item_code: 'BOQ-WL-01', description: 'Internal Precast Wall Panel 200mm', element_type: 'WL/PC', unit: 'm3', qty: 420, volume_cum: 420, weight_tons: 1050 },
  { id: 'boq2', project_no: 'P25044', item_code: 'BOQ-HCS-01', description: 'Hollow Core Slab 150mm', element_type: 'HCS', unit: 'm2', qty: 3600, volume_cum: 540, weight_tons: 1350 },
  { id: 'boq3', project_no: 'P25035', item_code: 'BOQ-HCS-02', description: 'Hollow Core Slab 150mm — West Baniyas', element_type: 'HCS', unit: 'm2', qty: 5200, volume_cum: 780, weight_tons: 1950 },
  { id: 'boq4', project_no: 'P25010', item_code: 'BOQ-BW-01', description: 'Boundary Wall Panel 100mm + Column', element_type: 'BW', unit: 'lm', qty: 2400, volume_cum: 460, weight_tons: 1150 },
  { id: 'boq5', project_no: 'P25020', item_code: 'BOQ-CL-01', description: 'GRC-faced Cladding Panel 120mm', element_type: 'CL', unit: 'm2', qty: 1800, volume_cum: 216, weight_tons: 540 },
  { id: 'boq6', project_no: 'P25027', item_code: 'BOQ-WL-02', description: 'External Wall Panel 250mm — Villas', element_type: 'WL/PC', unit: 'm3', qty: 980, volume_cum: 980, weight_tons: 2450 }
]

// ── PLANNING ─────────────────────────────────────────────────────────────────

const bomItems = [
  { id: 'bom1', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-101', material: 'Concrete C45', spec: 'MIX-C45-OPC', unit: 'm3', qty_per_element: 3.12, elements: 15, total_qty: 46.8 },
  { id: 'bom2', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-101', material: 'Rebar B500B Ø12', spec: 'B500B-12', unit: 'kg', qty_per_element: 245.5, elements: 15, total_qty: 3682.5 },
  { id: 'bom3', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-101', material: 'Lifting Anchor 2.5T', spec: 'HALFEN KKT', unit: 'pcs', qty_per_element: 4, elements: 15, total_qty: 60 },
  { id: 'bom4', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-201', material: 'Concrete C60', spec: 'MIX-C60-SRC', unit: 'm3', qty_per_element: 1.5, elements: 45, total_qty: 67.5 },
  { id: 'bom5', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-201', material: 'Prestressing Strand 12.7mm', spec: 'STRAND-12.7', unit: 'm', qty_per_element: 42, elements: 45, total_qty: 1890 },
  { id: 'bom6', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', material: 'Concrete C45', spec: 'MIX-C45-OPC', unit: 'm3', qty_per_element: 2.1, elements: 30, total_qty: 63 },
  { id: 'bom7', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', material: 'Mesh A252', spec: 'MESH-A252', unit: 'm2', qty_per_element: 8.4, elements: 30, total_qty: 252 }
]

// The per-piece element registry — heart of the QR tracking workflow.
// QR is generated when the element is planned to cast (status moves from
// 'Planned' to 'QR Generated'); downstream departments then scan/update it.
const elements = [
  { id: 'el1', element_code: '00-IW01-2502M-002', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-101', revision: 'R1', element_type: 'WL/PC', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.8, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-25', bed: 'Bed 1', mould: 'Mould A', qr_generated: true, qr_generated_at: '2026-06-24 09:00', status: 'Delivered', cast_date: '2026-06-25', remarks: 'Shipped on SPBM-10369' },
  { id: 'el2', element_code: '00-IW01-2502M-003', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-101', revision: 'R1', element_type: 'WL/PC', building: 'Building A', floor: 'Floor 1', zone: 'Zone 1', length_mm: 3200, width_mm: 2400, thickness_mm: 200, volume_cum: 3.12, weight_tons: 7.8, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-26', bed: 'Bed 1', mould: 'Mould A', qr_generated: true, qr_generated_at: '2026-06-24 09:00', status: 'Ready', cast_date: '2026-06-26', remarks: 'Curing completed' },
  { id: 'el3', element_code: '00-IW02-2502M-004', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-102', revision: 'R1', element_type: 'WL/PC', building: 'Building B', floor: 'Floor G', zone: 'Zone 1', length_mm: 3800, width_mm: 2600, thickness_mm: 250, volume_cum: 4.2, weight_tons: 10.5, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-29', bed: 'Mould B', mould: 'Mould B', qr_generated: true, qr_generated_at: '2026-06-27 10:30', status: 'Curing', cast_date: '2026-06-29', remarks: '' },
  { id: 'el4', element_code: '00-HC30-2502M-001', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-201', revision: 'R0', element_type: 'HCS', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.5, weight_tons: 3.75, concrete_grade: 'C60', mix_design: 'MIX-C60-SRC', planned_cast_date: '2026-06-27', bed: 'HCS Bed A', mould: '—', qr_generated: true, qr_generated_at: '2026-06-25 11:30', status: 'Curing', cast_date: '2026-06-27', remarks: '' },
  { id: 'el5', element_code: '00-HC30-2502M-002', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-201', revision: 'R0', element_type: 'HCS', building: 'Block H', floor: 'Floor 2', zone: 'Zone 2', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.5, weight_tons: 3.75, concrete_grade: 'C60', mix_design: 'MIX-C60-SRC', planned_cast_date: '2026-06-28', bed: 'HCS Bed A', mould: '—', qr_generated: true, qr_generated_at: '2026-06-25 11:30', status: 'Curing', cast_date: '2026-06-28', remarks: '' },
  { id: 'el6', element_code: '00-BW05-2502M-001', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', revision: 'R2', element_type: 'BW', building: 'Boundary Wall A', floor: 'G', zone: 'Zone 1', length_mm: 3500, width_mm: 1200, thickness_mm: 100, volume_cum: 2.1, weight_tons: 5.25, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-29', bed: 'Mould C', mould: 'Mould C', qr_generated: true, qr_generated_at: '2026-06-27 14:00', status: 'Rejected', cast_date: '2026-06-29', remarks: 'NCR-2026-011 raised — honeycombing' },
  { id: 'el7', element_code: '00-IW03-2502M-005', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-102', revision: 'R1', element_type: 'WL/PC', building: 'Building B', floor: 'Floor 1', zone: 'Zone 1', length_mm: 3800, width_mm: 2600, thickness_mm: 250, volume_cum: 4.2, weight_tons: 10.5, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-30', bed: 'Bed 1', mould: 'Mould A', qr_generated: true, qr_generated_at: '2026-06-29 08:15', status: 'QR Generated', cast_date: '', remarks: 'Scheduled for casting' },
  { id: 'el8', element_code: '00-IW03-2502M-006', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-102', revision: 'R1', element_type: 'WL/PC', building: 'Building B', floor: 'Floor 1', zone: 'Zone 1', length_mm: 3800, width_mm: 2600, thickness_mm: 250, volume_cum: 4.2, weight_tons: 10.5, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-06-30', bed: 'Bed 1', mould: 'Mould A', qr_generated: true, qr_generated_at: '2026-06-29 08:15', status: 'QR Generated', cast_date: '', remarks: 'Scheduled for casting' },
  { id: 'el9', element_code: '00-HC31-2502M-003', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-202', revision: 'R0', element_type: 'HCS', building: 'Block H', floor: 'Floor 3', zone: 'Zone 2', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.5, weight_tons: 3.75, concrete_grade: 'C60', mix_design: 'MIX-C60-SRC', planned_cast_date: '2026-07-01', bed: 'HCS Bed A', mould: '—', qr_generated: false, qr_generated_at: '', status: 'Planned', cast_date: '', remarks: 'Awaiting QR generation' },
  { id: 'el10', element_code: '00-HC31-2502M-004', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-202', revision: 'R0', element_type: 'HCS', building: 'Block H', floor: 'Floor 3', zone: 'Zone 2', length_mm: 6000, width_mm: 1200, thickness_mm: 150, volume_cum: 1.5, weight_tons: 3.75, concrete_grade: 'C60', mix_design: 'MIX-C60-SRC', planned_cast_date: '2026-07-01', bed: 'HCS Bed B', mould: '—', qr_generated: false, qr_generated_at: '', status: 'Planned', cast_date: '', remarks: 'Awaiting QR generation' },
  { id: 'el11', element_code: '00-BW06-2502M-002', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', revision: 'R2', element_type: 'BW', building: 'Boundary Wall B', floor: 'G', zone: 'Zone 1', length_mm: 3500, width_mm: 1200, thickness_mm: 100, volume_cum: 2.1, weight_tons: 5.25, concrete_grade: 'C45', mix_design: 'MIX-C45-OPC', planned_cast_date: '2026-07-02', bed: 'Mould C', mould: 'Mould C', qr_generated: false, qr_generated_at: '', status: 'Planned', cast_date: '', remarks: '' },
  { id: 'el12', element_code: '00-CL10-2502M-001', project_no: 'P25020', drawing_no: 'DWG-KU-CL-401', revision: 'R1', element_type: 'CL', building: 'Facade North', floor: 'L3', zone: 'Zone C', length_mm: 4200, width_mm: 1800, thickness_mm: 120, volume_cum: 0.91, weight_tons: 2.27, concrete_grade: 'C50', mix_design: 'MIX-C50-MS', planned_cast_date: '2026-07-03', bed: 'Mould B', mould: 'Mould B', qr_generated: false, qr_generated_at: '', status: 'Planned', cast_date: '', remarks: 'Pending drawing re-approval' }
]

const castingSchedule = [
  { id: 'cs1', schedule_date: '2026-06-29', shift: 'Day', bed: 'Mould B', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-102', element_codes: '00-IW02-2502M-004', qty: 1, status: 'Completed', remarks: 'Battery mould tilt verified' },
  { id: 'cs2', schedule_date: '2026-06-29', shift: 'Day', bed: 'Mould C', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', element_codes: '00-BW05-2502M-001', qty: 1, status: 'Completed', remarks: 'QC hold — cube test pending' },
  { id: 'cs3', schedule_date: '2026-06-30', shift: 'Day', bed: 'Bed 1', project_no: 'P25044', drawing_no: 'DWG-ACERS-WL-102', element_codes: '00-IW03-2502M-005, 00-IW03-2502M-006', qty: 2, status: 'QR Generated', remarks: 'Cages ready' },
  { id: 'cs4', schedule_date: '2026-07-01', shift: 'Day', bed: 'HCS Bed A', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-202', element_codes: '00-HC31-2502M-003', qty: 1, status: 'Scheduled', remarks: '' },
  { id: 'cs5', schedule_date: '2026-07-01', shift: 'Night', bed: 'HCS Bed B', project_no: 'P25035', drawing_no: 'DWG-BANIYAS-HCS-202', element_codes: '00-HC31-2502M-004', qty: 1, status: 'Scheduled', remarks: '' },
  { id: 'cs6', schedule_date: '2026-07-02', shift: 'Day', bed: 'Mould C', project_no: 'P25010', drawing_no: 'DWG-DAMAC-BW-301', element_codes: '00-BW06-2502M-002', qty: 1, status: 'Scheduled', remarks: '' }
]

// ── PRODUCTION ───────────────────────────────────────────────────────────────

const concreteBatches = [
  { id: 'cb1', batch_no: 'BATCH-99261', batch_date: '2026-06-29', mix_code: 'MIX-C45-OPC', grade: 'C45', volume_cum: 4.2, slump_mm: 180, temp_c: 31, cube_ref: 'TR-C45-0025', plant: 'Safetech Batching Plant 1', status: 'Accepted' },
  { id: 'cb2', batch_no: 'BATCH-99262', batch_date: '2026-06-29', mix_code: 'MIX-C45-OPC', grade: 'C45', volume_cum: 2.1, slump_mm: 175, temp_c: 32, cube_ref: 'TR-C45-0026', plant: 'Safetech Batching Plant 1', status: 'Cube Test Pending' },
  { id: 'cb3', batch_no: 'BATCH-99250', batch_date: '2026-06-28', mix_code: 'MIX-C60-SRC', grade: 'C60', volume_cum: 1.5, slump_mm: 160, temp_c: 30, cube_ref: 'TR-C60-0014', plant: 'Safetech Batching Plant 2', status: 'Accepted' },
  { id: 'cb4', batch_no: 'BATCH-99245', batch_date: '2026-06-27', mix_code: 'MIX-C60-SRC', grade: 'C60', volume_cum: 1.5, slump_mm: 165, temp_c: 33, cube_ref: 'TR-C60-0013', plant: 'Safetech Batching Plant 2', status: 'Accepted' },
  { id: 'cb5', batch_no: 'BATCH-99232', batch_date: '2026-06-26', mix_code: 'MIX-C45-OPC', grade: 'C45', volume_cum: 3.12, slump_mm: 185, temp_c: 34, cube_ref: 'TR-C45-0022', plant: 'Safetech Batching Plant 1', status: 'Accepted' }
]

const finishingWorks = [
  { id: 'fw1', element_code: '00-IW01-2502M-003', work_type: 'Surface Grinding', work_date: '2026-06-28', crew: 'Finishing Team A', hours: 1.5, status: 'Completed', remarks: 'Face 1 ground smooth' },
  { id: 'fw2', element_code: '00-IW02-2502M-004', work_type: 'Patching', work_date: '2026-06-29', crew: 'Finishing Team A', hours: 0.5, status: 'In Progress', remarks: 'Minor bug holes on edge' },
  { id: 'fw3', element_code: '00-HC30-2502M-001', work_type: 'Sacking / Rubbing', work_date: '2026-06-28', crew: 'Finishing Team B', hours: 1.0, status: 'Completed', remarks: '' },
  { id: 'fw4', element_code: '00-BW05-2502M-001', work_type: 'Honeycomb Repair Prep', work_date: '2026-06-30', crew: 'Finishing Team B', hours: 2.0, status: 'On Hold', remarks: 'Awaiting NCR disposition' }
]

const repairWorks = [
  { id: 'rw1', element_code: '00-BW05-2502M-001', defect: 'Honeycombing at bottom edge', severity: 'Major', repair_method: 'Chip back + structural repair mortar (SikaRep)', repair_date: '2026-07-01', approved_by: 'QA Manager', status: 'Pending Approval' },
  { id: 'rw2', element_code: '00-IW01-2502M-002', defect: 'Corner chip during demoulding', severity: 'Minor', repair_method: 'Cosmetic patch + cure', repair_date: '2026-06-26', approved_by: 'QC Inspector', status: 'Completed' },
  { id: 'rw3', element_code: '00-HC30-2502M-002', defect: 'Surface crazing (cosmetic)', severity: 'Cosmetic', repair_method: 'Monitor — no action', repair_date: '2026-06-29', approved_by: 'QC Inspector', status: 'Closed' }
]

// ── QA / QC ──────────────────────────────────────────────────────────────────

const incomingInspections = [
  { id: 'ii1', inspection_date: '2026-06-27', material: 'OPC Cement Bulk', supplier: 'National Cement', qty: '60 T', batch_ref: 'NC-2026-1182', result: 'Accepted', inspector: 'John Doe', remarks: 'Mill cert verified' },
  { id: 'ii2', inspection_date: '2026-06-27', material: 'Rebar B500B Ø12', supplier: 'Emirates Steel', qty: '24 T', batch_ref: 'ES-88213', result: 'Accepted', inspector: 'Sanjay Patel', remarks: 'Test cert + tags OK' },
  { id: 'ii3', inspection_date: '2026-06-28', material: 'Prestressing Strand 12.7mm', supplier: 'DWK Drahtwerk', qty: '8 coils', batch_ref: 'DWK-4471', result: 'Accepted', inspector: 'John Doe', remarks: '' },
  { id: 'ii4', inspection_date: '2026-06-29', material: '20mm Aggregate', supplier: 'Stevin Rock', qty: '120 T', batch_ref: 'SR-99120', result: 'Rejected', inspector: 'Hassan Al-Mansoori', remarks: 'Excess fines — returned' }
]

const mixApprovals = [
  { id: 'ma1', mix_code: 'MIX-C45-OPC', grade: 'C45', trial_date: '2026-05-12', cube_7d_mpa: 38.2, cube_28d_mpa: 52.6, result: 'Approved', approved_by: 'Consultant — AECOM', remarks: 'Production mix' },
  { id: 'ma2', mix_code: 'MIX-C50-MS', grade: 'C50', trial_date: '2026-05-15', cube_7d_mpa: 42.1, cube_28d_mpa: 58.4, result: 'Approved', approved_by: 'Consultant — K&A', remarks: 'Cladding mix' },
  { id: 'ma3', mix_code: 'MIX-C60-SRC', grade: 'C60', trial_date: '2026-05-18', cube_7d_mpa: 48.9, cube_28d_mpa: 67.2, result: 'Approved', approved_by: 'Consultant — AECOM', remarks: 'HCS prestressed mix' }
]

const postCastingInspections = [
  { id: 'pci1', element_code: '00-IW01-2502M-002', inspection_date: '2026-06-26', surface_finish: 'Good', cracks: 'None', honeycombing: 'None', edges: 'Minor chip — repaired', result: 'Accepted', inspector: 'John Doe' },
  { id: 'pci2', element_code: '00-IW01-2502M-003', inspection_date: '2026-06-27', surface_finish: 'Good', cracks: 'None', honeycombing: 'None', edges: 'Good', result: 'Accepted', inspector: 'John Doe' },
  { id: 'pci3', element_code: '00-HC30-2502M-001', inspection_date: '2026-06-28', surface_finish: 'Good', cracks: 'Surface crazing', honeycombing: 'None', edges: 'Good', result: 'Accepted', inspector: 'Sanjay Patel' },
  { id: 'pci4', element_code: '00-BW05-2502M-001', inspection_date: '2026-06-30', surface_finish: 'Poor', cracks: 'None', honeycombing: 'Bottom edge — Major', edges: 'Good', result: 'Rejected', inspector: 'Sanjay Patel' }
]

const dimensionalInspections = [
  { id: 'di1', element_code: '00-IW01-2502M-002', inspection_date: '2026-06-26', length_dev_mm: 2, width_dev_mm: 1, thickness_dev_mm: 0, diagonal_dev_mm: 3, tolerance: '±5mm', result: 'Pass', inspector: 'John Doe' },
  { id: 'di2', element_code: '00-IW01-2502M-003', inspection_date: '2026-06-27', length_dev_mm: 1, width_dev_mm: 2, thickness_dev_mm: 1, diagonal_dev_mm: 2, tolerance: '±5mm', result: 'Pass', inspector: 'John Doe' },
  { id: 'di3', element_code: '00-HC30-2502M-001', inspection_date: '2026-06-28', length_dev_mm: 3, width_dev_mm: 0, thickness_dev_mm: 2, diagonal_dev_mm: 4, tolerance: '±5mm', result: 'Pass', inspector: 'Sanjay Patel' },
  { id: 'di4', element_code: '00-BW05-2502M-001', inspection_date: '2026-06-30', length_dev_mm: 6, width_dev_mm: 2, thickness_dev_mm: 1, diagonal_dev_mm: 7, tolerance: '±5mm', result: 'Fail', inspector: 'Sanjay Patel' }
]

const finishingInspections = [
  { id: 'fi1', element_code: '00-IW01-2502M-003', inspection_date: '2026-06-28', finish_grade: 'A — Fair Face', patch_quality: 'N/A', paint_ready: 'Yes', result: 'Accepted', inspector: 'Hassan Al-Mansoori', remarks: '' },
  { id: 'fi2', element_code: '00-IW01-2502M-002', inspection_date: '2026-06-27', finish_grade: 'A — Fair Face', patch_quality: 'Good', paint_ready: 'Yes', result: 'Accepted', inspector: 'John Doe', remarks: 'Corner patch verified' },
  { id: 'fi3', element_code: '00-HC30-2502M-001', inspection_date: '2026-06-29', finish_grade: 'B — Standard', patch_quality: 'N/A', paint_ready: 'N/A', result: 'Accepted', inspector: 'Sanjay Patel', remarks: 'Soffit finish OK' }
]

const ncrRegister = [
  { id: 'ncr1', ncr_no: 'NCR-2026-009', ncr_date: '2026-06-18', project_no: 'P25020', element_code: '00-CL08-2501M-014', description: 'Cladding panel cast to superseded revision R0', category: 'Production', severity: 'Major', root_cause: 'Drawing revision not communicated to bed supervisor', corrective_action: 'Panel scrapped; revision control board added at each bed', status: 'Closed', raised_by: 'QA Manager', closed_date: '2026-06-24' },
  { id: 'ncr2', ncr_no: 'NCR-2026-010', ncr_date: '2026-06-27', project_no: 'P25035', element_code: '—', description: 'Aggregate delivery with excess fines accepted into silo 2', category: 'Material', severity: 'Minor', root_cause: 'Incoming inspection sampling missed', corrective_action: 'Silo purged; supplier warning issued', status: 'Closed', raised_by: 'QC Inspector', closed_date: '2026-06-29' },
  { id: 'ncr3', ncr_no: 'NCR-2026-011', ncr_date: '2026-06-30', project_no: 'P25010', element_code: '00-BW05-2502M-001', description: 'Honeycombing at bottom edge exceeding cosmetic limits', category: 'Production', severity: 'Major', root_cause: 'Insufficient vibration at congested rebar zone', corrective_action: 'Structural repair proposed — awaiting consultant approval', status: 'Open', raised_by: 'Sanjay Patel', closed_date: '' },
  { id: 'ncr4', ncr_no: 'NCR-2026-012', ncr_date: '2026-07-01', project_no: 'P25044', element_code: '—', description: 'Two lifting anchors of wrong capacity found in stores bin', category: 'Material', severity: 'Observation', root_cause: 'Bin labelling error', corrective_action: 'Bins relabelled; stock recount done', status: 'Under Review', raised_by: 'Store Keeper', closed_date: '' }
]

const punchList = [
  { id: 'pl1', item_no: 'PL-P25044-001', project_no: 'P25044', location: 'Building A — Level 1', description: 'Patch tie-rod holes after erection — 4 panels', raised_date: '2026-06-26', due_date: '2026-07-05', assigned_to: 'Site Finishing Crew', status: 'Open' },
  { id: 'pl2', item_no: 'PL-P25044-002', project_no: 'P25044', location: 'Building A — Level 1', description: 'Grout verticality shim gap panel IW01-002', raised_date: '2026-06-27', due_date: '2026-07-03', assigned_to: 'Erection Team', status: 'In Progress' },
  { id: 'pl3', item_no: 'PL-P25035-001', project_no: 'P25035', location: 'Block H — Level 2', description: 'Seal HCS joint gaps > 20mm before topping', raised_date: '2026-06-29', due_date: '2026-07-08', assigned_to: 'Site Finishing Crew', status: 'Open' },
  { id: 'pl4', item_no: 'PL-P25010-001', project_no: 'P25010', location: 'Boundary Wall Zone A', description: 'Touch-up paint on 6 coping units', raised_date: '2026-06-25', due_date: '2026-06-30', assigned_to: 'Painting Sub', status: 'Closed' }
]

// ── STOCKYARD ────────────────────────────────────────────────────────────────

const storageZones = [
  { id: 'sz1', zone_name: 'Zone Precast', description: 'Vertical wall panel racks — A-frames', bays: 'Bay 01–04', capacity_pcs: 600, current_pcs: 214, status: 'Active' },
  { id: 'sz2', zone_name: 'Zone HCS', description: 'Hollow core slab stacks — max 8 high', bays: 'Bay 05, HCS Zone 1', capacity_pcs: 500, current_pcs: 342, status: 'Active' },
  { id: 'sz3', zone_name: 'Zone Boundary Wall', description: 'BW panels + columns horizontal stacks', bays: 'Bay 08', capacity_pcs: 100, current_pcs: 38, status: 'Active' },
  { id: 'sz4', zone_name: 'Zone Rejects / QC Hold', description: 'Quarantine area — NCR elements', bays: 'Bay 09', capacity_pcs: 30, current_pcs: 1, status: 'Active' }
]

const cranePlanning = [
  { id: 'cp1', plan_date: '2026-06-29', shift: 'Day', crane: 'Gantry Crane 1', operator: 'Ramesh Kumar', activity: 'Demould + move to yard', element_codes: '00-IW02-2502M-004', from_loc: 'Mould B', to_loc: 'Bay 05', status: 'Completed' },
  { id: 'cp2', plan_date: '2026-06-29', shift: 'Day', crane: 'HCS Gantry', operator: 'Jamil Ahmed', activity: 'Stack HCS after saw-cut', element_codes: '00-HC30-2502M-002', from_loc: 'HCS Bed A', to_loc: 'HCS Zone 1', status: 'Completed' },
  { id: 'cp3', plan_date: '2026-06-30', shift: 'Day', crane: 'Gantry Crane 1', operator: 'Ramesh Kumar', activity: 'Load-out for dispatch', element_codes: '00-IW01-2502M-003', from_loc: 'Bay 03', to_loc: 'Trailer 45452', status: 'Planned' },
  { id: 'cp4', plan_date: '2026-06-30', shift: 'Night', crane: 'Mobile Crane 50T', operator: 'Sukhwinder Singh', activity: 'Shift rejected BW to quarantine', element_codes: '00-BW05-2502M-001', from_loc: 'Bay 08', to_loc: 'Bay 09', status: 'Planned' }
]

// ── DISPATCH ─────────────────────────────────────────────────────────────────

const deliverySchedule = [
  { id: 'ds1', schedule_date: '2026-06-30', project_no: 'P25044', project_name: 'ACERS VILLAS PHASE 1', element_type: 'WL/PC', qty: 8, trailer_type_req: 'A-Frame', trips_est: 2, priority: 'High', status: 'Confirmed' },
  { id: 'ds2', schedule_date: '2026-06-30', project_no: 'P25035', project_name: 'WEST BANIYAS(HCS)', element_type: 'HCS', qty: 34, trailer_type_req: 'Flatbed', trips_est: 2, priority: 'High', status: 'Confirmed' },
  { id: 'ds3', schedule_date: '2026-07-01', project_no: 'P25010', project_name: 'DAMAC MOROCCO', element_type: 'BW', qty: 12, trailer_type_req: 'Flatbed', trips_est: 3, priority: 'Medium', status: 'Tentative' },
  { id: 'ds4', schedule_date: '2026-07-01', project_no: 'P26003', project_name: 'ACERS VILLA PHASE 3', element_type: 'HCS', qty: 17, trailer_type_req: 'Flatbed', trips_est: 1, priority: 'Medium', status: 'Confirmed' },
  { id: 'ds5', schedule_date: '2026-07-02', project_no: 'P26002', project_name: 'ACERS VILLA PHASE 2', element_type: 'WL', qty: 10, trailer_type_req: 'A-Frame', trips_est: 2, priority: 'Low', status: 'Tentative' }
]

const allocations = [
  { id: 'al1', alloc_date: '2026-06-30', dispatch_no: 'DISP-2545-01', trailer_plate: '44292', trailer_type: 'A-Frame', driver_name: 'Gurwinder Singh', driver_mobile: '056 3770181', project_no: 'P25044', shift: 'Day', status: 'Allocated' },
  { id: 'al2', alloc_date: '2026-06-30', dispatch_no: 'DISP-2545-02', trailer_plate: '56305', trailer_type: 'Flatbed', driver_name: 'Jaspreet Singh', driver_mobile: '058 6589015', project_no: 'P25035', shift: 'Day', status: 'Allocated' },
  { id: 'al3', alloc_date: '2026-06-30', dispatch_no: 'DISP-2545-03', trailer_plate: '62349', trailer_type: 'Flatbed', driver_name: 'Khaled Ibrahim', driver_mobile: '058 2369395', project_no: 'P25035', shift: 'Day', status: 'Standby' },
  { id: 'al4', alloc_date: '2026-07-01', dispatch_no: 'DISP-2546-01', trailer_plate: '20990', trailer_type: 'A-Frame', driver_name: 'Satwant Singh', driver_mobile: '052 2805133', project_no: 'P25010', shift: 'Day', status: 'Planned' },
  { id: 'al5', alloc_date: '2026-07-01', dispatch_no: 'DISP-2546-02', trailer_plate: '73749', trailer_type: 'Flatbed', driver_name: 'Sami Ahmed', driver_mobile: '050 4167644', project_no: 'P26003', shift: 'Night', status: 'Planned' }
]

const gatePasses = [
  { id: 'gp1', gp_no: 'GP-2026-0501', gp_date: '2026-06-29', trailer_plate: '44292', driver_name: 'Gurwinder Singh', project_no: 'P26003', dn_no: 'SPBM-10368', items_desc: 'HCS x17 — 8.15 m³', issued_by: 'Gate Controller', time_out: '07:15', status: 'Exited' },
  { id: 'gp2', gp_no: 'GP-2026-0502', gp_date: '2026-06-29', trailer_plate: '45452', driver_name: 'Babar', project_no: 'P25044', dn_no: 'SPBM-10369', items_desc: 'WL/PC x7 — 11.15 m³', issued_by: 'Gate Controller', time_out: '08:20', status: 'Exited' },
  { id: 'gp3', gp_no: 'GP-2026-0503', gp_date: '2026-06-29', trailer_plate: '26142', driver_name: 'Rajan', project_no: 'P26002', dn_no: 'SPBM-10370', items_desc: 'WL x8 — 12.50 m³', issued_by: 'Gate Controller', time_out: '09:10', status: 'Exited' },
  { id: 'gp4', gp_no: 'GP-2026-0504', gp_date: '2026-06-30', trailer_plate: '56305', driver_name: 'Jaspreet Singh', project_no: 'P25035', dn_no: 'SPBM-10395', items_desc: 'HCS x18 — 10.6 m³', issued_by: 'Gate Controller', time_out: '', status: 'Issued' }
]

const dispatchChecklists = [
  { id: 'dc1', dn_no: 'SPBM-10368', check_date: '2026-06-29', trailer_plate: '44292', straps_chains: 'OK', a_frames_racks: 'OK', edge_protection: 'OK', permits_route: 'OK', escort_required: 'No', checked_by: 'Yard Supervisor', status: 'Cleared' },
  { id: 'dc2', dn_no: 'SPBM-10369', check_date: '2026-06-29', trailer_plate: '45452', straps_chains: 'OK', a_frames_racks: 'OK', edge_protection: 'OK', permits_route: 'OK', escort_required: 'No', checked_by: 'Yard Supervisor', status: 'Cleared' },
  { id: 'dc3', dn_no: 'SPBM-10395', check_date: '2026-06-30', trailer_plate: '56305', straps_chains: 'OK', a_frames_racks: 'Pending', edge_protection: 'OK', permits_route: 'OK', escort_required: 'No', checked_by: 'Yard Supervisor', status: 'In Progress' }
]

const dispatchLog = [
  { id: 'dl1', trailer_id: 't1', plate_no: '44292', supplier_name: 'Hil (AF)', trailer_type: 'Trailer - A-Frame', driver_name: 'Gurwinder Singh', driver_mobile: '056 3770181', project_no: 'P26003', do_no: 'SPBM-10368', shift: 'Day', diesel_status: true, driver_status: true, dn_status: true, leaving_status: true, remarks: '', log_date: '2026-06-29' },
  { id: 'dl2', trailer_id: 't2', plate_no: '45452', supplier_name: 'Hil (AF)', trailer_type: 'Trailer - A-Frame', driver_name: 'Babar', driver_mobile: '056 9406193', project_no: 'P25044', do_no: 'SPBM-10369', shift: 'Day', diesel_status: true, driver_status: true, dn_status: true, leaving_status: true, remarks: '', log_date: '2026-06-29' },
  { id: 'dl3', trailer_id: 't3', plate_no: '26142', supplier_name: 'Hil (AF)', trailer_type: 'Trailer - A-Frame', driver_name: 'Rajan', driver_mobile: '056 4688047', project_no: 'P26002', do_no: 'SPBM-10370', shift: 'Day', diesel_status: true, driver_status: true, dn_status: true, leaving_status: true, remarks: '', log_date: '2026-06-29' },
  { id: 'dl4', trailer_id: 't4', plate_no: '56305', supplier_name: 'Hil', trailer_type: 'Trailer - Flatbed', driver_name: 'Jaspreet singh', driver_mobile: '058 6589015', project_no: 'P25035', do_no: 'SPBM-10395', shift: 'Day', diesel_status: true, driver_status: true, dn_status: false, leaving_status: false, remarks: 'Loading in progress', log_date: '2026-06-30' },
  { id: 'dl5', trailer_id: 't8', plate_no: '62349', supplier_name: 'Diplomacy', trailer_type: 'Trailer - Flatbed', driver_name: 'Khaled Ibrahim', driver_mobile: '058 2369395', project_no: 'P25035', do_no: '', shift: 'Day', diesel_status: false, driver_status: true, dn_status: false, leaving_status: false, remarks: 'Standby at yard', log_date: '2026-06-30' }
]

// ── LOGISTICS ────────────────────────────────────────────────────────────────

const trips = [
  { id: 'tp1', trip_date: '2026-06-29', trailer_plate: '44292', driver_name: 'Gurwinder Singh', project_no: 'P26003', dn_no: 'SPBM-10368', departure: '07:15', arrival_site: '08:40', return_time: '11:05', km_out: 182450, km_in: 182562, km_total: 112, status: 'Completed' },
  { id: 'tp2', trip_date: '2026-06-29', trailer_plate: '45452', driver_name: 'Babar', project_no: 'P25044', dn_no: 'SPBM-10369', departure: '08:20', arrival_site: '09:35', return_time: '12:10', km_out: 90311, km_in: 90398, km_total: 87, status: 'Completed' },
  { id: 'tp3', trip_date: '2026-06-29', trailer_plate: '26142', driver_name: 'Rajan', project_no: 'P26002', dn_no: 'SPBM-10370', departure: '09:10', arrival_site: '10:20', return_time: '13:30', km_out: 77120, km_in: 77209, km_total: 89, status: 'Completed' },
  { id: 'tp4', trip_date: '2026-06-29', trailer_plate: '56305', driver_name: 'Jaspreet Singh', project_no: 'P25035', dn_no: 'SPBM-10371', departure: '10:00', arrival_site: '11:25', return_time: '14:45', km_out: 121870, km_in: 121998, km_total: 128, status: 'Completed' },
  { id: 'tp5', trip_date: '2026-06-30', trailer_plate: '56305', driver_name: 'Jaspreet Singh', project_no: 'P25035', dn_no: 'SPBM-10395', departure: '', arrival_site: '', return_time: '', km_out: 121998, km_in: 0, km_total: 0, status: 'Loading' }
]

const fuelLogs = [
  { id: 'fl1', fill_date: '2026-06-29', plate_no: '44292', vehicle_type: 'Trailer Unit', litres: 220, odometer_km: 182450, station: 'Yard Bowser', filled_by: 'Gate Controller', remarks: 'Pre-dispatch fill' },
  { id: 'fl2', fill_date: '2026-06-29', plate_no: '45452', vehicle_type: 'Trailer Unit', litres: 185, odometer_km: 90311, station: 'Yard Bowser', filled_by: 'Gate Controller', remarks: '' },
  { id: 'fl3', fill_date: '2026-06-30', plate_no: '56305', vehicle_type: 'Trailer Unit', litres: 240, odometer_km: 121998, station: 'ENOC Jebel Ali', filled_by: 'Driver', remarks: 'Receipt submitted' },
  { id: 'fl4', fill_date: '2026-06-28', plate_no: 'SF-9911', vehicle_type: 'Boom Truck', litres: 95, odometer_km: 45120, station: 'Yard Bowser', filled_by: 'Gate Controller', remarks: 'Weekly fill' }
]

const vehicleInspections = [
  { id: 'vi1', inspection_date: '2026-06-29', plate_no: '44292', inspection_type: 'Daily Pre-Trip', brakes: 'OK', lights: 'OK', tyres: 'OK', hydraulics: 'OK', coupling: 'OK', result: 'Pass', inspector: 'Gate Controller' },
  { id: 'vi2', inspection_date: '2026-06-29', plate_no: '56305', inspection_type: 'Daily Pre-Trip', brakes: 'OK', lights: 'Left indicator replaced', tyres: 'OK', hydraulics: 'OK', coupling: 'OK', result: 'Pass', inspector: 'Gate Controller' },
  { id: 'vi3', inspection_date: '2026-06-27', plate_no: '62349', inspection_type: 'Monthly', brakes: 'OK', lights: 'OK', tyres: 'Axle 2 inner worn', hydraulics: 'OK', coupling: 'OK', result: 'Conditional Pass', inspector: 'Fleet Supervisor' },
  { id: 'vi4', inspection_date: '2026-06-25', plate_no: 'SF-7702', inspection_type: 'Monthly', brakes: 'Pads < 30%', lights: 'OK', tyres: 'OK', hydraulics: 'Slow lift', coupling: 'N/A', result: 'Fail — Workshop', inspector: 'Fleet Supervisor' }
]

const tyreHistory = [
  { id: 'th1', change_date: '2026-06-27', plate_no: '62349', position: 'Axle 2 — Inner Left', action: 'Flagged for replacement', brand: 'Bridgestone R168', odometer_km: 210450, remarks: 'Wear below limit at monthly inspection' },
  { id: 'th2', change_date: '2026-06-20', plate_no: '80774', position: 'Axle 1 — Outer Right', action: 'Replacement', brand: 'Michelin XZY3', odometer_km: 198211, remarks: 'With brake pad job' },
  { id: 'th3', change_date: '2026-06-15', plate_no: '44292', position: 'Axle 3 — Outer Left', action: 'Puncture Repair', brand: 'Bridgestone R168', odometer_km: 181900, remarks: 'Nail — hot patch' },
  { id: 'th4', change_date: '2026-06-10', plate_no: '56305', position: 'All Axles', action: 'Rotation', brand: '—', odometer_km: 120100, remarks: 'Scheduled rotation' }
]

// ── ADMINISTRATION ───────────────────────────────────────────────────────────

const roles = [
  { id: 'role1', role_key: 'admin', label: 'Administrator', description: 'Full access — all modules, settings, and user management' },
  { id: 'role2', role_key: 'controller', label: 'Controller', description: 'Operational access — create/edit records in all operations modules' },
  { id: 'role3', role_key: 'viewer', label: 'Viewer', description: 'Read-only access to dashboards, registers, and reports' }
]

// Per-section access matrix consumed by ProtectedRoute/Sidebar.
const rolePermissions = [
  { id: 'perm1', role_key: 'admin', section_key: 'dashboard', can_view: true, can_edit: true },
  { id: 'perm2', role_key: 'admin', section_key: 'master', can_view: true, can_edit: true },
  { id: 'perm3', role_key: 'admin', section_key: 'design', can_view: true, can_edit: true },
  { id: 'perm4', role_key: 'admin', section_key: 'planning', can_view: true, can_edit: true },
  { id: 'perm5', role_key: 'admin', section_key: 'production', can_view: true, can_edit: true },
  { id: 'perm6', role_key: 'admin', section_key: 'qaqc', can_view: true, can_edit: true },
  { id: 'perm7', role_key: 'admin', section_key: 'stockyard', can_view: true, can_edit: true },
  { id: 'perm8', role_key: 'admin', section_key: 'dispatch', can_view: true, can_edit: true },
  { id: 'perm9', role_key: 'admin', section_key: 'logistics', can_view: true, can_edit: true },
  { id: 'perm10', role_key: 'admin', section_key: 'reports', can_view: true, can_edit: true },
  { id: 'perm11', role_key: 'admin', section_key: 'admin', can_view: true, can_edit: true },
  { id: 'perm12', role_key: 'controller', section_key: 'dashboard', can_view: true, can_edit: false },
  { id: 'perm13', role_key: 'controller', section_key: 'master', can_view: true, can_edit: false },
  { id: 'perm14', role_key: 'controller', section_key: 'design', can_view: true, can_edit: true },
  { id: 'perm15', role_key: 'controller', section_key: 'planning', can_view: true, can_edit: true },
  { id: 'perm16', role_key: 'controller', section_key: 'production', can_view: true, can_edit: true },
  { id: 'perm17', role_key: 'controller', section_key: 'qaqc', can_view: true, can_edit: true },
  { id: 'perm18', role_key: 'controller', section_key: 'stockyard', can_view: true, can_edit: true },
  { id: 'perm19', role_key: 'controller', section_key: 'dispatch', can_view: true, can_edit: true },
  { id: 'perm20', role_key: 'controller', section_key: 'logistics', can_view: true, can_edit: true },
  { id: 'perm21', role_key: 'controller', section_key: 'reports', can_view: true, can_edit: false },
  { id: 'perm22', role_key: 'controller', section_key: 'admin', can_view: false, can_edit: false },
  { id: 'perm23', role_key: 'viewer', section_key: 'dashboard', can_view: true, can_edit: false },
  { id: 'perm24', role_key: 'viewer', section_key: 'master', can_view: true, can_edit: false },
  { id: 'perm25', role_key: 'viewer', section_key: 'design', can_view: true, can_edit: false },
  { id: 'perm26', role_key: 'viewer', section_key: 'planning', can_view: true, can_edit: false },
  { id: 'perm27', role_key: 'viewer', section_key: 'production', can_view: true, can_edit: false },
  { id: 'perm28', role_key: 'viewer', section_key: 'qaqc', can_view: true, can_edit: false },
  { id: 'perm29', role_key: 'viewer', section_key: 'stockyard', can_view: true, can_edit: false },
  { id: 'perm30', role_key: 'viewer', section_key: 'dispatch', can_view: true, can_edit: false },
  { id: 'perm31', role_key: 'viewer', section_key: 'logistics', can_view: true, can_edit: false },
  { id: 'perm32', role_key: 'viewer', section_key: 'reports', can_view: true, can_edit: false },
  { id: 'perm33', role_key: 'viewer', section_key: 'admin', can_view: false, can_edit: false }
]

const auditLogs = [
  { id: 'au1', ts: '2026-06-29 07:02', user_email: 'admin@safetech.ae', action: 'INSERT', table_name: 'gate_passes', record_id: 'gp1', details: 'Gate pass GP-2026-0501 issued for 44292' },
  { id: 'au2', ts: '2026-06-29 08:22', user_email: 'admin@safetech.ae', action: 'UPDATE', table_name: 'dispatch_log', record_id: 'dl2', details: 'Leaving status set — 45452 exited gate' },
  { id: 'au3', ts: '2026-06-30 09:15', user_email: 'admin@safetech.ae', action: 'INSERT', table_name: 'ncr_register', record_id: 'ncr3', details: 'NCR-2026-011 raised on 00-BW05-2502M-001' }
]

const systemSettings = [
  { id: 'set1', key: 'company_name', value: 'Safetech Precast Building Manufacturing LLC' },
  { id: 'set2', key: 'company_address', value: 'Jebel Ali Industrial Area 1, Dubai, United Arab Emirates' },
  { id: 'set3', key: 'company_phone', value: '+971 4 880 0000' },
  { id: 'set4', key: 'company_email', value: 'operations@safetech.ae' },
  { id: 'set5', key: 'report_day_start', value: '06:00' },
  { id: 'set6', key: 'timezone', value: 'GMT+4 (Asia/Dubai)' },
  { id: 'set7', key: 'report_footer', value: 'Safetech Precast — Operations Control Panel. System-generated document.' },
  { id: 'set8', key: 'dn_prefix', value: 'SPBM-' },
  { id: 'set9', key: 'gate_pass_prefix', value: 'GP-2026-' }
]

const approvals = [
  { id: 'ap1', req_date: '2026-06-30', type: 'NCR Disposition', reference: 'NCR-2026-011', description: 'Structural repair method for BW panel honeycombing', requested_by: 'QA Manager', approver: 'Consultant — AECOM', status: 'Pending' },
  { id: 'ap2', req_date: '2026-06-29', type: 'Drawing Approval', reference: 'DWG-ACERS-WL-103', description: 'External wall panels Block B — R0 for approval', requested_by: 'Design Office', approver: 'Consultant — AECOM', status: 'Pending' },
  { id: 'ap3', req_date: '2026-06-28', type: 'Casting Release', reference: 'CS-2026-06-30', description: 'Release Bed 1 schedule 30-Jun after cage inspection', requested_by: 'Production Manager', approver: 'QA Manager', status: 'Approved' },
  { id: 'ap4', req_date: '2026-06-27', type: 'Mix Change', reference: 'MIX-C50-MS', description: 'Use C50 MS mix for KU cladding batch 12', requested_by: 'Plant Engineer', approver: 'Technical Manager', status: 'Approved' }
]

// Table name → seed rows. supabaseClient registers each into localStorage.
export const ERP_SEED_TABLES: Record<string, any[]> = {
  consultants,
  reinforcement_types: reinforcementTypes,
  vehicles,
  drivers,
  drawings,
  drawing_revisions: drawingRevisions,
  boq_items: boqItems,
  bom_items: bomItems,
  elements,
  casting_schedule: castingSchedule,
  concrete_batches: concreteBatches,
  finishing_works: finishingWorks,
  repair_works: repairWorks,
  incoming_inspections: incomingInspections,
  mix_approvals: mixApprovals,
  post_casting_inspections: postCastingInspections,
  dimensional_inspections: dimensionalInspections,
  finishing_inspections: finishingInspections,
  ncr_register: ncrRegister,
  punch_list: punchList,
  storage_zones: storageZones,
  crane_planning: cranePlanning,
  delivery_schedule: deliverySchedule,
  allocations,
  gate_passes: gatePasses,
  dispatch_checklists: dispatchChecklists,
  dispatch_log: dispatchLog,
  trips,
  fuel_logs: fuelLogs,
  vehicle_inspections: vehicleInspections,
  tyre_history: tyreHistory,
  roles,
  role_permissions: rolePermissions,
  audit_logs: auditLogs,
  system_settings: systemSettings,
  approvals
}

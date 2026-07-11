// ─────────────────────────────────────────────────────────────────────────────
// ERP module registry — single source of truth for navigation, routing, and
// the generic ModuleWorkspace (CRUD + CSV + Print). Every entry here becomes a
// fully working screen at /m/<id> with import/export/print for free.
// Scope: Precast Concrete Manufacturing Operations only (no Finance/Accounting/
// Payroll/Billing/Taxation/Procurement).
// ─────────────────────────────────────────────────────────────────────────────

export type SectionKey =
  | 'dashboard' | 'master' | 'design' | 'planning' | 'production'
  | 'qaqc' | 'hse' | 'workforce' | 'stockyard' | 'dispatch' | 'logistics' | 'reports' | 'admin'
  | 'prestressing' | 'erection' | 'maintenance' | 'documents' | 'handover' | 'environmental'

export type FieldType = 'text' | 'number' | 'date' | 'time' | 'select' | 'boolean' | 'textarea' | 'ref'

export type FieldDef = {
  key: string
  label: string
  type?: FieldType
  options?: string[]
  required?: boolean
  placeholder?: string
  /** for type 'ref': the field stores valueField of a row in another table;
      the edit form renders a select populated from that table */
  ref?: { table: string; valueField: string; labelField?: string }
}

export type ModuleDef = {
  id: string
  title: string
  subtitle: string
  icon: string
  section: SectionKey
  table: string
  fields: FieldDef[]
  /** field used for duplicate detection on CSV import (defaults to first field) */
  keyField?: string
  /** when set, each row gets a QR button encoding this field's value */
  qrField?: string
  /** pre-filter applied to the table (e.g. Shop vs IFC drawings) */
  filter?: { field: string; value: string }
  statusField?: string
  paper?: 'A4' | 'A3'
  landscape?: boolean
  readOnly?: boolean
  /** rows matching field∈values cannot be edited or deleted (e.g. the built-in admin role) */
  lockedRows?: { field: string; values: string[] }
  /** all writes in this module additionally require the 'approve' permission */
  requiresApprove?: boolean
}

const STATUS = (options: string[]): FieldDef => ({ key: 'status', label: 'Status', type: 'select', options })

export const MODULES: ModuleDef[] = [
  // ── MASTER DATA ────────────────────────────────────────────────────────────
  {
    id: 'projects', title: 'Projects', subtitle: 'Master project register', icon: '📁', section: 'master', table: 'projects', keyField: 'project_no', statusField: 'status',
    fields: [
      { key: 'project_no', label: 'Project No', required: true, placeholder: 'P26008' },
      { key: 'project_name', label: 'Project Name', required: true },
      { key: 'client', label: 'Client', type: 'ref', ref: { table: 'customers', valueField: 'name' } },
      { key: 'consultant', label: 'Consultant', type: 'ref', ref: { table: 'consultants', valueField: 'name' } },
      { key: 'location', label: 'Location' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Completed', 'On Hold'] }
    ]
  },
  {
    id: 'clients', title: 'Clients', subtitle: 'Client / developer directory', icon: '🤝', section: 'master', table: 'customers', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Client Name', required: true },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      STATUS(['Active', 'Inactive'])
    ]
  },
  {
    id: 'consultants', title: 'Consultants', subtitle: 'Approving consultants register', icon: '🧑‍💼', section: 'master', table: 'consultants', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Consultant', required: true },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      STATUS(['Active', 'Inactive'])
    ]
  },
  {
    id: 'production-beds', title: 'Production Beds', subtitle: 'Casting beds & lines', icon: '📏', section: 'master', table: 'production_beds', keyField: 'bed_name',
    fields: [
      { key: 'bed_name', label: 'Bed Name', required: true },
      { key: 'length_m', label: 'Length (m)', type: 'number' },
      { key: 'width_m', label: 'Width (m)', type: 'number' },
      { key: 'type', label: 'Bed Type' }
    ]
  },
  {
    id: 'moulds', title: 'Moulds', subtitle: 'Mould inventory', icon: '📦', section: 'master', table: 'moulds', keyField: 'mould_name',
    fields: [
      { key: 'mould_name', label: 'Mould Name', required: true },
      { key: 'type', label: 'Mould Type' },
      { key: 'product_width_m', label: 'Product Width (m)', type: 'number' }
    ]
  },
  {
    id: 'element-types', title: 'Element Types', subtitle: 'Precast element catalogue', icon: '📐', section: 'master', table: 'element_types', keyField: 'type_code',
    fields: [
      { key: 'type_name', label: 'Type Name', required: true },
      { key: 'type_code', label: 'Code', required: true }
    ]
  },
  {
    id: 'mix-designs', title: 'Mix Designs', subtitle: 'Approved concrete mixes', icon: '🧪', section: 'master', table: 'mix_designs', keyField: 'mix_code',
    fields: [
      { key: 'mix_code', label: 'Mix Code', required: true },
      { key: 'concrete_grade', label: 'Grade' },
      { key: 'cement_type', label: 'Cement Type' },
      { key: 'w_c_ratio', label: 'W/C Ratio', type: 'number' }
    ]
  },
  {
    id: 'reinforcement-types', title: 'Reinforcement Types', subtitle: 'Rebar, mesh & strand catalogue', icon: '🔩', section: 'master', table: 'reinforcement_types', keyField: 'ref_code', statusField: 'status',
    fields: [
      { key: 'ref_code', label: 'Ref Code', required: true },
      { key: 'description', label: 'Description', required: true },
      { key: 'diameter_mm', label: 'Ø (mm)', type: 'number' },
      { key: 'unit', label: 'Unit' },
      { key: 'standard', label: 'Standard' },
      STATUS(['Active', 'Inactive'])
    ]
  },
  {
    id: 'vehicles', title: 'Vehicles', subtitle: 'Trucks, units & plant vehicles', icon: '🚛', section: 'master', table: 'vehicles', keyField: 'plate_no', statusField: 'status',
    fields: [
      { key: 'plate_no', label: 'Plate No', required: true },
      { key: 'type', label: 'Vehicle Type' },
      { key: 'make', label: 'Make / Model' },
      { key: 'model_year', label: 'Year' },
      { key: 'owner', label: 'Owner' },
      STATUS(['Active', 'Under Maintenance', 'Retired'])
    ]
  },
  {
    id: 'trailers', title: 'Trailers', subtitle: 'Master trailer fleet (72 units)', icon: '🚚', section: 'master', table: 'trailers', keyField: 'plate_no',
    fields: [
      { key: 'plate_no', label: 'Plate No', required: true },
      { key: 'supplier', label: 'Transport Supplier', type: 'ref', ref: { table: 'suppliers', valueField: 'name' } },
      { key: 'type', label: 'Trailer Type' }
      // Driver assignment lives on the Drivers master (assigned_plate) — no
      // duplicated driver fields here.
    ]
  },
  {
    id: 'drivers', title: 'Drivers', subtitle: 'Driver database & licences', icon: '👮', section: 'master', table: 'drivers', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Driver Name', required: true },
      { key: 'mobile', label: 'Mobile' },
      { key: 'license_no', label: 'Licence No' },
      { key: 'license_expiry', label: 'Licence Expiry', type: 'date' },
      { key: 'assigned_plate', label: 'Assigned Plate' },
      STATUS(['Active', 'On Leave', 'Inactive'])
    ]
  },
  {
    id: 'suppliers', title: 'Suppliers', subtitle: 'Transport & material suppliers', icon: '🏭', section: 'master', table: 'suppliers', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Supplier Name', required: true },
      { key: 'supplier_type', label: 'Type', type: 'select', options: ['Transport', 'Ready-Mix Concrete', 'Steel / Rebar', 'Consumables', 'Other'] },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      STATUS(['Active', 'Inactive'])
    ]
  },

  // ── DESIGN ────────────────────────────────────────────────────────────────
  {
    id: 'drawings', title: 'Drawings', subtitle: 'All project drawings', icon: '📃', section: 'design', table: 'drawings', keyField: 'drawing_no', statusField: 'status', paper: 'A3', landscape: true,
    fields: [
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'project_no', label: 'Project No', required: true },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type', type: 'select', options: ['Shop Drawing', 'IFC Drawing', 'GA Drawing'] },
      { key: 'element_type', label: 'Element Type' },
      { key: 'revision', label: 'Rev' },
      { key: 'status', label: 'Status', type: 'select', options: ['For Approval', 'Approved', 'IFC', 'Superseded'] },
      { key: 'issued_date', label: 'Issued', type: 'date' },
      { key: 'received_date', label: 'Received', type: 'date' }
    ]
  },
  {
    id: 'drawing-revisions', title: 'Revisions', subtitle: 'Drawing revision history', icon: '🔁', section: 'design', table: 'drawing_revisions', keyField: 'drawing_no', statusField: 'status',
    fields: [
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'revision', label: 'Revision', required: true },
      { key: 'rev_date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Change Description', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Current', 'Superseded'] },
      { key: 'issued_by', label: 'Issued By' }
    ]
  },
  {
    id: 'shop-drawings', title: 'Shop Drawings', subtitle: 'Production shop drawings', icon: '🛠️', section: 'design', table: 'drawings', keyField: 'drawing_no', statusField: 'status', filter: { field: 'type', value: 'Shop Drawing' }, paper: 'A3', landscape: true,
    fields: [
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'project_no', label: 'Project No' },
      { key: 'title', label: 'Title' },
      { key: 'element_type', label: 'Element Type' },
      { key: 'revision', label: 'Rev' },
      { key: 'status', label: 'Status', type: 'select', options: ['For Approval', 'Approved', 'Superseded'] },
      { key: 'issued_date', label: 'Issued', type: 'date' }
    ]
  },
  {
    id: 'ifc-drawings', title: 'IFC Drawings', subtitle: 'Issued-for-construction set', icon: '✅', section: 'design', table: 'drawings', keyField: 'drawing_no', statusField: 'status', filter: { field: 'type', value: 'IFC Drawing' }, paper: 'A3', landscape: true,
    fields: [
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'project_no', label: 'Project No' },
      { key: 'title', label: 'Title' },
      { key: 'element_type', label: 'Element Type' },
      { key: 'revision', label: 'Rev' },
      { key: 'issued_date', label: 'Issued', type: 'date' }
    ]
  },
  {
    id: 'boq', title: 'BOQ', subtitle: 'Bill of quantities by project', icon: '🧾', section: 'design', table: 'boq_items', keyField: 'item_code', paper: 'A4', landscape: true,
    fields: [
      { key: 'project_no', label: 'Project No', required: true },
      { key: 'item_code', label: 'Item Code', required: true },
      { key: 'description', label: 'Description' },
      { key: 'element_type', label: 'Element Type' },
      { key: 'unit', label: 'Unit' },
      { key: 'qty', label: 'Qty', type: 'number' },
      { key: 'volume_cum', label: 'Volume (m³)', type: 'number' },
      { key: 'weight_tons', label: 'Weight (T)', type: 'number' }
    ]
  },
  {
    id: 'drawing-register', title: 'Drawing Register', subtitle: 'Controlled master register — print & issue', icon: '🗂️', section: 'design', table: 'drawings', keyField: 'drawing_no', statusField: 'status', paper: 'A3', landscape: true,
    fields: [
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'project_no', label: 'Project No' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'revision', label: 'Rev' },
      { key: 'status', label: 'Status' },
      { key: 'issued_date', label: 'Issued', type: 'date' },
      { key: 'received_date', label: 'Received', type: 'date' }
    ]
  },

  // ── PLANNING ──────────────────────────────────────────────────────────────
  {
    id: 'bom', title: 'BOM', subtitle: 'Bill of materials per drawing', icon: '🧮', section: 'planning', table: 'bom_items', keyField: 'drawing_no', paper: 'A4', landscape: true,
    fields: [
      { key: 'project_no', label: 'Project No', required: true },
      { key: 'drawing_no', label: 'Drawing No', required: true },
      { key: 'material', label: 'Material' },
      { key: 'spec', label: 'Specification' },
      { key: 'unit', label: 'Unit' },
      { key: 'qty_per_element', label: 'Qty / Element', type: 'number' },
      { key: 'elements', label: 'Elements', type: 'number' },
      { key: 'total_qty', label: 'Total Qty', type: 'number' }
    ]
  },
  {
    id: 'elements', title: 'Element Register', subtitle: 'Per-piece element registry with QR lifecycle', icon: '🧱', section: 'planning', table: 'elements', keyField: 'element_code', statusField: 'status', qrField: 'element_code', paper: 'A3', landscape: true,
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'drawing_no', label: 'Drawing' },
      { key: 'revision', label: 'Rev' },
      { key: 'element_type', label: 'Type' },
      { key: 'length_mm', label: 'L (mm)', type: 'number' },
      { key: 'width_mm', label: 'W (mm)', type: 'number' },
      { key: 'thickness_mm', label: 'T (mm)', type: 'number' },
      { key: 'volume_cum', label: 'Vol (m³)', type: 'number' },
      { key: 'weight_tons', label: 'Wt (T)', type: 'number' },
      { key: 'planned_cast_date', label: 'Planned Cast', type: 'date' },
      { key: 'bed', label: 'Bed' },
      { key: 'assigned_mould', label: 'Mould' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
      { key: 'cast_revision', label: 'Cast Rev' },
      { key: 'shape_type', label: 'Shape', type: 'select', options: ['Box', 'Solid Wall', 'Hollow-core', 'Beam', 'Column', 'Panel', 'Slab', 'Stairs', 'Custom'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'QR Generated', 'Cast', 'Curing', 'Ready', 'Loaded', 'Dispatched', 'Delivered', 'At Site', 'Erected', 'Completed', 'Rejected'] }
    ]
  },
  {
    id: 'daily-planning', title: 'Daily Planning', subtitle: 'Casting schedule — day plan', icon: '📆', section: 'planning', table: 'casting_schedule', keyField: 'element_codes', statusField: 'status',
    fields: [
      { key: 'schedule_date', label: 'Date', type: 'date', required: true },
      { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
      { key: 'bed', label: 'Bed / Mould' },
      { key: 'project_no', label: 'Project' },
      { key: 'drawing_no', label: 'Drawing' },
      { key: 'element_codes', label: 'Element Codes' },
      { key: 'qty', label: 'Qty', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'QR Generated', 'In Progress', 'Completed', 'Cancelled'] },
      { key: 'remarks', label: 'Remarks' }
    ]
  },

  // ── PRODUCTION ────────────────────────────────────────────────────────────
  {
    id: 'reinforcement', title: 'Reinforcement', subtitle: 'Cage fabrication tracking', icon: '🔗', section: 'production', table: 'reinforcement_tracking', keyField: 'cage_id', statusField: 'status',
    fields: [
      { key: 'cage_id', label: 'Cage ID', required: true },
      { key: 'element_code', label: 'Element Code' },
      { key: 'steel_weight_kg', label: 'Steel (kg)', type: 'number' },
      { key: 'fabricator', label: 'Fabricator' },
      { key: 'inspection_status', label: 'Inspection', type: 'select', options: ['Pending', 'Passed', 'Failed'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'Ready', 'Casting', 'Consumed'] }
    ]
  },
  {
    id: 'concrete', title: 'Concrete', subtitle: 'Batch & pour log', icon: '🥣', section: 'production', table: 'concrete_batches', keyField: 'batch_no', statusField: 'status',
    fields: [
      { key: 'batch_no', label: 'Batch No', required: true },
      { key: 'batch_date', label: 'Date', type: 'date' },
      { key: 'mix_code', label: 'Mix' },
      { key: 'grade', label: 'Grade' },
      { key: 'volume_cum', label: 'Volume (m³)', type: 'number' },
      { key: 'slump_mm', label: 'Slump (mm)', type: 'number' },
      { key: 'temp_c', label: 'Temp (°C)', type: 'number' },
      { key: 'water_added_litres', label: 'Water Added (L)', type: 'number' },
      { key: 'cube_ref', label: 'Cube Ref' },
      { key: 'plant', label: 'Plant' },
      { key: 'status', label: 'Status', type: 'select', options: ['Accepted', 'Cube Test Pending', 'Rejected'] }
    ]
  },
  {
    id: 'mould-preparation', title: 'Mould Preparation', subtitle: 'Setup, strike & inspection log', icon: '🧰', section: 'production', table: 'mould_preparation_log', keyField: 'mould_name', statusField: 'status',
    fields: [
      { key: 'mould_name', label: 'Mould', required: true },
      { key: 'bed', label: 'Bed' },
      { key: 'activity', label: 'Activity', type: 'select', options: ['Setup', 'Strike', 'Inspection', 'Cleaning', 'Repair'] },
      { key: 'scheduled_date', label: 'Scheduled Date', type: 'date' },
      { key: 'completed_date', label: 'Completed Date', type: 'date' },
      { key: 'condition', label: 'Condition', type: 'select', options: ['Good', 'Minor Damage', 'Major Damage', 'Under Repair'] },
      { key: 'reuse_count', label: 'Reuse Count', type: 'number' },
      { key: 'technician', label: 'Technician' },
      { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'On Hold'] },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'finishing', title: 'Finishing', subtitle: 'Patching, grinding & surface works', icon: '🪚', section: 'production', table: 'finishing_works', keyField: 'element_code', statusField: 'status',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'work_type', label: 'Work Type' },
      { key: 'work_date', label: 'Date', type: 'date' },
      { key: 'crew', label: 'Crew' },
      { key: 'hours', label: 'Hours', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Completed', 'On Hold'] },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'repairs', title: 'Repairs', subtitle: 'Defect repair register', icon: '🩹', section: 'production', table: 'repair_works', keyField: 'element_code', statusField: 'status',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'defect', label: 'Defect' },
      { key: 'source_ncr_no', label: 'Source NCR', placeholder: 'NCR-2026-…' },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Cosmetic', 'Minor', 'Major'] },
      { key: 'repair_method', label: 'Repair Method', type: 'textarea' },
      { key: 'repair_date', label: 'Date', type: 'date' },
      { key: 'approved_by', label: 'Approved By' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending Approval', 'In Progress', 'Completed', 'Closed'] }
    ]
  },
  {
    id: 'concrete-grades', title: 'Concrete Grades', subtitle: 'Grade catalogue used by batching & QC', icon: '🧪', section: 'production', table: 'concrete_grades', keyField: 'grade',
    fields: [
      { key: 'grade', label: 'Grade', required: true, placeholder: 'C45' },
      { key: 'grade_name', label: 'Grade Name', required: true }
    ]
  },

  // ── QA / QC ───────────────────────────────────────────────────────────────
  {
    id: 'incoming-inspection', title: 'Incoming Inspection', subtitle: 'Material receiving inspection', icon: '📥', section: 'qaqc', table: 'incoming_inspections', keyField: 'batch_ref', statusField: 'result',
    fields: [
      { key: 'inspection_date', label: 'Date', type: 'date', required: true },
      { key: 'material', label: 'Material', required: true },
      { key: 'supplier', label: 'Supplier' },
      { key: 'qty', label: 'Qty' },
      { key: 'batch_ref', label: 'Batch Ref' },
      { key: 'result', label: 'Result', type: 'select', options: ['Accepted', 'Rejected', 'On Hold'] },
      { key: 'inspector', label: 'Inspector' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'mix-approval', title: 'Mix Approval', subtitle: 'Trial mixes & consultant approvals', icon: '🧫', section: 'qaqc', table: 'mix_approvals', keyField: 'mix_code', statusField: 'result',
    fields: [
      { key: 'mix_code', label: 'Mix Code', required: true },
      { key: 'grade', label: 'Grade' },
      { key: 'trial_date', label: 'Trial Date', type: 'date' },
      { key: 'cube_7d_mpa', label: '7d Cube (MPa)', type: 'number' },
      { key: 'cube_28d_mpa', label: '28d Cube (MPa)', type: 'number' },
      { key: 'result', label: 'Result', type: 'select', options: ['Approved', 'Pending', 'Rejected'] },
      { key: 'approved_by', label: 'Approved By' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'pre-pour', title: 'Pre-Pour Inspection', subtitle: 'Pre-casting release checks', icon: '🔍', section: 'qaqc', table: 'qc_inspections', keyField: 'element_code', statusField: 'qc_result',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'pre_pour_check', label: 'Mould / Oil', type: 'boolean' },
      { key: 'reinforcement_check', label: 'Reinforcement', type: 'boolean' },
      { key: 'cover_check', label: 'Cover', type: 'boolean' },
      { key: 'embedded_items_check', label: 'Embeds', type: 'boolean' },
      { key: 'dimensions_check', label: 'Dimensions', type: 'boolean' },
      { key: 'concrete_test_ref', label: 'Test Ref' },
      { key: 'inspector', label: 'Inspector' },
      { key: 'qc_result', label: 'Result', type: 'select', options: ['PASSED', 'FAILED', 'PENDING'] }
    ]
  },
  {
    id: 'post-casting', title: 'Post Casting', subtitle: 'Demould / post-cast inspection', icon: '🔎', section: 'qaqc', table: 'post_casting_inspections', keyField: 'element_code', statusField: 'result',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'inspection_date', label: 'Date', type: 'date' },
      { key: 'surface_finish', label: 'Surface Finish', type: 'select', options: ['Good', 'Acceptable', 'Poor'] },
      { key: 'cracks', label: 'Cracks', type: 'select', options: ['None', 'Minor', 'Major'] },
      { key: 'honeycombing', label: 'Honeycombing', type: 'select', options: ['None', 'Minor', 'Major'] },
      { key: 'edges', label: 'Edges', type: 'select', options: ['Good', 'Minor Chips', 'Major Damage'] },
      { key: 'result', label: 'Result', type: 'select', options: ['Accepted', 'Rejected', 'Repair Required'] },
      { key: 'inspector', label: 'Inspector' }
    ]
  },
  {
    id: 'dimensional', title: 'Dimensional Inspection', subtitle: 'Dimensional tolerance checks', icon: '📏', section: 'qaqc', table: 'dimensional_inspections', keyField: 'element_code', statusField: 'result',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'inspection_date', label: 'Date', type: 'date' },
      { key: 'length_dev_mm', label: 'ΔL (mm)', type: 'number' },
      { key: 'width_dev_mm', label: 'ΔW (mm)', type: 'number' },
      { key: 'thickness_dev_mm', label: 'ΔT (mm)', type: 'number' },
      { key: 'diagonal_dev_mm', label: 'ΔDiag (mm)', type: 'number' },
      { key: 'tolerance', label: 'Tolerance' },
      { key: 'result', label: 'Result', type: 'select', options: ['Pass', 'Fail'] },
      { key: 'inspector', label: 'Inspector' }
    ]
  },
  {
    id: 'finishing-inspection', title: 'Finishing Inspection', subtitle: 'Final surface acceptance', icon: '🖌️', section: 'qaqc', table: 'finishing_inspections', keyField: 'element_code', statusField: 'result',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'inspection_date', label: 'Date', type: 'date' },
      { key: 'finish_grade', label: 'Finish Grade', type: 'select', options: ['Grade A', 'Grade B', 'Grade C'] },
      { key: 'patch_quality', label: 'Patch Quality', type: 'select', options: ['None Required', 'Good', 'Acceptable', 'Rework'] },
      { key: 'paint_ready', label: 'Paint Ready', type: 'select', options: ['Yes', 'No'] },
      { key: 'result', label: 'Result', type: 'select', options: ['Accepted', 'Rejected'] },
      { key: 'inspector', label: 'Inspector' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'ncr', title: 'NCR', subtitle: 'Non-conformance reports', icon: '⚠️', section: 'qaqc', table: 'ncr_register', keyField: 'ncr_no', statusField: 'status', paper: 'A4', landscape: true,
    fields: [
      { key: 'ncr_no', label: 'NCR No', required: true },
      { key: 'ncr_date', label: 'Date', type: 'date' },
      { key: 'project_no', label: 'Project' },
      { key: 'element_code', label: 'Element' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'category', label: 'Category', type: 'select', options: ['Production', 'Material', 'Design', 'Logistics'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Observation', 'Minor', 'Major', 'Critical'] },
      { key: 'root_cause', label: 'Root Cause', type: 'textarea' },
      { key: 'corrective_action', label: 'Corrective Action', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Under Review', 'Closed'] },
      { key: 'raised_by', label: 'Raised By' },
      { key: 'closed_date', label: 'Closed', type: 'date' }
    ]
  },
  {
    id: 'punch-list', title: 'Punch List', subtitle: 'Site snag & closeout items', icon: '📌', section: 'qaqc', table: 'punch_list', keyField: 'item_no', statusField: 'status',
    fields: [
      { key: 'item_no', label: 'Item No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'element_code', label: 'Element' },
      { key: 'location', label: 'Location' },
      { key: 'photo_ref', label: 'Photo Ref' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'raised_date', label: 'Raised', type: 'date' },
      { key: 'due_date', label: 'Due', type: 'date' },
      { key: 'assigned_to', label: 'Assigned To' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Closed'] }
    ]
  },
  {
    id: 'qc-inspectors', title: 'QC Inspectors', subtitle: 'Certified inspector register', icon: '📝', section: 'qaqc', table: 'qc_inspectors', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Inspector Name', required: true },
      { key: 'certification_no', label: 'Certification No' },
      STATUS(['Active', 'Inactive'])
    ]
  },

  // ── STOCKYARD ─────────────────────────────────────────────────────────────
  {
    id: 'rack-management', title: 'Rack Management', subtitle: 'Yard bays & racks', icon: '🗄️', section: 'stockyard', table: 'yard_bays', keyField: 'bay_name',
    fields: [
      { key: 'bay_name', label: 'Bay / Rack', required: true },
      { key: 'capacity_pcs', label: 'Capacity (pcs)', type: 'number' },
      { key: 'zone', label: 'Zone' }
    ]
  },
  {
    id: 'storage-zones', title: 'Storage Zones', subtitle: 'Yard zoning & utilization', icon: '🗺️', section: 'stockyard', table: 'storage_zones', keyField: 'zone_name', statusField: 'status',
    fields: [
      { key: 'zone_name', label: 'Zone', required: true },
      { key: 'description', label: 'Description' },
      { key: 'bays', label: 'Bays' },
      { key: 'capacity_pcs', label: 'Capacity (pcs)', type: 'number' },
      { key: 'current_pcs', label: 'Current (pcs)', type: 'number' },
      STATUS(['Active', 'Closed'])
    ]
  },
  {
    id: 'ready-for-dispatch', title: 'Ready for Dispatch', subtitle: 'QC-released elements awaiting load-out', icon: '✅', section: 'stockyard', table: 'stockyard_inventory', keyField: 'element_code', statusField: 'status', filter: { field: 'status', value: 'Stockyard' }, qrField: 'element_code',
    fields: [
      { key: 'element_code', label: 'Element Code' },
      { key: 'project_no', label: 'Project' },
      { key: 'building', label: 'Building' },
      { key: 'floor', label: 'Floor' },
      { key: 'zone', label: 'Zone' },
      { key: 'element_type', label: 'Type' },
      { key: 'revision', label: 'Rev' },
      { key: 'length_mm', label: 'L (mm)', type: 'number' },
      { key: 'width_mm', label: 'W (mm)', type: 'number' },
      { key: 'thickness_mm', label: 'T (mm)', type: 'number' },
      { key: 'volume_cum', label: 'Vol (m³)', type: 'number' },
      { key: 'weight_tons', label: 'Wt (T)', type: 'number' },
      { key: 'cast_date', label: 'Cast', type: 'date' },
      { key: 'bay_location', label: 'Bay' },
      { key: 'curing_days', label: 'Curing Days', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Curing', 'Stockyard', 'Loading', 'Dispatch', 'Delivered', 'Rejected'] },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'yard-movement', title: 'Yard Movement', subtitle: 'Crane moves & relocations', icon: '🔀', section: 'stockyard', table: 'yard_movement', keyField: 'element_code',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'from_bay', label: 'From' },
      { key: 'to_bay', label: 'To' },
      { key: 'crane', label: 'Crane' },
      { key: 'operator', label: 'Operator' },
      { key: 'movement_time', label: 'Time' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'stack-plans', title: 'Stack Planning', subtitle: 'Planned bay & stack position per element', icon: '📦', section: 'stockyard', table: 'stack_plans', keyField: 'element_code', statusField: 'status',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'planned_bay', label: 'Planned Bay' },
      { key: 'planned_position', label: 'Stack Position', type: 'number' },
      { key: 'planned_date', label: 'Planned Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'Executed', 'Cancelled'] },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'crane-planning', title: 'Crane Planning', subtitle: 'Daily crane & lifting plan', icon: '🏗️', section: 'stockyard', table: 'crane_planning', keyField: 'element_codes', statusField: 'status',
    fields: [
      { key: 'plan_date', label: 'Date', type: 'date', required: true },
      { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
      { key: 'crane', label: 'Crane' },
      { key: 'operator', label: 'Operator' },
      { key: 'activity', label: 'Activity' },
      { key: 'element_codes', label: 'Elements' },
      { key: 'from_loc', label: 'From' },
      { key: 'to_loc', label: 'To' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Completed', 'Cancelled'] }
    ]
  },
  {
    id: 'crane-operators', title: 'Crane Operators', subtitle: 'Licensed crane operator register', icon: '👷', section: 'stockyard', table: 'crane_operators', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Operator Name', required: true },
      { key: 'license_no', label: 'Licence No' },
      STATUS(['Active', 'Inactive'])
    ]
  },

  // ── DISPATCH ──────────────────────────────────────────────────────────────
  {
    id: 'delivery-schedule', title: 'Delivery Schedule', subtitle: 'Confirmed delivery slots by project', icon: '🗓️', section: 'dispatch', table: 'delivery_schedule', keyField: 'schedule_date', statusField: 'status',
    fields: [
      { key: 'schedule_date', label: 'Date', type: 'date', required: true },
      { key: 'project_no', label: 'Project No' },
      { key: 'project_name', label: 'Project Name' },
      { key: 'element_type', label: 'Element Type' },
      { key: 'qty', label: 'Qty', type: 'number' },
      { key: 'trailer_type_req', label: 'Trailer Type' },
      { key: 'trips_est', label: 'Est. Trips', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Tentative', 'Completed', 'Cancelled'] }
    ]
  },
  {
    id: 'allocations', title: 'Truck / Trailer / Driver Allocation', subtitle: 'Daily fleet allocation board', icon: '🎯', section: 'dispatch', table: 'allocations', keyField: 'dispatch_no', statusField: 'status',
    fields: [
      { key: 'alloc_date', label: 'Date', type: 'date', required: true },
      { key: 'dispatch_no', label: 'Dispatch No' },
      { key: 'trailer_plate', label: 'Trailer Plate', type: 'ref', ref: { table: 'trailers', valueField: 'plate_no' } },
      { key: 'trailer_type', label: 'Type' },
      { key: 'driver_name', label: 'Driver', type: 'ref', ref: { table: 'drivers', valueField: 'name' } },
      { key: 'project_no', label: 'Project', type: 'ref', ref: { table: 'projects', valueField: 'project_no' } },
      { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
      { key: 'loading_time', label: 'Loading Time' },
      { key: 'departure_time', label: 'Departure Time' },
      { key: 'destination', label: 'Destination' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'Allocated', 'Standby', 'Loading', 'In Transit', 'Delivered', 'Returning', 'Released'] }
    ]
  },
  {
    id: 'dispatch-checklist', title: 'Dispatch Checklist', subtitle: 'Pre-departure load security checks', icon: '☑️', section: 'dispatch', table: 'dispatch_checklists', keyField: 'dn_no', statusField: 'status',
    fields: [
      { key: 'dn_no', label: 'DN No', required: true },
      { key: 'check_date', label: 'Date', type: 'date' },
      { key: 'trailer_plate', label: 'Trailer' },
      { key: 'straps_chains', label: 'Straps / Chains' },
      { key: 'a_frames_racks', label: 'A-Frames / Racks' },
      { key: 'edge_protection', label: 'Edge Protection' },
      { key: 'permits_route', label: 'Permits / Route' },
      { key: 'escort_required', label: 'Escort' },
      { key: 'checked_by', label: 'Checked By' },
      { key: 'status', label: 'Status', type: 'select', options: ['In Progress', 'Cleared', 'Failed'] }
    ]
  },

  // ── LOGISTICS ─────────────────────────────────────────────────────────────
  {
    id: 'trips', title: 'Trips', subtitle: 'Trip log with km & timings', icon: '🛣️', section: 'logistics', table: 'trips', keyField: 'dn_no', statusField: 'status', paper: 'A4', landscape: true,
    fields: [
      { key: 'trip_date', label: 'Date', type: 'date', required: true },
      { key: 'trailer_plate', label: 'Trailer' },
      { key: 'driver_name', label: 'Driver' },
      { key: 'project_no', label: 'Project' },
      { key: 'dn_no', label: 'DN No' },
      { key: 'departure', label: 'Departure', type: 'time' },
      { key: 'arrival_site', label: 'Arrival', type: 'time' },
      { key: 'return_time', label: 'Return', type: 'time' },
      { key: 'km_out', label: 'KM Out', type: 'number' },
      { key: 'km_in', label: 'KM In', type: 'number' },
      { key: 'km_total', label: 'KM Total', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Loading', 'In Transit', 'Completed', 'Cancelled'] }
    ]
  },
  {
    id: 'fuel', title: 'Fuel', subtitle: 'Diesel fills & bowser log', icon: '⛽', section: 'logistics', table: 'fuel_logs', keyField: 'plate_no',
    fields: [
      { key: 'fill_date', label: 'Date', type: 'date', required: true },
      { key: 'plate_no', label: 'Plate No' },
      { key: 'vehicle_type', label: 'Vehicle Type' },
      { key: 'litres', label: 'Litres', type: 'number' },
      { key: 'odometer_km', label: 'Odometer (km)', type: 'number' },
      { key: 'station', label: 'Station' },
      { key: 'filled_by', label: 'Filled By' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'vehicle-inspection', title: 'Vehicle Inspection', subtitle: 'Pre-trip & periodic inspections', icon: '🔧', section: 'logistics', table: 'vehicle_inspections', keyField: 'plate_no', statusField: 'result',
    fields: [
      { key: 'inspection_date', label: 'Date', type: 'date', required: true },
      { key: 'plate_no', label: 'Plate No' },
      { key: 'inspection_type', label: 'Type', type: 'select', options: ['Daily Pre-Trip', 'Monthly', 'Annual'] },
      { key: 'brakes', label: 'Brakes', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'lights', label: 'Lights', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'tyres', label: 'Tyres', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'hydraulics', label: 'Hydraulics', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'coupling', label: 'Coupling', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'result', label: 'Result', type: 'select', options: ['Pass', 'Conditional Pass', 'Fail — Workshop'] },
      { key: 'inspector', label: 'Inspector' }
    ]
  },
  {
    id: 'tyre-history', title: 'Tyre History', subtitle: 'Tyre changes, rotations & repairs', icon: '🛞', section: 'logistics', table: 'tyre_history', keyField: 'plate_no',
    fields: [
      { key: 'change_date', label: 'Date', type: 'date', required: true },
      { key: 'plate_no', label: 'Plate No' },
      { key: 'position', label: 'Position' },
      { key: 'action', label: 'Action', type: 'select', options: ['New', 'Replacement', 'Rotation', 'Puncture Repair', 'Flagged for replacement'] },
      { key: 'brand', label: 'Brand' },
      { key: 'odometer_km', label: 'Odometer (km)', type: 'number' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },

  // ── ADMINISTRATION ────────────────────────────────────────────────────────
  {
    id: 'roles', title: 'Roles', subtitle: 'Dynamic role catalogue — grants are set in Permissions', icon: '🎭', section: 'admin', table: 'roles', keyField: 'role_key',
    lockedRows: { field: 'role_key', values: ['admin'] },
    fields: [
      { key: 'role_key', label: 'Role Key', required: true, placeholder: 'qa_engineer' },
      { key: 'label', label: 'Label', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  {
    id: 'departments', title: 'Departments', subtitle: 'Company departments — users inherit their department grants', icon: '🏢', section: 'admin', table: 'departments', keyField: 'department_key',
    fields: [
      { key: 'department_key', label: 'Department Key', required: true, placeholder: 'production' },
      { key: 'label', label: 'Label', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  {
    id: 'permission-actions', title: 'Permission Actions', subtitle: 'Action catalogue used by the permission matrices (read-only)', icon: '🔑', section: 'admin', table: 'permissions', keyField: 'action_key', readOnly: true,
    fields: [
      { key: 'action_key', label: 'Action' },
      { key: 'label', label: 'Label' },
      { key: 'description', label: 'Description' }
    ]
  },
  {
    id: 'audit-logs', title: 'Audit Logs', subtitle: 'System write trail (read-only)', icon: '🧾', section: 'admin', table: 'audit_logs', keyField: 'ts', readOnly: true, paper: 'A4', landscape: true,
    fields: [
      { key: 'ts', label: 'Timestamp' },
      { key: 'user_email', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'table_name', label: 'Table' },
      { key: 'record_id', label: 'Record' },
      { key: 'details', label: 'Details' }
    ]
  },
  {
    id: 'system-settings', title: 'System Settings', subtitle: 'Company identity & report configuration', icon: '⚙️', section: 'admin', table: 'system_settings', keyField: 'key',
    fields: [
      { key: 'key', label: 'Setting Key', required: true },
      { key: 'value', label: 'Value', required: true, type: 'textarea' }
    ]
  },
  {
    id: 'approvals', title: 'Pending Approvals', subtitle: 'Approval requests across departments', icon: '🖊️', section: 'admin', table: 'approvals', keyField: 'reference', statusField: 'status', requiresApprove: true,
    fields: [
      { key: 'req_date', label: 'Date', type: 'date' },
      { key: 'type', label: 'Type' },
      { key: 'reference', label: 'Reference' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'requested_by', label: 'Requested By' },
      { key: 'approver', label: 'Approver' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'] }
    ]
  },
  // ── HSE ────────────────────────────────────────────────────────────────────
  {
    id: 'hse-incidents', title: 'Incident Register', subtitle: 'Near-miss, injury & property damage log', icon: '🚨', section: 'hse', table: 'hse_incidents', keyField: 'incident_no', statusField: 'status', paper: 'A4',
    fields: [
      { key: 'incident_no', label: 'Incident No', required: true },
      { key: 'incident_date', label: 'Date', type: 'date' },
      { key: 'project_no', label: 'Project' },
      { key: 'location', label: 'Location' },
      { key: 'incident_type', label: 'Type', type: 'select', options: ['Near Miss', 'Injury', 'Property Damage', 'Environmental'] },
      { key: 'severity', label: 'Severity', type: 'select', options: ['Minor', 'Moderate', 'Major', 'Critical'] },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'injured_person', label: 'Injured Person' },
      { key: 'root_cause', label: 'Root Cause', type: 'textarea' },
      { key: 'corrective_action', label: 'Corrective Action', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Investigating', 'Closed'] },
      { key: 'reported_by', label: 'Reported By' },
      { key: 'closed_date', label: 'Closed', type: 'date' }
    ]
  },
  {
    id: 'toolbox-talks', title: 'Toolbox Talks', subtitle: 'Site safety briefing log', icon: '🗣️', section: 'hse', table: 'toolbox_talks', keyField: 'topic',
    fields: [
      { key: 'talk_date', label: 'Date', type: 'date', required: true },
      { key: 'topic', label: 'Topic', required: true },
      { key: 'conducted_by', label: 'Conducted By' },
      { key: 'department', label: 'Department' },
      { key: 'attendees_count', label: 'Attendees', type: 'number' },
      { key: 'location', label: 'Location' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    id: 'risk-assessments', title: 'Risk Assessments', subtitle: 'Activity risk & control measures', icon: '⚠️', section: 'hse', table: 'risk_assessments', keyField: 'ra_no', statusField: 'status',
    fields: [
      { key: 'ra_no', label: 'RA No', required: true },
      { key: 'activity', label: 'Activity', required: true },
      { key: 'hazards', label: 'Hazards', type: 'textarea' },
      { key: 'risk_level', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High'] },
      { key: 'control_measures', label: 'Control Measures', type: 'textarea' },
      { key: 'assessed_by', label: 'Assessed By' },
      { key: 'review_date', label: 'Review Date', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Review', 'Expired'] }
    ]
  },
  {
    id: 'hse-permits', title: 'Permits to Work', subtitle: 'Hot work, confined space, height & lifting permits', icon: '📜', section: 'hse', table: 'hse_permits', keyField: 'permit_no', statusField: 'status',
    fields: [
      { key: 'permit_no', label: 'Permit No', required: true },
      { key: 'permit_type', label: 'Type', type: 'select', options: ['Hot Work', 'Confined Space', 'Working at Height', 'Lifting'] },
      { key: 'issued_to', label: 'Issued To' },
      { key: 'valid_from', label: 'Valid From', type: 'date' },
      { key: 'valid_to', label: 'Valid To', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Expired', 'Closed'] },
      { key: 'issued_by', label: 'Issued By' }
    ]
  },
  {
    id: 'safety-audits', title: 'Safety Audits', subtitle: 'Site safety audit findings & scores', icon: '📋', section: 'hse', table: 'safety_audits', keyField: 'audit_no', statusField: 'status',
    fields: [
      { key: 'audit_no', label: 'Audit No', required: true },
      { key: 'audit_date', label: 'Date', type: 'date' },
      { key: 'area', label: 'Area' },
      { key: 'auditor', label: 'Auditor' },
      { key: 'findings_count', label: 'Findings', type: 'number' },
      { key: 'score', label: 'Score', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Closed'] }
    ]
  },
  // ── WORKFORCE ──────────────────────────────────────────────────────────────
  {
    id: 'crew-members', title: 'Crew Members', subtitle: 'Workforce master register', icon: '👷', section: 'workforce', table: 'crew_members', keyField: 'name', statusField: 'status',
    fields: [
      { key: 'name', label: 'Name', required: true },
      { key: 'trade', label: 'Trade' },
      { key: 'employee_no', label: 'Employee No' },
      { key: 'department', label: 'Department' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'On Leave', 'Inactive'] }
    ]
  },
  {
    id: 'crew-assignments', title: 'Crew Assignments', subtitle: 'Daily crew-to-task assignment', icon: '📌', section: 'workforce', table: 'crew_assignments', keyField: 'crew_member', statusField: 'status',
    fields: [
      { key: 'assignment_date', label: 'Date', type: 'date', required: true },
      { key: 'crew_member', label: 'Crew Member', type: 'ref', ref: { table: 'crew_members', valueField: 'name' } },
      { key: 'project_no', label: 'Project' },
      { key: 'task', label: 'Task' },
      { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Assigned', 'In Progress', 'Completed'] }
    ]
  },
  {
    id: 'shift-schedules', title: 'Shift Schedules', subtitle: 'Planned vs. actual shift headcount', icon: '🕐', section: 'workforce', table: 'shift_schedules', keyField: 'shift_date',
    fields: [
      { key: 'shift_date', label: 'Date', type: 'date', required: true },
      { key: 'shift_type', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
      { key: 'department', label: 'Department' },
      { key: 'supervisor', label: 'Supervisor' },
      { key: 'headcount_planned', label: 'Planned Headcount', type: 'number' },
      { key: 'headcount_actual', label: 'Actual Headcount', type: 'number' }
    ]
  },
  {
    id: 'certifications', title: 'Certifications', subtitle: 'Safety, trade & competency certification tracking', icon: '🎓', section: 'workforce', table: 'certifications', keyField: 'person_name', statusField: 'status',
    fields: [
      { key: 'person_name', label: 'Name', required: true },
      { key: 'cert_type', label: 'Certification' },
      { key: 'cert_category', label: 'Category', type: 'select', options: ['Safety', 'Trade', 'Competency'] },
      { key: 'cert_no', label: 'Cert No' },
      { key: 'issued_date', label: 'Issued', type: 'date' },
      { key: 'expiry_date', label: 'Expires', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Valid', 'Expiring Soon', 'Expired'] }
    ]
  },
  // ── PRESTRESSING ───────────────────────────────────────────────────────────
  {
    id: 'pt-strands', title: 'Strand Inventory', subtitle: 'PT strand stock & batches', icon: '➰', section: 'prestressing', table: 'pt_strands', keyField: 'strand_id', statusField: 'status',
    fields: [
      { key: 'strand_id', label: 'Strand ID', required: true },
      { key: 'strand_type', label: 'Type' },
      { key: 'diameter_mm', label: 'Ø (mm)', type: 'number' },
      { key: 'supplier', label: 'Supplier' },
      { key: 'batch_no', label: 'Batch No' },
      { key: 'tensile_strength_mpa', label: 'Tensile (MPa)', type: 'number' },
      { key: 'qty_meters', label: 'Qty (m)', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['In Stock', 'Issued', 'Consumed'] }
    ]
  },
  {
    id: 'pt-tensioning', title: 'Tensioning', subtitle: 'Strand tensioning log', icon: '🔧', section: 'prestressing', table: 'pt_tensioning', keyField: 'tensioning_no', statusField: 'status',
    fields: [
      { key: 'tensioning_no', label: 'Tensioning No', required: true },
      { key: 'bed', label: 'Bed' },
      { key: 'element_code', label: 'Element Code' },
      { key: 'tensioning_date', label: 'Date', type: 'date' },
      { key: 'strand_count', label: 'Strand Count', type: 'number' },
      { key: 'initial_force_kn', label: 'Initial Force (kN)', type: 'number' },
      { key: 'target_elongation_mm', label: 'Target Elong. (mm)', type: 'number' },
      { key: 'actual_elongation_mm', label: 'Actual Elong. (mm)', type: 'number' },
      { key: 'tensioned_by', label: 'Tensioned By' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'Tensioned', 'Released'] }
    ]
  },
  {
    id: 'pt-release', title: 'Strand Release', subtitle: 'PT release approvals', icon: '🔓', section: 'prestressing', table: 'pt_release', keyField: 'release_no', statusField: 'status',
    fields: [
      { key: 'release_no', label: 'Release No', required: true },
      { key: 'tensioning_no', label: 'Tensioning No' },
      { key: 'element_code', label: 'Element Code' },
      { key: 'release_date', label: 'Date', type: 'date' },
      { key: 'concrete_strength_mpa', label: 'Concrete Strength (MPa)', type: 'number' },
      { key: 'released_by', label: 'Released By' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Released', 'Hold'] }
    ]
  },
  {
    id: 'pt-long-line-plans', title: 'Long Line Planning', subtitle: 'Long-line bed casting plans', icon: '📏', section: 'prestressing', table: 'pt_long_line_plans', keyField: 'plan_no', statusField: 'status',
    fields: [
      { key: 'plan_no', label: 'Plan No', required: true },
      { key: 'bed', label: 'Bed' },
      { key: 'plan_date', label: 'Date', type: 'date' },
      { key: 'project_no', label: 'Project' },
      { key: 'element_codes', label: 'Element Codes' },
      { key: 'total_length_m', label: 'Total Length (m)', type: 'number' },
      { key: 'strand_pattern', label: 'Strand Pattern' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'In Progress', 'Completed'] }
    ]
  },
  // ── SITE ERECTION ──────────────────────────────────────────────────────────
  {
    id: 'erection-planning', title: 'Erection Planning', subtitle: 'Erection sequence & crane plan', icon: '🏗️', section: 'erection', table: 'erection_planning', keyField: 'plan_no', statusField: 'status',
    fields: [
      { key: 'plan_no', label: 'Plan No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'plan_date', label: 'Date', type: 'date' },
      { key: 'element_codes', label: 'Element Codes' },
      { key: 'crane', label: 'Crane' },
      { key: 'sequence_no', label: 'Sequence No', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Planned', 'Scheduled', 'In Progress', 'Completed'] }
    ]
  },
  {
    id: 'erection-log', title: 'Erection Log', subtitle: 'Site erection record per element', icon: '🧱', section: 'erection', table: 'erection_log', keyField: 'element_code', statusField: 'status',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'erection_date', label: 'Date', type: 'date' },
      { key: 'location', label: 'Location' },
      { key: 'crane', label: 'Crane' },
      { key: 'operator', label: 'Operator' },
      { key: 'erected_by', label: 'Erected By' },
      { key: 'status', label: 'Status', type: 'select', options: ['Erected', 'Pending', 'Rejected'] }
    ]
  },
  {
    id: 'grouting-records', title: 'Grouting Records', subtitle: 'Joint grouting log', icon: '🪣', section: 'erection', table: 'grouting_records', keyField: 'element_code', statusField: 'status',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'grout_date', label: 'Date', type: 'date' },
      { key: 'joint_ref', label: 'Joint Ref' },
      { key: 'grout_mix', label: 'Grout Mix' },
      { key: 'applied_by', label: 'Applied By' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Completed', 'Rework'] }
    ]
  },
  {
    id: 'connection-inspections', title: 'Connection Inspection', subtitle: 'Weld & bolt connection checks', icon: '🔩', section: 'erection', table: 'connection_inspections', keyField: 'element_code', statusField: 'result',
    fields: [
      { key: 'element_code', label: 'Element Code', required: true },
      { key: 'inspection_date', label: 'Date', type: 'date' },
      { key: 'connection_type', label: 'Connection Type' },
      { key: 'weld_check', label: 'Weld', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'bolt_torque_check', label: 'Bolt Torque', type: 'select', options: ['Pass', 'Fail', 'N/A'] },
      { key: 'result', label: 'Result', type: 'select', options: ['Accepted', 'Rejected'] },
      { key: 'inspector', label: 'Inspector' }
    ]
  },
  // ── MAINTENANCE ────────────────────────────────────────────────────────────
  {
    id: 'equipment-register', title: 'Equipment Register', subtitle: 'Plant & equipment master list', icon: '🛠️', section: 'maintenance', table: 'equipment_register', keyField: 'equipment_id', statusField: 'status',
    fields: [
      { key: 'equipment_id', label: 'Equipment ID', required: true },
      { key: 'equipment_type', label: 'Type' },
      { key: 'make_model', label: 'Make / Model' },
      { key: 'location', label: 'Location' },
      { key: 'purchase_date', label: 'Purchased', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Under Maintenance', 'Retired'] }
    ]
  },
  {
    id: 'preventive-maintenance', title: 'Preventive Maintenance', subtitle: 'Scheduled maintenance tasks', icon: '🗓️', section: 'maintenance', table: 'preventive_maintenance', keyField: 'pm_no', statusField: 'status',
    fields: [
      { key: 'pm_no', label: 'PM No', required: true },
      { key: 'equipment_id', label: 'Equipment ID' },
      { key: 'scheduled_date', label: 'Scheduled', type: 'date' },
      { key: 'task', label: 'Task' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'completed_date', label: 'Completed', type: 'date' },
      { key: 'technician', label: 'Technician' },
      { key: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'Completed', 'Overdue'] }
    ]
  },
  {
    id: 'calibration-records', title: 'Calibration Records', subtitle: 'Instrument calibration tracking', icon: '📐', section: 'maintenance', table: 'calibration_records', keyField: 'equipment_id', statusField: 'status',
    fields: [
      { key: 'equipment_id', label: 'Equipment ID', required: true },
      { key: 'calibration_date', label: 'Date', type: 'date' },
      { key: 'calibrated_by', label: 'Calibrated By' },
      { key: 'next_due_date', label: 'Next Due', type: 'date' },
      { key: 'certificate_no', label: 'Certificate No' },
      { key: 'status', label: 'Status', type: 'select', options: ['Valid', 'Due Soon', 'Expired'] }
    ]
  },
  {
    id: 'maintenance-log', title: 'Breakdown / General Maintenance', subtitle: 'Equipment maintenance & repair log', icon: '🔧', section: 'maintenance', table: 'maintenance_logs', keyField: 'equipment_id', statusField: 'status',
    fields: [
      { key: 'equipment_type', label: 'Equipment Type' },
      { key: 'equipment_id', label: 'Equipment ID', required: true },
      { key: 'maintenance_date', label: 'Date', type: 'date' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'technician', label: 'Technician' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Completed'] }
    ]
  },
  // ── DOCUMENT CONTROL ───────────────────────────────────────────────────────
  {
    id: 'rfi-register', title: 'RFI Register', subtitle: 'Request for Information log', icon: '❓', section: 'documents', table: 'rfi_register', keyField: 'rfi_no', statusField: 'status', paper: 'A4',
    fields: [
      { key: 'rfi_no', label: 'RFI No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'raised_date', label: 'Raised', type: 'date' },
      { key: 'subject', label: 'Subject' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'raised_by', label: 'Raised By' },
      { key: 'response', label: 'Response', type: 'textarea' },
      { key: 'response_date', label: 'Responded', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'Answered', 'Closed'] }
    ]
  },
  {
    id: 'method-statements', title: 'Method Statements', subtitle: 'Work method statement register', icon: '📄', section: 'documents', table: 'method_statements', keyField: 'ms_no', statusField: 'status',
    fields: [
      { key: 'ms_no', label: 'MS No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'title', label: 'Title' },
      { key: 'activity', label: 'Activity' },
      { key: 'revision', label: 'Revision' },
      { key: 'prepared_by', label: 'Prepared By' },
      { key: 'approved_by', label: 'Approved By' },
      { key: 'approval_date', label: 'Approved', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Under Review', 'Approved', 'Superseded'] }
    ]
  },
  {
    id: 'submittals', title: 'Submittals', subtitle: 'Material & document submittal log', icon: '📤', section: 'documents', table: 'submittals', keyField: 'submittal_no', statusField: 'status',
    fields: [
      { key: 'submittal_no', label: 'Submittal No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Type' },
      { key: 'submitted_date', label: 'Submitted', type: 'date' },
      { key: 'submitted_by', label: 'Submitted By' },
      { key: 'reviewer', label: 'Reviewer' },
      { key: 'review_status', label: 'Review Status', type: 'select', options: ['Pending', 'Approved', 'Approved as Noted', 'Rejected'] },
      { key: 'status', label: 'Status', type: 'select', options: ['Submitted', 'Under Review', 'Closed'] }
    ]
  },
  // ── CUSTOMER HANDOVER ──────────────────────────────────────────────────────
  {
    id: 'handover-packages', title: 'Handover Packages', subtitle: 'Project handover document packages', icon: '📦', section: 'handover', table: 'handover_packages', keyField: 'package_no', statusField: 'status',
    fields: [
      { key: 'package_no', label: 'Package No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'handover_date', label: 'Date', type: 'date' },
      { key: 'prepared_by', label: 'Prepared By' },
      { key: 'documents_included', label: 'Documents Included', type: 'textarea' },
      { key: 'client_signoff_by', label: 'Client Sign-off' },
      { key: 'status', label: 'Status', type: 'select', options: ['In Preparation', 'Submitted', 'Accepted'] }
    ]
  },
  {
    id: 'dlp-records', title: 'DLP Tracker', subtitle: 'Defects Liability Period tracking', icon: '⏳', section: 'handover', table: 'dlp_records', keyField: 'project_no', statusField: 'status',
    fields: [
      { key: 'project_no', label: 'Project', required: true },
      { key: 'dlp_start_date', label: 'DLP Start', type: 'date' },
      { key: 'dlp_end_date', label: 'DLP End', type: 'date' },
      { key: 'defects_count', label: 'Defects', type: 'number' },
      { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Closed'] }
    ]
  },
  {
    id: 'handover-defects', title: 'Handover Defects', subtitle: 'Post-handover defect register', icon: '🩹', section: 'handover', table: 'handover_defects', keyField: 'defect_no', statusField: 'status',
    fields: [
      { key: 'defect_no', label: 'Defect No', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'element_code', label: 'Element' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'raised_date', label: 'Raised', type: 'date' },
      { key: 'due_date', label: 'Due', type: 'date' },
      { key: 'closed_date', label: 'Closed', type: 'date' },
      { key: 'assigned_to', label: 'Assigned To' },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Closed'] }
    ]
  },
  {
    id: 'customer-acceptance', title: 'Customer Acceptance', subtitle: 'Final client acceptance sign-off', icon: '✍️', section: 'handover', table: 'customer_acceptance', keyField: 'project_no', statusField: 'status',
    fields: [
      { key: 'project_no', label: 'Project', required: true },
      { key: 'acceptance_date', label: 'Date', type: 'date' },
      { key: 'accepted_by', label: 'Accepted By' },
      { key: 'client_rep', label: 'Client Rep' },
      { key: 'remarks', label: 'Remarks', type: 'textarea' },
      { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Accepted', 'Rejected'] }
    ]
  },
  // ── ENVIRONMENTAL / SUSTAINABILITY ─────────────────────────────────────────
  {
    id: 'carbon-records', title: 'Carbon Tracking', subtitle: 'CO2 emissions log', icon: '🌍', section: 'environmental', table: 'carbon_records', keyField: 'record_date',
    fields: [
      { key: 'record_date', label: 'Date', type: 'date', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'activity', label: 'Activity' },
      { key: 'co2_kg', label: 'CO2 (kg)', type: 'number' },
      { key: 'source', label: 'Source' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ]
  },
  {
    id: 'waste-records', title: 'Waste Tracking', subtitle: 'Waste generation & disposal log', icon: '🗑️', section: 'environmental', table: 'waste_records', keyField: 'record_date',
    fields: [
      { key: 'record_date', label: 'Date', type: 'date', required: true },
      { key: 'project_no', label: 'Project' },
      { key: 'waste_type', label: 'Waste Type' },
      { key: 'qty_kg', label: 'Qty (kg)', type: 'number' },
      { key: 'disposal_method', label: 'Disposal Method' },
      { key: 'disposed_by', label: 'Disposed By' }
    ]
  },
  {
    id: 'water-records', title: 'Water Tracking', subtitle: 'Water usage log', icon: '💧', section: 'environmental', table: 'water_records', keyField: 'record_date',
    fields: [
      { key: 'record_date', label: 'Date', type: 'date', required: true },
      { key: 'source', label: 'Source' },
      { key: 'usage_litres', label: 'Usage (L)', type: 'number' },
      { key: 'purpose', label: 'Purpose' }
    ]
  },
  {
    id: 'environmental-reports', title: 'Environmental Reports', subtitle: 'Periodic environmental summary reports', icon: '📊', section: 'environmental', table: 'environmental_reports', keyField: 'report_no', statusField: 'status',
    fields: [
      { key: 'report_no', label: 'Report No', required: true },
      { key: 'report_period', label: 'Period' },
      { key: 'project_no', label: 'Project' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'prepared_by', label: 'Prepared By' },
      { key: 'submitted_date', label: 'Submitted', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', options: ['Draft', 'Submitted', 'Approved'] }
    ]
  }
]

export const getModule = (id: string): ModuleDef | undefined => MODULES.find(m => m.id === id)

// ── NAVIGATION ────────────────────────────────────────────────────────────────
// Mirrors the Safetech Operations Control Panel structure. Custom pages keep
// their dedicated routes; generic modules live at /m/<id>.

export type NavItem = { name: string; path: string }
export type NavSection = { key: SectionKey; name: string; icon: string; items: NavItem[] }

const m = (id: string) => `/m/${id}`

export const NAV_SECTIONS: NavSection[] = [
  {
    key: 'dashboard', name: 'Dashboard', icon: '🏠',
    items: [{ name: 'Control Center', path: '/dashboard' }]
  },
  {
    key: 'master', name: 'Master Data', icon: '🗄️',
    items: [
      { name: 'Projects', path: m('projects') },
      { name: 'Clients', path: m('clients') },
      { name: 'Consultants', path: m('consultants') },
      { name: 'Production Beds', path: m('production-beds') },
      { name: 'Moulds', path: m('moulds') },
      { name: 'Element Types', path: m('element-types') },
      { name: 'Mix Designs', path: m('mix-designs') },
      { name: 'Reinforcement Types', path: m('reinforcement-types') },
      { name: 'Vehicles', path: m('vehicles') },
      { name: 'Trailers', path: m('trailers') },
      { name: 'Drivers', path: m('drivers') },
      { name: 'Suppliers', path: m('suppliers') }
    ]
  },
  {
    key: 'design', name: 'Design', icon: '📐',
    items: [
      { name: 'Drawings', path: m('drawings') },
      { name: 'Revisions', path: m('drawing-revisions') },
      { name: 'Shop Drawings', path: m('shop-drawings') },
      { name: 'IFC Drawings', path: m('ifc-drawings') },
      { name: 'BOQ', path: m('boq') },
      { name: 'Drawing Register', path: m('drawing-register') },
      { name: 'Drawing Reports', path: '/reports-hub?report=drawings' }
    ]
  },
  {
    key: 'planning', name: 'Planning', icon: '📅',
    items: [
      { name: 'Project Auto-Import', path: '/project-import' },
      { name: 'BOM', path: m('bom') },
      { name: 'Casting Schedule', path: '/casting-schedule' },
      { name: 'Cast Bed Plan', path: '/cast-bed-plan' },
      { name: 'Element Register', path: m('elements') },
      { name: 'Daily Planning', path: m('daily-planning') },
      { name: 'Weekly Planning', path: '/reports-hub?report=weekly-planning' },
      { name: 'Monthly Planning', path: '/reports-hub?report=monthly-planning' },
      { name: 'DTPP', path: '/reports-hub?report=dtpp' },
      { name: 'DPR', path: '/reports-hub?report=dpr' },
      { name: 'Planning Reports', path: '/reports-hub?report=planning' }
    ]
  },
  {
    key: 'production', name: 'Production', icon: '⚙️',
    items: [
      { name: 'Casting', path: '/production?tab=casting' },
      { name: 'Reinforcement', path: m('reinforcement') },
      { name: 'Batching Dashboard', path: '/batching' },
      { name: 'Concrete', path: m('concrete') },
      { name: 'Mould Preparation', path: m('mould-preparation') },
      { name: 'Finishing', path: m('finishing') },
      { name: 'Repairs', path: m('repairs') },
      { name: 'Concrete Grades', path: m('concrete-grades') },
      { name: 'Daily Production', path: '/reports-hub?report=daily-production' },
      { name: 'Productivity', path: '/reports-hub?report=productivity' }
    ]
  },
  {
    key: 'qaqc', name: 'QA / QC', icon: '🛡️',
    items: [
      { name: 'Incoming Inspection', path: m('incoming-inspection') },
      { name: 'Mix Approval', path: m('mix-approval') },
      { name: 'Pre-Pour Inspection', path: m('pre-pour') },
      { name: 'Post Casting', path: m('post-casting') },
      { name: 'Dimensional Inspection', path: m('dimensional') },
      { name: 'Finishing Inspection', path: m('finishing-inspection') },
      { name: 'NCR', path: m('ncr') },
      { name: 'Punch List', path: m('punch-list') },
      { name: 'QC Inspectors', path: m('qc-inspectors') },
      { name: 'Quality Reports', path: '/reports-hub?report=qa' }
    ]
  },
  {
    key: 'hse', name: 'HSE', icon: '🦺',
    items: [
      { name: 'HSE Dashboard', path: '/hse' },
      { name: 'Incident Register', path: m('hse-incidents') },
      { name: 'Toolbox Talks', path: m('toolbox-talks') },
      { name: 'Risk Assessments', path: m('risk-assessments') },
      { name: 'Permits to Work', path: m('hse-permits') },
      { name: 'Safety Audits', path: m('safety-audits') }
    ]
  },
  {
    key: 'workforce', name: 'Workforce', icon: '👷',
    items: [
      { name: 'Workforce Dashboard', path: '/workforce' },
      { name: 'Crew Members', path: m('crew-members') },
      { name: 'Crew Assignments', path: m('crew-assignments') },
      { name: 'Shift Schedules', path: m('shift-schedules') },
      { name: 'Certifications', path: m('certifications') }
    ]
  },
  {
    key: 'prestressing', name: 'Prestressing', icon: '➰',
    items: [
      { name: 'Prestressing Dashboard', path: '/prestressing' },
      { name: 'Strand Inventory', path: m('pt-strands') },
      { name: 'Tensioning', path: m('pt-tensioning') },
      { name: 'Strand Release', path: m('pt-release') },
      { name: 'Long Line Planning', path: m('pt-long-line-plans') }
    ]
  },
  {
    key: 'stockyard', name: 'Stockyard', icon: '🏗️',
    items: [
      { name: 'Element Location', path: '/stockyard?tab=inventory' },
      { name: 'Rack Management', path: m('rack-management') },
      { name: 'Storage Zones', path: m('storage-zones') },
      { name: 'Ready for Dispatch', path: m('ready-for-dispatch') },
      { name: 'Yard Movement', path: m('yard-movement') },
      { name: 'Stack Planning', path: m('stack-plans') },
      { name: 'Crane Planning', path: m('crane-planning') },
      { name: 'Crane Operators', path: m('crane-operators') },
      { name: 'QR Scanner & Trace', path: '/qr-scanner' }
    ]
  },
  {
    key: 'dispatch', name: 'Dispatch', icon: '🚚',
    items: [
      { name: 'Delivery Planning', path: '/logistics/planning' },
      { name: 'Delivery Schedule', path: m('delivery-schedule') },
      { name: 'Truck / Trailer / Driver Allocation', path: m('allocations') },
      { name: 'Gate Pass', path: '/gate-pass' },
      { name: 'Dispatch Checklist', path: m('dispatch-checklist') },
      { name: 'Dispatch Gate Log', path: '/dispatch' },
      { name: 'Delivery Notes', path: '/delivery-note' },
      { name: 'Delivery Reports', path: '/reports' },
      { name: 'Fleet Status Board', path: '/fleet' }
    ]
  },
  {
    key: 'logistics', name: 'Logistics', icon: '🛞',
    items: [
      { name: 'Trips', path: m('trips') },
      { name: 'Fuel', path: m('fuel') },
      { name: 'Fleet Status', path: '/fleet' },
      { name: 'Vehicle Inspection', path: m('vehicle-inspection') },
      { name: 'Tyre History', path: m('tyre-history') }
    ]
  },
  {
    key: 'erection', name: 'Site Erection', icon: '🏢',
    items: [
      { name: 'Erection Planning', path: m('erection-planning') },
      { name: 'Erection Log', path: m('erection-log') },
      { name: 'Grouting Records', path: m('grouting-records') },
      { name: 'Connection Inspection', path: m('connection-inspections') }
    ]
  },
  {
    key: 'maintenance', name: 'Maintenance', icon: '🔧',
    items: [
      { name: 'Maintenance Dashboard', path: '/maintenance-dashboard' },
      { name: 'Maintenance Log', path: '/maintenance' },
      { name: 'Equipment Register', path: m('equipment-register') },
      { name: 'Preventive Maintenance', path: m('preventive-maintenance') },
      { name: 'Calibration Records', path: m('calibration-records') },
      { name: 'Breakdown / General Log', path: m('maintenance-log') }
    ]
  },
  {
    key: 'documents', name: 'Document Control', icon: '🗃️',
    items: [
      { name: 'Document Control Dashboard', path: '/documents' },
      { name: 'RFI Register', path: m('rfi-register') },
      { name: 'Method Statements', path: m('method-statements') },
      { name: 'Submittals', path: m('submittals') }
    ]
  },
  {
    key: 'handover', name: 'Customer Handover', icon: '🤝',
    items: [
      { name: 'Handover Dashboard', path: '/handover' },
      { name: 'Handover Packages', path: m('handover-packages') },
      { name: 'DLP Tracker', path: m('dlp-records') },
      { name: 'Handover Defects', path: m('handover-defects') },
      { name: 'Customer Acceptance', path: m('customer-acceptance') }
    ]
  },
  {
    key: 'environmental', name: 'Environmental', icon: '🌍',
    items: [
      { name: 'Environmental Dashboard', path: '/environmental' },
      { name: 'Carbon Tracking', path: m('carbon-records') },
      { name: 'Waste Tracking', path: m('waste-records') },
      { name: 'Water Tracking', path: m('water-records') },
      { name: 'Environmental Reports', path: m('environmental-reports') }
    ]
  },
  {
    key: 'reports', name: 'Reports', icon: '📊',
    items: [
      { name: 'Daily Report', path: '/reports-hub?report=daily' },
      { name: 'Weekly Report', path: '/reports-hub?report=weekly' },
      { name: 'Monthly Report', path: '/reports-hub?report=monthly' },
      { name: 'DPR', path: '/reports-hub?report=dpr' },
      { name: 'DTPP', path: '/reports-hub?report=dtpp' },
      { name: 'Production Report', path: '/reports-hub?report=production' },
      { name: 'Dispatch Report', path: '/reports' },
      { name: 'Yard Report', path: '/reports-hub?report=yard' },
      { name: 'QA Report', path: '/reports-hub?report=qa' },
      { name: 'Management Dashboard', path: '/reports-hub?report=management' }
    ]
  },
  {
    key: 'admin', name: 'Administration', icon: '🔐',
    items: [
      { name: 'Users', path: '/admin' },
      { name: 'Roles', path: m('roles') },
      { name: 'Departments', path: m('departments') },
      { name: 'Permissions', path: '/permissions' },
      { name: 'Permission Actions', path: m('permission-actions') },
      { name: 'Audit Logs', path: m('audit-logs') },
      { name: 'System Settings', path: m('system-settings') },
      { name: 'Pending Approvals', path: m('approvals') },
      { name: 'CSV Import (Legacy)', path: '/import' }
    ]
  }
]

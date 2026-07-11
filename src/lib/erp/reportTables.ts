/** Curated list of report-friendly source tables — shared by ReportsHubPage.tsx
    (fixed reports) and ReportBuilderPage.tsx (custom reports) so there's one
    list to maintain, not two. */
export const REPORT_TABLES = [
  'deliveries', 'casting_schedule', 'elements', 'production_casting', 'stockyard_inventory',
  'yard_movement', 'qc_inspections', 'post_casting_inspections', 'dimensional_inspections',
  'finishing_inspections', 'incoming_inspections', 'ncr_register', 'punch_list', 'gate_passes',
  'delivery_schedule', 'allocations', 'drawings', 'drawing_revisions', 'projects', 'boq_items',
  'fleet_status', 'trailers', 'concrete_batches', 'trips', 'storage_zones', 'approvals'
]

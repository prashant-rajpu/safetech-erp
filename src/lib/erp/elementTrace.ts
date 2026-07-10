import { insertAudited } from './db'

export type TraceStage =
  | 'Planning' | 'Casting' | 'QC' | 'Curing' | 'Stockyard' | 'Loading'
  | 'Dispatch' | 'Delivered' | 'At Site' | 'Erected' | 'Completed'

export type TraceEventType = 'Scan' | 'Status Update' | 'Defect Reported'

export type LogTraceEventParams = {
  elementCode: string
  stage: TraceStage
  eventType: TraceEventType
  status?: string
  defectSeverity?: 'Cosmetic' | 'Minor' | 'Major'
  defectDescription?: string
  remarks?: string
  loggedBy: string
  department?: string
}

/** Single write path into traceability_events — keeps the event shape consistent
    across every place that logs a scan/status/defect event. */
export async function logTraceEvent(params: LogTraceEventParams) {
  await insertAudited('traceability_events', [{
    element_code: params.elementCode,
    stage: params.stage,
    event_type: params.eventType,
    status: params.status || null,
    defect_severity: params.defectSeverity || null,
    defect_description: params.defectDescription || null,
    remarks: params.remarks || null,
    logged_by: params.loggedBy,
    department: params.department || null
  }], params.loggedBy, `${params.eventType} — ${params.elementCode} (${params.stage})`)
}

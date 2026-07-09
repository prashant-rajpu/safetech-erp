import { useState } from 'react'
import Typeahead from '../../src/components/Typeahead'

// Ported from real usage (src/pages/DeliveryForm.tsx, FleetStatusForm.tsx).
// Typeahead is a controlled input — each story wraps it with local state, the
// same pattern every real call site uses. Both stories start with an empty
// value: the component's autocomplete query only fires once `value` is
// non-empty, so an idle story never touches the network. The "suggestions
// open" state needs a live Supabase query result and isn't authored here
// (see .design-sync/NOTES.md).

export function ProjectLookup() {
  const [value, setValue] = useState('')
  return <Typeahead value={value} onChange={setValue} table="projects" column="project_no" placeholder="Enter Project No" />
}

export function TrailerPlateLookup() {
  const [value, setValue] = useState('')
  return <Typeahead value={value} onChange={setValue} table="trailers" column="plate_no" placeholder="Enter Plate Number" />
}

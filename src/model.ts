import documents from './data/documents.json' with { type: 'json' }

export const joiningDate = '2026-12-01T10:00:00+06:00'
export const key = 'jdt:v1'
export const categories = [
  'Bank forms',
  'Medical',
  'Identity',
  'Certificates',
  'Legal',
  'Academic',
  'Employment',
] as const
export type Category = (typeof categories)[number]
export const labels = {
  not_started: 'Not started',
  in_progress: 'In progress',
  prepared: 'Prepared',
  attested: 'Attested',
  ready: 'Ready',
} as const
export type Status = keyof typeof labels
export const statuses = Object.keys(labels) as Status[]
export interface SubItem {
  id: string
  label: string
  done: boolean
}
export interface DocItem {
  id: string
  title: string
  clause?: string
  category: Category
  requirements: string
  quantity?: string
  needsAttestation: boolean
  status: Status
  blocked: boolean
  blockedReason?: string
  dueDate?: string
  whereWho?: string
  notes?: string
  subItems?: SubItem[]
  isCustom?: boolean
  order: number
  updatedAt: string
}
export interface AppState {
  version: 1
  joiningDate: string
  items: DocItem[]
  lastExportedAt?: string
  savedAt?: string
  createdAt?: string
}

export function initialState(): AppState {
  const now = new Date().toISOString()
  return {
    version: 1,
    joiningDate,
    createdAt: now,
    items: documents.map(({ checklist, ...doc }) => ({
      ...doc,
      category: doc.category as Category,
      status: 'not_started',
      blocked: false,
      updatedAt: now,
      ...(checklist && {
        subItems: checklist.map((label, i) => ({
          id: doc.id + '-' + i,
          label,
          done: false,
        })),
      }),
    })),
  }
}
export function pipeline(attestation: boolean) {
  return statuses.filter((status) => attestation || status !== 'attested')
}
export function progress(doc: DocItem) {
  const steps = pipeline(doc.needsAttestation)
  return steps.indexOf(doc.status) / (steps.length - 1)
}
export function overall(items: DocItem[]) {
  return items.length
    ? Math.round(
        (100 * items.reduce((sum, d) => sum + progress(d), 0)) / items.length,
      )
    : 0
}
export function needsStamp(d: DocItem) {
  return d.needsAttestation && d.status !== 'attested' && d.status !== 'ready'
}
export function batch(items: DocItem[]) {
  return items.filter(
    (d) =>
      needsStamp(d) ||
      (['char-cert-1', 'char-cert-2'].includes(d.id) &&
        ['not_started', 'in_progress'].includes(d.status)),
  )
}
export function dhakaDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
export function overdue(d: DocItem, today = dhakaDay()) {
  return !!d.dueDate && d.dueDate < today && d.status !== 'ready'
}
export function daysLeft(now = new Date()) {
  return Math.round(
    (Date.parse(joiningDate.slice(0, 10)) - Date.parse(dhakaDay(now))) /
      86400000,
  )
}
export function dateLabel(iso: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(iso + 'T00:00:00Z'))
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const timestamp = (v: unknown) =>
  typeof v === 'string' && Number.isFinite(Date.parse(v))
function validDate(v: unknown) {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    timestamp(v) &&
    new Date(v).toISOString().slice(0, 10) === v
  )
}
function validItem(value: unknown) {
  if (!object(value)) return false
  const d = value
  return (
    typeof d.id === 'string' &&
    !!d.id.trim() &&
    typeof d.title === 'string' &&
    !!d.title.trim() &&
    categories.includes(d.category as Category) &&
    typeof d.requirements === 'string' &&
    typeof d.needsAttestation === 'boolean' &&
    pipeline(d.needsAttestation).includes(d.status as Status) &&
    typeof d.blocked === 'boolean' &&
    Number.isFinite(d.order) &&
    timestamp(d.updatedAt) &&
    (d.isCustom === undefined || typeof d.isCustom === 'boolean') &&
    ['clause', 'quantity', 'blockedReason', 'notes', 'whereWho'].every(
      (k) => d[k] === undefined || typeof d[k] === 'string',
    ) &&
    (!('dueDate' in d) || d.dueDate === '' || validDate(d.dueDate)) &&
    (d.subItems === undefined ||
      (Array.isArray(d.subItems) &&
        d.subItems.every(
          (s) =>
            object(s) &&
            typeof s.id === 'string' &&
            !!s.id &&
            typeof s.label === 'string' &&
            typeof s.done === 'boolean',
        ) &&
        new Set(d.subItems.map((s) => s.id)).size === d.subItems.length))
  )
}
export function parseBackup(raw: string): AppState {
  const data: unknown = JSON.parse(raw)
  const items = object(data) ? data.items : null
  if (
    !object(data) ||
    data.version !== 1 ||
    data.joiningDate !== joiningDate ||
    !Array.isArray(items) ||
    !items.every(validItem) ||
    new Set(items.map((d) => d.id)).size !== items.length ||
    !documents.every((seed) =>
      items.some((d: DocItem) => d.id === seed.id && !d.isCustom),
    ) ||
    !items.every(
      (d) => documents.some((s) => s.id === d.id) || d.isCustom === true,
    ) ||
    !['savedAt', 'createdAt', 'lastExportedAt'].every(
      (k) => data[k] === undefined || timestamp(data[k]),
    )
  )
    throw new Error(
      'This file is not a valid version 1 tracker backup. Your tracker has been kept as it was.',
    )
  return data as unknown as AppState
}

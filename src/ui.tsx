import { useEffect, useRef, type ReactNode } from 'react'
import {
  Banknote,
  Stethoscope,
  ContactRound,
  Award,
  Scale,
  GraduationCap,
  BriefcaseBusiness,
  FileText,
  Check,
  ChevronRight,
  Flag,
  CalendarDays,
  ListChecks,
  X,
} from 'lucide-react'
import {
  categories,
  dateLabel,
  labels,
  overdue,
  progress,
  type DocItem,
  type Category,
  type Status,
} from './model'
export const icons = {
  'Bank forms': FileText,
  Medical: Stethoscope,
  Identity: ContactRound,
  Certificates: Award,
  Legal: Scale,
  Academic: GraduationCap,
  Employment: BriefcaseBusiness,
}
export const categoryClass = (c: Category) => 'cat-' + categories.indexOf(c)
export function CategoryIcon({ category }: { category: Category }) {
  const Icon = icons[category] || Banknote
  return (
    <span className={'category-icon ' + categoryClass(category)}>
      <Icon size={19} />
    </span>
  )
}
export function Badge({ status }: { status: Status }) {
  return (
    <span className={'badge ' + status}>
      <i />
      {labels[status]}
    </span>
  )
}
export function Bar({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="progress"
    >
      <span style={{ width: value + '%' }} />
    </div>
  )
}
export function DocRow({ doc, onOpen }: { doc: DocItem; onOpen: () => void }) {
  return (
    <button className="doc-row" onClick={onOpen}>
      <span
        className={'doc-symbol ' + (doc.status === 'ready' ? 'complete' : '')}
      >
        {doc.status === 'ready' ? <Check size={16} /> : <FileText size={16} />}
      </span>
      <span className="doc-info">
        <strong>{doc.title}</strong>
        <span className="doc-meta">
          {doc.clause
            ? doc.clause === 'Closing para'
              ? 'Closing paragraph'
              : 'Clause ' + doc.clause
            : 'Custom document'}
          {doc.subItems && (
            <span>
              <ListChecks size={13} />
              {doc.subItems.filter((s) => s.done).length}/{doc.subItems.length}
            </span>
          )}
          {doc.blocked && (
            <span className="danger">
              <Flag size={12} />
              Blocked
            </span>
          )}
          {doc.dueDate && (
            <span className={overdue(doc) ? 'danger' : ''}>
              <CalendarDays size={12} />
              {dateLabel(doc.dueDate)}
            </span>
          )}
        </span>
      </span>
      <span className="row-percent">{Math.round(100 * progress(doc))}%</span>
      <Badge status={doc.status} />
      <ChevronRight size={16} className="row-go" />
    </button>
  )
}
export function Dialog({
  title,
  onClose,
  children,
  drawer = false,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  drawer?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const el = ref.current!
    const previous = document.activeElement as HTMLElement | null
    el.showModal()
    const old = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      el.close()
      document.body.style.overflow = old
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={drawer ? 'drawer' : 'dialog'}
      onCancel={(e) => {
        e.preventDefault()
        close.current()
      }}
      onClick={(e) => {
        if (e.target === ref.current) {
          const bounds = ref.current.getBoundingClientRect()
          if (
            e.clientX < bounds.left ||
            e.clientX > bounds.right ||
            e.clientY < bounds.top ||
            e.clientY > bounds.bottom
          )
            close.current()
        }
      }}
      aria-label={title}
    >
      <div className="dialog-top">
        <h2>{title}</h2>
        <button aria-label="Close" className="icon-button" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}

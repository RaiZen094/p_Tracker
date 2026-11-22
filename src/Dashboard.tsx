import { useEffect, useRef, useState } from 'react'
import {
  CalendarDays,
  Clock3,
  MapPin,
  FileCheck2,
  Stamp,
  CircleAlert,
  Flag,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Plus,
  Landmark,
  Files,
  Printer,
  Check,
  Layers3,
  RotateCcw,
} from 'lucide-react'
import { BankDrawing } from './BankDrawing'
import { Badge, Bar, CategoryIcon, DocRow } from './ui'
import {
  categories,
  statuses,
  labels,
  daysLeft,
  needsStamp,
  overall,
  overdue,
  trackerGroups,
  type BankReceipt,
  type DocItem,
  type Category,
  type Status,
} from './model'

type FlagFilter = '' | 'attestation' | 'blocked' | 'overdue'
export function Dashboard({
  items: allItems,
  onEdit,
  onAdd,
  onBankReceipt,
  print,
  now,
}: {
  items: DocItem[]
  onEdit: (d: DocItem) => void
  onAdd: (bankProvided: boolean) => void
  onBankReceipt: (id: string, receipt: BankReceipt) => void
  print: () => void
  now: Date
}) {
  const [view, setView] = useState<'personal' | 'bank'>('personal')
  const {
    personal: items,
    bank,
    received,
    bankPercent,
  } = trackerGroups(allItems)
  const [search, setSearch] = useState(''),
    [category, setCategory] = useState<Category | ''>(''),
    [status, setStatus] = useState<Status | ''>('')
  const [flag, setFlag] = useState<FlagFilter>(''),
    [sort, setSort] = useState('default'),
    [filters, setFilters] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const section = useRef<HTMLElement>(null)
  const ready = items.filter((d) => d.status === 'ready').length,
    pct = overall(items),
    days = daysLeft(now)
  const counts = Object.fromEntries(
    statuses.map((s) => [s, items.filter((d) => d.status === s).length]),
  )
  const active = !!(search || category || status || flag || sort !== 'default')
  const shown = items
    .filter(
      (d) =>
        (!category || d.category === category) &&
        (!status || d.status === status) &&
        (!flag ||
          (flag === 'blocked'
            ? d.blocked
            : flag === 'overdue'
              ? overdue(d)
              : needsStamp(d))) &&
        (
          d.title +
          ' ' +
          d.category +
          ' ' +
          (d.clause || '') +
          ' ' +
          (d.whereWho || '') +
          ' ' +
          (d.notes || '')
        )
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        (sort === 'due'
          ? (a.dueDate || '9999').localeCompare(b.dueDate || '9999')
          : sort === 'status'
            ? statuses.indexOf(a.status) - statuses.indexOf(b.status)
            : 0) || a.order - b.order,
    )
  const groups =
    sort === 'default'
      ? categories.filter((c) => shown.some((d) => d.category === c))
      : []
  function reset() {
    setSearch('')
    setCategory('')
    setStatus('')
    setFlag('')
    setSort('default')
    setCollapsed([])
  }
  function reveal() {
    setCollapsed([])
    setFilters(true)
    requestAnimationFrame(() =>
      section.current?.scrollIntoView({ block: 'start' }),
    )
  }
  function tileFilter(f: FlagFilter) {
    reset()
    setFlag(flag === f ? '' : f)
    reveal()
  }
  function filterStatus(s: Status) {
    reset()
    setStatus(status === s ? '' : s)
    reveal()
  }
  useEffect(() => {
    setCollapsed([])
  }, [category, search, status, flag, sort])
  const metrics = [
    {
      name: 'Needs attestation',
      value: items.filter(needsStamp).length,
      desc: 'Pending signatures',
      Icon: Stamp,
      tone: 'ochre',
      filter: 'attestation' as const,
    },
    {
      name: 'Blocked',
      value: items.filter((d) => d.blocked).length,
      desc: 'Waiting on a dependency',
      Icon: Flag,
      tone: 'rose',
      filter: 'blocked' as const,
    },
    {
      name: 'Overdue',
      value: items.filter((d) => overdue(d)).length,
      desc: 'Past their due date',
      Icon: Clock3,
      tone: 'clay',
      filter: 'overdue' as const,
    },
  ]
  return (
    <>
      <div className="page-heading">
        <h1>Joining dashboard</h1>
        <button className="button desktop-print" onClick={print}>
          <Printer size={16} />
          Print checklist
        </button>
      </div>
      <section className="appointment" aria-label="Joining appointment">
        <div className="appointment-copy">
          <div className="hero-label">
            <span className="hero-line" />
            Joining appointment
          </div>
          <h2>Pubali Bank PLC</h2>
          <p>Probationary Senior Officer – Computer</p>
          <div className="appointment-meta">
            <span>
              <CalendarDays />1 Dec 2026
            </span>
            <span>
              <Clock3 />
              10:00 AM
            </span>
            <span>
              <MapPin />
              HRD Head Office, Dhaka
            </span>
          </div>
        </div>
        <BankDrawing />
        <div
          className={
            'countdown ' + (days <= 2 ? 'urgent' : days <= 5 ? 'soon' : '')
          }
        >
          <div className="ticket-date">
            <CalendarDays size={15} /> 01 DEC
          </div>
          <strong>
            {days > 0
              ? String(days).padStart(2, '0')
              : days === 0
                ? 'Today'
                : 'Passed'}
          </strong>
          <span>
            {days > 0
              ? 'days to joining'
              : days === 0
                ? 'Joining day'
                : 'Joining date'}
          </span>
        </div>
      </section>
      <div
        className="tracker-switch"
        role="group"
        aria-label="Choose progress tracker"
      >
        <button
          className="metric tracker-choice"
          aria-pressed={view === 'personal'}
          onClick={() => setView('personal')}
        >
          <div className="metric-top">
            <span className="metric-icon mint">
              <FileCheck2 />
            </span>
            <h2>My documents</h2>
          </div>
          <strong>
            {pct}
            <small>%</small>
          </strong>
          <div className="metric-foot">
            <Bar value={pct} label="My preparation progress" />
            <span>
              {ready} of {items.length} ready
            </span>
          </div>
        </button>
        <button
          className="metric tracker-choice"
          aria-pressed={view === 'bank'}
          onClick={() => setView('bank')}
        >
          <div className="metric-top">
            <span className="metric-icon ochre">
              <Landmark />
            </span>
            <h2>Bank-provided forms</h2>
          </div>
          <strong>
            {bankPercent}
            <small>%</small>
          </strong>
          <div className="metric-foot">
            <Bar value={bankPercent} label="Bank forms received" />
            <span>
              {received} of {bank.length} received
            </span>
          </div>
        </button>
      </div>
      {view === 'bank' ? (
        <section className="panel bank-register">
          <div className="panel-head">
            <div className="section-title">
              <h2>Bank-provided forms</h2>
              <span className="number-pill">{bank.length}</span>
            </div>
            <button className="button primary" onClick={() => onAdd(true)}>
              <Plus size={16} />
              Add form
            </button>
          </div>
          <p className="bank-hint">
            Mark each blank form as received when the bank gives it to you. Open
            its title to track signing and preparation.
          </p>
          {!bank.length && (
            <div className="empty">
              <Landmark />
              <h3>No bank-provided forms</h3>
            </div>
          )}
          {bank.map((doc) => (
            <div className="bank-row" key={doc.id}>
              <button className="bank-document" onClick={() => onEdit(doc)}>
                <CategoryIcon category={doc.category} />
                <span>
                  <strong>{doc.title}</strong>
                  <small>
                    {doc.id === 'surety-bond'
                      ? 'Bank supplies the proforma · '
                      : ''}
                    Preparation · {labels[doc.status]}
                  </small>
                </span>
              </button>
              <label className="receipt-check">
                <input
                  type="checkbox"
                  checked={doc.bankReceipt === 'received'}
                  aria-label={'Received from bank: ' + doc.title}
                  onChange={(e) =>
                    onBankReceipt(
                      doc.id,
                      e.target.checked ? 'received' : 'awaiting',
                    )
                  }
                />
                {doc.bankReceipt === 'received' ? 'Received' : 'Awaiting form'}
              </label>
            </div>
          ))}
        </section>
      ) : (
        <>
          <div className="metrics personal-metrics">
            {metrics.map(({ name, value, desc, Icon, tone, filter: f }) => (
              <button
                key={f}
                className={
                  'metric metric-' + tone + (flag === f ? ' active-metric' : '')
                }
                onClick={() => tileFilter(f)}
              >
                <div className="metric-top">
                  <span className={'metric-icon ' + tone}>
                    <Icon />
                  </span>
                  <h2>{name}</h2>
                </div>
                <strong>{value}</strong>
                <span className="metric-caption">{desc}</span>
              </button>
            ))}
          </div>
          <div className="dashboard-columns">
            <section className="panel register" ref={section}>
              <div className="panel-head">
                <div className="section-title">
                  <h2>My document register</h2>
                  <span className="number-pill">{items.length}</span>
                </div>
                <button className="button primary" onClick={() => onAdd(false)}>
                  <Plus size={16} />
                  Add document
                </button>
              </div>
              <div className="tools">
                <label className="search">
                  <Search size={17} />
                  <input
                    placeholder="Search documents…"
                    aria-label="Search documents"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <button
                  aria-expanded={filters}
                  className={
                    'button filter-btn ' + (filters || active ? 'chosen' : '')
                  }
                  onClick={() => setFilters(!filters)}
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {(category || status || flag || sort !== 'default') && <i />}
                </button>
              </div>
              {filters && (
                <div className="filters">
                  <label>
                    Status
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Status | '')}
                    >
                      <option value="">All statuses</option>
                      {statuses.map((s) => (
                        <option value={s} key={s}>
                          {labels[s]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as Category | '')
                      }
                    >
                      <option value="">All categories</option>
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Attention
                    <select
                      value={flag}
                      onChange={(e) => setFlag(e.target.value as FlagFilter)}
                    >
                      <option value="">All documents</option>
                      <option value="attestation">Needs attestation</option>
                      <option value="blocked">Blocked</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </label>
                  <label>
                    Sort by
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                    >
                      <option value="default">Default order</option>
                      <option value="due">Due date</option>
                      <option value="status">Status</option>
                    </select>
                  </label>
                </div>
              )}
              {active && (
                <div className="filter-summary">
                  <span>
                    {shown.length} of {items.length} documents
                  </span>
                  <button onClick={reset} className="text-btn">
                    <RotateCcw size={12} />
                    Clear filters
                  </button>
                </div>
              )}
              {!shown.length ? (
                <div className="empty">
                  <Files size={29} />
                  <h3>No matching documents</h3>
                  <button className="text-btn" onClick={reset}>
                    Show all documents
                  </button>
                </div>
              ) : sort !== 'default' ? (
                shown.map((d) => (
                  <DocRow doc={d} key={d.id} onOpen={() => onEdit(d)} />
                ))
              ) : (
                groups.map((c) => {
                  const docs = shown.filter((d) => d.category === c),
                    closed = collapsed.includes(c)
                  return (
                    <div key={c}>
                      <button
                        className="group-head"
                        aria-expanded={!closed}
                        onClick={() =>
                          setCollapsed(
                            closed
                              ? collapsed.filter((v) => v !== c)
                              : [...collapsed, c],
                          )
                        }
                      >
                        <CategoryIcon category={c} />
                        <strong>{c}</strong>
                        <span>
                          {docs.length}{' '}
                          {docs.length === 1 ? 'document' : 'documents'}
                        </span>
                        <ChevronDown
                          size={15}
                          className={closed ? 'folded' : ''}
                        />
                      </button>
                      {!closed &&
                        docs.map((d) => (
                          <DocRow doc={d} key={d.id} onOpen={() => onEdit(d)} />
                        ))}
                    </div>
                  )
                })
              )}
            </section>
            <aside className="rail">
              <section className="panel rail-card">
                <div className="rail-title">
                  <span className="rail-icon">
                    <Layers3 size={18} />
                  </span>
                  <h2>Status breakdown</h2>
                </div>
                <div className="stacked">
                  {statuses
                    .filter((s) => counts[s])
                    .map((s) => (
                      <button
                        key={s}
                        className={s}
                        style={{ flex: counts[s] }}
                        aria-label={'Filter ' + labels[s] + ': ' + counts[s]}
                        onClick={() => filterStatus(s)}
                      />
                    ))}
                </div>
                <div className="legend">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      aria-pressed={s === status}
                      onClick={() => filterStatus(s)}
                    >
                      <Badge status={s} />
                      <span>{counts[s]}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel rail-card">
                <div className="rail-title">
                  <span className="rail-icon">
                    <Files size={18} />
                  </span>
                  <h2>Category progress</h2>
                </div>
                <div className="category-bars">
                  {categories
                    .filter((c) => items.some((d) => d.category === c))
                    .map((c) => {
                      const value = overall(
                        items.filter((d) => d.category === c),
                      )
                      return (
                        <div key={c}>
                          <button
                            onClick={() => {
                              reset()
                              setCategory(c)
                              reveal()
                            }}
                          >
                            <span>{c}</span>
                            <span>{value}%</span>
                          </button>
                          <Bar label={c + ' progress'} value={value} />
                        </div>
                      )
                    })}
                </div>
              </section>
              <section className="panel rail-card reference">
                <div className="rail-title">
                  <span className="rail-icon">
                    <Landmark size={18} />
                  </span>
                  <h2>Joining details</h2>
                </div>
                <p>
                  <b>Reporting location</b>HRD, Head Office, Level 4<br />
                  26 Dilkusha C/A, Dhaka
                </p>
                <p>
                  <CircleAlert size={15} />
                  Report on time to retain the offer. No TA/DA is payable for
                  joining.
                </p>
                <p>
                  <Check size={15} />
                  The Bank handles police verification after joining, expected
                  within two months.
                </p>
                <p>
                  <b>Probation</b>One year · Tk 50,000/month consolidated
                </p>
              </section>
            </aside>
          </div>
        </>
      )}
    </>
  )
}

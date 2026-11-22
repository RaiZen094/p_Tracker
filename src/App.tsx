import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react'
import {
  FolderCheck,
  LayoutDashboard,
  Stamp,
  Printer,
  Settings2,
  HardDrive,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Check,
  ShieldCheck,
  FileText,
  House,
  ChevronRight,
  AlertCircle,
  CheckCheck,
  CalendarDays,
} from 'lucide-react'
import { Dashboard } from './Dashboard'
import { DocumentEditor } from './DocumentEditor'
import { Dialog, DocRow } from './ui'
import {
  batch,
  dhakaDay,
  initialState,
  key,
  parseBackup,
  type BankReceipt,
  type AppState,
  type DocItem,
} from './model'

const pages = [
  { path: '/', name: 'Overview', icon: LayoutDashboard },
  { path: '/attestation', name: 'Attestation', icon: Stamp },
  { path: '/print', name: 'Print list', icon: Printer },
  { path: '/settings', name: 'Settings', icon: Settings2 },
]
function readTracker() {
  try {
    const raw = localStorage.getItem(key)
    return { data: raw ? parseBackup(raw) : initialState(), error: '' }
  } catch {
    return {
      data: initialState(),
      error:
        'Stored tracker data could not be read. Use Settings to restore a backup or reset this browser.',
    }
  }
}
function App() {
  const [initial] = useState(readTracker),
    [data, setData] = useState(initial.data),
    [storageError, setStorageError] = useState(initial.error)
  const [path, setPath] = useState(location.pathname),
    [now, setNow] = useState(() => new Date()),
    [notice, setNotice] = useState('')
  const [editing, setEditing] = useState<{
    doc: DocItem
    isNew: boolean
  } | null>(null)
  const [confirm, setConfirm] = useState<{
    title: string
    message: string
    action: () => void
    label: string
  } | null>(null)
  const input = useRef<HTMLInputElement>(null)
  const current = pages.find((p) => p.path === path)
  useEffect(() => {
    const pop = () => {
      setPath(location.pathname)
      setEditing(null)
      setConfirm(null)
    }
    const sync = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        const next = readTracker()
        setData(next.data)
        setStorageError(next.error)
      }
    }
    window.addEventListener('popstate', pop)
    window.addEventListener('storage', sync)
    const timer = window.setInterval(() => setNow(new Date()), 30000)
    return () => {
      window.removeEventListener('popstate', pop)
      window.removeEventListener('storage', sync)
      clearInterval(timer)
    }
  }, [])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 5500)
    return () => clearTimeout(t)
  }, [notice])
  useEffect(() => {
    document.title =
      (current?.name || 'Page not found') + ' · Joining Docs Tracker'
  }, [current])
  function go(url: string) {
    if (location.pathname !== url) history.pushState(null, '', url)
    setPath(url)
    window.scrollTo(0, 0)
  }
  function follow(e: MouseEvent<HTMLAnchorElement>, url: string) {
    if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return
    e.preventDefault()
    go(url)
  }
  function save(next: AppState, exact = false, recover = false) {
    if (storageError && !recover) {
      setNotice('Restore a backup or reset in Settings before editing.')
      return false
    }
    const value = exact ? next : { ...next, savedAt: new Date().toISOString() }
    try {
      localStorage.setItem(key, JSON.stringify(value))
      setData(value)
      setStorageError('')
      return true
    } catch {
      setNotice('Could not save. Check your browser storage and try again.')
      return false
    }
  }
  function add(bankProvided: boolean) {
    setEditing({
      isNew: true,
      doc: {
        id: crypto.randomUUID(),
        title: '',
        category: 'Bank forms',
        requirements: '',
        needsAttestation: false,
        status: 'not_started',
        bankReceipt: bankProvided ? 'awaiting' : null,
        blocked: false,
        isCustom: true,
        order: Math.max(0, ...data.items.map((d) => d.order)) + 1,
        updatedAt: new Date().toISOString(),
      },
    })
  }
  function edit(doc: DocItem) {
    setEditing({ doc, isNew: false })
  }
  function setBankReceipt(id: string, bankReceipt: BankReceipt) {
    save({
      ...data,
      items: data.items.map((doc) =>
        doc.id === id
          ? { ...doc, bankReceipt, updatedAt: new Date().toISOString() }
          : doc,
      ),
    })
  }
  function exportData() {
    const stamp = new Date().toISOString()
    const backup = { ...data, lastExportedAt: stamp, savedAt: stamp }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'joining-docs-' + dhakaDay() + '.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 3000)
    if (save(backup, true)) setNotice('Backup exported.')
  }
  async function importData(file: File) {
    try {
      const backup = parseBackup(await file.text())
      setConfirm({
        title: 'Restore this backup?',
        message:
          'The backup contains ' +
          backup.items.length +
          ' documents. Restoring replaces the tracker saved in this browser.',
        label: 'Restore backup',
        action: () => {
          if (save(backup, true, true)) setNotice('Backup restored.')
        },
      })
    } catch {
      setNotice(
        'Import failed. Choose a valid version 1 tracker JSON backup. Your current documents are still saved.',
      )
    }
  }
  const pending = batch(data.items)
  const [copyText, setCopyText] = useState('')
  async function copyBatch() {
    const list = pending
      .map((d) => '☐ ' + d.title + ' — ' + d.requirements)
      .join('\n')
    try {
      await navigator.clipboard.writeText(list)
      setNotice('Attestation list copied.')
    } catch {
      setCopyText(list)
    }
  }
  const backupAge = Date.parse(
    data.lastExportedAt || data.createdAt || data.items[0]?.updatedAt,
  )
  const backupDue =
    !!data.savedAt &&
    (!data.lastExportedAt || data.savedAt > data.lastExportedAt) &&
    now.getTime() - backupAge >= 3 * 86400000
  return (
    <>
      <a className="skip" href="#content">
        Skip to content
      </a>
      <header className="topbar">
        <div className="nav-inner">
          <a href="/" onClick={(e) => follow(e, '/')} className="brand">
            <span className="brand-mark">
              <FolderCheck size={23} />
            </span>
            <span>
              Joining<span className="brand-light">Docs</span>
            </span>
          </a>
          <nav aria-label="Main navigation">
            {pages.map(({ path: p, name, icon: Icon }) => (
              <a
                key={p}
                href={p}
                aria-current={p === path ? 'page' : undefined}
                onClick={(e) => follow(e, p)}
              >
                <Icon size={16} />
                {name}
              </a>
            ))}
          </nav>
          <span className="local-label">
            <i />
            Local workspace
          </span>
        </div>
      </header>
      <main id="content" className="shell">
        <div className="utility-row">
          <div className="crumb">
            <House size={14} />
            <span>Workspace</span>
            <ChevronRight size={12} />
            <b>{current?.name || 'Page not found'}</b>
          </div>
          <span className="today">
            <CalendarDays size={14} />
            {new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Dhaka',
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(now)}
          </span>
        </div>
        {storageError && (
          <div className="banner" role="alert">
            {storageError}
          </div>
        )}
        {backupDue && (
          <div className="banner">
            <span>Your tracker has recent changes. Save a fresh backup.</span>
            <button className="text-btn" onClick={exportData}>
              Export JSON
            </button>
          </div>
        )}
        {path === '/' ? (
          <Dashboard
            items={data.items}
            onEdit={edit}
            onAdd={add}
            onBankReceipt={setBankReceipt}
            print={() => go('/print')}
            now={now}
          />
        ) : path === '/attestation' ? (
          <>
            <div className="page-heading">
              <h1>Attestation batch</h1>
              <button
                disabled={!pending.length}
                className="button primary"
                onClick={copyBatch}
              >
                <Copy size={16} />
                Copy list
              </button>
            </div>
            <div className="info-banner">
              <Stamp size={23} />
              <div>
                <b>Plan your signature trip</b>
                <p>
                  Bring the items below for attestation or signature. The two
                  character certificates require different eligible signers.
                  Neither signer may be a relative.
                </p>
              </div>
            </div>
            <section className="panel subpanel">
              <div className="panel-head">
                <div className="section-title">
                  <h2>Pending signatures</h2>
                  <span className="number-pill">{pending.length}</span>
                </div>
              </div>
              {pending.length ? (
                pending.map((d) => (
                  <DocRow key={d.id} doc={d} onOpen={() => edit(d)} />
                ))
              ) : (
                <div className="empty">
                  <CheckCheck />
                  <h3>All signatures collected</h3>
                </div>
              )}
            </section>
          </>
        ) : path === '/print' ? (
          <>
            <div className="page-heading print-controls">
              <h1>Print checklist</h1>
              <button className="button primary" onClick={() => window.print()}>
                <Printer size={16} />
                Print
              </button>
            </div>
            <article className="paper">
              <div className="paper-heading">
                <FolderCheck size={26} />
                <span>Pubali Bank PLC</span>
              </div>
              <h2>Joining day checklist</h2>
              <p>
                1 December 2026 · 10:00 AM · HRD Head Office, Level 4, 26
                Dilkusha C/A, Dhaka
              </p>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Ready</th>
                    <th scope="col">Document</th>
                    <th scope="col">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.items]
                    .sort((a, b) => a.order - b.order)
                    .map((d) => (
                      <tr key={d.id}>
                        <td>
                          <span
                            className="print-box"
                            aria-label={
                              d.status === 'ready' ? 'Ready' : 'Pending'
                            }
                          >
                            {d.status === 'ready' && <Check size={13} />}
                          </span>
                        </td>
                        <td>{d.title}</td>
                        <td>{d.quantity || '1'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <p className="paper-total">
                {data.items.filter((d) => d.status === 'ready').length} of{' '}
                {data.items.length} documents ready
              </p>
            </article>
          </>
        ) : path === '/settings' ? (
          <>
            <div className="page-heading">
              <h1>Workspace settings</h1>
            </div>
            <div className="info-banner">
              <ShieldCheck size={25} />
              <div>
                <b>Private to this browser</b>
                <p>
                  Your tracker is saved on this device. To continue on another
                  device or browser, export a JSON backup and import it there.
                </p>
              </div>
            </div>
            <section className="panel settings-panel">
              <h2>Tracker data</h2>
              <Setting
                icon={<Download />}
                title="Export backup"
                detail="Download your documents, checklists and progress as JSON."
              >
                <button
                  className="button"
                  disabled={!!storageError}
                  onClick={exportData}
                >
                  Export JSON
                </button>
              </Setting>
              <Setting
                icon={<Upload />}
                title="Import backup"
                detail="Restore a previously exported tracker file."
              >
                <button
                  className="button"
                  onClick={() => input.current?.click()}
                >
                  Import JSON
                </button>
              </Setting>
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                ref={input}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) void importData(f)
                  e.target.value = ''
                }}
              />
              <Setting
                icon={<RotateCcw />}
                title="Reset tracker"
                detail="Restore the original 15 documents and clear your changes."
              >
                <button
                  className="button danger"
                  onClick={() =>
                    setConfirm({
                      title: 'Reset this tracker?',
                      message:
                        'This clears your progress, notes and custom documents from this browser. Export a backup first if you need a copy.',
                      label: 'Reset tracker',
                      action: () => {
                        if (save(initialState(), false, true))
                          setNotice('Tracker reset.')
                      },
                    })
                  }
                >
                  Reset tracker
                </button>
              </Setting>
              <div className="saved">
                <HardDrive size={14} />{' '}
                {data.savedAt
                  ? 'Last saved ' +
                    new Date(data.savedAt).toLocaleString('en-GB', {
                      timeZone: 'Asia/Dhaka',
                    }) +
                    ' (Dhaka)'
                  : 'No changes saved yet'}
              </div>
            </section>
          </>
        ) : (
          <div className="empty">
            <FileText />
            <h1>Page not found</h1>
            <button className="button" onClick={() => go('/')}>
              Return to overview
            </button>
          </div>
        )}
      </main>
      <footer>
        <FolderCheck size={15} />
        Joining Docs Tracker<span>Browser-local storage</span>
      </footer>
      {editing && (
        <DocumentEditor
          key={editing.doc.id}
          doc={editing.doc}
          isNew={editing.isNew}
          onClose={() => setEditing(null)}
          onSave={(d) => {
            if (
              save({
                ...data,
                items: editing.isNew
                  ? [...data.items, d]
                  : data.items.map((i) => (i.id === d.id ? d : i)),
              })
            ) {
              setEditing(null)
              setNotice('Document saved.')
            }
          }}
          onDelete={() => {
            if (
              save({
                ...data,
                items: data.items.filter((d) => d.id !== editing.doc.id),
              })
            ) {
              setEditing(null)
              setNotice('Document deleted.')
            }
          }}
        />
      )}
      {confirm && (
        <Dialog title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="dialog-message">{confirm.message}</p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setConfirm(null)}>
              Cancel
            </button>
            <button
              className="button primary"
              onClick={() => {
                confirm.action()
                setConfirm(null)
              }}
            >
              {confirm.label}
            </button>
          </div>
        </Dialog>
      )}
      {copyText && (
        <Dialog title="Copy attestation list" onClose={() => setCopyText('')}>
          <label className="dialog-message">
            Select and copy this list
            <textarea
              readOnly
              rows={8}
              value={copyText}
              onFocus={(e) => e.target.select()}
            />
          </label>
        </Dialog>
      )}
      {notice && (
        <div className="toast" role="status">
          <AlertCircle size={16} />
          {notice}
        </div>
      )}
    </>
  )
}
function Setting({
  icon,
  title,
  detail,
  children,
}: {
  icon: ReactNode
  title: string
  detail: string
  children: ReactNode
}) {
  return (
    <div className="setting">
      <span className="metric-icon mint">{icon}</span>
      <div>
        <b>{title}</b>
        <p>{detail}</p>
      </div>
      {children}
    </div>
  )
}
export default App

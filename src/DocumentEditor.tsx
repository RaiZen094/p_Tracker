import { useState } from 'react'
import { Check, Plus, Trash2, Landmark } from 'lucide-react'
import { Dialog, CategoryIcon } from './ui'
import {
  labels,
  categories,
  pipeline,
  type DocItem,
  type Category,
} from './model'
export function DocumentEditor({
  doc,
  isNew,
  onSave,
  onClose,
  onDelete,
}: {
  doc: DocItem
  isNew: boolean
  onSave: (d: DocItem) => void
  onClose: () => void
  onDelete: () => void
}) {
  const [draft, setDraft] = useState<DocItem>(() => structuredClone(doc))
  const [editing, setEditing] = useState(isNew)
  const [sub, setSub] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  function patch<K extends keyof DocItem>(key: K, value: DocItem[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }
  const editSub = draft.id.startsWith('academic-')
  function addSub() {
    if (!sub.trim()) return
    patch('subItems', [
      ...(draft.subItems || []),
      { id: crypto.randomUUID(), label: sub.trim(), done: false },
    ])
    setSub('')
  }
  return (
    <Dialog
      title={isNew ? 'Add document' : 'Document details'}
      onClose={onClose}
      drawer
    >
      <form
        className="editor"
        onSubmit={(e) => {
          e.preventDefault()
          if (
            !draft.title.trim() ||
            draft.subItems?.some((s) => !s.label.trim())
          )
            return
          onSave({
            ...draft,
            title: draft.title.trim(),
            updatedAt: new Date().toISOString(),
          })
        }}
      >
        <div className="drawer-scroll">
          <div className="detail-heading">
            <CategoryIcon category={draft.category} />
            <span>
              {draft.category} ·{' '}
              {draft.clause
                ? draft.clause === 'Closing para'
                  ? 'Closing paragraph'
                  : 'Clause ' + draft.clause
                : 'Custom document'}
            </span>
          </div>
          {editing ? (
            <>
              <label>
                Document title
                <input
                  required
                  maxLength={250}
                  value={draft.title}
                  onChange={(e) => patch('title', e.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  value={draft.category}
                  onChange={(e) =>
                    patch('category', e.target.value as Category)
                  }
                >
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.bankReceipt !== null}
                  onChange={(e) =>
                    patch('bankReceipt', e.target.checked ? 'awaiting' : null)
                  }
                />
                Form provided by the bank
              </label>
              <label className="check">
                <input
                  type="checkbox"
                  checked={draft.needsAttestation}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      needsAttestation: e.target.checked,
                      status:
                        !e.target.checked && draft.status === 'attested'
                          ? 'prepared'
                          : draft.status,
                    })
                  }
                />
                Requires attestation
              </label>
              {isNew && (
                <label>
                  Requirements
                  <textarea
                    value={draft.requirements}
                    onChange={(e) => patch('requirements', e.target.value)}
                  />
                </label>
              )}
            </>
          ) : (
            <>
              <h3>{draft.title}</h3>
              <button
                type="button"
                className="text-btn"
                onClick={() => setEditing(true)}
              >
                Edit document details
              </button>
            </>
          )}
          {doc.requirements && (
            <div className="requirement">
              <Landmark size={17} />
              <div>
                <b>Requirement</b>
                <p>{doc.requirements}</p>
              </div>
            </div>
          )}
          {draft.bankReceipt !== null && (
            <label>
              Bank form receipt
              <select
                value={draft.bankReceipt}
                onChange={(e) =>
                  patch(
                    'bankReceipt',
                    e.target.value === 'received' ? 'received' : 'awaiting',
                  )
                }
              >
                <option value="awaiting">Awaiting form</option>
                <option value="received">Received</option>
              </select>
            </label>
          )}
          <fieldset>
            <legend>Preparation status</legend>
            <div className="stepper">
              {pipeline(draft.needsAttestation).map((s, i) => {
                const active = s === draft.status
                return (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={active}
                    className={active ? 'selected' : ''}
                    onClick={() => patch('status', s)}
                  >
                    <span>
                      {i <
                      pipeline(draft.needsAttestation).indexOf(draft.status) ? (
                        <Check size={12} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    {labels[s]}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <label className="check">
            <input
              type="checkbox"
              checked={draft.blocked}
              onChange={(e) => patch('blocked', e.target.checked)}
            />
            Mark as blocked
          </label>
          {draft.blocked && (
            <label>
              Blocked reason
              <input
                value={draft.blockedReason || ''}
                onChange={(e) => patch('blockedReason', e.target.value)}
              />
            </label>
          )}
          <div className="field-pair">
            <label>
              Due date
              <input
                type="date"
                value={draft.dueDate || ''}
                onChange={(e) => patch('dueDate', e.target.value)}
              />
            </label>
            <label>
              Where / who
              <input
                value={draft.whereWho || ''}
                onChange={(e) => patch('whereWho', e.target.value)}
              />
            </label>
          </div>
          {draft.subItems && (
            <fieldset>
              <legend>
                Checklist{' '}
                <small>
                  {draft.subItems.filter((s) => s.done).length}/
                  {draft.subItems.length}
                </small>
              </legend>
              {draft.subItems.map((s) => (
                <div className="checkline" key={s.id}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={s.done}
                      aria-label={'Mark ' + s.label + ' complete'}
                      onChange={(e) =>
                        patch(
                          'subItems',
                          draft.subItems!.map((t) =>
                            t.id === s.id
                              ? { ...t, done: e.target.checked }
                              : t,
                          ),
                        )
                      }
                    />
                    {!editSub && s.label}
                  </label>
                  {editSub && (
                    <>
                      <input
                        aria-label="Checklist item name"
                        value={s.label}
                        required
                        onChange={(e) =>
                          patch(
                            'subItems',
                            draft.subItems!.map((t) =>
                              t.id === s.id
                                ? { ...t, label: e.target.value }
                                : t,
                            ),
                          )
                        }
                      />
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={'Remove ' + s.label}
                        onClick={() =>
                          patch(
                            'subItems',
                            draft.subItems!.filter((t) => t.id !== s.id),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ))}
              {editSub && (
                <div className="checkline">
                  <input
                    placeholder="New checklist item"
                    aria-label="New checklist item"
                    value={sub}
                    onChange={(e) => setSub(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addSub()
                      }
                    }}
                  />
                  <button type="button" className="button" onClick={addSub}>
                    <Plus size={14} />
                    Add
                  </button>
                </div>
              )}
            </fieldset>
          )}
          <label>
            Notes
            <textarea
              placeholder="Collection details or reminders. Omit sensitive ID numbers."
              value={draft.notes || ''}
              onChange={(e) => patch('notes', e.target.value)}
            />
          </label>
          {doc.isCustom &&
            !isNew &&
            (confirmDelete ? (
              <div className="delete-confirm">
                Delete this document?{' '}
                <button
                  type="button"
                  className="text-btn danger"
                  onClick={onDelete}
                >
                  Yes, delete
                </button>{' '}
                <button
                  type="button"
                  className="text-btn"
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="text-btn danger"
                onClick={() => setConfirmDelete(true)}
              >
                Delete document
              </button>
            ))}
        </div>
        <div className="dialog-actions">
          <button className="button" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="button primary" type="submit">
            {isNew ? 'Add document' : 'Save changes'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}

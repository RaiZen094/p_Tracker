import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initialState,
  pipeline,
  overall,
  trackerGroups,
  progress,
  batch,
  parseBackup,
  daysLeft,
  overdue,
} from '../src/model.ts'
test('seed list, checklists and eligibility match the letter plan', () => {
  const { items } = initialState()
  assert.equal(items.length, 15)
  assert.equal(batch(items).length, 5)
  assert.equal(items.filter((d) => d.needsAttestation).length, 3)
  assert.equal(items.find((d) => d.id === 'medical').subItems.length, 12)
  assert.equal(pipeline(false).includes('attested'), false)
})
test('personal readiness and bank receipt have independent denominators', () => {
  const { items } = initialState()
  const { personal, bank } = trackerGroups(items)
  assert.equal(personal.length, 11)
  assert.equal(bank.length, 4)
  personal.forEach((doc) => (doc.status = 'ready'))
  assert.equal(overall(personal), 100)
  assert.equal(trackerGroups(items).bankPercent, 0)
  bank[0].bankReceipt = 'received'
  assert.equal(trackerGroups(items).bankPercent, 25)
  assert.equal(bank[0].status, 'not_started')
  bank[0].bankReceipt = null
  assert.equal(trackerGroups(items).personal.length, 12)
  assert.equal(trackerGroups(items).received, 0)
  for (const doc of items) doc.bankReceipt = null
  assert.equal(trackerGroups(items).bankPercent, 0)
})
test('old backups keep preparation and gain receipt defaults only for known bank forms', () => {
  const old = initialState()
  const service = old.items.find((d) => d.id === 'service-sheet')
  Object.assign(service, { status: 'prepared', notes: 'Signed copy in folder' })
  old.items.push({ ...service, id: 'custom-form', isCustom: true })
  old.items.forEach((d) => delete d.bankReceipt)
  const migrated = parseBackup(JSON.stringify(old))
  const restored = migrated.items.find((d) => d.id === service.id)
  assert.deepEqual(restored, { ...service, bankReceipt: 'received' })
  assert.equal(migrated.items.at(-1).bankReceipt, null)
  assert.equal(trackerGroups(migrated.items).received, 1)
  restored.bankReceipt = null
  assert.deepEqual(parseBackup(JSON.stringify(migrated)), migrated)
  restored.bankReceipt = 'invalid'
  assert.throws(() => parseBackup(JSON.stringify(migrated)))
})
test('older surety bonds move to personal printing while retaining saved preparation', () => {
  const state = initialState()
  const original = state.items.find(d => d.id === 'surety-bond')
  assert.equal(original.bankReceipt, null)
  assert.equal(original.quantity, '3 sheets × Tk 100')
  assert.match(original.requirements, /one page per sheet \(Tk 300 total\)/)
  for (const receipt of [undefined, 'awaiting', 'received', null]) {
    const old = structuredClone(state)
    const bond = old.items.find(d => d.id === original.id)
    Object.assign(bond, {
      title: receipt === null ? 'My renamed bond' : 'Surety bond on Tk 300 stamp paper',
      requirements: 'Use the prescribed proforma and Tk 300 non-judicial stamp paper. The bond covers at least five years of service from joining.',
      quantity: '1', bankReceipt: receipt, status: 'in_progress', notes: 'Print on Monday',
    })
    const updated = parseBackup(JSON.stringify(old))
    const migrated = updated.items.find(d => d.id === bond.id)
    assert.deepEqual(migrated, {
      ...original, title: receipt === null ? bond.title : original.title,
      notes: bond.notes, status: bond.status,
    })
    migrated.bankReceipt = 'received'
    assert.deepEqual(parseBackup(JSON.stringify(updated)), updated)
  }
})
test('applicable steps and mean progress', () => {
  const [a] = initialState().items
  assert.equal(progress({ ...a, status: 'prepared' }), 2 / 3)
  assert.equal(
    progress({ ...a, needsAttestation: true, status: 'attested' }),
    0.75,
  )
  assert.equal(overall([a, { ...a, status: 'ready' }]), 50)
})
test('round trips checklists and notes and rejects broken backups', () => {
  const state = initialState()
  state.items[1].subItems[2].done = true
  state.items[3].notes = 'Pick up on Monday'
  assert.deepEqual(parseBackup(JSON.stringify(state)), state)
  assert.throws(() => parseBackup('{}'))
  for (const patch of [
    { status: 'attested' },
    { dueDate: '2026-02-31' },
    { id: 'medical' },
    { subItems: [{}] },
  ]) {
    const invalid = structuredClone(state)
    Object.assign(invalid.items[0], patch)
    assert.throws(() => parseBackup(JSON.stringify(invalid)))
  }
})
test('countdown and overdue use the Dhaka calendar', () => {
  assert.equal(daysLeft(new Date('2026-11-22T08:00:00Z')), 9)
  assert.equal(daysLeft(new Date('2026-11-30T18:01:00Z')), 0)
  assert.equal(daysLeft(new Date('2026-12-01T18:01:00Z')), -1)
  const [a] = initialState().items
  assert.equal(overdue({ ...a, dueDate: '2026-11-01' }, '2026-11-02'), true)
  assert.equal(
    overdue({ ...a, status: 'ready', dueDate: '2026-11-01' }, '2026-11-02'),
    false,
  )
})

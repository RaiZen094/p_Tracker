import test from 'node:test'
import assert from 'node:assert/strict'
import {
  initialState,
  pipeline,
  overall,
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

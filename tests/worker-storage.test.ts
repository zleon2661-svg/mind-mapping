import { expect, it } from 'vitest'
import { addRoot, emptyDocument } from '../src/model/operations'
import { loadDocument, saveDocument } from '../src/storage/localStorage'

it('recovers valid storage and safely rejects malformed storage', () => {
  const values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }
  const saved = addRoot(emptyDocument(), 'Stored root')
  expect(saveDocument(saved, storage)).toBeUndefined()
  expect(loadDocument(storage).document.nodes[0].label).toBe('Stored root')
  values.set('mindmap-panel.document.v1', '{not json')
  expect(loadDocument(storage)).toMatchObject({ document: { nodes: [] }, warning: expect.any(String) })
})

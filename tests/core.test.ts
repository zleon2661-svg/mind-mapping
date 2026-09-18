import { describe, expect, it } from 'vitest'
import { addChild, addRoot, deleteSubtree, emptyDocument, expandAncestors, renameNode, toggleCollapsed } from '../src/model/operations'
import { visibleNodeIds } from '../src/model/layout'
import { createHistory, commit, redo, undo } from '../src/state/mindMapStore'
import { parseDocument } from '../src/model/validation'

describe('mind-map domain', () => {
  it('creates a three-level tree and deletes a subtree', () => {
    const root = addRoot(emptyDocument(), 'Root')
    const child = addChild(root, root.rootIds[0], 'Child')
    const grandchild = addChild(child, child.nodes.find((node) => node.label === 'Child')!.id, 'Grandchild')
    expect(grandchild.nodes).toHaveLength(3)
    expect(deleteSubtree(grandchild, child.nodes.find((node) => node.label === 'Child')!.id).nodes).toHaveLength(1)
  })

  it('keeps bounded undo/redo snapshots', () => {
    const first = addRoot(emptyDocument())
    const second = addChild(first, first.rootIds[0])
    const history = commit(createHistory(first), second)
    expect(undo(history).present.nodes).toHaveLength(1)
    expect(redo(undo(history)).present.nodes).toHaveLength(2)
    let bounded = createHistory(emptyDocument())
    for (let index = 0; index < 55; index += 1) bounded = commit(bounded, addRoot(bounded.present, `N${index}`))
    expect(bounded.past).toHaveLength(50)
  })

  it('renames with trimmed text and ignores blank or unchanged labels', () => {
    const document = addRoot(emptyDocument(), 'Original')
    const id = document.rootIds[0]
    expect(renameNode(document, id, '   ')).toBe(document)
    expect(renameNode(document, id, 'Original')).toBe(document)
    const renamed = renameNode(document, id, '  Updated  ')
    expect(renamed).not.toBe(document)
    expect(renamed.nodes[0].label).toBe('Updated')
  })

  it('rejects duplicate IDs, cycles, orphaned nodes, invalid versions, and bad endpoints', () => {
    expect(parseDocument(JSON.stringify({ version: 1, nodes: [{ id: 'a', label: 'A', position: { x: 0, y: 0 }, collapsed: false }, { id: 'a', label: 'B', position: { x: 1, y: 1 }, collapsed: false }], edges: [], rootIds: ['a'] })).ok).toBe(false)
    expect(parseDocument(JSON.stringify({ version: 1, nodes: [{ id: 'a', label: 'A', position: { x: 0, y: 0 }, collapsed: false }, { id: 'b', label: 'B', position: { x: 1, y: 1 }, collapsed: false }], edges: [{ id: 'e1', source: 'a', target: 'b' }, { id: 'e2', source: 'b', target: 'a' }], rootIds: [] })).ok).toBe(false)
    expect(parseDocument(JSON.stringify({ version: 99, nodes: [], edges: [], rootIds: [] })).ok).toBe(false)
    expect(parseDocument(JSON.stringify({ version: 1, nodes: [{ id: 'a', label: 'A', position: { x: 0, y: 0 }, collapsed: false }], edges: [{ id: 'e', source: 'a', target: 'missing' }], rootIds: ['a'] })).ok).toBe(false)
    expect(parseDocument(JSON.stringify({ version: 1, nodes: [{ id: 'a', label: 'A', position: { x: 0, y: 0 }, collapsed: false }, { id: 'b', label: 'B', position: { x: 1, y: 1 }, collapsed: false }], edges: [], rootIds: ['a'] })).ok).toBe(false)
  })

  it('hides collapsed descendants without deleting them', () => {
    const root = addRoot(emptyDocument())
    const withChild = addChild(root, root.rootIds[0])
    const collapsed = toggleCollapsed(withChild, root.rootIds[0])
    expect(visibleNodeIds(collapsed)).toEqual(new Set([root.rootIds[0]]))
    expect(collapsed.nodes).toHaveLength(2)
  })

  it('expands a collapsed parent when adding a child so the new node is visible', () => {
    const root = addRoot(emptyDocument())
    const withChild = addChild(root, root.rootIds[0])
    const collapsed = toggleCollapsed(withChild, root.rootIds[0])
    const expandedWithNewChild = addChild(collapsed, root.rootIds[0], 'Visible new child')
    expect(expandedWithNewChild.nodes.find((node) => node.id === root.rootIds[0])!.collapsed).toBe(false)
    expect(visibleNodeIds(expandedWithNewChild)).toHaveLength(3)
  })

  it('expands the ancestor path for a hidden search match', () => {
    const root = addRoot(emptyDocument())
    const withChild = addChild(root, root.rootIds[0], 'Hidden result')
    const expanded = expandAncestors(toggleCollapsed(withChild, root.rootIds[0]), withChild.nodes.find((node) => node.label === 'Hidden result')!.id)
    expect(visibleNodeIds(expanded)).toHaveLength(2)
  })
})

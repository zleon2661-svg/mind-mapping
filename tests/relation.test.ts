import { describe, expect, it } from 'vitest'
import { addChild, addRoot, connectRelatedNodes, deleteSubtree, emptyDocument, expandAncestors, toggleCollapsed } from '../src/model/operations'
import { childrenOf, descendantIds, nextChildPosition, parentOf, visibleNodeIds } from '../src/model/layout'
import { parseDocument } from '../src/model/validation'
import { commit, createHistory, redo, undo } from '../src/state/mindMapStore'

function nokiaScenario() {
  let document = addRoot(emptyDocument(), '诺基亚')
  const nokia = document.rootIds[0]
  document = addChild(document, nokia, '直板手机')
  const barPhone = document.nodes.find((node) => node.label === '直板手机')!.id
  document = addChild(document, nokia, '翻盖手机')
  const flipPhone = document.nodes.find((node) => node.label === '翻盖手机')!.id
  document = addChild(document, flipPhone, '苹果手机')
  return { document, nokia, barPhone, flipPhone, iPhone: document.nodes.find((node) => node.label === '苹果手机')!.id }
}

describe('relation connections', () => {
  it('adds the Nokia relation without altering either tree edge, roots, or positions', () => {
    const { document, nokia, barPhone, flipPhone, iPhone } = nokiaScenario()
    const positions = document.nodes.map((node) => ({ id: node.id, position: { ...node.position } }))
    const result = connectRelatedNodes(document, barPhone, iPhone)
    expect(result.rootIds).toEqual(document.rootIds)
    expect(result.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: nokia, target: barPhone, kind: 'tree' }),
      expect.objectContaining({ source: nokia, target: flipPhone, kind: 'tree' }),
      expect.objectContaining({ source: flipPhone, target: iPhone, kind: 'tree' }),
      expect.objectContaining({ source: barPhone, target: iPhone, kind: 'relation' }),
    ]))
    expect(result.nodes.map((node) => ({ id: node.id, position: node.position }))).toEqual(positions)
  })

  it('rejects self connections and treats duplicate directed relations as a no-op', () => {
    const { document, barPhone, iPhone } = nokiaScenario()
    expect(() => connectRelatedNodes(document, barPhone, barPhone)).toThrow('A node cannot be connected to itself.')
    const related = connectRelatedNodes(document, barPhone, iPhone)
    expect(connectRelatedNodes(related, barPhone, iPhone)).toBe(related)
  })

  it('keeps relations out of hierarchy, layout visibility, collapse, search expansion, and subtree membership', () => {
    const { document, nokia, barPhone, flipPhone, iPhone } = nokiaScenario()
    const related = connectRelatedNodes(document, barPhone, iPhone)
    expect(childrenOf(related, barPhone)).toEqual([])
    expect(parentOf(related, iPhone)).toBe(flipPhone)
    expect(descendantIds(related, barPhone)).toEqual(new Set([barPhone]))
    const collapsed = toggleCollapsed(related, flipPhone)
    expect(visibleNodeIds(collapsed)).toEqual(new Set([nokia, barPhone, flipPhone]))
    expect(expandAncestors(collapsed, iPhone).nodes.find((node) => node.id === flipPhone)!.collapsed).toBe(false)
    expect(nextChildPosition(related, barPhone)).toEqual(nextChildPosition(document, barPhone))
    const baselineChild = addChild(document, barPhone, 'Unaffected layout')
    const relatedChild = addChild(related, barPhone, 'Unaffected layout')
    expect(relatedChild.nodes.find((node) => node.label === 'Unaffected layout')!.position).toEqual(baselineChild.nodes.find((node) => node.label === 'Unaffected layout')!.position)
  })

  it('cleans relations that reference a recursively deleted tree node', () => {
    const { document, barPhone, flipPhone, iPhone } = nokiaScenario()
    const related = connectRelatedNodes(document, barPhone, iPhone)
    const deleted = deleteSubtree(related, flipPhone)
    expect(deleted.nodes.some((node) => node.id === iPhone)).toBe(false)
    expect(deleted.edges.some((edge) => edge.kind === 'relation' && (edge.source === barPhone || edge.target === iPhone))).toBe(false)
  })

  it('undoes and redoes only the added relation', () => {
    const { document, barPhone, flipPhone, iPhone } = nokiaScenario()
    const related = connectRelatedNodes(document, barPhone, iPhone)
    const history = commit(createHistory(document), related)
    expect(undo(history).present.edges.some((edge) => edge.kind === 'relation')).toBe(false)
    const redone = redo(undo(history)).present
    expect(redone.edges.some((edge) => edge.source === flipPhone && edge.target === iPhone && edge.kind === 'tree')).toBe(true)
    expect(redone.edges.some((edge) => edge.source === barPhone && edge.target === iPhone && edge.kind === 'relation')).toBe(true)
  })

  it('normalizes legacy kindless tree edges and preserves relations through parse/export', () => {
    const { document, barPhone, iPhone } = nokiaScenario()
    const legacy = JSON.parse(JSON.stringify(document)) as { edges: Array<{ kind?: string }> }
    legacy.edges.forEach((edge) => delete edge.kind)
    const parsedLegacy = parseDocument(JSON.stringify(legacy))
    expect(parsedLegacy.ok).toBe(true)
    if (parsedLegacy.ok) expect(parsedLegacy.value.edges.every((edge) => edge.kind === 'tree')).toBe(true)
    const related = connectRelatedNodes(document, barPhone, iPhone)
    const parsedRelated = parseDocument(JSON.stringify(related))
    expect(parsedRelated.ok).toBe(true)
    if (parsedRelated.ok) expect(parsedRelated.value.edges.some((edge) => edge.kind === 'relation')).toBe(true)
  })
})

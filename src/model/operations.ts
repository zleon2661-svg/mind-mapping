import { childrenOf, descendantIds, nextChildPosition, nextRootPosition, parentOf } from './layout'
import { DOCUMENT_VERSION, MAX_NODES, type MindMapDocument, type MindNode, type NodeId, type Point } from './types'

export function emptyDocument(): MindMapDocument { return { version: DOCUMENT_VERSION, nodes: [], edges: [], rootIds: [] } }
export function cloneDocument(document: MindMapDocument): MindMapDocument { return structuredClone(document) }
export function createId(prefix: 'node' | 'edge'): string { const value = globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`; return `${prefix}-${value}` }
function canAdd(document: MindMapDocument): void { if (document.nodes.length >= MAX_NODES) throw new Error(`A mind map can contain at most ${MAX_NODES} nodes.`) }
function createNode(id: NodeId, label: string, position: Point): MindNode { return { id, label: label.trim() || 'New idea', position, collapsed: false } }

export function addRoot(document: MindMapDocument, label = 'Central idea'): MindMapDocument {
  canAdd(document); const copy = cloneDocument(document); const id = createId('node'); copy.nodes.push(createNode(id, label, nextRootPosition(copy))); copy.rootIds.push(id); return copy
}
export function addChild(document: MindMapDocument, parentId: NodeId, label = 'New idea'): MindMapDocument {
  if (!document.nodes.some((node) => node.id === parentId)) throw new Error('The parent node no longer exists.')
  canAdd(document); const copy = cloneDocument(document); const id = createId('node'); copy.nodes.push(createNode(id, label, nextChildPosition(copy, parentId))); copy.edges.push({ id: createId('edge'), source: parentId, target: id, kind: 'tree' }); return copy
}
export function addSibling(document: MindMapDocument, nodeId: NodeId, label = 'New idea'): MindMapDocument {
  if (!document.nodes.some((node) => node.id === nodeId)) throw new Error('The selected node no longer exists.'); const parentId = parentOf(document, nodeId); return parentId ? addChild(document, parentId, label) : addRoot(document, label)
}
export function renameNode(document: MindMapDocument, nodeId: NodeId, label: string): MindMapDocument {
  const current = document.nodes.find((candidate) => candidate.id === nodeId); if (!current) throw new Error('The selected node no longer exists.'); const normalized = label.trim(); if (!normalized || normalized === current.label) return document; const copy = cloneDocument(document); const node = copy.nodes.find((candidate) => candidate.id === nodeId)!; node.label = normalized; return copy
}
export function moveNode(document: MindMapDocument, nodeId: NodeId, position: Point): MindMapDocument {
  const copy = cloneDocument(document); const node = copy.nodes.find((candidate) => candidate.id === nodeId); if (!node) throw new Error('The selected node no longer exists.'); node.position = { x: Math.round(position.x), y: Math.round(position.y) }; return copy
}
export function toggleCollapsed(document: MindMapDocument, nodeId: NodeId): MindMapDocument {
  const copy = cloneDocument(document); const node = copy.nodes.find((candidate) => candidate.id === nodeId); if (!node) throw new Error('The selected node no longer exists.'); if (childrenOf(copy, nodeId).length > 0) node.collapsed = !node.collapsed; return copy
}
export function expandAncestors(document: MindMapDocument, nodeId: NodeId): MindMapDocument {
  const copy = cloneDocument(document)
  let ancestor = parentOf(copy, nodeId)
  let changed = false
  while (ancestor !== undefined) {
    const node = copy.nodes.find((candidate) => candidate.id === ancestor)
    if (node?.collapsed) { node.collapsed = false; changed = true }
    ancestor = parentOf(copy, ancestor)
  }
  return changed ? copy : document
}
export function deleteSubtree(document: MindMapDocument, nodeId: NodeId): MindMapDocument {
  if (!document.nodes.some((node) => node.id === nodeId)) throw new Error('The selected node no longer exists.'); const removed = descendantIds(document, nodeId)
  return { version: DOCUMENT_VERSION, nodes: document.nodes.filter((node) => !removed.has(node.id)).map((node) => ({ ...node, position: { ...node.position } })), edges: document.edges.filter((edge) => !removed.has(edge.source) && !removed.has(edge.target)).map((edge) => ({ ...edge })), rootIds: document.rootIds.filter((id) => !removed.has(id)) }
}
export function hasChildren(document: MindMapDocument, nodeId: NodeId): boolean { return childrenOf(document, nodeId).length > 0 }

export function connectRelatedNodes(document: MindMapDocument, sourceId: NodeId, targetId: NodeId): MindMapDocument {
  const sourceExists = document.nodes.some((node) => node.id === sourceId)
  const targetExists = document.nodes.some((node) => node.id === targetId)
  if (!sourceExists) throw new Error('The source node no longer exists.')
  if (!targetExists) throw new Error('The target node no longer exists.')
  if (sourceId === targetId) throw new Error('A node cannot be connected to itself.')
  if (document.edges.some((edge) => edge.kind === 'relation' && edge.source === sourceId && edge.target === targetId)) return document
  const copy = cloneDocument(document)
  copy.edges.push({ id: createId('edge'), source: sourceId, target: targetId, kind: 'relation' })
  return copy
}

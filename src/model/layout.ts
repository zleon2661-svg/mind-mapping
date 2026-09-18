import type { MindMapDocument, NodeId, Point } from './types'

const HORIZONTAL_GAP = 240
const VERTICAL_GAP = 100

export function childrenOf(document: MindMapDocument, parentId: NodeId): NodeId[] {
  return document.edges.filter((edge) => edge.kind === 'tree' && edge.source === parentId).map((edge) => edge.target)
}
export function parentOf(document: MindMapDocument, nodeId: NodeId): NodeId | undefined {
  return document.edges.find((edge) => edge.kind === 'tree' && edge.target === nodeId)?.source
}
export function descendantIds(document: MindMapDocument, rootId: NodeId): Set<NodeId> {
  const found = new Set<NodeId>(); const queue = [rootId]
  while (queue.length > 0) { const id = queue.shift(); if (id === undefined || found.has(id)) continue; found.add(id); queue.push(...childrenOf(document, id)) }
  return found
}
export function visibleNodeIds(document: MindMapDocument): Set<NodeId> {
  const visible = new Set<NodeId>()
  const visit = (id: NodeId): void => { const node = document.nodes.find((candidate) => candidate.id === id); if (!node || visible.has(id)) return; visible.add(id); if (!node.collapsed) childrenOf(document, id).forEach(visit) }
  document.rootIds.forEach(visit); return visible
}
export function nextChildPosition(document: MindMapDocument, parentId: NodeId): Point {
  const parent = document.nodes.find((node) => node.id === parentId); const childCount = childrenOf(document, parentId).length
  return { x: (parent?.position.x ?? 0) + HORIZONTAL_GAP, y: (parent?.position.y ?? 0) + childCount * VERTICAL_GAP }
}
export function nextRootPosition(document: MindMapDocument): Point {
  return document.nodes.length === 0 ? { x: 0, y: 0 } : { x: 0, y: Math.max(...document.nodes.map((node) => node.position.y)) + VERTICAL_GAP * 1.5 }
}

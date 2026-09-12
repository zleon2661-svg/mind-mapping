import { DOCUMENT_VERSION, MAX_NODES, type ImportResult, type MindEdge, type MindNode } from './types'

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isPoint(value: unknown): value is { x: number; y: number } { return isObject(value) && typeof value.x === 'number' && Number.isFinite(value.x) && typeof value.y === 'number' && Number.isFinite(value.y) }
function isNode(value: unknown): value is MindNode { return isObject(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.label === 'string' && value.label.length <= 500 && typeof value.collapsed === 'boolean' && isPoint(value.position) }
function isEdge(value: unknown): value is MindEdge { return isObject(value) && typeof value.id === 'string' && value.id.length > 0 && typeof value.source === 'string' && value.source.length > 0 && typeof value.target === 'string' && value.target.length > 0 }

export function validateDocument(value: unknown): ImportResult {
  if (!isObject(value)) return { ok: false, error: 'Imported JSON must be an object.' }
  if (value.version !== DOCUMENT_VERSION) return { ok: false, error: 'This file uses an unsupported mind-map version.' }
  if (!Array.isArray(value.nodes) || !Array.isArray(value.edges) || !Array.isArray(value.rootIds)) return { ok: false, error: 'The file must contain nodes, edges, and rootIds arrays.' }
  if (value.nodes.length > MAX_NODES) return { ok: false, error: `The file exceeds the ${MAX_NODES}-node safety limit.` }
  if (!value.nodes.every(isNode) || !value.edges.every(isEdge) || !value.rootIds.every((id) => typeof id === 'string' && id.length > 0)) return { ok: false, error: 'The file contains invalid node, edge, or root data.' }
  const nodes = value.nodes as MindNode[]; const edges = value.edges as MindEdge[]; const rootIds = value.rootIds as string[]
  const nodeIds = new Set(nodes.map((node) => node.id)); const edgeIds = new Set(edges.map((edge) => edge.id))
  if (nodeIds.size !== nodes.length || edgeIds.size !== edges.length || new Set(rootIds).size !== rootIds.length) return { ok: false, error: 'Node, edge, or root IDs must be unique.' }
  if (rootIds.some((id) => !nodeIds.has(id))) return { ok: false, error: 'A root ID does not identify a node.' }
  const parents = new Map<string, string>(); const children = new Map<string, string[]>()
  for (const edge of edges) { if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target) return { ok: false, error: 'Every edge must connect two distinct existing nodes.' }; if (parents.has(edge.target)) return { ok: false, error: 'Each node may have only one parent.' }; parents.set(edge.target, edge.source); children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]) }
  if (nodes.some((node) => parents.has(node.id) === rootIds.includes(node.id))) return { ok: false, error: 'Every node must be either a root or have one parent.' }
  const visited = new Set<string>(); const visiting = new Set<string>()
  const visit = (id: string): boolean => { if (visiting.has(id)) return false; if (visited.has(id)) return true; visiting.add(id); const valid = (children.get(id) ?? []).every(visit); visiting.delete(id); visited.add(id); return valid }
  if (!rootIds.every(visit) || visited.size !== nodes.length) return { ok: false, error: 'The file contains a cycle or orphaned node.' }
  return { ok: true, value: { version: DOCUMENT_VERSION, nodes: nodes.map((node) => ({ ...node, position: { ...node.position } })), edges: edges.map((edge) => ({ ...edge })), rootIds: [...rootIds] } }
}
export function parseDocument(text: string): ImportResult { try { return validateDocument(JSON.parse(text) as unknown) } catch { return { ok: false, error: 'The selected file is not valid JSON.' } } }

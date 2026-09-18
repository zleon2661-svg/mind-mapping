export const DOCUMENT_VERSION = 1 as const
export const MAX_NODES = 2_000

export type NodeId = string
export type EdgeId = string

export interface Point { x: number; y: number }

export interface MindNode {
  id: NodeId
  label: string
  position: Point
  collapsed: boolean
}

export type MindEdgeKind = 'tree' | 'relation'
export interface MindEdge { id: EdgeId; source: NodeId; target: NodeId; kind: MindEdgeKind }

export interface MindMapDocument {
  version: typeof DOCUMENT_VERSION
  nodes: MindNode[]
  edges: MindEdge[]
  rootIds: NodeId[]
}

export interface HistoryState { past: MindMapDocument[]; present: MindMapDocument; future: MindMapDocument[] }
export type ImportResult = { ok: true; value: MindMapDocument } | { ok: false; error: string }

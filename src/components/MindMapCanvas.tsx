import { Background, Controls, ReactFlow, type Connection, type Edge, type NodeMouseHandler, type OnConnect, type OnNodeDrag, type ReactFlowInstance } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useEffect, useMemo, useState } from 'react'
import { childrenOf, visibleNodeIds } from '../model/layout'
import type { MindMapDocument, Point } from '../model/types'
import MindNode, { type MindFlowNode } from './MindNode'

interface Props { document: MindMapDocument; selectedId?: string; editNodeId?: string; searchTerm: string; centerSignal: number; onSelect: (id?: string) => void; onMove: (id: string, position: Point) => void; onRename: (id: string, label: string) => void; onEditFinished: (id: string) => void; onToggleCollapse: (id: string) => void; onConnectNodes?: (sourceId: string, targetId: string) => void }
const nodeTypes = { mind: MindNode }

export default function MindMapCanvas({ document, selectedId, editNodeId, searchTerm, centerSignal, onSelect, onMove, onRename, onEditFinished, onToggleCollapse, onConnectNodes }: Props) {
  const [flow, setFlow] = useState<ReactFlowInstance<MindFlowNode, Edge> | null>(null)
  const visible = useMemo(() => visibleNodeIds(document), [document])
  const nodes = useMemo<MindFlowNode[]>(() => document.nodes.filter((node) => visible.has(node.id)).map((node) => ({ id: node.id, type: 'mind', position: node.position, selected: node.id === selectedId, data: { label: node.label, collapsed: node.collapsed, hasChildren: childrenOf(document, node.id).length > 0, searchHit: searchTerm.trim().length > 0 && node.label.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()), editRequested: node.id === editNodeId, onRename, onEditFinished, onToggleCollapse } })), [document, editNodeId, onEditFinished, onRename, onToggleCollapse, searchTerm, selectedId, visible])
  const edges = useMemo<Edge[]>(() => document.edges.filter((edge) => visible.has(edge.source) && visible.has(edge.target)).map((edge) => ({ ...edge, type: edge.kind === 'relation' ? 'bezier' : 'smoothstep', animated: false })), [document.edges, visible])
  useEffect(() => {
    if (!flow) return
    const selected = selectedId ? document.nodes.find((node) => node.id === selectedId) : undefined
    requestAnimationFrame(() => selected ? flow.setCenter(selected.position.x + 70, selected.position.y + 25, { zoom: 1.2, duration: 250 }) : flow.fitView({ padding: 0.25, duration: 250 }))
  }, [centerSignal, document.nodes, flow, selectedId])
  const onNodeClick: NodeMouseHandler = (_, node) => onSelect(node.id)
  const onDragStop: OnNodeDrag = (_, node) => onMove(node.id, node.position)
  const onConnect: OnConnect = (connection: Connection) => {
    if (connection.source && connection.target && onConnectNodes) {
      onConnectNodes(connection.source, connection.target)
    }
  }
  return <div className="canvas" aria-label="Mind map canvas"><ReactFlow<MindFlowNode, Edge> nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={setFlow} onNodeClick={onNodeClick} onNodeDragStop={onDragStop} onConnect={onConnect} onPaneClick={() => onSelect(undefined)} fitView><Background gap={18} /><Controls showInteractive={false} /></ReactFlow></div>
}

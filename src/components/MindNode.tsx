import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react'

export interface MindNodeData extends Record<string, unknown> {
  label: string
  collapsed: boolean
  hasChildren: boolean
  searchHit: boolean
  editRequested: boolean
  onRename: (id: string, label: string) => void
  onEditFinished: (id: string) => void
  onToggleCollapse: (id: string) => void
}
export type MindFlowNode = Node<MindNodeData, 'mind'>

export default function MindNode({ id, data, selected }: NodeProps<MindFlowNode>) {
  const { editRequested, label, onEditFinished } = data
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)
  const settledRef = useRef(false)
  const editRequestHandledRef = useRef(false)

  useEffect(() => {
    if (!editing) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [editing])

  useEffect(() => {
    if (!editRequested) {
      editRequestHandledRef.current = false
      return
    }
    if (editing || editRequestHandledRef.current) return
    editRequestHandledRef.current = true
    settledRef.current = false
    setDraft(label)
    setEditing(true)
  }, [editRequested, editing, label])

  const beginEditing = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    settledRef.current = false
    setDraft(data.label)
    setEditing(true)
  }

  const commitEdit = useCallback(() => {
    if (!editing || settledRef.current) return
    settledRef.current = true
    setEditing(false)
    onEditFinished(id)
    const label = draft.trim()
    if (label && label !== data.label) data.onRename(id, label)
  }, [data, draft, editing, id, onEditFinished])

  const cancelEdit = useCallback(() => {
    if (!editing || settledRef.current) return
    settledRef.current = true
    setDraft(data.label)
    setEditing(false)
    onEditFinished(id)
  }, [data.label, editing, id, onEditFinished])

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation()
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEdit()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      cancelEdit()
    }
  }

  const stopPointer = (event: PointerEvent<HTMLInputElement>) => event.stopPropagation()
  const stopMouse = (event: MouseEvent<HTMLInputElement>) => event.stopPropagation()

  return (
    <div
      className={`mind-node ${selected ? 'selected' : ''} ${data.searchHit ? 'search-hit' : ''}`}
    >
      <Handle type="target" position={Position.Left} />
      {editing ? (
        <input
          ref={inputRef}
          className="node-label-input nodrag nopan nowheel"
          aria-label={`Edit ${data.label}`}
          value={draft}
          maxLength={500}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitEdit}
          onKeyDown={handleKeyDown}
          onPointerDown={stopPointer}
          onClick={stopMouse}
          onDoubleClick={stopMouse}
        />
      ) : (
        <button
          className="node-label"
          aria-label={`Edit ${data.label}`}
          onDoubleClick={beginEditing}
        >
          {data.label}
        </button>
      )}
      {data.hasChildren && (
        <button
          className="collapse-button"
          aria-label={data.collapsed ? 'Expand node' : 'Collapse node'}
          onClick={(event) => {
            event.stopPropagation()
            data.onToggleCollapse(id)
          }}
        >
          {data.collapsed ? '+' : '−'}
        </button>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

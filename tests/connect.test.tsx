import { render } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { addChild, addRoot, connectRelatedNodes, emptyDocument, toggleCollapsed } from '../src/model/operations'

let capturedEdges: Array<{ id: string; source: string; target: string; type?: string; style?: { strokeDasharray?: string } }> = []

vi.mock('@xyflow/react', async () => {
  const actual = await vi.importActual('@xyflow/react')
  return {
    ...actual,
    ReactFlow: ({ onConnect, nodes, edges }: { onConnect?: (connection: { source: string | null; target: string | null }) => void; nodes?: unknown[]; edges?: Array<{ id: string; source: string; target: string; type?: string; style?: { strokeDasharray?: string } }> }) => {
      capturedEdges = edges ?? []
      return (
        <div data-testid="react-flow">
          <button
            data-testid="trigger-connect"
            onClick={() =>
              onConnect?.({ source: 'test-source', target: 'test-target' })
            }
          >
            Trigger connect
          </button>
          <button
            data-testid="trigger-connect-missing"
            onClick={() => onConnect?.({ source: null, target: 'test-target' })}
          >
            Trigger missing
          </button>
          <div data-testid="node-count">{nodes?.length ?? 0}</div>
          <div data-testid="edge-count">{edges?.length ?? 0}</div>
        </div>
      )
    },
    Background: () => null,
    Controls: () => null,
  }
})

import MindMapCanvas from '../src/components/MindMapCanvas'

it('forwards React Flow onConnect to onConnectNodes when both source and target exist', () => {
  const onConnectNodes = vi.fn()
  const document = addRoot(emptyDocument(), 'Test')
  const { getByTestId } = render(
    <MindMapCanvas
      document={document}
      selectedId={undefined}
      searchTerm=""
      centerSignal={0}
      onSelect={() => {}}
      onMove={() => {}}
      onRename={() => {}}
      onToggleCollapse={() => {}}
      onConnectNodes={onConnectNodes}
    />
  )
  getByTestId('trigger-connect').click()
  expect(onConnectNodes).toHaveBeenCalledWith('test-source', 'test-target')
})

it('does not call onConnectNodes when source or target is missing', () => {
  const onConnectNodes = vi.fn()
  const document = addRoot(emptyDocument(), 'Test')
  const { getByTestId } = render(
    <MindMapCanvas
      document={document}
      selectedId={undefined}
      searchTerm=""
      centerSignal={0}
      onSelect={() => {}}
      onMove={() => {}}
      onRename={() => {}}
      onToggleCollapse={() => {}}
      onConnectNodes={onConnectNodes}
    />
  )
  getByTestId('trigger-connect-missing').click()
  expect(onConnectNodes).not.toHaveBeenCalled()
})

it('works without onConnectNodes callback', () => {
  const document = addRoot(emptyDocument(), 'Test')
  const { getByTestId } = render(
    <MindMapCanvas
      document={document}
      selectedId={undefined}
      searchTerm=""
      centerSignal={0}
      onSelect={() => {}}
      onMove={() => {}}
      onRename={() => {}}
      onToggleCollapse={() => {}}
    />
  )
  expect(() => getByTestId('trigger-connect').click()).not.toThrow()
})

it('renders a visible relation as a dashed curve and hides it when either endpoint is hidden', () => {
  let document = addRoot(emptyDocument(), 'Root')
  const root = document.rootIds[0]
  document = addChild(document, root, 'Source')
  const source = document.nodes.find((node) => node.label === 'Source')!.id
  document = addChild(document, root, 'Branch')
  const branch = document.nodes.find((node) => node.label === 'Branch')!.id
  document = addChild(document, branch, 'Target')
  const target = document.nodes.find((node) => node.label === 'Target')!.id
  const related = connectRelatedNodes(document, source, target)
  const props = { selectedId: undefined, searchTerm: '', centerSignal: 0, onSelect: () => {}, onMove: () => {}, onRename: () => {}, onToggleCollapse: () => {} }
  const { rerender } = render(<MindMapCanvas document={related} {...props} />)
  expect(capturedEdges).toEqual(expect.arrayContaining([expect.objectContaining({ source, target, type: 'bezier', style: { strokeDasharray: '6 4' } })]))
  rerender(<MindMapCanvas document={toggleCollapsed(related, branch)} {...props} />)
  expect(capturedEdges.some((edge) => edge.source === source && edge.target === target)).toBe(false)
})

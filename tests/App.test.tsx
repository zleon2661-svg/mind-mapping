import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { MindMapDocument, Point } from '../src/model/types'
import { expect, it, vi } from 'vitest'

interface CanvasProps { document: MindMapDocument; onSelect: (id?: string) => void; onMove: (id: string, position: Point) => void; onRename: (id: string, label: string) => void; onConnectNodes?: (sourceId: string, targetId: string) => void }
let capturedOnConnectNodes: ((sourceId: string, targetId: string) => void) | undefined
vi.mock('../src/components/MindMapCanvas', () => ({ default: ({ document, onSelect, onMove, onRename, onConnectNodes }: CanvasProps) => { capturedOnConnectNodes = onConnectNodes; return <section aria-label="Mock canvas"><div data-testid="node-count">{document.nodes.length}</div><div data-testid="root-label">{document.nodes[0]?.label}</div><div data-testid="edge-count">{document.edges.length}</div><button onClick={() => onSelect(document.rootIds[0])}>Select root</button><button onClick={() => onMove(document.rootIds[0], { x: 42, y: 24 })}>Move root</button><button onClick={() => onRename(document.rootIds[0], 'Renamed root')}>Rename root</button></section> } }))

import App from '../src/App'
import { addChild, addRoot, emptyDocument } from '../src/model/operations'

function createRootAndSelect(): void { fireEvent.click(screen.getByRole('button', { name: 'Create root node' })); fireEvent.click(screen.getByRole('button', { name: 'Select root' })) }
function nokiaScenario() { let document = addRoot(emptyDocument(), '诺基亚'); const nokia = document.rootIds[0]; document = addChild(document, nokia, '直板手机'); const barPhone = document.nodes.find((node) => node.label === '直板手机')!.id; document = addChild(document, nokia, '翻盖手机'); const flipPhone = document.nodes.find((node) => node.label === '翻盖手机')!.id; document = addChild(document, flipPhone, '苹果手机'); return { document, barPhone, flipPhone, iPhone: document.nodes.find((node) => node.label === '苹果手机')!.id } }

it('handles keyboard creation, destructive confirmation, and oversized import feedback', () => { render(<App />); createRootAndSelect(); fireEvent.keyDown(window, { key: 'Tab' }); expect(screen.getByTestId('node-count')).toHaveTextContent('2'); fireEvent.keyDown(window, { key: 'Delete' }); expect(screen.getByRole('dialog', { name: 'Delete this branch?' })).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); const input = document.querySelector('input[type="file"]'); expect(input).not.toBeNull(); fireEvent.change(input!, { target: { files: [new File([new Uint8Array(1_000_001)], 'large.json', { type: 'application/json' })] } }); expect(screen.getByText('Import rejected: files must be 1 MB or smaller.')).toBeInTheDocument() })

it('records an inline rename as one undoable and redoable mutation', () => { render(<App />); createRootAndSelect(); fireEvent.click(screen.getByRole('button', { name: 'Rename root' })); expect(screen.getByTestId('root-label')).toHaveTextContent('Renamed root'); fireEvent.click(screen.getByRole('button', { name: 'Undo' })); expect(screen.getByTestId('root-label')).toHaveTextContent('Central idea'); fireEvent.click(screen.getByRole('button', { name: 'Redo' })); expect(screen.getByTestId('root-label')).toHaveTextContent('Renamed root') })

it('connects the Nokia relation without deleting the existing iPhone tree edge, then undo/redo persists it', async () => {
  localStorage.clear(); const { document: doc, barPhone, flipPhone, iPhone } = nokiaScenario(); localStorage.setItem('mindmap-panel.document.v1', JSON.stringify(doc)); const { unmount } = render(<App />); expect(screen.getByTestId('edge-count')).toHaveTextContent('3'); capturedOnConnectNodes!(barPhone, iPhone)
  await waitFor(() => expect(screen.getByTestId('edge-count')).toHaveTextContent('4'))
  let saved = JSON.parse(localStorage.getItem('mindmap-panel.document.v1')!)
  expect(saved.edges).toEqual(expect.arrayContaining([expect.objectContaining({ source: flipPhone, target: iPhone, kind: 'tree' }), expect.objectContaining({ source: barPhone, target: iPhone, kind: 'relation' })]))
  fireEvent.click(screen.getByRole('button', { name: 'Undo' })); await waitFor(() => expect(JSON.parse(localStorage.getItem('mindmap-panel.document.v1')!).edges.some((edge: { kind: string }) => edge.kind === 'relation')).toBe(false))
  fireEvent.click(screen.getByRole('button', { name: 'Redo' })); await waitFor(() => expect(JSON.parse(localStorage.getItem('mindmap-panel.document.v1')!).edges.some((edge: { source: string; target: string; kind: string }) => edge.source === barPhone && edge.target === iPhone && edge.kind === 'relation')).toBe(true))
  unmount(); render(<App />); saved = JSON.parse(localStorage.getItem('mindmap-panel.document.v1')!); expect(saved.edges.some((edge: { source: string; target: string; kind: string }) => edge.source === flipPhone && edge.target === iPhone && edge.kind === 'tree')).toBe(true); expect(saved.edges.some((edge: { source: string; target: string; kind: string }) => edge.source === barPhone && edge.target === iPhone && edge.kind === 'relation')).toBe(true); localStorage.clear()
})

it('shows an error for self-connection without changing history', async () => { localStorage.clear(); const doc = addRoot(emptyDocument(), 'Node A'); const nodeA = doc.rootIds[0]; localStorage.setItem('mindmap-panel.document.v1', JSON.stringify(doc)); render(<App />); capturedOnConnectNodes!(nodeA, nodeA); await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('A node cannot be connected to itself.')); expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled(); localStorage.clear() })

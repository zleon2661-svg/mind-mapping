import { fireEvent, render, screen } from '@testing-library/react'
import type { MindMapDocument, Point } from '../src/model/types'
import { expect, it, vi } from 'vitest'

interface CanvasProps {
  document: MindMapDocument
  onSelect: (id?: string) => void
  onMove: (id: string, position: Point) => void
  onRename: (id: string, label: string) => void
}

vi.mock('../src/components/MindMapCanvas', () => ({
  default: ({ document, onSelect, onMove, onRename }: CanvasProps) => <section aria-label="Mock canvas"><output>{document.nodes.length}</output><output aria-label="Root label">{document.nodes[0]?.label}</output><button onClick={() => onSelect(document.rootIds[0])}>Select root</button><button onClick={() => onMove(document.rootIds[0], { x: 42, y: 24 })}>Move root</button><button onClick={() => onRename(document.rootIds[0], 'Renamed root')}>Rename root</button></section>,
}))

import App from '../src/App'

function createRootAndSelect(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Create root node' }))
  fireEvent.click(screen.getByRole('button', { name: 'Select root' }))
}

it('handles keyboard creation, destructive confirmation, and oversized import feedback', () => {
  render(<App />)
  createRootAndSelect()
  fireEvent.keyDown(window, { key: 'Tab' })
  expect(screen.getByText('2')).toBeInTheDocument()
  fireEvent.keyDown(window, { key: 'Delete' })
  expect(screen.getByRole('dialog', { name: 'Delete this branch?' })).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
  const input = document.querySelector('input[type="file"]')
  expect(input).not.toBeNull()
  fireEvent.change(input!, { target: { files: [new File([new Uint8Array(1_000_001)], 'large.json', { type: 'application/json' })] } })
  expect(screen.getByText('Import rejected: files must be 1 MB or smaller.')).toBeInTheDocument()
})

it('records an inline rename as one undoable and redoable mutation', () => {
  render(<App />)
  createRootAndSelect()
  fireEvent.click(screen.getByRole('button', { name: 'Rename root' }))
  expect(screen.getByRole('status', { name: 'Root label' })).toHaveTextContent('Renamed root')
  fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
  expect(screen.getByRole('status', { name: 'Root label' })).toHaveTextContent('Central idea')
  fireEvent.click(screen.getByRole('button', { name: 'Redo' }))
  expect(screen.getByRole('status', { name: 'Root label' })).toHaveTextContent('Renamed root')
})

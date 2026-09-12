import { fireEvent, render, screen } from '@testing-library/react'
import type { NodeProps } from '@xyflow/react'
import { expect, it, vi } from 'vitest'

vi.mock('@xyflow/react', () => ({
  Handle: () => null,
  Position: { Left: 'left', Right: 'right' },
}))

import MindNode, { type MindFlowNode, type MindNodeData } from '../src/components/MindNode'

function renderNode(overrides: Partial<MindNodeData> = {}) {
  const onRename = vi.fn()
  const data: MindNodeData = {
    label: 'Original idea',
    collapsed: false,
    hasChildren: false,
    searchHit: false,
    onRename,
    onToggleCollapse: vi.fn(),
    ...overrides,
  }
  const props = { id: 'node-1', data, selected: true } as NodeProps<MindFlowNode>
  render(<MindNode {...props} />)
  return { data, onRename }
}

function beginEditing(): HTMLInputElement {
  fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit Original idea' }))
  return screen.getByRole('textbox', { name: 'Edit Original idea' })
}

it('enters inline editing only on double click and focuses and selects the label', () => {
  renderNode()
  const label = screen.getByRole('button', { name: 'Edit Original idea' })
  fireEvent.click(label)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

  const input = beginEditing()
  expect(input).toHaveFocus()
  expect(input).toHaveValue('Original idea')
  expect(input.selectionStart).toBe(0)
  expect(input.selectionEnd).toBe('Original idea'.length)
  expect(input).toHaveAttribute('maxlength', '500')
})

it('commits trimmed text once on blur or Enter', () => {
  const first = renderNode()
  const blurInput = beginEditing()
  fireEvent.change(blurInput, { target: { value: '  Updated by blur  ' } })
  fireEvent.blur(blurInput)
  expect(first.onRename).toHaveBeenCalledTimes(1)
  expect(first.onRename).toHaveBeenCalledWith('node-1', 'Updated by blur')

  const enterInput = beginEditing()
  fireEvent.change(enterInput, { target: { value: 'Updated by Enter' } })
  fireEvent.keyDown(enterInput, { key: 'Enter' })
  fireEvent.blur(enterInput)
  expect(first.onRename).toHaveBeenCalledTimes(2)
  expect(first.onRename).toHaveBeenLastCalledWith('node-1', 'Updated by Enter')
})

it('cancels with Escape and ignores blank or unchanged values', () => {
  const { onRename } = renderNode()
  const cancelled = beginEditing()
  fireEvent.change(cancelled, { target: { value: 'Discard me' } })
  fireEvent.keyDown(cancelled, { key: 'Escape' })
  fireEvent.blur(cancelled)
  expect(onRename).not.toHaveBeenCalled()

  const blank = beginEditing()
  fireEvent.change(blank, { target: { value: '   ' } })
  fireEvent.blur(blank)
  expect(onRename).not.toHaveBeenCalled()

  const unchanged = beginEditing()
  fireEvent.change(unchanged, { target: { value: '  Original idea  ' } })
  fireEvent.blur(unchanged)
  expect(onRename).not.toHaveBeenCalled()
})

it('resets the exact-once guard for every edit session', () => {
  const { onRename } = renderNode()
  for (const label of ['First rename', 'Second rename']) {
    const input = beginEditing()
    fireEvent.change(input, { target: { value: label } })
    fireEvent.keyDown(input, { key: 'Enter' })
  }
  expect(onRename).toHaveBeenNthCalledWith(1, 'node-1', 'First rename')
  expect(onRename).toHaveBeenNthCalledWith(2, 'node-1', 'Second rename')
})

it('isolates editing pointer, mouse, and keyboard events from the canvas', () => {
  const onPointerDown = vi.fn()
  const onClick = vi.fn()
  const onDoubleClick = vi.fn()
  const onKeyDown = vi.fn()
  const onRename = vi.fn()
  const data: MindNodeData = {
    label: 'Original idea',
    collapsed: false,
    hasChildren: false,
    searchHit: false,
    onRename,
    onToggleCollapse: vi.fn(),
  }
  const props = { id: 'node-1', data, selected: true } as NodeProps<MindFlowNode>
  render(<div onPointerDown={onPointerDown} onClick={onClick} onDoubleClick={onDoubleClick} onKeyDown={onKeyDown}><MindNode {...props} /></div>)

  const input = beginEditing()
  onPointerDown.mockClear()
  onClick.mockClear()
  onDoubleClick.mockClear()
  onKeyDown.mockClear()
  fireEvent.pointerDown(input)
  fireEvent.click(input)
  fireEvent.doubleClick(input)
  for (const key of ['Backspace', 'Delete', 'Tab']) fireEvent.keyDown(input, { key })
  expect(onPointerDown).not.toHaveBeenCalled()
  expect(onClick).not.toHaveBeenCalled()
  expect(onDoubleClick).not.toHaveBeenCalled()
  expect(onKeyDown).not.toHaveBeenCalled()
  expect(onRename).not.toHaveBeenCalled()
})

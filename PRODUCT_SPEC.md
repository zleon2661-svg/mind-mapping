# Mindmap Panel product specification

## Purpose

A local-first, desktop-first single-page mind map editor. It stores no user content remotely and has no account or backend.

## Core domain

The canonical document is a normalized directed forest represented by `nodes`, `edges`, and a `rootIds` order. Every node has an opaque generated ID, plaintext label, and a canvas position. Each edge joins exactly one parent to one child. Validation rejects unknown versions, malformed records, duplicate IDs, self links, cycles, orphaned non-roots, duplicate parent links, and documents above a conservative node limit.

The domain layer owns tree operations, import validation, cloning, and automatic layout. The view layer derives React Flow nodes and edges from the document and owns only selection, viewport, and edit-focus presentation state.

## Interaction rules

- A selected node receives children with Tab and same-parent siblings with Enter.
- Delete and Backspace remove the selected node. A non-leaf deletion requires an accessible confirmation dialog and removes its subtree.
- A node label is plain text only. Double-clicking it replaces the label with a focused inline input inside the node; blur or Enter commits once, while Escape cancels. Blank and unchanged edits do not create history.
- Collapse hides descendants in the view without destroying domain data.
- Drag changes positions, but records one undoable state only on drag end.
- History snapshots contain valid document states only, cap at 50 prior states, and clear redo after a new mutation.
- Every document mutation persists a versioned payload to localStorage. Storage failures surface a non-blocking message.

## Security and resilience

Import is JSON-only, uses a bounded file size, validates a versioned schema before replacing state, and shows a visible error message on failure. Exported JSON is the same validated schema. User labels are rendered as text, never HTML. PNG export should use a local rendering library; an SVG download is an explicitly labelled fallback if raster conversion fails.

## Test strategy

Unit tests cover tree edits, recursive delete, history, validation rejection cases, and storage parsing/recovery. Component tests cover keyboard actions, help visibility, and import error feedback. Build, ESLint, strict TypeScript and Vitest are mandatory.

# Mindmap Panel product specification

## Purpose

A local-first, desktop-first single-page mind map editor. It stores no user content remotely and has no account or backend.

## Core domain

The canonical document is a normalized directed forest plus optional relations, represented by `nodes`, typed `edges`, and a `rootIds` order. Every node has an opaque generated ID, plaintext label, and a canvas position. A `tree` edge joins one parent to one child; a `relation` edge is a user-created directed association that does not affect hierarchy. Old edges with no `kind` are normalized to `tree` on load. Validation rejects unknown versions, malformed records, duplicate IDs, self links, invalid endpoints, invalid tree cycles/orphans/multiple parents, duplicate relation pairs, and documents above a conservative node limit.

The domain layer owns tree operations, import validation, cloning, and automatic layout. The view layer derives React Flow nodes and edges from the document and owns only selection, viewport, and edit-focus presentation state.

## Interaction rules

- A selected node receives children with Tab and same-parent siblings with Enter. The created node becomes selected and immediately enters focused inline editing with its default label selected; adding a child also expands a collapsed parent so the editor remains visible.
- Delete and Backspace remove the selected node. A non-leaf deletion requires an accessible confirmation dialog and removes its subtree.
- A node label is plain text only. Double-clicking it replaces the label with a focused inline input inside the node; blur or Enter commits once, while Escape cancels. Blank and unchanged edits do not create history.
- Collapse hides descendants in the view without destroying domain data.
- Drag changes positions, but records one undoable state only on drag end.
- Connecting via drag-and-drop adds a directed `relation` from source to target, rendered as a solid curve. It never changes either node's tree parent, `rootIds`, position, layout, or pre-existing tree edge. Self-connections are rejected and a repeated directed relation is a no-op. Relations are visible only if both endpoints are visible; they are excluded from children/parent/descendant queries, automatic layout, collapse, ancestor expansion, and recursive-delete traversal. Deleting a tree node or subtree removes any relation that references it.
- History snapshots contain valid document states only, cap at 50 prior states, and clear redo after a new mutation.
- Every document mutation persists a versioned payload to localStorage. Storage failures surface a non-blocking message.

## Security and resilience

Import is JSON-only, uses a bounded file size, validates a versioned schema before replacing state, and shows a visible error message on failure. Exported JSON is the same validated schema. User labels are rendered as text, never HTML. PNG export should use a local rendering library; an SVG download is an explicitly labelled fallback if raster conversion fails.

## Test strategy

Unit tests cover tree edits, recursive deletion, hierarchy isolation, typed-edge validation, legacy kindless loading, history, and storage parsing/recovery. Component tests cover drag-to-connect forwarding and relation styling/visibility. Integration tests cover the Nokia scenario, undo/redo, local-storage reload, and the preservation of both the old tree edge and new relation. Build, ESLint, strict TypeScript and Vitest are mandatory.

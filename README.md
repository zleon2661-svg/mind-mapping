# Mindmap Panel

A local-first browser mind-map editor built with React, TypeScript, Vite, and React Flow. It has no backend, account, analytics, remote fonts, or network transport of map content.

## Features

- Build multiple root ideas and child/sibling branches on an interactive canvas.
- Connect nodes by dragging from one node's handle to another to add a separate relation line.
- Edit labels directly inside nodes with blur/Enter save and Escape cancel.
- Drag, collapse, search, center, undo, and redo without sending map data to a server.
- Persist automatically in browser local storage.
- Import/export validated JSON and export PNG with an SVG fallback.

## Run

```bash
npm ci
npm run dev
```

Validate the production app with `npm run lint`, `npm run typecheck`, `npm test -- --run`, and `npm run build`.

## Use

Create a root node from the empty state or toolbar. Select a node on the canvas, then use Tab to add a child and Enter to add a sibling. Drag from the source node's right handle to the target node's left handle to add a dashed relation line. This never reparents either node: the existing tree edges, `rootIds`, positions, and layout remain unchanged. Self-connections are rejected and a repeated directed relation is ignored. Double-click a node label to edit directly inside the node: click elsewhere or press Enter to save, and press Escape to cancel. Blank or unchanged text is ignored, and no separate Save button is needed. Delete or Backspace removes a node; branches require a confirmation dialog. Nodes drag on the canvas and `Center` fits the map into view. Use the compact help control for the full shortcut reference.

The editor automatically saves a versioned document in `localStorage` under `mindmap-panel.document.v1`; refreshing restores it. `New` and `Clear` confirm before replacing content. JSON export uses the same versioned schema that import validates. Edges have `kind: "tree"` or `kind: "relation"`; old JSON edges with no `kind` are loaded as `tree`. Tree edges alone are subject to parent, cycle, and root validation; relation endpoints must exist and relation pairs cannot be duplicated. Labels are rendered as text, never HTML.

PNG export uses local DOM rasterization. If that operation fails in a browser, the UI attempts an SVG download and clearly reports the fallback. JSON remains available if both image paths fail.

## Architecture

The canonical document contains a normalized tree forest plus optional relations: `nodes`, typed `edges`, and ordered `rootIds`. Pure model functions implement edits, tree-only layout, validation, and cloning; the history module owns 50 bounded snapshots; the React Flow layer derives visible nodes and edges without owning business data and forwards connection events to domain operations. The app shell owns selection, destructive confirmation, file input, viewport requests, and user-facing notices, while each rendered node owns only its temporary inline-edit draft. `connectRelatedNodes` adds a `relation` edge only; hierarchy queries, collapse, ancestor expansion, automatic placement, and recursive deletion traversal use `tree` edges only.

## Security limits

There is no HTML injection API, server, telemetry, or remote synchronization. Import parsing is defensive and preserves the current map if validation fails. The UUID helper never derives IDs from user labels. Local storage errors become visible non-blocking notices.

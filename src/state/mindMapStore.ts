import { cloneDocument } from '../model/operations'
import type { HistoryState, MindMapDocument } from '../model/types'

const HISTORY_LIMIT = 50
export function createHistory(present: MindMapDocument): HistoryState { return { past: [], present: cloneDocument(present), future: [] } }
export function commit(history: HistoryState, next: MindMapDocument): HistoryState { return { past: [...history.past, cloneDocument(history.present)].slice(-HISTORY_LIMIT), present: cloneDocument(next), future: [] } }
export function undo(history: HistoryState): HistoryState { const previous = history.past.at(-1); return previous === undefined ? history : { past: history.past.slice(0, -1), present: cloneDocument(previous), future: [cloneDocument(history.present), ...history.future].slice(0, HISTORY_LIMIT) } }
export function redo(history: HistoryState): HistoryState { const next = history.future[0]; return next === undefined ? history : { past: [...history.past, cloneDocument(history.present)].slice(-HISTORY_LIMIT), present: cloneDocument(next), future: history.future.slice(1) } }

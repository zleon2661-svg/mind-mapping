import { emptyDocument } from '../model/operations'
import { parseDocument } from '../model/validation'
import type { MindMapDocument } from '../model/types'

export const STORAGE_KEY = 'mindmap-panel.document.v1'
export function loadDocument(storage: Pick<Storage, 'getItem'> = window.localStorage): { document: MindMapDocument; warning?: string } {
  try { const saved = storage.getItem(STORAGE_KEY); if (!saved) return { document: emptyDocument() }; const result = parseDocument(saved); return result.ok ? { document: result.value } : { document: emptyDocument(), warning: 'Saved mind map was invalid and was not loaded.' } } catch { return { document: emptyDocument(), warning: 'Saved mind map could not be read.' } }
}
export function saveDocument(document: MindMapDocument, storage: Pick<Storage, 'setItem'> = window.localStorage): string | undefined { try { storage.setItem(STORAGE_KEY, JSON.stringify(document)); return undefined } catch { return 'Your changes could not be saved locally.' } }

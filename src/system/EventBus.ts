type Handler = (payload: unknown) => void

/** Tiny typed-ish event bus decoupling desktop, panel, terminal and apps. */
export class EventBus {
  private map = new Map<string, Set<Handler>>()
  on(event: string, fn: Handler): () => void {
    if (!this.map.has(event)) this.map.set(event, new Set())
    this.map.get(event)!.add(fn)
    return () => this.map.get(event)?.delete(fn)
  }
  emit(event: string, payload?: unknown): void {
    for (const fn of this.map.get(event) ?? []) fn(payload)
  }
}

export const bus = new EventBus()
export const Events = {
  Notify: 'notify',
  OpenApp: 'open-app',
  OpenFile: 'open-file',
  FocusWindow: 'focus-window',
} as const

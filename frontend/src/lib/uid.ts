let counter = 0

// crypto.randomUUID() needs a secure context and a fairly recent browser
// (Safari 15.4+, roughly 2022) — used here only to key local React list
// rows (cart lines, cheque lines, installments), never sent to the
// server, so any unique string works just as well as a real UUID.
export function uid(): string {
  try {
    return crypto.randomUUID()
  } catch {
    counter += 1
    return `${Date.now()}-${counter}-${Math.random().toString(36).slice(2)}`
  }
}

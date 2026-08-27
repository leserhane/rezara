// Flattens a joined relation (e.g. `customers(first_name,last_name)`) down
// to a single readable string for a CSV cell, rather than dumping raw JSON.
function flattenValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (Array.isArray(value)) return value.map(flattenValue).join('; ')
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('first_name' in obj || 'last_name' in obj) {
      return `${obj.first_name ?? ''} ${obj.last_name ?? ''}`.trim()
    }
    if ('name' in obj) return String(obj.name ?? '')
    if ('sale_number' in obj) return String(obj.sale_number ?? '')
    return JSON.stringify(obj)
  }
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

function csvCell(value: unknown): string {
  const str = flattenValue(value)
  return /[",\n\r]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

export interface ExportColumn {
  key: string
  label: string
}

export function toCsv(rows: Record<string, unknown>[], columns: ExportColumn[]): string {
  const header = columns.map((c) => csvCell(c.label)).join(',')
  const lines = rows.map((row) => columns.map((c) => csvCell(row[c.key])).join(','))
  return [header, ...lines].join('\r\n')
}

export function downloadCsv(filename: string, csv: string) {
  // Leading BOM so Excel opens UTF-8 accented characters correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

import { URL } from 'node:url'

export const isValidUrl = (value?: string | null): value is string => {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

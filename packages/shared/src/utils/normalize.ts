import { PackageNameSchema, SemverSchema } from '../schemas/identifiers'

export const normalizePackageName = (value: string): string => {
  const trimmed = value.trim()
  const normalized = trimmed.toLowerCase()
  PackageNameSchema.parse(normalized)
  return normalized
}

export const normalizeVersion = (value: string): string => {
  const trimmed = value.trim()
  SemverSchema.parse(trimmed)
  return trimmed
}

export const toPosixPath = (value: string): string => value.replace(/\\+/g, '/')

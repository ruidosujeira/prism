import { compare, rcompare, valid } from 'semver'
import { SemverSchema } from '@prism/shared'

export const coerceVersion = (version: string) => {
  const parsed = valid(version) ?? version
  SemverSchema.parse(parsed)
  return parsed
}

export const sortVersionsAsc = (versions: string[]) =>
  [...versions].sort((a, b) => compare(coerceVersion(a), coerceVersion(b)))

export const sortVersionsDesc = (versions: string[]) =>
  [...versions].sort((a, b) => rcompare(coerceVersion(a), coerceVersion(b)))

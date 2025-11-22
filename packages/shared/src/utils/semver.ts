import { maxSatisfying, satisfies, valid, rcompare } from 'semver'
import { SemverSchema } from '../schemas/identifiers'

export const isValidVersion = (version: string) => !!valid(version)

export const resolveMaxSatisfying = (
  versions: string[],
  range: string,
): string | null => {
  // Accept either a tag-like exact string or a range
  const v = maxSatisfying(versions, range)
  return v ?? null
}

export const sortSemverDesc = (versions: string[]) =>
  [...versions].sort((a, b) => rcompare(a, b))

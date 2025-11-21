import fs from 'node:fs/promises'
import path from 'node:path'

type NodeError = Error & { code?: string }

export const ensureDir = async (dir: string) => {
  await fs.mkdir(dir, { recursive: true })
}

export const writeJson = async (filePath: string, payload: unknown) => {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')
}

export const readJson = async <T>(filePath: string): Promise<T | null> => {
  try {
    const data = await fs.readFile(filePath, 'utf8')
    return JSON.parse(data) as T
  } catch (error) {
    if ((error as NodeError).code === 'ENOENT') {
      return null
    }
    throw error
  }
}

export const fileExists = async (target: string) => {
  try {
    await fs.access(target)
    return true
  } catch (error) {
    if ((error as NodeError).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

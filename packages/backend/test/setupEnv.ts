import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const tempRoot = mkdtempSync(path.join(tmpdir(), 'prism-backend-'))
process.env.STORAGE_ROOT = tempRoot
process.env.NODE_ENV = 'test'

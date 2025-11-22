/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from 'vitest'
import type { StorageDriver } from '../storageDriver'

export type DriverFactory = () => StorageDriver

export function runStorageDriverContract(name: string, factory: DriverFactory) {
  describe(`StorageDriver contract: ${name}`, () => {
    let driver: StorageDriver
    const pkg = 'example-pkg'

    beforeEach(() => {
      driver = factory()
    })

    it('stores and retrieves tarballs', async () => {
      const v = '1.0.0'
      const payload = Buffer.from('hello world', 'utf8')
      await driver.putTarball(pkg, v, payload)
      const loaded = await driver.getTarball(pkg, v)
      expect(loaded?.toString('utf8')).toBe('hello world')
    })

    it('stores and retrieves metadata', async () => {
      const v = '1.0.1'
      const meta = { foo: 'bar', n: 42 }
      await driver.putMetadata(pkg, v, meta)
      const loaded = await driver.getMetadata(pkg, v)
      expect(loaded).toEqual(meta)
    })

    it('returns null for missing tarball/metadata', async () => {
      expect(await driver.getTarball(pkg, '9.9.9')).toBeNull()
      expect(await driver.getMetadata(pkg, '9.9.9')).toBeNull()
    })

    it('lists versions in ascending semver order', async () => {
      await driver.putMetadata(pkg, '1.0.0', { a: 1 })
      await driver.putTarball(pkg, '1.0.1', Buffer.from('x'))
      await driver.putMetadata(pkg, '2.0.0', { a: 2 })
      const versions = await driver.listVersions(pkg)
      expect(versions).toEqual(['1.0.0', '1.0.1', '2.0.0'])
    })
  })
}

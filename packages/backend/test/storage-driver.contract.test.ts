/// <reference types="vitest" />
import { runStorageDriverContract } from '@prism/core'
import { FilesystemStorageDriver } from '../src/storage/storageDrivers/filesystem'

runStorageDriverContract('filesystem', () => new FilesystemStorageDriver())

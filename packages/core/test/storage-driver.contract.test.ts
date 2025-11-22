/// <reference types="vitest" />
import { runStorageDriverContract } from '../src/testing/storageDriverContract'
import { InMemoryStorageDriver } from '../src'

runStorageDriverContract('memory', () => new InMemoryStorageDriver())

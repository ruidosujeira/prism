/// <reference types="vitest" />
import { runStorageDriverContract } from '@prism/core'
import { S3StubStorageDriver } from '../src'

runStorageDriverContract('s3-stub', () => new S3StubStorageDriver())

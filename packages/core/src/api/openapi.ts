import { OpenAPIRegistry, OpenApiGeneratorV3 } from 'zod-to-openapi'
import {
  publishRequestSchema,
  publishResponseSchema,
  versionLookupParamsSchema,
  versionLookupResponseSchema,
  metadataParamsSchema,
  metadataResponseSchema,
  tarballParamsSchema,
  tarballResponseSchema,
  listQuerySchema,
  listResponseSchema,
} from './schemas'

export interface OpenAPIOptions {
  title?: string
  version?: string
  baseUrl?: string
}

export function buildOpenAPISpec(opts: OpenAPIOptions = {}) {
  const registry = new OpenAPIRegistry()

  // Components registration
  registry.registerPath({
    method: 'post',
    path: '/v1/publish',
    request: {
      body: {
        content: {
          'application/json': { schema: publishRequestSchema },
        },
      },
    },
    responses: {
      200: {
        description: 'Publish success',
        content: { 'application/json': { schema: publishResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/v1/{name}/versions',
    request: {
      params: versionLookupParamsSchema,
    },
    responses: {
      200: {
        description: 'Version list',
        content: { 'application/json': { schema: versionLookupResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/v1/{name}/manifest/{version}',
    request: { params: metadataParamsSchema },
    responses: {
      200: {
        description: 'Manifest payload',
        content: { 'application/json': { schema: metadataResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/v1/{name}/tarball/{version}',
    request: { params: tarballParamsSchema },
    responses: {
      200: {
        description: 'Tarball URL response',
        content: { 'application/json': { schema: tarballResponseSchema } },
      },
    },
  })

  registry.registerPath({
    method: 'get',
    path: '/v1/packages',
    request: { query: listQuerySchema },
    responses: {
      200: {
        description: 'Package listing',
        content: { 'application/json': { schema: listResponseSchema } },
      },
    },
  })

  const generator = new OpenApiGeneratorV3(registry.definitions)
  const doc = generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: opts.title ?? 'Prism Registry API',
      version: opts.version ?? '0.1.0',
    },
    servers: opts.baseUrl ? [{ url: opts.baseUrl }] : [],
  })

  return doc
}

// TODO: Add error components, auth headers, and shared schemas as security model is defined.

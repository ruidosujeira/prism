import { PublishPayload, PublishResponseSchema } from '@prism/shared'
import { runPublishPipeline } from '../ingest/publishPipeline'

class PublishService {
  async publish(name: string, payload: PublishPayload) {
    const result = await runPublishPipeline(payload, { expectedName: name })
    return PublishResponseSchema.parse(result)
  }
}

export const publishService = new PublishService()

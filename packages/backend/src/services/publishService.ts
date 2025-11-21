import { PublishPayload, PublishResponseSchema } from '@prism/shared'
import { runPublishPipeline } from '../ingest/publishPipeline'

class PublishService {
  async publish(payload: PublishPayload) {
    const result = await runPublishPipeline(payload)
    return PublishResponseSchema.parse(result)
  }
}

export const publishService = new PublishService()

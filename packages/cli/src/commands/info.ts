import { Command } from 'commander'
import { PackageIndexEntrySchema } from '@prism/shared'
import type { CliContext } from '../index'

const getJson = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Registry responded with ${response.status}: ${text}`)
  }
  return response.json()
}

const formatVersions = (versions: string[]) => versions.join(', ')

export const registerInfoCommand = (program: Command, context: CliContext) => {
  program
    .command('info')
    .description('Show metadata for a package')
    .argument('<name>', 'Package name')
    .action(async (name: string) => {
      const target = new URL(
        `/v1/packages/${encodeURIComponent(name)}`,
        context.registryUrl,
      )
      const payload = await getJson(target.toString())
      const result = PackageIndexEntrySchema.parse(payload)
      console.log(`Package: ${result.name}`)
      console.log(`Latest:  ${result.latest}`)
      console.log(`Versions: ${formatVersions(result.versions)}`)
      if (result.tags?.length) {
        console.log(`Tags:     ${result.tags.join(', ')}`)
      }
    })
}

import { Command, InvalidArgumentError } from 'commander'
import type { ResolvedEntry } from '@prism/core'
import type { CliContext } from '../index'

const RUNTIMES = ['node', 'deno', 'bun'] as const

type RuntimeOption = (typeof RUNTIMES)[number]

const fetchResolve = async (
  baseUrl: string,
  spec: string,
  runtime: RuntimeOption,
): Promise<ResolvedEntry> => {
  const target = new URL('/v1/resolve', baseUrl)
  target.searchParams.set('spec', spec)
  target.searchParams.set('runtime', runtime)

  const response = await fetch(target)
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Registry responded with ${response.status}: ${text}`)
  }
  return (await response.json()) as ResolvedEntry
}

export const registerResolveCommand = (
  program: Command,
  context: CliContext,
) => {
  program
    .command('resolve')
    .description('Resolve a package spec for a given runtime')
    .argument('<spec>', 'Package spec, e.g. react@18')
    .option('-r, --runtime <runtime>', 'Runtime (node|deno|bun)', 'node')
    .action(async (spec: string, options: { runtime: string }) => {
      const runtime = options.runtime as RuntimeOption
      if (!RUNTIMES.includes(runtime)) {
        throw new InvalidArgumentError(
          `Unsupported runtime "${
            options.runtime
          }". Choose from ${RUNTIMES.join(', ')}`,
        )
      }

      const result = await fetchResolve(context.registryUrl, spec, runtime)
      console.log(`Spec:     ${spec}`)
      console.log(`Runtime:  ${result.runtime}`)
      console.log(`Format:   ${result.format}`)
      console.log(`URL:      ${result.url}`)
      console.log(`Entry:    ${result.entryPath}`)
      if (result.typesUrl) {
        console.log(`Types:    ${result.typesUrl}`)
      }
    })
}

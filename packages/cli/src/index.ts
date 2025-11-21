import { Command } from 'commander'
import { registerPublishCommand } from './commands/publish'
import { registerInfoCommand } from './commands/info'
import { registerResolveCommand } from './commands/resolve'

export interface CliContext {
  registryUrl: string
}

const createContext = (): CliContext => ({
  registryUrl:
    process.env.PRISM_REGISTRY_URL?.trim() || 'http://localhost:3333',
})

export const buildProgram = (context: CliContext) => {
  const program = new Command()
  program.name('prism').description('Interact with a Prism registry')

  registerPublishCommand(program, context)
  registerInfoCommand(program, context)
  registerResolveCommand(program, context)

  return program
}

export const run = async (argv = process.argv) => {
  const context = createContext()
  const program = buildProgram(context)
  await program.parseAsync(argv)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

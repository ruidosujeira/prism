export class PrismError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

export class PackageNotFoundError extends PrismError {
  constructor(name: string) {
    super(`Package "${name}" was not found in Prism storage.`)
  }
}

export class VersionNotFoundError extends PrismError {
  constructor(name: string, range: string) {
    super(`No version of "${name}" satisfies range "${range}".`)
  }
}

export class EntryPointResolutionError extends PrismError {
  constructor(name: string, version: string) {
    super(`Unable to resolve an entry point for "${name}@${version}".`)
  }
}

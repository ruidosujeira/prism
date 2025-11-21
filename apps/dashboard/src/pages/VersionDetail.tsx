import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  API_BASE,
  fetchPackageVersion,
  fetchResolution,
  type PackageVersionResponse,
  type ResolvedEntry,
  type Runtime,
} from '../api/client'

const RUNTIMES: Runtime[] = ['node', 'deno', 'bun']

const absoluteUrl = (value: string) =>
  value.startsWith('http') ? value : new URL(value, API_BASE).toString()

export const VersionDetail = () => {
  const { name, version } = useParams<{ name: string; version: string }>()
  const [payload, setPayload] = useState<PackageVersionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [resolutions, setResolutions] = useState<
    Record<Runtime, ResolvedEntry | null>
  >({
    node: null,
    deno: null,
    bun: null,
  })

  useEffect(() => {
    if (!name || !version) return
    setLoading(true)
    fetchPackageVersion(name, version)
      .then((data) => {
        setPayload(data)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [name, version])

  useEffect(() => {
    if (!payload) return
    const spec = `${payload.metadata.identifier.name}@${payload.metadata.identifier.version}`
    Promise.all(
      RUNTIMES.map(async (runtime) => {
        try {
          const resolved = await fetchResolution(spec, runtime)
          return { runtime, resolved }
        } catch (err) {
          console.warn('Failed to resolve runtime', runtime, err)
          return { runtime, resolved: null }
        }
      }),
    ).then((entries) => {
      setResolutions(
        entries.reduce((acc, entry) => {
          acc[entry.runtime] = entry.resolved
          return acc
        }, {} as Record<Runtime, ResolvedEntry | null>),
      )
    })
  }, [payload])

  const manifestFiles = payload?.manifest?.files ?? []
  const totalFiles = payload?.metadata.files?.totalFiles ?? manifestFiles.length

  const runtimeBadges = useMemo(() => {
    if (!payload) return []
    const compatibility = payload.metadata.runtime?.compatibility
    if (!compatibility) return []
    return Object.entries(compatibility)
  }, [payload])

  const exportEntries = useMemo(() => {
    if (!payload) return []
    return Object.entries(payload.metadata.exports || {})
  }, [payload])

  if (!name || !version) {
    return <p className="error">Missing name or version.</p>
  }

  if (loading) {
    return <p className="loading">Loading version…</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!payload) {
    return <p className="muted">Version not found.</p>
  }

  return (
    <div className="section">
      <Link to={`/packages/${name}`} className="muted">
        ← Back to package
      </Link>
      <h2>
        {payload.metadata.identifier.name}@{payload.metadata.identifier.version}
      </h2>
      <p className="muted">
        Published{' '}
        {new Date(payload.metadata.release.publishedAt).toLocaleString()}
        <div>
          {(payload.metadata.tags ?? []).map((tag: string) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </p>

      <div className="section">
        <h3>Runtime Signals</h3>
        <div>
          {runtimeBadges.map(([runtime, status]) => {
            const label =
              typeof status === 'boolean'
                ? status
                  ? 'supported'
                  : 'blocked'
                : status
            return (
              <span key={runtime} className="tag">
                {runtime}: {label}
              </span>
            )
          })}
        </div>
      </div>

      <div className="section">
        <h3>Manifest</h3>
        {payload.manifest ? (
          <ul>
            <li>Integrity: {payload.manifest.integrity}</li>
            <li>Files tracked: {manifestFiles.length}</li>
            {payload.manifest.types && (
              <li>Types entry: {payload.manifest.types}</li>
            )}
          </ul>
        ) : (
          <p className="muted">Manifest not available.</p>
        )}
      </div>

      <div className="section">
        <h3>Exports</h3>
        {exportEntries.length ? (
          <table className="table">
            <tbody>
              {exportEntries.map(([key, target]) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <code>{target}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">No exports recorded for this version.</p>
        )}
      </div>

      <div className="section">
        <h3>Runtime Resolutions</h3>
        <div className="card-grid">
          {RUNTIMES.map((runtime) => {
            const resolution = resolutions[runtime]
            return (
              <div key={runtime} className="card">
                <h4>{runtime}</h4>
                {resolution ? (
                  <ul>
                    <li>Entry: {resolution.entryPath}</li>
                    <li>Format: {resolution.format}</li>
                    <li>
                      URL:{' '}
                      <a
                        href={absoluteUrl(resolution.url)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {absoluteUrl(resolution.url)}
                      </a>
                    </li>
                    {resolution.typesUrl && (
                      <li>Types: {resolution.typesUrl}</li>
                    )}
                  </ul>
                ) : (
                  <p className="muted">No export registered.</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="section">
        <h3>Distribution</h3>
        <p className="muted">
          {totalFiles} files ·{' '}
          {(payload.metadata.distribution.rawBytes / 1024).toFixed(1)}
          kB unpacked (gzip{' '}
          {(payload.metadata.distribution.gzipBytes / 1024).toFixed(1)} kB)
        </p>
      </div>

      <div className="section">
        <h3>Provenance</h3>
        <ul>
          <li>Checksum: {payload.metadata.checksum}</li>
          <li>Maturity score: {payload.metadata.release.maturityScore}</li>
          {payload.metadata.release.previousVersion && (
            <li>Previous: {payload.metadata.release.previousVersion}</li>
          )}
          {payload.metadata.release.releaseFrequencyDays && (
            <li>
              Release frequency: ~
              {payload.metadata.release.releaseFrequencyDays.toFixed(1)} days
            </li>
          )}
          <li>
            Artifact:{' '}
            <a href={absoluteUrl(payload.metadata.dist.tarball)}>
              {payload.metadata.dist.fileName}
            </a>
          </li>
        </ul>
      </div>
    </div>
  )
}

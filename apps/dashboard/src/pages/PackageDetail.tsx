import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchPackage, type PackageSummary } from '../api/client'

export const PackageDetail = () => {
  const { name } = useParams<{ name: string }>()
  const [pkg, setPkg] = useState<PackageSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!name) return
    fetchPackage(name)
      .then((data) => {
        setPkg(data)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [name])

  if (!name) {
    return <p className="error">Package name missing.</p>
  }

  if (loading) {
    return <p className="loading">Loading package…</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!pkg) {
    return <p className="muted">Package not found.</p>
  }

  return (
    <div className="section">
      <h2>{pkg.name}</h2>
      <p className="muted">Latest version: {pkg.latest}</p>
      <div>
        {pkg.tags.map((tag) => (
          <span key={tag} className="tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="section">
        <h3>Versions</h3>
        <div className="card-grid">
          {[...pkg.versions].reverse().map((version) => (
            <Link
              key={version}
              to={`/packages/${pkg.name}/${version}`}
              className="card"
            >
              <h4>{version}</h4>
              {version === pkg.latest && <span className="tag">Latest</span>}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

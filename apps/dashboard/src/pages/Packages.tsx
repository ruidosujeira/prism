import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchPackages, type PackageSummary } from '../api/client'

export const Packages = () => {
  const [packages, setPackages] = useState<PackageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPackages()
      .then((result) => {
        setPackages(result)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <p className="loading">Loading packages…</p>
  }

  if (error) {
    return <p className="error">{error}</p>
  }

  if (!packages.length) {
    return <p className="muted">No packages published yet.</p>
  }

  return (
    <div className="section">
      <h2>Published Packages</h2>
      <div className="card-grid">
        {packages.map((pkg: PackageSummary) => (
          <Link key={pkg.name} to={`/packages/${pkg.name}`} className="card">
            <h3>{pkg.name}</h3>
            <p className="muted">Latest: {pkg.latest}</p>
            <div>
              {pkg.tags?.slice(0, 4).map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

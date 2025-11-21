import { NavLink, Outlet } from 'react-router-dom'

export const Layout = () => {
  return (
    <div className="app-shell">
      <header>
        <h1>Prism Platform Dashboard</h1>
        <nav>
          <NavLink to="/packages">Packages</NavLink>
          <a
            href="https://github.com/ruidosujeira/prism/tree/main/docs"
            target="_blank"
            rel="noreferrer"
            className="muted"
          >
            Docs ↗
          </a>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  )
}

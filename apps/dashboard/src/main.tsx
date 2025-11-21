import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Packages } from './pages/Packages'
import { PackageDetail } from './pages/PackageDetail'
import { VersionDetail } from './pages/VersionDetail'
import './main.css'

const App = () => (
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/packages" replace />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/packages/:name" element={<PackageDetail />} />
          <Route path="/packages/:name/:version" element={<VersionDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)

const root = document.getElementById('root')
if (root) {
  ReactDOM.createRoot(root).render(<App />)
}

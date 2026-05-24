// api.js — Capa de comunicación con el backend FastAPI
const BASE_URL = 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error desconocido' }))
    throw new Error(err.detail || `Error ${res.status}`)
  }
  if (res.status === 204) return null
  return res.json()
}

// ── Categorías ──────────────────────────────────────────────────────────────
export const getCategorias = () => request('/categorias')

// ── Productos ───────────────────────────────────────────────────────────────
export const getProductos = (params = {}) => {
  const qs = new URLSearchParams()
  if (params.busqueda)     qs.set('busqueda', params.busqueda)
  if (params.categoria_id) qs.set('categoria_id', params.categoria_id)
  if (params.soloActivos !== undefined) qs.set('solo_activos', params.soloActivos)
  if (params.pagina)       qs.set('pagina', params.pagina)
  if (params.porPagina)    qs.set('por_pagina', params.porPagina)
  return request(`/productos?${qs}`)
}

export const getProducto = (id) => request(`/productos/${id}`)

export const crearProducto = (data) =>
  request('/productos', { method: 'POST', body: JSON.stringify(data) })

export const actualizarProducto = (id, data) =>
  request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const eliminarProducto = (id) =>
  request(`/productos/${id}`, { method: 'DELETE' })

export const desactivarProducto = (id) =>
  request(`/productos/${id}/desactivar`, { method: 'PATCH' })

export const activarProducto = (id) =>
  request(`/productos/${id}/activar`, { method: 'PATCH' })
import { useState, useEffect, useCallback, useMemo } from 'react'
import ProductForm from './components/ProductForm.jsx'
import { useToast, ToastContainer } from './components/Toast.jsx'
import * as api from './api.js'

// ─── Paleta de colores por categoría (se asigna automáticamente) ──────────────
const CAT_COLORS = [
  { bg: 'rgba(245,166,35,.15)',  color: '#f5a623' },
  { bg: 'rgba(76,186,127,.15)', color: '#4cba7f' },
  { bg: 'rgba(99,139,255,.15)', color: '#638bff' },
  { bg: 'rgba(224,82,82,.15)',  color: '#e05252' },
  { bg: 'rgba(168,99,255,.15)', color: '#a863ff' },
  { bg: 'rgba(56,189,248,.15)', color: '#38bdf8' },
  { bg: 'rgba(251,146,60,.15)', color: '#fb923c' },
  { bg: 'rgba(52,211,153,.15)', color: '#34d399' },
]

// ─── Íconos SVG inline ────────────────────────────────────────────────────────
const Icon = {
  edit:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  toggle:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>,
  search:  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  pkg:     <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  warning: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  tag:     <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  chart:   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
}

export default function App() {
  const [productos,   setProductos]   = useState([])
  const [categorias,  setCategorias]  = useState([])
  const [total,       setTotal]       = useState(0)
  const [pagina,      setPagina]      = useState(1)
  const [busqueda,    setBusqueda]    = useState('')
  const [catFiltro,   setCatFiltro]   = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [loadingSave, setLoadingSave] = useState(false)
  const [formOpen,    setFormOpen]    = useState(false)
  const [editando,    setEditando]    = useState(null)
  const [confirmDel,  setConfirmDel]  = useState(null)
  const [backendOk,   setBackendOk]   = useState(null)
  const { toasts, show } = useToast()
  const POR_PAGINA = 15

  // ── Estadísticas derivadas ──────────────────────────────────────────────────
  const stockBajo    = useMemo(() => productos.filter(p => p.stock <= 10 && p.activo).length, [productos])
  const inactivos    = useMemo(() => productos.filter(p => !p.activo).length, [productos])
  const catColorMap  = useMemo(() => {
    const map = {}
    categorias.forEach((c, i) => { map[c.id] = CAT_COLORS[i % CAT_COLORS.length] })
    return map
  }, [categorias])

  // ── Cargar categorías ───────────────────────────────────────────────────────
  useEffect(() => {
    api.getCategorias()
      .then(setCategorias)
      .catch(() => setBackendOk(false))
  }, [])

  // ── Cargar productos ────────────────────────────────────────────────────────
  const cargarProductos = useCallback(async () => {
    setLoadingData(true)
    try {
      const res = await api.getProductos({
        busqueda: busqueda || undefined,
        categoria_id: catFiltro || undefined,
        soloActivos,
        pagina,
        porPagina: POR_PAGINA,
      })
      setProductos(res.productos)
      setTotal(res.total)
      setBackendOk(true)
    } catch {
      setBackendOk(false)
    } finally {
      setLoadingData(false)
    }
  }, [busqueda, catFiltro, soloActivos, pagina])

  useEffect(() => { cargarProductos() }, [cargarProductos])
  useEffect(() => { setPagina(1) }, [busqueda, catFiltro, soloActivos])

  // ── Guardar ─────────────────────────────────────────────────────────────────
  const handleSave = async (data) => {
    setLoadingSave(true)
    try {
      if (editando) {
        await api.actualizarProducto(editando.id, data)
        show('Producto actualizado correctamente')
      } else {
        await api.crearProducto(data)
        show('Producto creado correctamente')
      }
      setFormOpen(false)
      setEditando(null)
      cargarProductos()
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setLoadingSave(false)
    }
  }

  // ── Eliminar ─────────────────────────────────────────────────────────────────
  const handleEliminar = async () => {
    if (!confirmDel) return
    try {
      await api.eliminarProducto(confirmDel.id)
      show(`"${confirmDel.nombre}" eliminado`)
      setConfirmDel(null)
      cargarProductos()
    } catch (e) {
      show(e.message, 'error')
    }
  }

  // ── Toggle activo ────────────────────────────────────────────────────────────
  const handleToggle = async (p) => {
    try {
      if (p.activo) await api.desactivarProducto(p.id)
      else          await api.activarProducto(p.id)
      show(`Producto ${p.activo ? 'desactivado' : 'activado'}`)
      cargarProductos()
    } catch (e) {
      show(e.message, 'error')
    }
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)
  const catNombre = (id) => categorias.find(c => c.id === id)?.nombre || '—'

  // ── Banner sin conexión ──────────────────────────────────────────────────────
  if (backendOk === false) {
    return (
      <div style={S.noConn}>
        <div style={S.noConnBox}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Syne', color: '#f5a623', marginBottom: 8, fontSize: 20 }}>Backend no disponible</h2>
          <p style={{ color: '#7a849e', marginBottom: 20, lineHeight: 1.6 }}>
            Asegurate de que el servidor FastAPI esté corriendo:
          </p>
          <code style={S.code}>uvicorn main:app --reload</code>
          <p style={{ color: '#7a849e', marginTop: 16, fontSize: 13 }}>Luego recargá esta página.</p>
          <button onClick={() => { setBackendOk(null); cargarProductos() }} style={{ ...S.btnPrimary, marginTop: 20 }}>
            {Icon.refresh}&nbsp; Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.app}>

      {/* ── Sidebar ───────────────────────────────────────────────────────────── */}
      <aside style={S.sidebar}>
        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoIconWrap}>{Icon.pkg}</div>
          <div>
            <div style={S.logoTitle}>Polijuar</div>
            <div style={S.logoSub}>Descartables</div>
          </div>
        </div>

        {/* Navegación */}
        <nav style={S.nav}>
          <div style={{ ...S.navItem, ...S.navActive }}>
            <span style={S.navDot} />
            {Icon.pkg}
            Productos
          </div>
          <div style={S.navItem}>
            {Icon.tag}
            Categorías
            <span style={S.comingSoon}>pronto</span>
          </div>
          <div style={S.navItem}>
            {Icon.chart}
            Reportes
            <span style={S.comingSoon}>pronto</span>
          </div>
        </nav>

        {/* Footer del sidebar con estadísticas */}
        <div style={S.sidebarFooter}>
          <div style={S.sidebarStat}>
            <span style={S.sidebarStatNum}>{total}</span>
            <span style={S.sidebarStatLabel}>Productos</span>
          </div>
          <div style={S.sidebarDivider} />
          <div style={S.sidebarStat}>
            <span style={S.sidebarStatNum}>{categorias.length}</span>
            <span style={S.sidebarStatLabel}>Categorías</span>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ───────────────────────────────────────────────── */}
      <main style={S.main}>

        {/* Topbar */}
        <div style={S.topbar}>
          <div style={S.topbarLeft}>
            <h1 style={S.pageTitle}>Gestión de Productos</h1>
            <span style={S.pageSub}>Inventario en tiempo real</span>
          </div>
          <div style={S.topbarRight}>
            <button
              onClick={cargarProductos}
              style={S.btnIcon}
              title="Actualizar"
              disabled={loadingData}
            >
              {Icon.refresh}
            </button>
            <button
              onClick={() => { setEditando(null); setFormOpen(true) }}
              style={S.btnPrimary}
            >
              + Nuevo producto
            </button>
          </div>
        </div>

        {/* ── Tarjetas de estadísticas ─────────────────────────────────────────── */}
        <div style={S.statsRow}>
          <div style={{ ...S.statCard, borderColor: '#f5a623' }}>
            <div style={{ ...S.statCardIcon, background: 'rgba(245,166,35,.12)', color: '#f5a623' }}>📦</div>
            <div>
              <div style={S.statCardNum}>{total}</div>
              <div style={S.statCardLabel}>Total productos</div>
            </div>
          </div>
          <div style={{ ...S.statCard, borderColor: '#638bff' }}>
            <div style={{ ...S.statCardIcon, background: 'rgba(99,139,255,.12)', color: '#638bff' }}>🏷️</div>
            <div>
              <div style={{ ...S.statCardNum, color: '#638bff' }}>{categorias.length}</div>
              <div style={S.statCardLabel}>Categorías</div>
            </div>
          </div>
          <div style={{ ...S.statCard, borderColor: stockBajo > 0 ? '#e05252' : '#2a3045' }}>
            <div style={{ ...S.statCardIcon, background: stockBajo > 0 ? 'rgba(224,82,82,.12)' : 'rgba(42,48,69,.5)', color: stockBajo > 0 ? '#e05252' : '#7a849e' }}>
              {Icon.warning}
            </div>
            <div>
              <div style={{ ...S.statCardNum, color: stockBajo > 0 ? '#e05252' : '#7a849e' }}>{stockBajo}</div>
              <div style={S.statCardLabel}>Stock bajo (≤10)</div>
            </div>
          </div>
          <div style={{ ...S.statCard, borderColor: '#4cba7f' }}>
            <div style={{ ...S.statCardIcon, background: 'rgba(76,186,127,.12)', color: '#4cba7f' }}>✓</div>
            <div>
              <div style={{ ...S.statCardNum, color: '#4cba7f' }}>{total - inactivos}</div>
              <div style={S.statCardLabel}>Activos</div>
            </div>
          </div>
        </div>

        {/* ── Filtros ─────────────────────────────────────────────────────────── */}
        <div style={S.filtersBar}>
          <div style={S.searchWrap}>
            <span style={S.searchIconWrap}>{Icon.search}</span>
            <input
              id="buscador-productos"
              style={S.searchInput}
              placeholder="Buscar por nombre o código…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            {busqueda && (
              <button
                style={S.clearBtn}
                onClick={() => setBusqueda('')}
                title="Limpiar búsqueda"
              >✕</button>
            )}
          </div>
          <select
            id="filtro-categoria"
            style={S.select}
            value={catFiltro}
            onChange={e => setCatFiltro(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label style={S.toggleSwitch}>
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={e => setSoloActivos(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              ...S.toggleTrack,
              background: soloActivos ? 'rgba(245,166,35,.2)' : '#1f2435',
              border: soloActivos ? '1.5px solid #f5a623' : '1.5px solid #2a3045',
            }}>
              <span style={{
                ...S.toggleThumb,
                background: soloActivos ? '#f5a623' : '#3d4460',
                transform: soloActivos ? 'translateX(18px)' : 'translateX(2px)',
              }} />
            </span>
            <span style={{ color: soloActivos ? '#f5a623' : '#7a849e', fontSize: 13, transition: 'color .2s' }}>
              Solo activos
            </span>
          </label>
        </div>

        {/* ── Tabla ───────────────────────────────────────────────────────────── */}
        <div style={S.tableWrap}>
          {loadingData ? (
            <div style={S.loadingState}>
              <div style={S.spinner} />
              <span style={{ color: '#7a849e', fontSize: 13 }}>Cargando productos…</span>
            </div>
          ) : productos.length === 0 ? (
            <div style={S.emptyState}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
              <div style={{ color: '#e8eaf0', fontWeight: 600, marginBottom: 6 }}>No hay productos</div>
              <div style={{ color: '#7a849e', fontSize: 13 }}>
                {busqueda || catFiltro ? 'Probá con otros filtros de búsqueda.' : 'Creá tu primer producto con el botón de arriba.'}
              </div>
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  {['Código', 'Nombre', 'Categoría', 'Unidad', 'Precio', 'Stock', 'Estado', 'Acciones']
                    .map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const catColor = catColorMap[p.categoria_id] || CAT_COLORS[0]
                  const stockCrit = p.stock <= 10
                  return (
                    <tr key={p.id} className="table-row">
                      {/* Código */}
                      <td style={S.td}>
                        <code style={S.codeBadge}>{p.codigo}</code>
                      </td>
                      {/* Nombre */}
                      <td style={{ ...S.td, fontWeight: 500, color: '#e8eaf0', maxWidth: 200 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.nombre}
                        </span>
                      </td>
                      {/* Categoría */}
                      <td style={S.td}>
                        <span style={{ ...S.catTag, background: catColor.bg, color: catColor.color }}>
                          {catNombre(p.categoria_id)}
                        </span>
                      </td>
                      {/* Unidad */}
                      <td style={{ ...S.td, color: '#7a849e', fontSize: 12 }}>{p.unidad_venta}</td>
                      {/* Precio */}
                      <td style={{ ...S.td, fontWeight: 700, color: '#4cba7f', fontVariantNumeric: 'tabular-nums' }}>
                        ${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      {/* Stock */}
                      <td style={{ ...S.td, textAlign: 'center' }}>
                        <span style={{
                          ...S.stockPill,
                          background: stockCrit ? 'rgba(224,82,82,.15)' : 'rgba(76,186,127,.1)',
                          color:      stockCrit ? '#e05252' : '#4cba7f',
                          border:     `1px solid ${stockCrit ? 'rgba(224,82,82,.3)' : 'rgba(76,186,127,.2)'}`,
                        }}>
                          {stockCrit && <span style={{ marginRight: 3 }}>⚠</span>}
                          {p.stock}
                        </span>
                      </td>
                      {/* Estado */}
                      <td style={S.td}>
                        <span style={{
                          ...S.statusPill,
                          background: p.activo ? 'rgba(76,186,127,.1)'  : 'rgba(122,132,158,.1)',
                          color:      p.activo ? '#4cba7f' : '#7a849e',
                          border:     `1px solid ${p.activo ? 'rgba(76,186,127,.25)' : 'rgba(122,132,158,.2)'}`,
                        }}>
                          <span style={{ ...S.statusDot, background: p.activo ? '#4cba7f' : '#7a849e' }} />
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {/* Acciones */}
                      <td style={{ ...S.td, ...S.actionsCell }}>
                        <button
                          title="Editar"
                          style={S.iconBtn}
                          onClick={() => { setEditando(p); setFormOpen(true) }}
                        >
                          {Icon.edit}
                        </button>
                        <button
                          title={p.activo ? 'Desactivar' : 'Activar'}
                          style={{ ...S.iconBtn, color: '#f5a623' }}
                          onClick={() => handleToggle(p)}
                        >
                          {Icon.toggle}
                        </button>
                        <button
                          title="Eliminar"
                          style={{ ...S.iconBtn, color: '#e05252' }}
                          onClick={() => setConfirmDel(p)}
                        >
                          {Icon.trash}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Paginación ──────────────────────────────────────────────────────── */}
        {totalPaginas > 1 && (
          <div style={S.pagination}>
            <button
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              style={S.pageBtn}
            >← Anterior</button>
            <div style={S.pageNumbers}>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPaginas || Math.abs(n - pagina) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`sep-${i}`} style={{ color: '#3d4460', padding: '0 4px' }}>…</span>
                    : <button
                        key={n}
                        onClick={() => setPagina(n)}
                        style={{ ...S.pageNumBtn, ...(n === pagina ? S.pageNumActive : {}) }}
                      >{n}</button>
                )}
            </div>
            <button
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              style={S.pageBtn}
            >Siguiente →</button>
          </div>
        )}
      </main>

      {/* ── Modal formulario ────────────────────────────────────────────────────── */}
      {formOpen && (
        <ProductForm
          producto={editando}
          categorias={categorias}
          loading={loadingSave}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditando(null) }}
        />
      )}

      {/* ── Modal confirmar eliminar ─────────────────────────────────────────── */}
      {confirmDel && (
        <div style={S.overlay}>
          <div style={S.confirmBox}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
            <h3 style={{ fontFamily: 'Syne', color: '#e05252', marginBottom: 10, fontSize: 18 }}>
              ¿Eliminar producto?
            </h3>
            <p style={{ color: '#7a849e', marginBottom: 24, fontSize: 13, lineHeight: 1.6 }}>
              Vas a eliminar permanentemente{' '}
              <strong style={{ color: '#e8eaf0' }}>"{confirmDel.nombre}"</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDel(null)} style={S.btnSecondary}>Cancelar</button>
              <button onClick={handleEliminar} style={{ ...S.btnPrimary, background: '#e05252' }}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes fadeIn   { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes shimmer  { 0%,100% { opacity:.5 } 50% { opacity:1 } }

        * { box-sizing: border-box; }

        input:focus, select:focus, textarea:focus {
          outline: none !important;
          border-color: #f5a623 !important;
          box-shadow: 0 0 0 3px rgba(245,166,35,.12) !important;
        }

        .table-row:hover td {
          background: rgba(245,166,35,.035) !important;
        }

        .table-row { transition: background .12s; }

        button:disabled { opacity: .4; cursor: not-allowed !important; }

        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a3045; border-radius: 99px; }
      `}</style>
    </div>
  )
}

// ── Sistema de Estilos ────────────────────────────────────────────────────────
const S = {
  // Layout principal
  app:  { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f1117', fontFamily: "'DM Sans', sans-serif" },

  // Sidebar
  sidebar: {
    width: 230,
    background: 'linear-gradient(180deg, #141824 0%, #111521 100%)',
    borderRight: '1px solid #1e2438',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    overflow: 'hidden',
  },
  logoWrap: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '22px 20px 20px',
    borderBottom: '1px solid #1e2438',
  },
  logoIconWrap: {
    width: 38, height: 38,
    background: 'rgba(245,166,35,.12)',
    border: '1px solid rgba(245,166,35,.2)',
    borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#f5a623',
    flexShrink: 0,
  },
  logoTitle: { fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 15, color: '#e8eaf0', lineHeight: 1.1 },
  logoSub:   { fontSize: 10, color: '#4a5470', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 },

  nav: { flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 },
  navItem: {
    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
    color: '#4a5470', fontSize: 13,
    display: 'flex', alignItems: 'center', gap: 8,
    position: 'relative',
    transition: 'color .15s, background .15s',
  },
  navActive: {
    background: 'rgba(245,166,35,.1)',
    color: '#f5a623', fontWeight: 600,
    boxShadow: 'inset 2px 0 0 #f5a623',
  },
  navDot: {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 18, background: '#f5a623', borderRadius: '0 2px 2px 0',
    display: 'none',
  },
  comingSoon: {
    marginLeft: 'auto', fontSize: 10,
    background: '#1e2438', color: '#3d4460',
    padding: '2px 7px', borderRadius: 4,
    fontWeight: 600, letterSpacing: '.03em',
  },

  sidebarFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #1e2438',
    display: 'flex', alignItems: 'center', gap: 16,
  },
  sidebarStat:      { display: 'flex', flexDirection: 'column', gap: 1 },
  sidebarStatNum:   { fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 18, color: '#f5a623', lineHeight: 1 },
  sidebarStatLabel: { fontSize: 10, color: '#4a5470', textTransform: 'uppercase', letterSpacing: '.05em' },
  sidebarDivider:   { width: 1, height: 28, background: '#1e2438' },

  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#0f1117' },

  // Topbar
  topbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '20px 28px 0',
  },
  topbarLeft: { display: 'flex', flexDirection: 'column', gap: 2 },
  topbarRight: { display: 'flex', alignItems: 'center', gap: 10 },
  pageTitle: { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#e8eaf0', lineHeight: 1.1 },
  pageSub:   { fontSize: 12, color: '#4a5470' },

  // Stats
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    padding: '16px 28px 0',
  },
  statCard: {
    background: '#141824',
    border: '1px solid',
    borderRadius: 12,
    padding: '14px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    transition: 'transform .15s',
  },
  statCardIcon: {
    width: 38, height: 38, borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 16, flexShrink: 0,
  },
  statCardNum:   { fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#f5a623', lineHeight: 1 },
  statCardLabel: { fontSize: 11, color: '#4a5470', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.04em' },

  // Filtros
  filtersBar: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 28px',
    flexWrap: 'wrap',
  },
  searchWrap: { position: 'relative', flex: 1, minWidth: 220 },
  searchIconWrap: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: '#4a5470', display: 'flex',
  },
  searchInput: {
    width: '100%', padding: '9px 36px',
    background: '#141824',
    border: '1.5px solid #1e2438',
    borderRadius: 9, color: '#e8eaf0', fontSize: 13,
    outline: 'none',
    transition: 'border-color .15s, box-shadow .15s',
  },
  clearBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#4a5470',
    cursor: 'pointer', fontSize: 13, padding: 2,
  },
  select: {
    padding: '9px 12px',
    background: '#141824',
    border: '1.5px solid #1e2438',
    borderRadius: 9, color: '#e8eaf0', fontSize: 13,
    outline: 'none',
    transition: 'border-color .15s',
  },
  toggleSwitch: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' },
  toggleTrack: {
    width: 40, height: 22, borderRadius: 99,
    position: 'relative', transition: 'background .2s, border .2s',
    display: 'inline-block', flexShrink: 0,
  },
  toggleThumb: {
    position: 'absolute', top: 2,
    width: 16, height: 16, borderRadius: '50%',
    transition: 'transform .2s, background .2s',
  },

  // Tabla
  tableWrap: { flex: 1, overflow: 'auto', padding: '0 28px 12px' },
  table:     { width: '100%', borderCollapse: 'collapse', animation: 'slideUp .2s ease' },
  th: {
    textAlign: 'left', padding: '10px 12px',
    fontSize: 10, fontWeight: 700, color: '#4a5470',
    textTransform: 'uppercase', letterSpacing: '.08em',
    borderBottom: '1px solid #1e2438',
    whiteSpace: 'nowrap', background: '#0f1117',
    position: 'sticky', top: 0, zIndex: 1,
  },
  td: { padding: '10px 12px', borderBottom: '1px solid #141824', verticalAlign: 'middle', fontSize: 13, color: '#c8cad4' },

  codeBadge: {
    fontFamily: 'monospace', fontSize: 11, fontWeight: 600,
    color: '#f5a623',
    background: 'rgba(245,166,35,.08)',
    border: '1px solid rgba(245,166,35,.15)',
    borderRadius: 5, padding: '2px 7px',
  },
  catTag: {
    display: 'inline-block', fontSize: 11, fontWeight: 600,
    padding: '2px 8px', borderRadius: 99,
    whiteSpace: 'nowrap',
  },
  stockPill: {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 9px', borderRadius: 99,
    fontSize: 12, fontWeight: 700,
  },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '3px 10px', borderRadius: 99,
    fontSize: 11, fontWeight: 600,
  },
  statusDot: { display: 'inline-block', width: 6, height: 6, borderRadius: '50%' },
  actionsCell: { display: 'flex', gap: 4 },
  iconBtn: {
    background: 'transparent', border: 'none', color: '#4a5470',
    padding: '5px', borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'color .15s, background .15s', cursor: 'pointer',
  },

  // Loading / Empty
  loadingState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: 60, color: '#4a5470' },
  spinner: {
    width: 28, height: 28,
    border: '2.5px solid #1e2438',
    borderTop: '2.5px solid #f5a623',
    borderRadius: '50%',
    animation: 'spin .8s linear infinite',
  },
  emptyState: { textAlign: 'center', padding: 60, animation: 'fadeIn .3s ease' },

  // Paginación
  pagination: {
    display: 'flex', alignItems: 'center', gap: 8,
    justifyContent: 'center', padding: '12px 28px',
    borderTop: '1px solid #141824',
  },
  pageNumbers: { display: 'flex', gap: 4, alignItems: 'center' },
  pageBtn: {
    background: '#141824', border: '1px solid #1e2438',
    color: '#7a849e', padding: '6px 14px', borderRadius: 8,
    fontSize: 12, transition: 'background .15s', cursor: 'pointer',
  },
  pageNumBtn: {
    background: 'transparent', border: '1px solid transparent',
    color: '#7a849e', width: 32, height: 32,
    borderRadius: 7, fontSize: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all .15s',
  },
  pageNumActive: {
    background: 'rgba(245,166,35,.15)',
    border: '1px solid rgba(245,166,35,.3)',
    color: '#f5a623', fontWeight: 700,
  },

  // Botones
  btnPrimary: {
    background: 'linear-gradient(135deg, #f5a623, #f0941a)',
    color: '#0f1117', border: 'none', borderRadius: 9,
    padding: '9px 20px', fontWeight: 700, fontSize: 13,
    fontFamily: 'Syne, sans-serif', cursor: 'pointer',
    whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 2px 12px rgba(245,166,35,.25)',
    transition: 'opacity .15s, transform .1s',
  },
  btnSecondary: {
    background: 'transparent', color: '#7a849e',
    border: '1.5px solid #1e2438', borderRadius: 9,
    padding: '9px 18px', fontSize: 13, cursor: 'pointer',
  },
  btnIcon: {
    background: '#141824', border: '1px solid #1e2438',
    color: '#7a849e', borderRadius: 8,
    padding: '8px', display: 'flex', alignItems: 'center',
    cursor: 'pointer', transition: 'color .15s',
  },

  // Sin conexión
  noConn:    { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f1117' },
  noConnBox: { textAlign: 'center', padding: 40, maxWidth: 420 },
  code: {
    display: 'block', background: '#141824',
    border: '1px solid #1e2438', borderRadius: 9,
    padding: '12px 20px', fontFamily: 'monospace',
    color: '#f5a623', fontSize: 13,
  },

  // Modal
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(5,7,12,.8)',
    backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    animation: 'fadeIn .2s ease',
  },
  confirmBox: {
    background: '#141824',
    border: '1px solid #1e2438',
    borderRadius: 14, padding: 28,
    maxWidth: 380, width: '90%',
    textAlign: 'center',
    animation: 'slideUp .25s ease',
  },
}
import { useState, useEffect, useCallback } from 'react'
import ProductForm from './components/ProductForm.jsx'
import { useToast, ToastContainer } from './components/Toast.jsx'
import * as api from './api.js'

// ─── Íconos SVG inline ────────────────────────────────────────────────────────
const Icon = {
  edit:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  toggle: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="1" y="5" width="22" height="14" rx="7"/><circle cx="16" cy="12" r="3" fill="currentColor"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  pkg:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
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

  // ── Cargar categorías una sola vez ──────────────────────────────────────────
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

  // Reset página al cambiar filtros
  useEffect(() => { setPagina(1) }, [busqueda, catFiltro, soloActivos])

  // ── Guardar (crear o editar) ─────────────────────────────────────────────────
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontFamily: 'Syne', color: '#f5a623', marginBottom: 8 }}>Backend no disponible</h2>
          <p style={{ color: '#7a849e', marginBottom: 20 }}>
            Asegurate de que el servidor FastAPI esté corriendo:
          </p>
          <code style={S.code}>uvicorn main:app --reload</code>
          <p style={{ color: '#7a849e', marginTop: 16, fontSize: 13 }}>
            Luego recargá esta página.
          </p>
          <button onClick={() => { setBackendOk(null); cargarProductos() }} style={S.btnPrimary}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={S.app}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={S.sidebar}>
        <div style={S.logo}>
          <span style={S.logoIcon}>{Icon.pkg}</span>
          <div>
            <div style={S.logoTitle}>Polijuar</div>
            <div style={S.logoSub}>Descartables</div>
          </div>
        </div>
        <nav style={S.nav}>
          <div style={{ ...S.navItem, ...S.navActive }}>📦 Productos</div>
          <div style={{ ...S.navItem, color: '#3d4460' }}>🏷️ Categorías <span style={S.badge}>pronto</span></div>
          <div style={{ ...S.navItem, color: '#3d4460' }}>📊 Reportes <span style={S.badge}>pronto</span></div>
        </nav>
        <div style={S.sidebarFooter}>
          <div style={S.stat}>
            <span style={S.statN}>{total}</span>
            <span style={S.statL}>productos</span>
          </div>
          <div style={S.stat}>
            <span style={S.statN}>{categorias.length}</span>
            <span style={S.statL}>categorías</span>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ─────────────────────────────────────────────── */}
      <main style={S.main}>
        {/* Toolbar */}
        <div style={S.toolbar}>
          <div style={S.toolbarLeft}>
            <h1 style={S.pageTitle}>Productos</h1>
            <span style={S.totalBadge}>{total} resultados</span>
          </div>
          <button onClick={() => { setEditando(null); setFormOpen(true) }} style={S.btnPrimary}>
            + Nuevo producto
          </button>
        </div>

        {/* Filtros */}
        <div style={S.filters}>
          <div style={S.searchBox}>
            <span style={S.searchIcon}>{Icon.search}</span>
            <input
              style={S.searchInput}
              placeholder="Buscar por nombre o código…"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <select style={S.select} value={catFiltro} onChange={e => setCatFiltro(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
          <label style={S.checkFilter}>
            <input type="checkbox" checked={soloActivos}
              onChange={e => setSoloActivos(e.target.checked)} />
            Solo activos
          </label>
        </div>

        {/* Tabla */}
        <div style={S.tableWrap}>
          {loadingData ? (
            <div style={S.loading}>Cargando…</div>
          ) : productos.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div>No hay productos que coincidan</div>
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  {['Código','Nombre','Categoría','Unidad','Precio','Stock','Estado','Acciones']
                    .map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {productos.map((p, i) => (
                  <tr key={p.id} style={{ ...S.tr, background: i % 2 === 0 ? '#181c27' : '#1a1f30' }}>
                    <td style={{ ...S.td, fontFamily: 'monospace', color: '#f5a623', fontSize: 12 }}>{p.codigo}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{p.nombre}</td>
                    <td style={{ ...S.td, color: '#7a849e', fontSize: 12 }}>{catNombre(p.categoria_id)}</td>
                    <td style={{ ...S.td, color: '#7a849e', fontSize: 12 }}>{p.unidad_venta}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: '#4cba7f' }}>
                      ${Number(p.precio).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...S.td, textAlign: 'center' }}>
                      <span style={{ ...S.stockBadge, background: p.stock > 10 ? '#1a2d1a' : '#3d1a1a', color: p.stock > 10 ? '#4cba7f' : '#e05252' }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={S.td}>
                      <span style={{ ...S.statusDot, background: p.activo ? '#4cba7f' : '#e05252' }} />
                      <span style={{ fontSize: 11, color: p.activo ? '#4cba7f' : '#e05252' }}>
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ ...S.td, ...S.actions }}>
                      <button title="Editar" style={S.iconBtn}
                        onClick={() => { setEditando(p); setFormOpen(true) }}>
                        {Icon.edit}
                      </button>
                      <button title={p.activo ? 'Desactivar' : 'Activar'} style={{ ...S.iconBtn, color: '#f5a623' }}
                        onClick={() => handleToggle(p)}>
                        {Icon.toggle}
                      </button>
                      <button title="Eliminar" style={{ ...S.iconBtn, color: '#e05252' }}
                        onClick={() => setConfirmDel(p)}>
                        {Icon.trash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div style={S.pagination}>
            <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} style={S.pageBtn}>← Anterior</button>
            <span style={{ color: '#7a849e', fontSize: 13 }}>Página {pagina} de {totalPaginas}</span>
            <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)} style={S.pageBtn}>Siguiente →</button>
          </div>
        )}
      </main>

      {/* ── Modal formulario ──────────────────────────────────────────────────── */}
      {formOpen && (
        <ProductForm
          producto={editando}
          categorias={categorias}
          loading={loadingSave}
          onSave={handleSave}
          onCancel={() => { setFormOpen(false); setEditando(null) }}
        />
      )}

      {/* ── Confirm eliminar ─────────────────────────────────────────────────── */}
      {confirmDel && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.65)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:100 }}>
          <div style={{ background:'#181c27',border:'1px solid #2a3045',borderRadius:14,padding:28,maxWidth:380,width:'90%' }}>
            <h3 style={{ fontFamily:'Syne',color:'#e05252',marginBottom:12 }}>¿Eliminar producto?</h3>
            <p style={{ color:'#7a849e',marginBottom:24,fontSize:13 }}>
              Vas a eliminar <strong style={{ color:'#e8eaf0' }}>"{confirmDel.nombre}"</strong> permanentemente. Esta acción no se puede deshacer.
            </p>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end' }}>
              <button onClick={() => setConfirmDel(null)} style={S.btnSecondary}>Cancelar</button>
              <button onClick={handleEliminar} style={{ ...S.btnPrimary, background:'#e05252' }}>Eliminar</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} />

      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideIn { from { transform:translateX(20px);opacity:0 } to { transform:translateX(0);opacity:1 } }
        input:focus, select:focus, textarea:focus { border-color: #f5a623 !important; }
        tr:hover td { background: rgba(245,166,35,.04) !important; }
        button:disabled { opacity: .45; cursor: not-allowed; }
      `}</style>
    </div>
  )
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const S = {
  app:         { display:'flex', height:'100vh', overflow:'hidden', background:'#0f1117' },
  sidebar:     { width:220, background:'#181c27', borderRight:'1px solid #2a3045', display:'flex', flexDirection:'column', padding:'24px 0', flexShrink:0 },
  logo:        { display:'flex', alignItems:'center', gap:10, padding:'0 20px 28px', borderBottom:'1px solid #2a3045' },
  logoIcon:    { color:'#f5a623' },
  logoTitle:   { fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:16, color:'#e8eaf0', lineHeight:1.1 },
  logoSub:     { fontSize:10, color:'#7a849e', textTransform:'uppercase', letterSpacing:'.1em' },
  nav:         { flex:1, padding:'20px 12px', display:'flex', flexDirection:'column', gap:4 },
  navItem:     { padding:'9px 12px', borderRadius:8, cursor:'pointer', color:'#7a849e', fontSize:13, display:'flex', alignItems:'center', gap:8 },
  navActive:   { background:'rgba(245,166,35,.12)', color:'#f5a623', fontWeight:600 },
  badge:       { fontSize:10, background:'#2a3045', color:'#7a849e', padding:'2px 6px', borderRadius:4, marginLeft:'auto' },
  sidebarFooter:{ padding:'20px', borderTop:'1px solid #2a3045', display:'flex', gap:20 },
  stat:        { display:'flex', flexDirection:'column' },
  statN:       { fontFamily:'Syne,sans-serif', fontWeight:700, fontSize:20, color:'#f5a623' },
  statL:       { fontSize:10, color:'#7a849e', textTransform:'uppercase', letterSpacing:'.05em' },

  main:        { flex:1, display:'flex', flexDirection:'column', overflow:'hidden' },
  toolbar:     { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 28px 0' },
  toolbarLeft: { display:'flex', alignItems:'baseline', gap:12 },
  pageTitle:   { fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:800, color:'#e8eaf0' },
  totalBadge:  { fontSize:12, color:'#7a849e' },

  filters:     { display:'flex', alignItems:'center', gap:12, padding:'16px 28px', flexWrap:'wrap' },
  searchBox:   { position:'relative', flex:1, minWidth:200 },
  searchIcon:  { position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#7a849e' },
  searchInput: { width:'100%', padding:'9px 12px 9px 36px', background:'#1f2435', border:'1.5px solid #2a3045', borderRadius:8, color:'#e8eaf0', fontSize:13, outline:'none' },
  select:      { padding:'9px 12px', background:'#1f2435', border:'1.5px solid #2a3045', borderRadius:8, color:'#e8eaf0', fontSize:13, outline:'none' },
  checkFilter: { display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#7a849e', cursor:'pointer', whiteSpace:'nowrap' },

  tableWrap:   { flex:1, overflow:'auto', padding:'0 28px 20px' },
  table:       { width:'100%', borderCollapse:'collapse' },
  th:          { textAlign:'left', padding:'10px 12px', fontSize:11, fontWeight:700, color:'#7a849e', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #2a3045', whiteSpace:'nowrap' },
  tr:          { transition:'background .1s' },
  td:          { padding:'11px 12px', borderBottom:'1px solid #1f2435', verticalAlign:'middle', fontSize:13 },
  actions:     { display:'flex', gap:4 },
  iconBtn:     { background:'transparent', border:'none', color:'#7a849e', padding:'5px', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', transition:'color .15s, background .15s', cursor:'pointer' },
  stockBadge:  { display:'inline-block', padding:'2px 8px', borderRadius:20, fontSize:12, fontWeight:600 },
  statusDot:   { display:'inline-block', width:6, height:6, borderRadius:'50%', marginRight:5 },

  loading:     { textAlign:'center', padding:60, color:'#7a849e' },
  empty:       { textAlign:'center', padding:60, color:'#7a849e' },

  pagination:  { display:'flex', alignItems:'center', gap:16, justifyContent:'center', padding:'16px 28px', borderTop:'1px solid #2a3045' },
  pageBtn:     { background:'#1f2435', border:'1px solid #2a3045', color:'#e8eaf0', padding:'7px 16px', borderRadius:8, fontSize:13, transition:'background .15s' },

  btnPrimary:  { background:'#f5a623', color:'#0f1117', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:700, fontSize:13, fontFamily:'Syne,sans-serif', cursor:'pointer', whiteSpace:'nowrap' },
  btnSecondary:{ background:'transparent', color:'#7a849e', border:'1.5px solid #2a3045', borderRadius:8, padding:'10px 18px', fontSize:13, cursor:'pointer' },

  noConn:      { display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' },
  noConnBox:   { textAlign:'center', padding:40, maxWidth:420 },
  code:        { display:'block', background:'#181c27', border:'1px solid #2a3045', borderRadius:8, padding:'12px 20px', fontFamily:'monospace', color:'#f5a623', fontSize:13 },
}
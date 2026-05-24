export default function ProductForm({ producto, categorias, loading, onSave, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: '#181c27', border: '1px solid #2a3045', borderRadius: 14, padding: 28, maxWidth: 500, width: '90%' }}>
        <h3 style={{ fontFamily: 'Syne', color: '#f5a623', marginBottom: 20 }}>
          {producto ? 'Editar Producto' : 'Nuevo Producto'}
        </h3>
        <p style={{ color: '#7a849e', marginBottom: 20 }}>El formulario está listo para ser programado.</p>
        <button onClick={onCancel} style={{ background: 'transparent', color: '#7a849e', border: '1.5px solid #2a3045', borderRadius: 8, padding: '10px 18px', cursor: 'pointer' }}>
          Cerrar
        </button>
      </div>
    </div>
  )
}
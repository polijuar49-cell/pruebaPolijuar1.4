import { useState, useEffect } from 'react'

export default function ProductForm({ producto, categorias, loading, onSave, onCancel }) {
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    categoria_id: '',
    descripcion: '',
    precio: '',
    unidad_venta: 'unidad',
    stock: 0,
    activo: true,
  })
  const [errors, setErrors] = useState({})

  // Cargar datos si estamos editando
  useEffect(() => {
    if (producto) {
      setForm({
        codigo: producto.codigo || '',
        nombre: producto.nombre || '',
        categoria_id: producto.categoria_id || '',
        descripcion: producto.descripcion || '',
        precio: producto.precio !== undefined ? Number(producto.precio) : '',
        unidad_venta: producto.unidad_venta || 'unidad',
        stock: producto.stock !== undefined ? producto.stock : 0,
        activo: producto.activo !== undefined ? producto.activo : true,
      })
    }
  }, [producto])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    // Limpiar error al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!form.codigo.trim()) newErrors.codigo = 'El código es requerido'
    if (!form.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!form.categoria_id) newErrors.categoria_id = 'La categoría es requerida'
    
    if (form.precio === '' || isNaN(form.precio) || Number(form.precio) < 0) {
      newErrors.precio = 'El precio debe ser un número positivo'
    }
    if (form.stock === '' || isNaN(form.stock) || Number(form.stock) < 0) {
      newErrors.stock = 'El stock debe ser mayor o igual a 0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const data = {
      ...form,
      categoria_id: Number(form.categoria_id),
      precio: Number(form.precio),
      stock: Number(form.stock),
    }
    onSave(data)
  }

  return (
    <div style={S.overlay}>
      <div style={S.modal}>
        <div style={S.header}>
          <h2 style={S.title}>{producto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button style={S.closeBtn} onClick={onCancel}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.grid}>
            {/* Código */}
            <div style={S.field}>
              <label style={S.label}>Código *</label>
              <input
                type="text"
                name="codigo"
                value={form.codigo}
                onChange={handleChange}
                placeholder="Ej: BOL-CAM-01"
                style={{ ...S.input, borderColor: errors.codigo ? '#e05252' : '#2a3045' }}
                disabled={loading}
              />
              {errors.codigo && <span style={S.errorText}>{errors.codigo}</span>}
            </div>

            {/* Nombre */}
            <div style={S.field}>
              <label style={S.label}>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Ej: Bolsa Camiseta Chica"
                style={{ ...S.input, borderColor: errors.nombre ? '#e05252' : '#2a3045' }}
                disabled={loading}
              />
              {errors.nombre && <span style={S.errorText}>{errors.nombre}</span>}
            </div>

            {/* Categoría */}
            <div style={S.field}>
              <label style={S.label}>Categoría *</label>
              <select
                name="categoria_id"
                value={form.categoria_id}
                onChange={handleChange}
                style={{ ...S.select, borderColor: errors.categoria_id ? '#e05252' : '#2a3045' }}
                disabled={loading}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
              {errors.categoria_id && <span style={S.errorText}>{errors.categoria_id}</span>}
            </div>

            {/* Unidad de Venta */}
            <div style={S.field}>
              <label style={S.label}>Unidad de Venta</label>
              <input
                type="text"
                name="unidad_venta"
                value={form.unidad_venta}
                onChange={handleChange}
                placeholder="Ej: paquete x100"
                style={S.input}
                disabled={loading}
              />
            </div>

            {/* Precio */}
            <div style={S.field}>
              <label style={S.label}>Precio ($) *</label>
              <input
                type="number"
                name="precio"
                value={form.precio}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                style={{ ...S.input, borderColor: errors.precio ? '#e05252' : '#2a3045' }}
                disabled={loading}
              />
              {errors.precio && <span style={S.errorText}>{errors.precio}</span>}
            </div>

            {/* Stock */}
            <div style={S.field}>
              <label style={S.label}>Stock *</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="0"
                style={{ ...S.input, borderColor: errors.stock ? '#e05252' : '#2a3045' }}
                disabled={loading}
              />
              {errors.stock && <span style={S.errorText}>{errors.stock}</span>}
            </div>
          </div>

          {/* Descripción */}
          <div style={S.field}>
            <label style={S.label}>Descripción</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Detalles del producto (opcional)..."
              style={S.textarea}
              rows="3"
              disabled={loading}
            />
          </div>

          {/* Activo (Checkbox) */}
          <div style={S.checkboxField}>
            <label style={S.checkboxLabel}>
              <input
                type="checkbox"
                name="activo"
                checked={form.activo}
                onChange={handleChange}
                style={S.checkbox}
                disabled={loading}
              />
              Producto activo y visible en el catálogo
            </label>
          </div>

          {/* Acciones */}
          <div style={S.actions}>
            <button
              type="button"
              onClick={onCancel}
              style={S.btnSecondary}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={S.btnPrimary}
              disabled={loading}
            >
              {loading ? 'Guardando...' : (producto ? 'Guardar Cambios' : 'Crear Producto')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(10, 11, 16, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    background: '#181c27',
    border: '1px solid #2a3045',
    borderRadius: 14,
    width: '95%',
    maxWidth: 580,
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #2a3045',
  },
  title: {
    fontFamily: 'Syne, sans-serif',
    fontSize: 18,
    fontWeight: 700,
    color: '#e8eaf0',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#7a849e',
    fontSize: 16,
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color 0.15s',
  },
  form: {
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: 600,
    color: '#7a849e',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    padding: '9px 12px',
    background: '#1f2435',
    border: '1.5px solid #2a3045',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  select: {
    padding: '9px 12px',
    background: '#1f2435',
    border: '1.5px solid #2a3045',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 13,
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  textarea: {
    padding: '9px 12px',
    background: '#1f2435',
    border: '1.5px solid #2a3045',
    borderRadius: 8,
    color: '#e8eaf0',
    fontSize: 13,
    outline: 'none',
    resize: 'vertical',
    transition: 'border-color 0.15s',
  },
  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#7a849e',
    cursor: 'pointer',
  },
  checkbox: {
    accentColor: '#f5a623',
    width: 16,
    height: 16,
    cursor: 'pointer',
  },
  errorText: {
    fontSize: 11,
    color: '#e05252',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
    borderTop: '1px solid #2a3045',
    paddingTop: 16,
  },
  btnPrimary: {
    background: '#f5a623',
    color: '#0f1117',
    border: 'none',
    borderRadius: 8,
    padding: '10px 20px',
    fontWeight: 700,
    fontSize: 13,
    fontFamily: 'Syne, sans-serif',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    background: 'transparent',
    color: '#7a849e',
    border: '1.5px solid #2a3045',
    borderRadius: 8,
    padding: '10px 18px',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  },
}

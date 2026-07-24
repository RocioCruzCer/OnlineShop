import { useState, useEffect } from 'react';
import { productos as api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const emptyForm = { nombre: '', descripcion: '', precio: '', stock: '' };

export default function Catalogo({ onAddToCart, refreshTrigger }) {
  const { usuario } = useAuth();
  const isAdmin = usuario?.rol === 'ADMIN';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedId, setAddedId] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [imagenData, setImagenData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const cargar = () => {
    setLoading(true);
    api.listar()
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);
  useEffect(() => { cargar(); }, [refreshTrigger]);

  const handleAdd = (producto) => {
    if (!usuario) {
      alert('Debes iniciar sesion para agregar productos al carrito.');
      return;
    }
    onAddToCart(producto);
    setAddedId(producto.id);
    setTimeout(() => setAddedId(null), 800);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditId(null);
    setModalError('');
    setImagenPreview(null);
    setImagenData(null);
    setShowModal(true);
  };

  const openEdit = (p) => {
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion || '',
      precio: String(p.precio),
      stock: String(p.stock),
    });
    setEditId(p.id);
    setModalError('');
    setImagenPreview(p.imagenData || null);
    setImagenData(p.imagenData || null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm(emptyForm);
    setModalError('');
    setImagenPreview(null);
    setImagenData(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setModalError('Solo se permiten archivos de imagen.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagenData(ev.target.result);
      setImagenPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: parseFloat(form.precio),
      stock: parseInt(form.stock, 10),
      imagenData: imagenData || null,
    };
    try {
      if (editId) {
        await api.actualizar(editId, payload);
      } else {
        await api.crear(payload);
      }
      closeModal();
      cargar();
    } catch (err) {
      setModalError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, nombre) => {
    if (!window.confirm(`Eliminar "${nombre}"?`)) return;
    try {
      await api.eliminar(id);
      cargar();
    } catch (err) {
      setError(err.message || 'Error al eliminar');
    }
  };

  if (loading) return <Loader />;
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.5rem', color: 'var(--text)' }}>Catalogo de Productos</h2>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>+ Agregar Nuevo Producto</button>
        )}
      </div>

      {items.length === 0 && <p style={{ color: 'var(--text-dim)' }}>No hay productos disponibles.</p>}

      <div className="product-grid">
        {items.map((p) => (
          <div key={p.id} className="card">
            <div className="card-image-container">
              {p.imagenData ? (
                <img src={p.imagenData} alt={p.nombre} className="card-image" />
              ) : (
                <div className="card-image-placeholder">
                  <span style={{ fontSize: '2.5rem' }}>&#128722;</span>
                </div>
              )}
            </div>
            <h3 className="card-title">{p.nombre}</h3>
            <p className="card-desc">{p.descripcion || 'Sin descripcion'}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                <span className="price">${Number(p.precio).toFixed(2)}</span>
                <span className={`stock ${p.stock === 0 ? 'stock-out' : ''}`}>
                  {p.stock > 0 ? `${p.stock} en stock` : 'Agotado'}
                </span>
              </div>
              {isAdmin ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }} onClick={() => openEdit(p)}>Editar</button>
                  <button className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--danger)', borderColor: 'var(--danger-border)' }} onClick={() => handleDelete(p.id, p.nombre)}>Eliminar</button>
                </div>
              ) : (
                <button
                  className={`btn btn-primary ${addedId === p.id ? 'btn-added' : ''}`}
                  onClick={() => handleAdd(p)}
                  disabled={p.stock === 0 || addedId === p.id}
                >
                  {addedId === p.id ? 'Agregado' : '+ Agregar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>
              {editId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            {modalError && <div className="alert alert-error" style={{ marginBottom: '14px' }}>{modalError}</div>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input className="form-input" name="nombre" value={form.nombre} onChange={handleChange} required placeholder="Ej: Laptop HP" />
              </div>
              <div className="form-group">
                <label className="form-label">Descripcion</label>
                <input className="form-input" name="descripcion" value={form.descripcion} onChange={handleChange} placeholder="Descripcion del producto" />
              </div>
              <div className="form-group">
                <label className="form-label">Imagen del Producto</label>
                <label className="file-input-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                  />
                  <span className="file-input-button">Seleccionar imagen...</span>
                  {imagenPreview && <span className="file-input-name">Imagen seleccionada</span>}
                </label>
              </div>
              {imagenPreview && (
                <div style={{ textAlign: 'center', position: 'relative' }}>
                  <img src={imagenPreview} alt="Vista previa" className="image-preview" />
                  <button
                    type="button"
                    className="image-remove-btn"
                    onClick={() => { setImagenPreview(null); setImagenData(null); }}
                  >
                    &#10005;
                  </button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Precio *</label>
                  <input className="form-input" name="precio" type="number" step="0.01" min="0" value={form.precio} onChange={handleChange} required placeholder="0.00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock *</label>
                  <input className="form-input" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
                </button>
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Loader() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
      <div className="spinner" />
      <p style={{ marginTop: '14px' }}>Cargando productos...</p>
    </div>
  );
}

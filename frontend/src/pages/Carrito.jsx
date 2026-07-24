import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { carrito as apiCarrito, pedidos as apiPedidos, productos as apiProductos } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatProdId(id) {
  return `PROD-${String(id).padStart(4, '0')}`;
}

export default function Carrito({ items, onUpdateQty, onRemoveItem, onClearCart, onOrderPlaced }) {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [productMap, setProductMap] = useState({});

  useEffect(() => {
    if (items.length === 0) return;
    const ids = [...new Set(items.map((i) => i.productoId).filter(Boolean))];
    const missing = ids.filter((id) => !productMap[id]);
    if (missing.length === 0) return;
    missing.forEach((id) => {
      apiProductos.obtener(id)
        .then((p) => setProductMap((prev) => ({ ...prev, [id]: p })))
        .catch(() => setProductMap((prev) => ({ ...prev, [id]: { nombre: `Producto ${id}` } })));
    });
  }, [items]);

  const total = items.reduce((sum, i) => sum + i.precioUnitario * i.cantidad, 0);

  const getProductName = (productoId) => {
    const p = productMap[productoId];
    if (!p) return `Producto ${productoId}`;
    return `${p.nombre} (${formatProdId(productoId)})`;
  };

  const handleCheckout = async () => {
    if (!usuario) { alert('Inicia sesion para continuar.'); return; }
    if (items.length === 0) { alert('El carrito esta vacio.'); return; }

    setProcessing(true);
    try {
      const pedido = {
        usuarioId: usuario.id,
        total,
        estado: 'PENDIENTE',
        detalles: items.map((i) => ({
          productoId: i.productoId,
          cantidad: i.cantidad,
          precioUnitario: i.precioUnitario,
        })),
      };
      await apiPedidos.crear(pedido);
      await apiCarrito.vaciar(usuario.id);
      onClearCart();
      onOrderPlaced();
      alert('Pedido registrado exitosamente.');
      navigate('/pedidos');
    } catch (e) {
      alert('Error al procesar el pedido: ' + e.message);
    } finally {
      setProcessing(false);
    }
  };

  if (!usuario) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Inicia sesion para ver tu carrito.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>
          Ir a Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text)' }}>Tu Carrito</h2>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: '3rem', marginBottom: '10px' }}>&#128722;</p>
          <p>El carrito esta vacio.</p>
          <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
            Ver Catalogo
          </button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item) => (
              <div key={item.id} className="cart-item">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.95rem' }}>{getProductName(item.productoId)}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                    ${Number(item.precioUnitario).toFixed(2)} c/u
                  </div>
                </div>
                <div className="qty-controls">
                  <button className="qty-btn" onClick={() => onUpdateQty(item, -1)} disabled={item.cantidad <= 1}>&#8722;</button>
                  <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: '600', color: 'var(--text)' }}>{item.cantidad}</span>
                  <button className="qty-btn" onClick={() => onUpdateQty(item, 1)}>+</button>
                </div>
                <div style={{ fontWeight: '700', color: 'var(--accent)', minWidth: '80px', textAlign: 'right' }}>
                  ${(item.precioUnitario * item.cantidad).toFixed(2)}
                </div>
                <button className="qty-btn" style={{ color: 'var(--danger)', marginLeft: '6px' }} onClick={() => onRemoveItem(item.id)}>
                  &#10005;
                </button>
              </div>
            ))}
          </div>

          <div className="cart-total">
            <span>Total</span>
            <span className="price">${total.toFixed(2)}</span>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClearCart}>
              Vaciar Carrito
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleCheckout} disabled={processing}>
              {processing ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

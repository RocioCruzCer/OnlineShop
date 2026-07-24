import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pedidos as api, usuarios as apiUsuarios, productos as apiProductos } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ESTADOS = ['PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO'];

const ESTADO_COLORS = {
  PENDIENTE: { bg: '#FEF3C7', color: '#92400E' },
  CONFIRMADO: { bg: '#DBEAFE', color: '#1E40AF' },
  ENVIADO: { bg: '#E9D5FF', color: '#6B21A8' },
  ENTREGADO: { bg: '#D1FAE5', color: '#065F46' },
  CANCELADO: { bg: '#FEE2E2', color: '#991B1B' },
};

function formatPedidoId(id) {
  return `PED-${String(id).padStart(4, '0')}`;
}

function formatProdId(id) {
  return `PROD-${String(id).padStart(4, '0')}`;
}

function formatFullDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} a las ${hours}:${minutes}`;
}

function getDeliveryEstimate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 3);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function Pedidos() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [userCache, setUserCache] = useState({});
  const [productCache, setProductCache] = useState({});
  const isAdmin = usuario?.rol === 'ADMIN';

  const cargar = () => {
    setLoading(true);
    setError(null);
    const request = isAdmin ? api.listarTodos() : api.listarPorUsuario(usuario.id);
    request
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!usuario) return;
    cargar();
  }, [usuario, isAdmin]);

  useEffect(() => {
    if (!isAdmin || orders.length === 0) return;
    const ids = [...new Set(orders.map((o) => o.usuarioId).filter(Boolean))];
    const missing = ids.filter((id) => !userCache[id]);
    if (missing.length === 0) return;
    missing.forEach((id) => {
      apiUsuarios.obtener(id)
        .then((u) => setUserCache((prev) => ({ ...prev, [id]: u })))
        .catch(() => setUserCache((prev) => ({ ...prev, [id]: { username: `Usuario #${id}` } })));
    });
  }, [orders, isAdmin]);

  useEffect(() => {
    if (orders.length === 0) return;
    const allProdIds = [...new Set(orders.flatMap((o) => (o.detalles || []).map((d) => d.productoId)).filter(Boolean))];
    const missing = allProdIds.filter((id) => !productCache[id]);
    if (missing.length === 0) return;
    missing.forEach((id) => {
      apiProductos.obtener(id)
        .then((p) => setProductCache((prev) => ({ ...prev, [id]: p })))
        .catch(() => setProductCache((prev) => ({ ...prev, [id]: { nombre: `Producto ${id}` } })));
    });
  }, [orders]);

  const getProductName = (productoId) => {
    const p = productCache[productoId];
    if (!p) return `Producto ${productoId}`;
    return `${p.nombre} (${formatProdId(productoId)})`;
  };

  const handleCambiarEstado = async (pedidoId, nuevoEstado) => {
    try {
      await api.actualizarEstado(pedidoId, nuevoEstado);
      cargar();
      setSuccess(`Pedido ${formatPedidoId(pedidoId)} actualizado a "${nuevoEstado}"`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Error al actualizar estado: ' + e.message);
      setTimeout(() => setError(null), 4000);
    }
  };

  if (!usuario) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Inicia sesion para ver los pedidos.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/login')}>
          Ir a Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-dim)' }}>
        <div className="spinner" />
        <p style={{ marginTop: '14px' }}>Cargando pedidos...</p>
      </div>
    );
  }

  if (error) return <div className="alert alert-error">{error}</div>;

  if (isAdmin) return <AdminPedidos orders={orders} success={success} onCambiarEstado={handleCambiarEstado} userCache={userCache} getProductName={getProductName} />;

  return <ClientePedidos orders={orders} navigate={navigate} getProductName={getProductName} />;
}

function ClientePedidos({ orders, navigate, getProductName }) {
  const estadoStyle = (estado) => ESTADO_COLORS[estado] || { bg: '#E5E7EB', color: '#374151' };

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text)' }}>Mis Pedidos</h2>

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '10px' }}>&#128230;</p>
          <p>No tienes pedidos aun.</p>
          <button className="btn btn-outline" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
            Ir al Catalogo
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {orders.map((pedido) => {
            const fechaCompra = formatFullDate(pedido.fechaCreacion);
            const delivery = getDeliveryEstimate(pedido.fechaCreacion);
            const es = estadoStyle(pedido.estado);

            return (
              <div key={pedido.id} className="card" style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>{formatPedidoId(pedido.id)}</span>
                  <span style={{
                    fontSize: '0.78rem', fontWeight: '600', padding: '3px 10px',
                    borderRadius: '999px', color: es.color, background: es.bg,
                  }}>
                    {pedido.estado}
                  </span>
                </div>

                {fechaCompra && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '6px' }}>
                    Comprado el: <span style={{ color: 'var(--text-muted)', fontWeight: '500' }}>{fechaCompra}</span>
                  </div>
                )}

                {(pedido.estado === 'PENDIENTE' || pedido.estado === 'CONFIRMADO' || pedido.estado === 'ENVIADO') && delivery && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    Entrega estimada: <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{delivery}</span>
                  </div>
                )}

                {pedido.estado === 'ENTREGADO' && pedido.fechaEntrega && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    Entregado el: <span style={{ color: 'var(--accent)', fontWeight: '600' }}>{formatFullDate(pedido.fechaEntrega)}</span>
                  </div>
                )}

                {pedido.estado === 'CANCELADO' && pedido.fechaCancelacion && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginBottom: '10px' }}>
                    Cancelado el: <span style={{ color: 'var(--danger)', fontWeight: '600' }}>{formatFullDate(pedido.fechaCancelacion)}</span>
                  </div>
                )}

                {pedido.detalles && pedido.detalles.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    {pedido.detalles.map((d) => (
                      <div key={d.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '6px 0', borderBottom: '1px solid var(--border-light)',
                        fontSize: '0.88rem', color: 'var(--text-muted)',
                      }}>
                        <span>{getProductName(d.productoId)} x {d.cantidad} unidades</span>
                        <span style={{ color: 'var(--accent)', fontWeight: '600' }}>
                          ${(d.precioUnitario * d.cantidad).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ textAlign: 'right', fontSize: '1.05rem' }}>
                  <span style={{ color: 'var(--text-dim)' }}>Total: </span>
                  <span className="price">${Number(pedido.total).toFixed(2)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AdminPedidos({ orders, success, onCambiarEstado, userCache, getProductName }) {
  function getEstadoDate(pedido) {
    if (pedido.estado === 'ENTREGADO' && pedido.fechaEntrega) return formatFullDate(pedido.fechaEntrega);
    if (pedido.estado === 'CANCELADO' && pedido.fechaCancelacion) return formatFullDate(pedido.fechaCancelacion);
    return '—';
  }

  return (
    <div style={{ width: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: 'var(--text)' }}>Gestion Global de Pedidos</h2>

      {success && (
        <div className="alert" style={{
          background: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0',
          marginBottom: '16px',
        }}>{success}</div>
      )}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-dim)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '10px' }}>&#128230;</p>
          <p>No hay pedidos registrados en la tienda.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Fecha Pedido</th>
                <th>Fecha Estado / Entrega</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Accion</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((pedido) => {
                const user = userCache[pedido.usuarioId];
                const es = ESTADO_COLORS[pedido.estado] || { bg: '#E5E7EB', color: '#374151' };
                return (
                  <tr key={pedido.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text)' }}>{formatPedidoId(pedido.id)}</td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {user ? user.username : `#${pedido.usuarioId}`}
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {formatFullDate(pedido.fechaCreacion) || '—'}
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                      {getEstadoDate(pedido)}
                    </td>
                    <td className="price" style={{ fontSize: '1rem' }}>
                      ${Number(pedido.total).toFixed(2)}
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem', fontWeight: '600', padding: '3px 10px',
                        borderRadius: '999px', color: es.color, background: es.bg,
                      }}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <select
                        className="form-input"
                        style={{
                          padding: '5px 8px', fontSize: '0.8rem', width: '160px',
                          borderRadius: '6px', cursor: 'pointer',
                        }}
                        value={pedido.estado}
                        onChange={(e) => onCambiarEstado(pedido.id, e.target.value)}
                      >
                        {ESTADOS.map((est) => (
                          <option key={est} value={est}>{est}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

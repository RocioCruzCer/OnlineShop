const API_USUARIOS = 'https://usuario-service-production-a6a3.up.railway.app/api';
const API_PRODUCTOS = 'https://producto-service-production-a90b.up.railway.app/api';
const API_CARRITO = 'https://carrito-service-production-ac81.up.railway.app/api';
const API_PEDIDOS = 'https://pedido-service-production.up.railway.app/api';

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Error ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const usuarios = {
  registrar: (data) => request(`${API_USUARIOS}/usuarios/registro`, { method: 'POST', body: JSON.stringify(data) }),
  listar: () => request(`${API_USUARIOS}/usuarios`),
  obtener: (id) => request(`${API_USUARIOS}/usuarios/${id}`),
};

export const productos = {
  listar: () => request(`${API_PRODUCTOS}/productos`),
  obtener: (id) => request(`${API_PRODUCTOS}/productos/${id}`),
  crear: (data) => request(`${API_PRODUCTOS}/productos`, { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id, data) => request(`${API_PRODUCTOS}/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminar: (id) => request(`${API_PRODUCTOS}/productos/${id}`, { method: 'DELETE' }),
};

export const carrito = {
  obtener: (usuarioId) => request(`${API_CARRITO}/carrito/usuario/${usuarioId}`),
  agregar: (item) => request(`${API_CARRITO}/carrito`, { method: 'POST', body: JSON.stringify(item) }),
  eliminar: (itemId) => request(`${API_CARRITO}/carrito/${itemId}`, { method: 'DELETE' }),
  vaciar: (usuarioId) => request(`${API_CARRITO}/carrito/usuario/${usuarioId}`, { method: 'DELETE' }),
};

export const pedidos = {
  crear: (data) => request(`${API_PEDIDOS}/pedidos`, { method: 'POST', body: JSON.stringify(data) }),
  listarTodos: () => request(`${API_PEDIDOS}/pedidos`),
  listarPorUsuario: (usuarioId) => request(`${API_PEDIDOS}/pedidos/usuario/${usuarioId}`),
  actualizarEstado: (id, estado) => request(`${API_PEDIDOS}/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
};
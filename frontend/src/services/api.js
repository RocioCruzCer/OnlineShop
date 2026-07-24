const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
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
  registrar: (data) => request('/usuarios/registro', { method: 'POST', body: JSON.stringify(data) }),
  listar: () => request('/usuarios'),
  obtener: (id) => request(`/usuarios/${id}`),
};

export const productos = {
  listar: () => request('/productos'),
  obtener: (id) => request(`/productos/${id}`),
  crear: (data) => request('/productos', { method: 'POST', body: JSON.stringify(data) }),
  actualizar: (id, data) => request(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  eliminar: (id) => request(`/productos/${id}`, { method: 'DELETE' }),
};

export const carrito = {
  obtener: (usuarioId) => request(`/carrito/usuario/${usuarioId}`),
  agregar: (item) => request('/carrito', { method: 'POST', body: JSON.stringify(item) }),
  eliminar: (itemId) => request(`/carrito/${itemId}`, { method: 'DELETE' }),
  vaciar: (usuarioId) => request(`/carrito/usuario/${usuarioId}`, { method: 'DELETE' }),
};

export const pedidos = {
  crear: (data) => request('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
  listarTodos: () => request('/pedidos'),
  listarPorUsuario: (usuarioId) => request(`/pedidos/usuario/${usuarioId}`),
  actualizarEstado: (id, estado) => request(`/pedidos/${id}/estado`, { method: 'PUT', body: JSON.stringify({ estado }) }),
};

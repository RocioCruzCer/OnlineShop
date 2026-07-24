import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Catalogo from './pages/Catalogo';
import Carrito from './pages/Carrito';
import Pedidos from './pages/Pedidos';
import Login from './pages/Login';
import { carrito as apiCarrito } from './services/api';
import { useAuth } from './context/AuthContext';

function AppRoutes() {
  const [cartItems, setCartItems] = useState([]);
  const [catalogRefresh, setCatalogRefresh] = useState(0);
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) { setCartItems([]); return; }
    apiCarrito.obtener(usuario.id).then(setCartItems).catch(() => setCartItems([]));
  }, [usuario]);

  const addToCart = useCallback(async (producto) => {
    if (!usuario) return;
    try {
      const item = await apiCarrito.agregar({
        usuarioId: usuario.id,
        productoId: producto.id,
        cantidad: 1,
        precioUnitario: Number(producto.precio),
      });
      setCartItems((prev) => [...prev, item]);
    } catch (e) {
      alert('Error al agregar al carrito: ' + e.message);
    }
  }, [usuario]);

  const updateQty = useCallback(async (item, delta) => {
    const newQty = item.cantidad + delta;
    if (newQty < 1) return;
    try {
      await apiCarrito.eliminar(item.id);
      const added = await apiCarrito.agregar({
        usuarioId: usuario.id,
        productoId: item.productoId,
        cantidad: newQty,
        precioUnitario: item.precioUnitario,
      });
      setCartItems((prev) => prev.map((c) => c.id === item.id ? added : c));
    } catch (e) {
      alert('Error al actualizar cantidad: ' + e.message);
    }
  }, [usuario]);

  const removeItem = useCallback(async (itemId) => {
    try {
      await apiCarrito.eliminar(itemId);
      setCartItems((prev) => prev.filter((c) => c.id !== itemId));
    } catch (e) {
      alert('Error al eliminar item: ' + e.message);
    }
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const handleOrderPlaced = useCallback(() => {
    setCatalogRefresh((prev) => prev + 1);
  }, []);

  return (
    <>
      <Navbar cartCount={cartItems.length} />
      <main style={{ flex: 1, padding: '32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<Catalogo onAddToCart={addToCart} refreshTrigger={catalogRefresh} />} />
          <Route path="/carrito" element={<Carrito items={cartItems} onUpdateQty={updateQty} onRemoveItem={removeItem} onClearCart={clearCart} onOrderPlaced={handleOrderPlaced} />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

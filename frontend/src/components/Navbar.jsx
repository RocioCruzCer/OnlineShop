import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ cartCount }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const isAdmin = usuario?.rol === 'ADMIN';

  const mkLink = (path) => {
    const active = location.pathname === path;
    return {
      to: path,
      style: {
        color: '#FFFFFF',
        textDecoration: 'none',
        fontWeight: active ? '700' : '600',
        padding: '6px 14px',
        borderRadius: '8px',
        background: active ? 'rgba(255,255,255,0.18)' : 'transparent',
        transition: 'all 0.2s',
      },
      onMouseEnter: (e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; },
      onMouseLeave: (e) => { e.currentTarget.style.background = active ? 'rgba(255,255,255,0.18)' : 'transparent'; },
    };
  };

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', background: '#1E293B', borderBottom: '1px solid #0F172A',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <Link to="/" style={{ textDecoration: 'none', fontSize: '1.35rem', fontWeight: '800', color: '#FFFFFF', letterSpacing: '-0.5px' }}>
        OnlineShop
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link {...mkLink('/')}>{isAdmin ? 'Productos' : 'Catalogo'}</Link>
        {!isAdmin && (
          <Link {...mkLink('/carrito')}>
            Carrito {cartCount > 0 && <span style={{
              background: '#FFFFFF', color: '#1E293B', fontSize: '0.75rem',
              padding: '2px 7px', borderRadius: '999px', marginLeft: '4px', fontWeight: '800',
            }}>{cartCount}</span>}
          </Link>
        )}
        {usuario && (
          <Link {...mkLink('/pedidos')}>
            {isAdmin ? 'Pedidos' : 'Mis Pedidos'}
          </Link>
        )}
        {isAdmin && (
          <span style={{
            fontSize: '0.7rem', fontWeight: '800', padding: '3px 8px',
            borderRadius: '6px', background: '#3B82F6', color: '#FFFFFF',
            letterSpacing: '0.5px', textTransform: 'uppercase',
          }}>Admin</span>
        )}
        {usuario ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
            <span style={{
              color: '#FFFFFF', fontSize: '0.85rem', fontWeight: '700',
              background: '#3B82F6', padding: '4px 12px', borderRadius: '999px',
            }}>{usuario.username}</span>
            <button onClick={logout} style={{
              background: '#DC2626', color: '#FFFFFF', border: 'none',
              padding: '6px 14px', borderRadius: '6px', cursor: 'pointer',
              fontSize: '0.8rem', fontWeight: '700',
            }}>Salir</button>
          </div>
        ) : (
          <Link to="/login" style={{
            color: '#1E293B', textDecoration: 'none', fontWeight: '700',
            padding: '6px 14px', borderRadius: '8px', background: '#FFFFFF',
            marginLeft: '12px', transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#E2E8F0'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF'; }}
          >Iniciar Sesion</Link>
        )}
      </div>
    </nav>
  );
}

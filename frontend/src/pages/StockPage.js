import { useEffect, useState, useCallback } from 'react';
import { articulos as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

export default function StockPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [filtroBajo, setFiltroBajo] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.listar({ q: q || undefined, stock_bajo: filtroBajo || undefined, limit: 200 });
      setItems(r.data.items);
      setTotal(r.data.total);
    } catch { toast.error('Error cargando stock'); }
    finally { setLoading(false); }
  }, [q, filtroBajo]);

  useEffect(() => { load(); }, [load]);

  const sinStock   = items.filter(a => a.stock_act <= 0).length;
  const bajMinimo  = items.filter(a => a.stock_act > 0 && a.stock_estado === 'bajo').length;
  const normal     = items.filter(a => a.stock_estado === 'ok').length;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Control de Stock</h1>
        <div className="flex-gap">
          <button className={`btn ${filtroBajo ? 'btn-primary' : ''}`} onClick={() => setFiltroBajo(f => !f)}>
            ⚠️ Solo bajo mínimo
          </button>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <div className="stat-card"><div className="stat-label">📦 Total artículos</div><div className="stat-value">{total}</div></div>
        <div className="stat-card"><div className="stat-label">✅ En stock normal</div><div className="stat-value" style={{ color: '#34C759' }}>{normal}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ Bajo mínimo</div><div className="stat-value" style={{ color: '#FF9F0A' }}>{bajMinimo}</div></div>
        <div className="stat-card"><div className="stat-label">🚨 Sin stock</div><div className="stat-value" style={{ color: '#FF3B30' }}>{sinStock}</div></div>
      </div>

      <div className="card">
        <div className="search-bar">
          <span className="icon">🔍</span>
          <input placeholder="Buscar artículo..." value={q} onChange={e => setQ(e.target.value)} />
          {q && <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }} onClick={() => setQ('')}>✕</button>}
        </div>

        {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : items.length === 0 ? <div className="empty-state"><div className="empty-icon">📦</div><p>Sin artículos</p></div>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Artículo</th>
                    <th>Marca</th>
                    <th>Rubro</th>
                    <th>Stock actual</th>
                    <th>Mínimo</th>
                    <th>Precio 1</th>
                    <th>Costo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(a => (
                    <tr key={a.id}>
                      <td><code style={{ fontSize: 12 }}>{a.codigo}</code></td>
                      <td><strong>{a.nombre}</strong></td>
                      <td className="text-muted">{a.marca_nombre || '—'}</td>
                      <td className="text-muted">{a.rubro_nombre || '—'}</td>
                      <td>
                        <span style={{
                          fontWeight: 600,
                          color: a.stock_act <= 0 ? '#FF3B30' : a.stock_estado === 'bajo' ? '#FF9F0A' : '#34C759'
                        }}>
                          {a.stock_act} {a.unimed}
                        </span>
                      </td>
                      <td className="text-muted">{a.stock_min} {a.unimed}</td>
                      <td>{fmt(a.precio1)}</td>
                      <td className="text-muted">{fmt(a.costo)}</td>
                      <td>
                        <span className={`badge ${a.stock_estado === 'ok' ? 'badge-green' : a.stock_estado === 'bajo' ? 'badge-amber' : 'badge-red'}`}>
                          {a.stock_estado === 'ok' ? 'Normal' : a.stock_estado === 'bajo' ? 'Bajo mín.' : 'Sin stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
}

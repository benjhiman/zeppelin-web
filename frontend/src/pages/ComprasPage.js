import { useEffect, useState } from 'react';
import apiClient from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

const ESTADO_LABEL = { P: 'Pendiente', G: 'Pagada', A: 'Anulada' };
const ESTADO_CLS   = { P: 'badge-amber', G: 'badge-green', A: 'badge-red' };

export default function ComprasPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await apiClient.get('/api/compras/', { params: { limit: 100 } });
      setItems(r.data.items || []); setTotal(r.data.total || 0);
    } catch { setItems([]); setTotal(0); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function pagar(id) {
    try {
      await apiClient.post(`/api/compras/${id}/pagar`);
      toast.success('Compra marcada como pagada');
      load();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Compras <span style={{ color: '#888', fontSize: 16 }}>({total})</span></h1>
        <button className="btn btn-primary" onClick={() => toast('Formulario de nueva compra — próximamente')}>🚚 Nueva compra</button>
      </div>

      <div className="card">
        {loading
          ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : items.length === 0
            ? (
              <div className="empty-state">
                <div className="empty-icon">🚚</div>
                <p>No hay compras registradas aún</p>
                <p className="text-muted text-sm" style={{ marginTop: 8 }}>Las compras que registres aparecerán aquí con su estado de pago</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr><th>Tipo</th><th>Número</th><th>Proveedor</th><th>Fecha</th><th>Neto</th><th>IVA</th><th>Total</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {items.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-purple">{c.tipo}</span></td>
                      <td><code style={{ fontSize: 12 }}>{c.numero || '—'}</code></td>
                      <td>{c.proveedor_nombre}</td>
                      <td>{c.fecha}</td>
                      <td>{fmt(c.neto)}</td>
                      <td>{fmt((c.iva21 || 0) + (c.iva105 || 0))}</td>
                      <td><strong>{fmt(c.total)}</strong></td>
                      <td><span className={`badge ${ESTADO_CLS[c.estado] || 'badge-gray'}`}>{ESTADO_LABEL[c.estado] || c.estado}</span></td>
                      <td>
                        {c.estado === 'P' && (
                          <button className="btn btn-sm" style={{ color: '#34C759' }} onClick={() => pagar(c.id)}>✓ Pagar</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>
    </div>
  );
}

// FacturacionPage.js
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facturacion as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
const ESTADO = { P:'Pendiente', C:'Cobrada', A:'Anulada' };
const ESTADO_CLS = { P:'badge-amber', C:'badge-green', A:'badge-red' };

export default function FacturacionPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const r = await api.listar({ q: q||undefined, tipo: tipo||undefined, estado: estado||undefined, limit:100 });
      setItems(r.data.items); setTotal(r.data.total);
    } catch { toast.error('Error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [q, tipo, estado]);

  async function anular(id) {
    if (!window.confirm('¿Anular este comprobante?')) return;
    await api.anular(id); toast.success('Anulado'); load();
  }

  async function cobrar(id) {
    await api.cobrar(id); toast.success('Marcado como cobrado'); load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Facturación <span style={{ color:'#888', fontSize:16 }}>({total})</span></h1>
        <button className="btn btn-primary" onClick={() => navigate('/facturacion/nueva')}>🧾 Nueva factura</button>
      </div>
      <div className="card">
        <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
          <div className="search-bar" style={{ flex:1, margin:0 }}>
            <span className="icon">🔍</span>
            <input placeholder="Buscar por cliente o número..." value={q} onChange={e=>setQ(e.target.value)} />
          </div>
          <select className="btn" value={tipo} onChange={e=>setTipo(e.target.value)}>
            <option value="">Todos los tipos</option>
            <option value="FA">Factura A</option><option value="FB">Factura B</option>
            <option value="FC">Factura C</option><option value="NCA">Nota de Crédito A</option>
            <option value="REM">Remito</option>
          </select>
          <select className="btn" value={estado} onChange={e=>setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="P">Pendiente</option><option value="C">Cobrada</option><option value="A">Anulada</option>
          </select>
        </div>
        {loading ? <div className="empty-state"><div className="spinner" style={{ margin:'0 auto' }}></div></div>
        : items.length === 0 ? <div className="empty-state"><div className="empty-icon">🧾</div><p>Sin comprobantes</p></div>
        : <table>
            <thead><tr><th>Número</th><th>Tipo</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id}>
                  <td><code style={{ fontSize:12 }}>{c.numero_fmt}</code></td>
                  <td><span className="badge badge-blue">{c.tipo}</span></td>
                  <td>{c.cliente_nombre}</td>
                  <td>{c.fecha}</td>
                  <td><strong>{fmt(c.total)}</strong></td>
                  <td><span className={`badge ${ESTADO_CLS[c.estado]||'badge-gray'}`}>{ESTADO[c.estado]||c.estado}</span></td>
                  <td>
                    <div className="flex-gap">
                      {c.estado === 'P' && <button className="btn btn-sm" style={{ color:'#34C759' }} onClick={() => cobrar(c.id)}>✓ Cobrar</button>}
                      {c.estado !== 'A' && <button className="btn btn-sm" style={{ color:'#FF3B30' }} onClick={() => anular(c.id)}>✕ Anular</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        }
      </div>
    </div>
  );
}

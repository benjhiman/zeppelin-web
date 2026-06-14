import { useEffect, useState, useCallback } from 'react';
import { pedidos as api, clientes as cliApi, articulos as artApi, vendedores as vendApi } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
const hoy = () => new Date().toISOString().slice(0, 10);

const ESTADO_LABEL = { N: 'Nuevo', P: 'En proceso', F: 'Facturado', C: 'Cancelado' };
const ESTADO_CLS   = { N: 'badge-blue', P: 'badge-amber', F: 'badge-green', C: 'badge-red' };

function NuevoPedidoModal({ onClose, onSaved }) {
  const [head, setHead] = useState({ fecha: hoy(), cliente_id: '', vendedor_id: '', observaciones: '' });
  const [items, setItems] = useState([{ articulo_id: '', articulo_nombre: '', cantidad: 1, precio: 0 }]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [artSearch, setArtSearch] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { vendApi.listar().then(r => setVendedores(r.data)).catch(() => {}); }, []);

  async function buscarCli(q) {
    if (q.length < 2) return setClientes([]);
    const r = await cliApi.listar({ q, limit: 8 });
    setClientes(r.data.items);
  }

  async function buscarArt(idx, q) {
    if (q.length < 2) return;
    const r = await artApi.listar({ q, limit: 8 });
    setArtSearch(s => ({ ...s, [idx]: r.data.items }));
  }

  function selectArt(idx, a) {
    setItems(its => its.map((it, i) => i === idx ? { ...it, articulo_id: a.id, articulo_nombre: a.nombre, precio: a.precio1 || 0 } : it));
    setArtSearch(s => ({ ...s, [idx]: [] }));
  }

  function updateItem(idx, patch) { setItems(its => its.map((it, i) => i === idx ? { ...it, ...patch } : it)); }
  function addItem() { setItems(its => [...its, { articulo_id: '', articulo_nombre: '', cantidad: 1, precio: 0 }]); }
  function removeItem(idx) { setItems(its => its.filter((_, i) => i !== idx)); }

  const total = items.reduce((s, it) => s + (it.cantidad * it.precio), 0);

  async function save() {
    if (!head.cliente_id) return toast.error('Seleccioná un cliente');
    if (items.every(it => !it.articulo_id)) return toast.error('Agregá al menos un artículo');
    setSaving(true);
    try {
      await api.crear({
        ...head,
        cliente_id: Number(head.cliente_id),
        vendedor_id: head.vendedor_id ? Number(head.vendedor_id) : null,
        items: items.filter(it => it.articulo_id).map(it => ({
          articulo_id: Number(it.articulo_id),
          cantidad: Number(it.cantidad),
          precio: Number(it.precio)
        }))
      });
      toast.success('Pedido creado'); onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  }

  const [cliSearch, setCliSearch] = useState('');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 750, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="flex-between mb-6">
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Nuevo pedido</h2>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="form-section">Encabezado</div>
        <div className="form-grid mb-4">
          <div className="form-group" style={{ position: 'relative' }}>
            <label>Cliente *</label>
            <input value={cliSearch} onChange={e => { setCliSearch(e.target.value); buscarCli(e.target.value); }} placeholder="Buscar cliente..." />
            {clientes.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, maxHeight: 180, overflow: 'auto', boxShadow: 'var(--shadow)' }}>
                {clientes.map(c => (
                  <div key={c.id} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13 }} onMouseDown={() => { setCliSearch(c.nombre); setHead(h => ({ ...h, cliente_id: c.id })); setClientes([]); }}>
                    <strong>{c.nombre}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={head.fecha} onChange={e => setHead(h => ({ ...h, fecha: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Vendedor</label>
            <select value={head.vendedor_id} onChange={e => setHead(h => ({ ...h, vendedor_id: e.target.value }))}>
              <option value="">— Sin asignar —</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Observaciones</label>
            <input value={head.observaciones} onChange={e => setHead(h => ({ ...h, observaciones: e.target.value }))} />
          </div>
        </div>

        <div className="form-section">Artículos</div>
        <table style={{ marginBottom: 12 }}>
          <thead><tr><th>Artículo</th><th>Cantidad</th><th>Precio</th><th>Subtotal</th><th></th></tr></thead>
          <tbody>
            {items.map((it, idx) => (
              <tr key={idx}>
                <td style={{ position: 'relative', minWidth: 200 }}>
                  <input style={{ width: '100%', padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
                    value={it.articulo_nombre}
                    onChange={e => { updateItem(idx, { articulo_nombre: e.target.value, articulo_id: '' }); buscarArt(idx, e.target.value); }}
                    placeholder="Buscar..." />
                  {artSearch[idx]?.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid var(--border)', borderRadius: 8, zIndex: 100, maxHeight: 160, overflow: 'auto', boxShadow: 'var(--shadow)' }}>
                      {artSearch[idx].map(a => (
                        <div key={a.id} style={{ padding: '7px 12px', cursor: 'pointer', fontSize: 13 }} onMouseDown={() => selectArt(idx, a)}>
                          <strong>{a.codigo}</strong> — {a.nombre}
                        </div>
                      ))}
                    </div>
                  )}
                </td>
                <td><input type="number" min="1" value={it.cantidad} onChange={e => updateItem(idx, { cantidad: parseFloat(e.target.value) || 1 })} style={{ width: 70, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} /></td>
                <td><input type="number" min="0" step="0.01" value={it.precio} onChange={e => updateItem(idx, { precio: parseFloat(e.target.value) || 0 })} style={{ width: 100, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} /></td>
                <td style={{ fontWeight: 600 }}>{fmt(it.cantidad * it.precio)}</td>
                <td><button className="btn btn-sm" style={{ color: '#FF3B30' }} onClick={() => removeItem(idx)}>✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn btn-sm" onClick={addItem}>➕ Agregar artículo</button>

        <div style={{ textAlign: 'right', margin: '16px 0', fontSize: 16, fontWeight: 700 }}>Total: {fmt(total)}</div>

        <div className="flex-gap">
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner"></span> : '💾'} Guardar pedido</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function PedidosPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [estado, setEstado] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.listar({ estado: estado || undefined, limit: 100 });
      setItems(r.data.items); setTotal(r.data.total);
    } catch { toast.error('Error'); }
    finally { setLoading(false); }
  }, [estado]);

  useEffect(() => { load(); }, [load]);

  async function cambiarEstado(id, nuevoEstado) {
    await api.cambiarEstado(id, nuevoEstado);
    toast.success('Estado actualizado');
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Pedidos <span style={{ color: '#888', fontSize: 16 }}>({total})</span></h1>
        <button className="btn btn-primary" onClick={() => setModal(true)}>🛒 Nuevo pedido</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['', 'Todos'], ['N', 'Nuevos'], ['P', 'En proceso'], ['F', 'Facturados'], ['C', 'Cancelados']].map(([k, v]) => (
            <button key={k} className={`btn btn-sm ${estado === k ? 'btn-primary' : ''}`} onClick={() => setEstado(k)}>{v}</button>
          ))}
        </div>

        {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : items.length === 0 ? <div className="empty-state"><div className="empty-icon">🛒</div><p>Sin pedidos</p></div>
          : (
            <table>
              <thead><tr><th>Nro</th><th>Cliente</th><th>Fecha</th><th>Vendedor</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td><strong>P-{String(p.numero).padStart(4, '0')}</strong></td>
                    <td>{p.cliente_nombre}</td>
                    <td>{p.fecha}</td>
                    <td className="text-muted">{p.vendedor_nombre || '—'}</td>
                    <td><strong>{fmt(p.total)}</strong></td>
                    <td><span className={`badge ${ESTADO_CLS[p.estado]}`}>{ESTADO_LABEL[p.estado]}</span></td>
                    <td>
                      <div className="flex-gap">
                        {p.estado === 'N' && <button className="btn btn-sm" onClick={() => cambiarEstado(p.id, 'P')}>▶ Procesar</button>}
                        {p.estado === 'P' && <button className="btn btn-sm" style={{ color: '#34C759' }} onClick={() => cambiarEstado(p.id, 'F')}>✓ Facturar</button>}
                        {p.estado !== 'C' && p.estado !== 'F' && <button className="btn btn-sm" style={{ color: '#FF3B30' }} onClick={() => cambiarEstado(p.id, 'C')}>✕ Cancelar</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {modal && <NuevoPedidoModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}

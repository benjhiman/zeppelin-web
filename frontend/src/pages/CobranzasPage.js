import { useEffect, useState } from 'react';
import { cobranzas as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n||0);

export default function CobranzasPage() {
  const [items, setItems] = useState([]); const [resumen, setResumen] = useState({});
  const [loading, setLoading] = useState(true); const [sel, setSel] = useState([]);

  async function load() {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([api.pendientes({ limit:100 }), api.resumen()]);
      setItems(p.data.items); setResumen(r.data);
    } catch { toast.error('Error'); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const toggleSel = id => setSel(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);

  async function cobrarSeleccionados() {
    if (sel.length===0) return toast.error('Seleccioná al menos un comprobante');
    const clienteId = items.find(i=>i.id===sel[0])?.cliente_id;
    const medio = window.prompt('Medio de pago (EF=efectivo, CH=cheque, TJ=tarjeta, TR=transferencia):', 'EF');
    if (!medio) return;
    const importe = sel.reduce((s,id) => s + (items.find(i=>i.id===id)?.total||0), 0);
    try {
      await api.registrar({ cliente_id: clienteId, fecha: new Date().toISOString().slice(0,10), comprobante_ids: sel, pagos: [{ medio, importe }] });
      toast.success('Cobranza registrada'); setSel([]); load();
    } catch(e) { toast.error(e.response?.data?.detail||'Error'); }
  }

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Cobranzas</h1>
        {sel.length>0 && <button className="btn btn-primary" onClick={cobrarSeleccionados}>✓ Cobrar seleccionados ({sel.length})</button>}
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns:'repeat(3,1fr)' }}>
        <div className="stat-card"><div className="stat-label">💰 Total pendiente</div><div className="stat-value" style={{color:'#FF9F0A'}}>{fmt(resumen.pendiente_total)}</div></div>
        <div className="stat-card"><div className="stat-label">⚠️ Vencidas</div><div className="stat-value" style={{color:'#FF3B30'}}>{fmt(resumen.vencidas)}</div></div>
        <div className="stat-card"><div className="stat-label">✅ Cobrado mes</div><div className="stat-value" style={{color:'#34C759'}}>{fmt(resumen.cobrado_mes)}</div></div>
      </div>
      <div className="card">
        {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div>
        : items.length===0 ? <div className="empty-state"><div className="empty-icon">✅</div><p>No hay cobranzas pendientes</p></div>
        : <table><thead><tr><th></th><th>Comprobante</th><th>Cliente</th><th>Fecha</th><th>Días</th><th>Total</th></tr></thead>
          <tbody>{items.map(c=>(
            <tr key={c.id} style={{background:sel.includes(c.id)?'#EEEDFE':'inherit'}}>
              <td><input type="checkbox" checked={sel.includes(c.id)} onChange={()=>toggleSel(c.id)} /></td>
              <td><code>{c.numero_fmt}</code></td>
              <td>{c.cliente_nombre}</td>
              <td>{c.fecha}</td>
              <td><span className={`badge ${c.dias>30?'badge-red':c.dias>0?'badge-amber':'badge-green'}`}>{c.dias}d</span></td>
              <td><strong>{fmt(c.total)}</strong></td>
            </tr>
          ))}</tbody></table>}
      </div>
    </div>
  );
}

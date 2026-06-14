import { useEffect, useState } from 'react';
import { caja as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
const hoy = () => new Date().toISOString().slice(0, 10);

const MEDIO_LABEL = { EF: 'Efectivo', CH: 'Cheque', TJ: 'Tarjeta', TR: 'Transferencia' };
const MEDIO_ICON  = { EF: '💵', CH: '📄', TJ: '💳', TR: '🏦' };

function MovModal({ onClose, onSaved }) {
  const [form, setForm] = useState({ fecha: hoy(), tipo: 'I', medio: 'EF', concepto: '', importe: 0 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.concepto.trim()) return toast.error('Ingresá un concepto');
    if (!form.importe || form.importe <= 0) return toast.error('Ingresá un importe válido');
    setSaving(true);
    try {
      await api.crear(form);
      toast.success('Movimiento registrado');
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440 }}>
        <div className="flex-between mb-6">
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>Nuevo movimiento de caja</h2>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="form-grid mb-4">
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.tipo} onChange={e => set('tipo', e.target.value)}>
              <option value="I">💰 Ingreso</option>
              <option value="E">📤 Egreso</option>
            </select>
          </div>
          <div className="form-group">
            <label>Medio de pago</label>
            <select value={form.medio} onChange={e => set('medio', e.target.value)}>
              <option value="EF">💵 Efectivo</option>
              <option value="CH">📄 Cheque</option>
              <option value="TJ">💳 Tarjeta</option>
              <option value="TR">🏦 Transferencia</option>
            </select>
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={form.fecha} onChange={e => set('fecha', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Importe</label>
            <input type="number" min="0" step="0.01" value={form.importe} onChange={e => set('importe', parseFloat(e.target.value) || 0)} />
          </div>
        </div>
        <div className="form-group mb-6">
          <label>Concepto</label>
          <input value={form.concepto} onChange={e => set('concepto', e.target.value)} placeholder="Ej: Pago proveedor, Cobro cliente..." />
        </div>
        <div className="flex-gap">
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner"></span> : '💾'} Guardar</button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function CajaPage() {
  const [movs, setMovs] = useState([]);
  const [saldo, setSaldo] = useState({});
  const [fecha, setFecha] = useState(hoy());
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([api.listar({ fecha }), api.saldo()]);
      setMovs(m.data.items); setSaldo(s.data);
    } catch { toast.error('Error cargando caja'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [fecha]);

  const ingresos = movs.filter(m => m.tipo === 'I').reduce((s, m) => s + m.importe, 0);
  const egresos  = movs.filter(m => m.tipo === 'E').reduce((s, m) => s + m.importe, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Caja</h1>
        <div className="flex-gap">
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="btn" />
          <button className="btn btn-primary" onClick={() => setModal(true)}>➕ Nuevo movimiento</button>
        </div>
      </div>

      <div className="stats-grid">
        {Object.entries(MEDIO_LABEL).map(([k, v]) => (
          <div className="stat-card" key={k}>
            <div className="stat-label">{MEDIO_ICON[k]} {v}</div>
            <div className="stat-value" style={{ fontSize: 20 }}>{fmt(saldo[k] || 0)}</div>
          </div>
        ))}
      </div>

      <div className="two-col mb-4">
        <div className="stat-card" style={{ background: '#D1F2E0', border: 'none' }}>
          <div className="stat-label">📥 Ingresos del día</div>
          <div className="stat-value" style={{ color: '#1A7A3F' }}>{fmt(ingresos)}</div>
        </div>
        <div className="stat-card" style={{ background: '#FCE8E8', border: 'none' }}>
          <div className="stat-label">📤 Egresos del día</div>
          <div className="stat-value" style={{ color: '#A32D2D' }}>{fmt(egresos)}</div>
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <span className="card-title" style={{ marginBottom: 0 }}>Movimientos — {fecha}</span>
          <span style={{ fontSize: 16, fontWeight: 700 }}>Saldo del día: {fmt(ingresos - egresos)}</span>
        </div>

        {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : movs.length === 0
            ? <div className="empty-state"><div className="empty-icon">💼</div><p>Sin movimientos para esta fecha</p></div>
            : (
              <table>
                <thead><tr><th>Tipo</th><th>Medio</th><th>Concepto</th><th>Comprobante</th><th>Usuario</th><th>Importe</th></tr></thead>
                <tbody>
                  {movs.map(m => (
                    <tr key={m.id}>
                      <td><span className={`badge ${m.tipo === 'I' ? 'badge-green' : 'badge-red'}`}>{m.tipo === 'I' ? '📥 Ingreso' : '📤 Egreso'}</span></td>
                      <td>{MEDIO_ICON[m.medio]} {MEDIO_LABEL[m.medio]}</td>
                      <td>{m.concepto}</td>
                      <td className="text-muted"><code>{m.comprobante || '—'}</code></td>
                      <td className="text-muted">{m.usuario}</td>
                      <td style={{ fontWeight: 600, color: m.tipo === 'I' ? '#1A7A3F' : '#A32D2D' }}>
                        {m.tipo === 'I' ? '+' : '-'}{fmt(m.importe)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
      </div>

      {modal && <MovModal onClose={() => setModal(false)} onSaved={() => { setModal(false); load(); }} />}
    </div>
  );
}

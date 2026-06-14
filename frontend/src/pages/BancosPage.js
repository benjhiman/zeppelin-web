import { useEffect, useState } from 'react';
import { bancos as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);
const hoy = () => new Date().toISOString().slice(0, 10);

const TIPO_LABEL = { C: 'Cta. Corriente', A: 'Caja de Ahorro' };

export default function BancosPage() {
  const [bancos, setBancos] = useState([]);
  const [selBanco, setSelBanco] = useState(null);
  const [movs, setMovs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalMov, setModalMov] = useState(false);

  async function loadBancos() {
    setLoading(true);
    try { const r = await api.listar(); setBancos(r.data); }
    catch { toast.error('Error'); }
    finally { setLoading(false); }
  }

  async function loadMovs(id) {
    const r = await api.movimientos(id);
    setMovs(r.data);
  }

  useEffect(() => { loadBancos(); }, []);

  function selectBanco(b) {
    setSelBanco(b);
    loadMovs(b.id);
  }

  async function agregarMov(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.agregarMov({
        banco_id: selBanco.id,
        fecha: fd.get('fecha'),
        concepto: fd.get('concepto'),
        tipo: fd.get('tipo'),
        importe: parseFloat(fd.get('importe')),
        comprobante: fd.get('comprobante') || null,
      });
      toast.success('Movimiento registrado');
      setModalMov(false);
      loadBancos();
      loadMovs(selBanco.id);
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
  }

  const totalSaldo = bancos.reduce((s, b) => s + (b.saldo || 0), 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Bancos</h1>
        {selBanco && <button className="btn btn-primary" onClick={() => setModalMov(true)}>➕ Nuevo movimiento</button>}
      </div>

      <div className="stat-card mb-4" style={{ display: 'inline-block', minWidth: 240 }}>
        <div className="stat-label">🏦 Saldo total en bancos</div>
        <div className="stat-value">{fmt(totalSaldo)}</div>
      </div>

      <div className="two-col">
        <div className="card">
          <div className="card-title">Cuentas bancarias</div>
          {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
            : bancos.length === 0
              ? <div className="empty-state"><div className="empty-icon">🏦</div><p>No hay cuentas bancarias</p></div>
              : bancos.map(b => (
                <div key={b.id}
                  onClick={() => selectBanco(b)}
                  style={{ padding: '14px 16px', borderRadius: 8, cursor: 'pointer', marginBottom: 8, background: selBanco?.id === b.id ? 'var(--brand-light)' : 'var(--bg)', border: `1px solid ${selBanco?.id === b.id ? 'var(--brand)' : 'var(--border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: selBanco?.id === b.id ? 'var(--brand)' : 'inherit' }}>{b.nombre}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{TIPO_LABEL[b.tipo] || b.tipo} — {b.nro_cta || 'Sin nro'}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{fmt(b.saldo)}</div>
                  </div>
                </div>
              ))}
        </div>

        <div className="card">
          {!selBanco
            ? <div className="empty-state"><div className="empty-icon">👈</div><p>Seleccioná una cuenta para ver sus movimientos</p></div>
            : <>
              <div className="card-title">Movimientos — {selBanco.nombre}</div>
              {movs.length === 0
                ? <div className="empty-state" style={{ padding: 24 }}><p>Sin movimientos registrados</p></div>
                : (
                  <table>
                    <thead><tr><th>Fecha</th><th>Concepto</th><th>Tipo</th><th>Importe</th></tr></thead>
                    <tbody>
                      {movs.map(m => (
                        <tr key={m.id}>
                          <td>{m.fecha}</td>
                          <td>{m.concepto}</td>
                          <td><span className={`badge ${m.tipo === 'C' ? 'badge-green' : 'badge-red'}`}>{m.tipo === 'C' ? '📥 Crédito' : '📤 Débito'}</span></td>
                          <td style={{ fontWeight: 600, color: m.tipo === 'C' ? '#1A7A3F' : '#A32D2D' }}>
                            {m.tipo === 'C' ? '+' : '-'}{fmt(m.importe)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </>}
        </div>
      </div>

      {modalMov && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 440 }}>
            <div className="flex-between mb-6">
              <h2 style={{ fontSize: 17, fontWeight: 600 }}>Movimiento — {selBanco?.nombre}</h2>
              <button className="btn btn-sm" onClick={() => setModalMov(false)}>✕</button>
            </div>
            <form onSubmit={agregarMov}>
              <div className="form-grid mb-4">
                <div className="form-group"><label>Tipo</label><select name="tipo"><option value="C">📥 Crédito</option><option value="D">📤 Débito</option></select></div>
                <div className="form-group"><label>Fecha</label><input type="date" name="fecha" defaultValue={hoy()} /></div>
                <div className="form-group"><label>Importe</label><input type="number" name="importe" min="0" step="0.01" required /></div>
                <div className="form-group"><label>Comprobante</label><input name="comprobante" placeholder="Opcional" /></div>
              </div>
              <div className="form-group mb-6"><label>Concepto *</label><input name="concepto" required placeholder="Ej: Transferencia, Cheque acreditado..." /></div>
              <div className="flex-gap">
                <button type="submit" className="btn btn-primary">💾 Guardar</button>
                <button type="button" className="btn" onClick={() => setModalMov(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

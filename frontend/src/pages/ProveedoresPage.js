import { useEffect, useState, useCallback } from 'react';
import { proveedores as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

function ProveedorModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { nombre: '', direc: '', localidad: '', provincia: '', codpos: '', telefono: '', cuit: '', tipo_iva: 'RI', contacto: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      if (item?.id) await api.actualizar(item.id, form);
      else await api.crear(form);
      toast.success(item?.id ? 'Proveedor actualizado' : 'Proveedor creado');
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflow: 'auto' }}>
        <div className="flex-between mb-6"><h2 style={{ fontSize: 17, fontWeight: 600 }}>{item?.id ? 'Editar proveedor' : 'Nuevo proveedor'}</h2><button className="btn btn-sm" onClick={onClose}>✕</button></div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Razón social *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group"><label>CUIT</label><input value={form.cuit || ''} onChange={e => set('cuit', e.target.value)} placeholder="30-00000000-0" /></div>
          <div className="form-group"><label>Tipo IVA</label>
            <select value={form.tipo_iva || 'RI'} onChange={e => set('tipo_iva', e.target.value)}>
              <option value="RI">Resp. Inscripto</option><option value="MO">Monotributista</option><option value="EX">Exento</option>
            </select>
          </div>
          <div className="form-group"><label>Contacto</label><input value={form.contacto || ''} onChange={e => set('contacto', e.target.value)} /></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} /></div>
          <div className="form-group"><label>Dirección</label><input value={form.direc || ''} onChange={e => set('direc', e.target.value)} /></div>
          <div className="form-group"><label>Localidad</label><input value={form.localidad || ''} onChange={e => set('localidad', e.target.value)} /></div>
          <div className="form-group"><label>Provincia</label><input value={form.provincia || ''} onChange={e => set('provincia', e.target.value)} /></div>
        </div>
        <div className="flex-gap"><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner"></span> : '💾'} Guardar</button><button className="btn" onClick={onClose}>Cancelar</button></div>
      </div>
    </div>
  );
}

export default function ProveedoresPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.listar({ q: q || undefined, limit: 100 }); setItems(r.data.items); setTotal(r.data.total); }
    catch { toast.error('Error'); } finally { setLoading(false); }
  }, [q]);

  useEffect(() => { load(); }, [load]);

  const TIPO_IVA = { RI: 'R. Inscripto', MO: 'Monotributista', EX: 'Exento' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Proveedores <span style={{ color: '#888', fontSize: 16 }}>({total})</span></h1>
        <button className="btn btn-primary" onClick={() => setModal({})}>🏪 Nuevo proveedor</button>
      </div>
      <div className="card">
        <div className="search-bar"><span className="icon">🔍</span><input placeholder="Buscar por nombre, CUIT..." value={q} onChange={e => setQ(e.target.value)} /></div>
        {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : items.length === 0 ? <div className="empty-state"><div className="empty-icon">🏪</div><p>No hay proveedores</p></div>
          : (
            <table>
              <thead><tr><th>Cód.</th><th>Nombre</th><th>CUIT</th><th>Localidad</th><th>Teléfono</th><th>Tipo IVA</th><th>Saldo</th><th></th></tr></thead>
              <tbody>
                {items.map(p => (
                  <tr key={p.id}>
                    <td className="text-muted">{p.codigo}</td>
                    <td><strong>{p.nombre}</strong></td>
                    <td className="text-muted">{p.cuit || '—'}</td>
                    <td>{p.localidad || '—'}</td>
                    <td>{p.telefono || '—'}</td>
                    <td><span className="badge badge-blue">{TIPO_IVA[p.tipo_iva] || p.tipo_iva}</span></td>
                    <td style={{ fontWeight: p.saldo > 0 ? 600 : 400, color: p.saldo > 0 ? '#FF9F0A' : 'inherit' }}>{p.saldo > 0 ? fmt(p.saldo) : '—'}</td>
                    <td><button className="btn btn-sm" onClick={() => setModal(p)}>✏️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {modal !== null && <ProveedorModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

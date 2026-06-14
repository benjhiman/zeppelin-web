import { useEffect, useState } from 'react';
import { vendedores as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0);

function VendedorModal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || { nombre: '', direc: '', localidad: '', telefono: '', comision: 0 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      if (item?.id) await api.actualizar(item.id, form);
      else await api.crear(form);
      toast.success(item?.id ? 'Vendedor actualizado' : 'Vendedor creado');
      onSaved();
    } catch (e) { toast.error(e.response?.data?.detail || 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 480 }}>
        <div className="flex-between mb-6"><h2 style={{ fontSize: 17, fontWeight: 600 }}>{item?.id ? 'Editar vendedor' : 'Nuevo vendedor'}</h2><button className="btn btn-sm" onClick={onClose}>✕</button></div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Nombre completo *</label><input value={form.nombre} onChange={e => set('nombre', e.target.value)} /></div>
          <div className="form-group"><label>Comisión %</label><input type="number" min="0" max="100" step="0.01" value={form.comision || 0} onChange={e => set('comision', e.target.value)} /></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono || ''} onChange={e => set('telefono', e.target.value)} /></div>
          <div className="form-group"><label>Localidad</label><input value={form.localidad || ''} onChange={e => set('localidad', e.target.value)} /></div>
        </div>
        <div className="form-group mb-6"><label>Dirección</label><input value={form.direc || ''} onChange={e => set('direc', e.target.value)} /></div>
        <div className="flex-gap"><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? <span className="spinner"></span> : '💾'} Guardar</button><button className="btn" onClick={onClose}>Cancelar</button></div>
      </div>
    </div>
  );
}

export default function VendedoresPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  async function load() {
    setLoading(true);
    try { const r = await api.listar(); setItems(r.data); }
    catch { toast.error('Error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Vendedores</h1>
        <button className="btn btn-primary" onClick={() => setModal({})}>🤝 Nuevo vendedor</button>
      </div>
      <div className="card">
        {loading ? <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>
          : items.length === 0 ? <div className="empty-state"><div className="empty-icon">🤝</div><p>Sin vendedores</p></div>
          : (
            <table>
              <thead><tr><th>Cód.</th><th>Nombre</th><th>Teléfono</th><th>Localidad</th><th>Comisión</th><th></th></tr></thead>
              <tbody>
                {items.map(v => (
                  <tr key={v.id}>
                    <td className="text-muted">{v.codigo}</td>
                    <td><strong>{v.nombre}</strong></td>
                    <td>{v.telefono || '—'}</td>
                    <td>{v.localidad || '—'}</td>
                    <td><span className="badge badge-purple">{v.comision}%</span></td>
                    <td><button className="btn btn-sm" onClick={() => setModal(v)}>✏️</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      {modal !== null && <VendedorModal item={modal.id ? modal : null} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
    </div>
  );
}

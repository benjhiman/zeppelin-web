import { useEffect, useState, useCallback } from 'react';
import { clientes as api, vendedores as vendApi } from '../lib/api';
import toast from 'react-hot-toast';

function ClienteModal({ item, onClose, onSaved, vendedores }) {
  const [form, setForm] = useState(item || {
    nombre: '', comercial: '', cuit: '', tipo_iva: 'RI',
    direc: '', localidad: '', provincia: '', codpos: '',
    telefono: '', celular: '', email: '', contacto: '',
    vendedor_id: '', condicion: 'CO', lista_pre: '1',
    credito: 0, boni1: 0, comentario: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function save() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      if (item?.id) await api.actualizar(item.id, form);
      else await api.crear(form);
      toast.success(item?.id ? 'Cliente actualizado' : 'Cliente creado');
      onSaved();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al guardar');
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:12,padding:28,width:'100%',maxWidth:700,maxHeight:'90vh',overflow:'auto' }}>
        <div className="flex-between mb-6">
          <h2 style={{ fontSize:18,fontWeight:600 }}>{item?.id ? 'Editar cliente' : 'Nuevo cliente'}</h2>
          <button className="btn btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="form-section">Datos principales</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Nombre / Razón social *</label><input value={form.nombre} onChange={e=>set('nombre',e.target.value)} /></div>
          <div className="form-group"><label>Nombre comercial</label><input value={form.comercial||''} onChange={e=>set('comercial',e.target.value)} /></div>
          <div className="form-group"><label>CUIT</label><input value={form.cuit||''} onChange={e=>set('cuit',e.target.value)} placeholder="30-00000000-0" /></div>
          <div className="form-group"><label>Tipo IVA</label>
            <select value={form.tipo_iva||'RI'} onChange={e=>set('tipo_iva',e.target.value)}>
              <option value="RI">Resp. Inscripto</option>
              <option value="MO">Monotributista</option>
              <option value="EX">Exento</option>
              <option value="CF">Consumidor Final</option>
            </select>
          </div>
        </div>

        <div className="form-section">Contacto</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Dirección</label><input value={form.direc||''} onChange={e=>set('direc',e.target.value)} /></div>
          <div className="form-group"><label>Localidad</label><input value={form.localidad||''} onChange={e=>set('localidad',e.target.value)} /></div>
          <div className="form-group"><label>Teléfono</label><input value={form.telefono||''} onChange={e=>set('telefono',e.target.value)} /></div>
          <div className="form-group"><label>Celular</label><input value={form.celular||''} onChange={e=>set('celular',e.target.value)} /></div>
          <div className="form-group"><label>Email</label><input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} /></div>
          <div className="form-group"><label>Contacto</label><input value={form.contacto||''} onChange={e=>set('contacto',e.target.value)} /></div>
        </div>

        <div className="form-section">Condiciones comerciales</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Vendedor</label>
            <select value={form.vendedor_id||''} onChange={e=>set('vendedor_id',e.target.value)}>
              <option value="">— Sin asignar —</option>
              {vendedores.map(v=><option key={v.id} value={v.codigo}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Lista de precios</label>
            <select value={form.lista_pre||'1'} onChange={e=>set('lista_pre',e.target.value)}>
              {[1,2,3,4,5].map(n=><option key={n} value={String(n)}>Lista {n}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Límite de crédito</label><input type="number" value={form.credito||0} onChange={e=>set('credito',e.target.value)} /></div>
          <div className="form-group"><label>Descuento %</label><input type="number" value={form.boni1||0} onChange={e=>set('boni1',e.target.value)} /></div>
        </div>

        <div className="form-group mb-6"><label>Comentarios</label><textarea rows={2} value={form.comentario||''} onChange={e=>set('comentario',e.target.value)} /></div>

        <div className="flex-gap">
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? <span className="spinner"></span> : '💾'} Guardar
          </button>
          <button className="btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [vends, setVends] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.listar({ q: q || undefined, limit: 100 });
      setItems(res.data.items); setTotal(res.data.total);
    } catch { toast.error('Error cargando clientes'); }
    finally { setLoading(false); }
  }, [q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { vendApi.listar().then(r => setVends(r.data)).catch(() => {}); }, []);

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este cliente?')) return;
    await api.eliminar(id);
    toast.success('Cliente eliminado');
    load();
  }

  const TIPO_IVA_LABEL = { RI: 'Resp. Inscripto', MO: 'Monotributista', EX: 'Exento', CF: 'Cons. Final' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Clientes <span className="text-muted text-sm">({total})</span></h1>
        <button className="btn btn-primary" onClick={() => setModal({})}>👤 Nuevo cliente</button>
      </div>

      <div className="card">
        <div className="search-bar">
          <span className="icon">🔍</span>
          <input placeholder="Buscar por nombre, CUIT, localidad..." value={q} onChange={e => setQ(e.target.value)} />
          {q && <button style={{ border:'none',background:'none',cursor:'pointer',color:'#888' }} onClick={()=>setQ('')}>✕</button>}
        </div>

        {loading ? <div className="empty-state"><div className="spinner" style={{ margin:'0 auto' }}></div></div> :
         items.length === 0 ? <div className="empty-state"><div className="empty-icon">👥</div><p>No hay clientes{q ? ' con ese criterio' : ' aún'}</p></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Cód.</th><th>Nombre</th><th>CUIT</th><th>Localidad</th><th>Teléfono</th><th>Tipo IVA</th><th>Saldo</th><th></th></tr></thead>
              <tbody>
                {items.map(c => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.codigo}</td>
                    <td><strong>{c.nombre}</strong>{c.comercial && c.comercial !== c.nombre && <div className="text-muted text-sm">{c.comercial}</div>}</td>
                    <td className="text-muted">{c.cuit || '—'}</td>
                    <td>{c.localidad || '—'}</td>
                    <td>{c.telefono || '—'}</td>
                    <td><span className="badge badge-blue">{TIPO_IVA_LABEL[c.tipo_iva] || c.tipo_iva}</span></td>
                    <td style={{ fontWeight: c.saldo > 0 ? 600 : 400, color: c.saldo > 0 ? '#FF9F0A' : 'inherit' }}>
                      {c.saldo > 0 ? `$${c.saldo.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td>
                      <div className="flex-gap">
                        <button className="btn btn-sm" onClick={() => setModal(c)}>✏️</button>
                        <button className="btn btn-sm" style={{ color:'#FF3B30' }} onClick={() => eliminar(c.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <ClienteModal item={modal.id ? modal : null} vendedores={vends}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}

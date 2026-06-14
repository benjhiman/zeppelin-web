import { useEffect, useState, useCallback } from 'react';
import { articulos as api } from '../lib/api';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS', maximumFractionDigits:0 }).format(n||0);

function ArticuloModal({ item, onClose, onSaved, marcas, rubros }) {
  const [form, setForm] = useState(item || { codigo:'', nombre:'', precio1:0, precio2:0, precio3:0, costo:0, stock_act:0, stock_min:0, unimed:'u.', iva:'1', marca_id:'', rubro_id:'', observaciones:'' });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  async function save() {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      if (item?.id) await api.actualizar(item.id, form);
      else await api.crear(form);
      toast.success(item?.id ? 'Artículo actualizado' : 'Artículo creado');
      onSaved();
    } catch(e) { toast.error(e.response?.data?.detail||'Error'); }
    finally { setSaving(false); }
  }

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.4)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:12,padding:28,width:'100%',maxWidth:700,maxHeight:'90vh',overflow:'auto' }}>
        <div className="flex-between mb-6"><h2 style={{ fontSize:18,fontWeight:600 }}>{item?.id?'Editar artículo':'Nuevo artículo'}</h2><button className="btn btn-sm" onClick={onClose}>✕</button></div>
        <div className="form-section">Datos del artículo</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Código</label><input value={form.codigo||''} onChange={e=>set('codigo',e.target.value)} placeholder="Ej: A-001" /></div>
          <div className="form-group"><label>Nombre *</label><input value={form.nombre} onChange={e=>set('nombre',e.target.value)} /></div>
          <div className="form-group"><label>Marca</label><select value={form.marca_id||''} onChange={e=>set('marca_id',e.target.value)}><option value="">—</option>{marcas.map(m=><option key={m.id} value={m.id}>{m.nombre}</option>)}</select></div>
          <div className="form-group"><label>Rubro</label><select value={form.rubro_id||''} onChange={e=>set('rubro_id',e.target.value)}><option value="">—</option>{rubros.map(r=><option key={r.id} value={r.id}>{r.nombre}</option>)}</select></div>
          <div className="form-group"><label>Unidad de medida</label><input value={form.unimed||'u.'} onChange={e=>set('unimed',e.target.value)} /></div>
          <div className="form-group"><label>IVA</label><select value={form.iva||'1'} onChange={e=>set('iva',e.target.value)}><option value="1">21%</option><option value="2">10.5%</option><option value="3">Exento</option></select></div>
        </div>
        <div className="form-section">Precios y stock</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Costo</label><input type="number" value={form.costo||0} onChange={e=>set('costo',e.target.value)} /></div>
          <div className="form-group"><label>Precio lista 1</label><input type="number" value={form.precio1||0} onChange={e=>set('precio1',e.target.value)} /></div>
          <div className="form-group"><label>Precio lista 2</label><input type="number" value={form.precio2||0} onChange={e=>set('precio2',e.target.value)} /></div>
          <div className="form-group"><label>Precio lista 3</label><input type="number" value={form.precio3||0} onChange={e=>set('precio3',e.target.value)} /></div>
          <div className="form-group"><label>Stock actual</label><input type="number" value={form.stock_act||0} onChange={e=>set('stock_act',e.target.value)} /></div>
          <div className="form-group"><label>Stock mínimo</label><input type="number" value={form.stock_min||0} onChange={e=>set('stock_min',e.target.value)} /></div>
        </div>
        <div className="form-group mb-6"><label>Observaciones</label><textarea rows={2} value={form.observaciones||''} onChange={e=>set('observaciones',e.target.value)} /></div>
        <div className="flex-gap"><button className="btn btn-primary" onClick={save} disabled={saving}>{saving?<span className="spinner"></span>:'💾'} Guardar</button><button className="btn" onClick={onClose}>Cancelar</button></div>
      </div>
    </div>
  );
}

export default function ArticulosPage() {
  const [items, setItems] = useState([]); const [total, setTotal] = useState(0);
  const [q, setQ] = useState(''); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [marcas, setMarcas] = useState([]); const [rubros, setRubros] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.listar({ q: q||undefined, limit:100 }); setItems(r.data.items); setTotal(r.data.total); }
    catch { toast.error('Error'); } finally { setLoading(false); }
  }, [q]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.marcas().then(r=>setMarcas(r.data)).catch(()=>{}); api.rubros().then(r=>setRubros(r.data)).catch(()=>{}); }, []);

  const STOCK_CLS = { ok:'badge-green', bajo:'badge-amber', critico:'badge-red' };
  const STOCK_LBL = { ok:'Normal', bajo:'Bajo mín.', critico:'Sin stock' };

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Artículos <span style={{color:'#888',fontSize:16}}>({total})</span></h1><button className="btn btn-primary" onClick={()=>setModal({})}>📦 Nuevo artículo</button></div>
      <div className="card">
        <div className="search-bar"><span className="icon">🔍</span><input placeholder="Buscar por código, nombre..." value={q} onChange={e=>setQ(e.target.value)} /></div>
        {loading ? <div className="empty-state"><div className="spinner" style={{margin:'0 auto'}}></div></div>
        : items.length===0 ? <div className="empty-state"><div className="empty-icon">📦</div><p>No hay artículos</p></div>
        : <table><thead><tr><th>Código</th><th>Nombre</th><th>Marca</th><th>Rubro</th><th>Precio 1</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
          <tbody>{items.map(a=>(
            <tr key={a.id}>
              <td><code>{a.codigo}</code></td><td><strong>{a.nombre}</strong></td>
              <td>{a.marca_nombre||'—'}</td><td>{a.rubro_nombre||'—'}</td>
              <td>{fmt(a.precio1)}</td>
              <td style={{fontWeight:600,color:a.stock_estado==='critico'?'#FF3B30':a.stock_estado==='bajo'?'#FF9F0A':'inherit'}}>{a.stock_act} {a.unimed}</td>
              <td><span className={`badge ${STOCK_CLS[a.stock_estado]}`}>{STOCK_LBL[a.stock_estado]}</span></td>
              <td><button className="btn btn-sm" onClick={()=>setModal(a)}>✏️</button></td>
            </tr>
          ))}</tbody></table>}
      </div>
      {modal!==null && <ArticuloModal item={modal.id?modal:null} marcas={marcas} rubros={rubros} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}} />}
    </div>
  );
}

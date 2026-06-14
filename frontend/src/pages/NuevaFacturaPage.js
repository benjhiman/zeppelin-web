import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { facturacion, clientes as cliApi, articulos as artApi, vendedores as vendApi } from '../lib/api';
import toast from 'react-hot-toast';

const hoy = () => new Date().toISOString().slice(0, 10);
const fmt = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n || 0);

export default function NuevaFacturaPage() {
  const navigate = useNavigate();
  const [head, setHead] = useState({ tipo:'FA', pto_vta:1, fecha:hoy(), cliente_id:'', vendedor_id:'', condicion_id:'', observaciones:'' });
  const [items, setItems] = useState([{ articulo_id:'', articulo_nombre:'', cantidad:1, precio_unit:0, descuento:0, iva_porc:21 }]);
  const [clientes, setClientes] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchCli, setSearchCli] = useState('');
  const [searchArt, setSearchArt] = useState({});

  useEffect(() => {
    vendApi.listar().then(r => setVendedores(r.data)).catch(() => {});
  }, []);

  async function buscarClientes(q) {
    if (q.length < 2) return setClientes([]);
    const r = await cliApi.listar({ q, limit: 10 });
    setClientes(r.data.items);
  }

  async function buscarArticulo(idx, q) {
    if (q.length < 2) return;
    const r = await artApi.listar({ q, limit: 10 });
    setSearchArt(s => ({ ...s, [idx]: r.data.items }));
  }

  function selectCliente(c) {
    setHead(h => ({ ...h, cliente_id: c.id }));
    setSearchCli(c.nombre);
    setClientes([]);
  }

  function selectArticulo(idx, a) {
    updateItem(idx, { articulo_id: a.id, articulo_nombre: a.nombre, precio_unit: a.precio1 || 0, iva_porc: a.iva === '2' ? 10.5 : 21 });
    setSearchArt(s => ({ ...s, [idx]: [] }));
  }

  function updateItem(idx, patch) {
    setItems(its => its.map((it, i) => i === idx ? { ...it, ...patch } : it));
  }

  function addItem() {
    setItems(its => [...its, { articulo_id:'', articulo_nombre:'', cantidad:1, precio_unit:0, descuento:0, iva_porc:21 }]);
  }

  function removeItem(idx) {
    setItems(its => its.filter((_, i) => i !== idx));
  }

  function subtotalItem(it) { return it.cantidad * it.precio_unit * (1 - it.descuento / 100); }
  const subtotal = items.reduce((s, it) => s + subtotalItem(it), 0);
  const iva21 = items.filter(it => it.iva_porc === 21).reduce((s, it) => s + subtotalItem(it) * 0.21, 0);
  const iva105 = items.filter(it => it.iva_porc === 10.5).reduce((s, it) => s + subtotalItem(it) * 0.105, 0);
  const total = subtotal + iva21 + iva105;

  async function guardar() {
    if (!head.cliente_id) return toast.error('Seleccioná un cliente');
    if (items.every(it => !it.articulo_id)) return toast.error('Agregá al menos un artículo');
    setSaving(true);
    try {
      const payload = {
        ...head,
        cliente_id: Number(head.cliente_id),
        vendedor_id: head.vendedor_id ? Number(head.vendedor_id) : null,
        items: items.filter(it => it.articulo_id).map(it => ({
          articulo_id: Number(it.articulo_id),
          cantidad: Number(it.cantidad),
          precio_unit: Number(it.precio_unit),
          descuento: Number(it.descuento),
          iva_porc: Number(it.iva_porc),
        }))
      };
      await facturacion.crear(payload);
      toast.success('Factura creada correctamente');
      navigate('/facturacion');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Error al crear factura');
    } finally { setSaving(false); }
  }

  const TIPOS = [
    ['FA','Factura A'],['FB','Factura B'],['FC','Factura C'],
    ['NCA','NC A'],['NCB','NC B'],['REM','Remito'],['PRE','Presupuesto']
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Nueva factura</h1>
        <button className="btn" onClick={() => navigate('/facturacion')}>← Volver</button>
      </div>

      <div className="card mb-4">
        <div className="form-section">Encabezado</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Tipo de comprobante</label>
            <select value={head.tipo} onChange={e => setHead(h => ({ ...h, tipo: e.target.value }))}>
              {TIPOS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Punto de venta</label>
            <input type="number" value={head.pto_vta} onChange={e => setHead(h => ({ ...h, pto_vta: e.target.value }))} />
          </div>
          <div className="form-group" style={{ position:'relative' }}>
            <label>Cliente *</label>
            <input value={searchCli} onChange={e => { setSearchCli(e.target.value); buscarClientes(e.target.value); }} placeholder="Escribí para buscar..." />
            {clientes.length > 0 && (
              <div style={{ position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid var(--border)',borderRadius:8,zIndex:100,maxHeight:200,overflow:'auto',boxShadow:'var(--shadow)' }}>
                {clientes.map(c => (
                  <div key={c.id} style={{ padding:'8px 12px',cursor:'pointer' }} onMouseDown={() => selectCliente(c)}>
                    <strong>{c.nombre}</strong> <span style={{ color:'#888',fontSize:12 }}>{c.cuit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="form-group">
            <label>Vendedor</label>
            <select value={head.vendedor_id} onChange={e => setHead(h => ({ ...h, vendedor_id: e.target.value }))}>
              <option value="">— Sin asignar —</option>
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha</label>
            <input type="date" value={head.fecha} onChange={e => setHead(h => ({ ...h, fecha: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Observaciones</label>
            <input value={head.observaciones} onChange={e => setHead(h => ({ ...h, observaciones: e.target.value }))} />
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="form-section">Artículos</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Artículo</th><th>Cantidad</th><th>Precio unit.</th><th>Desc %</th><th>IVA %</th><th>Subtotal</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx}>
                  <td style={{ position:'relative', minWidth:220 }}>
                    <input
                      style={{ width:'100%', padding:'5px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }}
                      value={it.articulo_nombre}
                      onChange={e => { updateItem(idx, { articulo_nombre: e.target.value, articulo_id:'' }); buscarArticulo(idx, e.target.value); }}
                      placeholder="Buscar artículo..."
                    />
                    {searchArt[idx]?.length > 0 && (
                      <div style={{ position:'absolute',top:'100%',left:0,right:0,background:'#fff',border:'1px solid var(--border)',borderRadius:8,zIndex:100,maxHeight:180,overflow:'auto',boxShadow:'var(--shadow)' }}>
                        {searchArt[idx].map(a => (
                          <div key={a.id} style={{ padding:'7px 12px',cursor:'pointer',fontSize:13 }} onMouseDown={() => selectArticulo(idx, a)}>
                            <strong>{a.codigo}</strong> — {a.nombre} <span style={{ color:'#888' }}>{fmt(a.precio1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td><input type="number" min="0.001" step="0.001" value={it.cantidad}
                    onChange={e => updateItem(idx, { cantidad: parseFloat(e.target.value) || 0 })}
                    style={{ width:80, padding:'5px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} /></td>
                  <td><input type="number" min="0" step="0.01" value={it.precio_unit}
                    onChange={e => updateItem(idx, { precio_unit: parseFloat(e.target.value) || 0 })}
                    style={{ width:110, padding:'5px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} /></td>
                  <td><input type="number" min="0" max="100" value={it.descuento}
                    onChange={e => updateItem(idx, { descuento: parseFloat(e.target.value) || 0 })}
                    style={{ width:70, padding:'5px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }} /></td>
                  <td>
                    <select value={it.iva_porc} onChange={e => updateItem(idx, { iva_porc: parseFloat(e.target.value) })}
                      style={{ padding:'5px 8px', border:'1px solid var(--border)', borderRadius:6, fontSize:13 }}>
                      <option value={21}>21%</option>
                      <option value={10.5}>10.5%</option>
                      <option value={0}>Exento</option>
                    </select>
                  </td>
                  <td style={{ fontWeight:600 }}>{fmt(subtotalItem(it))}</td>
                  <td><button className="btn btn-sm" style={{ color:'#FF3B30' }} onClick={() => removeItem(idx)}>✕</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn btn-sm" style={{ marginTop:12 }} onClick={addItem}>➕ Agregar artículo</button>

        <div style={{ display:'flex',justifyContent:'flex-end',marginTop:20 }}>
          <div style={{ textAlign:'right',fontSize:14,minWidth:280 }}>
            <div className="flex-between mb-4"><span className="text-muted">Subtotal neto:</span><span>{fmt(subtotal)}</span></div>
            {iva21 > 0 && <div className="flex-between mb-4"><span className="text-muted">IVA 21%:</span><span>{fmt(iva21)}</span></div>}
            {iva105 > 0 && <div className="flex-between mb-4"><span className="text-muted">IVA 10.5%:</span><span>{fmt(iva105)}</span></div>}
            <div className="flex-between" style={{ fontSize:18,fontWeight:700,borderTop:'1px solid var(--border)',paddingTop:10,marginTop:10 }}>
              <span>TOTAL</span><span>{fmt(total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-gap">
        <button className="btn btn-primary" onClick={guardar} disabled={saving}>
          {saving ? <span className="spinner"></span> : '💾'} Guardar factura
        </button>
        <button className="btn" onClick={() => navigate('/facturacion')}>Cancelar</button>
      </div>
    </div>
  );
}

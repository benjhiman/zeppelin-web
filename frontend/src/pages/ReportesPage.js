import { useState } from 'react';
import { reportes as api } from '../lib/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const fmt = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(n||0);
const hoy = () => new Date().toISOString().slice(0,10);
const primerDiaMes = () => { const d=new Date(); d.setDate(1); return d.toISOString().slice(0,10); };

export default function ReportesPage() {
  const [activo, setActivo] = useState('ventas-vendedor');
  const [desde, setDesde] = useState(primerDiaMes());
  const [hasta, setHasta] = useState(hoy());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generar() {
    setLoading(true); setData(null);
    try {
      let r;
      if (activo==='ventas-vendedor') r = await api.ventasPorVendedor({ fecha_desde:desde, fecha_hasta:hasta });
      else if (activo==='articulos') r = await api.articulosMasVendidos({ fecha_desde:desde, fecha_hasta:hasta });
      else if (activo==='iva') r = await api.ivaVentas({ fecha_desde:desde, fecha_hasta:hasta });
      else if (activo==='cta-cte') r = await api.ctaCteClientes({});
      else if (activo==='caja') r = await api.cajaDiaria({ fecha: hasta });
      setData(r.data);
    } catch { toast.error('Error al generar reporte'); } finally { setLoading(false); }
  }

  const REPORTES = [
    ['ventas-vendedor','📊 Ventas por vendedor'],['articulos','🏆 Artículos más vendidos'],
    ['iva','📋 Libro IVA ventas'],['cta-cte','👥 Cta. cte. clientes'],['caja','💼 Caja diaria'],
  ];

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Reportes</h1></div>
      <div className="two-col">
        <div className="card" style={{ height:'fit-content' }}>
          <div className="card-title">Seleccionar reporte</div>
          {REPORTES.map(([k,v])=>(
            <div key={k} onClick={()=>setActivo(k)} style={{ padding:'10px 12px',cursor:'pointer',borderRadius:8,marginBottom:4,background:activo===k?'var(--brand-light)':'transparent',color:activo===k?'var(--brand)':'inherit',fontWeight:activo===k?600:400 }}>{v}</div>
          ))}
          <div className="form-section">Período</div>
          <div className="form-group mb-4"><label>Desde</label><input type="date" value={desde} onChange={e=>setDesde(e.target.value)} /></div>
          <div className="form-group mb-4"><label>Hasta</label><input type="date" value={hasta} onChange={e=>setHasta(e.target.value)} /></div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={generar} disabled={loading}>{loading?<span className="spinner"></span>:'▶'} Generar</button>
        </div>
        <div className="card">
          {!data && !loading && <div className="empty-state"><div className="empty-icon">📈</div><p>Seleccioná un reporte y hacé clic en Generar</p></div>}
          {loading && <div className="empty-state"><div className="spinner" style={{margin:'0 auto',width:32,height:32}}></div></div>}
          {data && activo==='ventas-vendedor' && <>
            <div className="card-title">Ventas por vendedor</div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}><XAxis dataKey="vendedor" tick={{fontSize:12}}/><YAxis tickFormatter={v=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:11}}/><Tooltip formatter={v=>fmt(v)}/><Bar dataKey="total" fill="#534AB7" radius={[4,4,0,0]}/></BarChart>
            </ResponsiveContainer>
            <table style={{marginTop:16}}><thead><tr><th>Vendedor</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>{data.map((r,i)=><tr key={i}><td>{r.vendedor}</td><td>{r.cantidad}</td><td><strong>{fmt(r.total)}</strong></td></tr>)}</tbody></table>
          </>}
          {data && activo==='articulos' && <>
            <div className="card-title">Artículos más vendidos</div>
            <table><thead><tr><th>Código</th><th>Artículo</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>{data.map((r,i)=><tr key={i}><td><code>{r.codigo}</code></td><td>{r.nombre}</td><td>{r.cantidad}</td><td><strong>{fmt(r.total)}</strong></td></tr>)}</tbody></table>
          </>}
          {data && activo==='iva' && <>
            <div className="card-title">Libro IVA Ventas</div>
            <table><thead><tr><th>Fecha</th><th>Tipo</th><th>Cliente</th><th>Neto</th><th>IVA 21%</th><th>Total</th></tr></thead>
            <tbody>{data.map((r,i)=><tr key={i}><td>{r.fecha}</td><td>{r.tipo}</td><td>{r.cliente}</td><td>{fmt(r.neto)}</td><td>{fmt(r.iva21)}</td><td><strong>{fmt(r.total)}</strong></td></tr>)}</tbody>
            <tfoot><tr style={{fontWeight:700}}><td colSpan={3}>TOTALES</td><td>{fmt(data.reduce((s,r)=>s+r.neto,0))}</td><td>{fmt(data.reduce((s,r)=>s+r.iva21,0))}</td><td>{fmt(data.reduce((s,r)=>s+r.total,0))}</td></tr></tfoot>
            </table>
          </>}
          {data && activo==='cta-cte' && <>
            <div className="card-title">Cuenta corriente clientes (deudores)</div>
            <table><thead><tr><th>Código</th><th>Cliente</th><th>Saldo</th></tr></thead>
            <tbody>{data.map((r,i)=><tr key={i}><td>{r.codigo}</td><td>{r.nombre}</td><td style={{fontWeight:600,color:'#FF9F0A'}}>{fmt(r.saldo)}</td></tr>)}</tbody></table>
          </>}
          {data && activo==='caja' && <>
            <div className="card-title">Caja del día — {data.fecha}</div>
            <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:16}}>
              <div className="stat-card"><div className="stat-label">Ingresos</div><div className="stat-value" style={{fontSize:18,color:'#34C759'}}>{fmt(data.ingresos)}</div></div>
              <div className="stat-card"><div className="stat-label">Egresos</div><div className="stat-value" style={{fontSize:18,color:'#FF3B30'}}>{fmt(data.egresos)}</div></div>
              <div className="stat-card"><div className="stat-label">Saldo</div><div className="stat-value" style={{fontSize:18}}>{fmt(data.saldo)}</div></div>
            </div>
            <table><thead><tr><th>Tipo</th><th>Medio</th><th>Concepto</th><th>Importe</th></tr></thead>
            <tbody>{data.movimientos.map((m,i)=><tr key={i}><td><span className={`badge ${m.tipo==='I'?'badge-green':'badge-red'}`}>{m.tipo==='I'?'Ingreso':'Egreso'}</span></td><td>{m.medio}</td><td>{m.concepto}</td><td style={{fontWeight:600}}>{fmt(m.importe)}</td></tr>)}</tbody></table>
          </>}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { dashboard, reportes } from '../lib/api';
import toast from 'react-hot-toast';

const ESTADO_LABEL = { P: 'Pendiente', C: 'Cobrada', A: 'Anulada' };
const ESTADO_CLASS = { P: 'badge-amber', C: 'badge-green', A: 'badge-red' };

function fmt(n) { return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n || 0); }

export default function DashboardPage() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [facturas, setFacturas] = useState([]);
  const [stockBajo, setStockBajo] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [k, f, s, v] = await Promise.all([
          dashboard.kpis(), dashboard.ultimasFacturas(),
          dashboard.stockBajo(), reportes.ventasPorVendedor()
        ]);
        setKpis(k.data); setFacturas(f.data); setStockBajo(s.data); setVentas(v.data);
      } catch { toast.error('Error cargando datos'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) return <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32, margin: '0 auto' }}></div></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inicio</h1>
        <button className="btn btn-primary" onClick={() => navigate('/facturacion/nueva')}>
          🧾 Nueva factura
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">💹 Ventas del mes</div>
          <div className="stat-value">{fmt(kpis?.ventas_mes)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👥 Clientes activos</div>
          <div className="stat-value">{kpis?.clientes_activos}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📦 Artículos bajo mínimo</div>
          <div className="stat-value" style={{ color: kpis?.stock_bajo > 0 ? '#FF3B30' : 'inherit' }}>
            {kpis?.stock_bajo}
          </div>
          <div className="stat-sub">de {kpis?.articulos_total} artículos</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ Cobranzas pendientes</div>
          <div className="stat-value" style={{ color: '#FF9F0A' }}>{fmt(kpis?.cobranzas_pendientes)}</div>
          <div className="stat-sub">{kpis?.comp_pendientes} comprobantes</div>
        </div>
      </div>

      <div className="two-col mb-6">
        <div className="card">
          <div className="card-title">Ventas por vendedor (mes actual)</div>
          {ventas.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ventas} barSize={32}>
                <XAxis dataKey="vendedor" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="total" fill="#534AB7" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <div className="flex-between mb-4">
            <span className="card-title" style={{ marginBottom: 0 }}>Stock bajo mínimo</span>
            <button className="btn btn-sm" onClick={() => navigate('/stock')}>Ver todo →</button>
          </div>
          {stockBajo.length === 0 ? (
            <div className="empty-state" style={{ padding: 24 }}>✅ Todo el stock en orden</div>
          ) : (
            <table>
              <thead><tr><th>Artículo</th><th>Stock</th><th>Mínimo</th></tr></thead>
              <tbody>
                {stockBajo.map((a, i) => (
                  <tr key={i}>
                    <td>{a.nombre}</td>
                    <td style={{ color: a.stock <= 0 ? '#FF3B30' : '#FF9F0A', fontWeight: 600 }}>
                      {a.stock} {a.unimed || 'u.'}
                    </td>
                    <td className="text-muted">{a.minimo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex-between mb-4">
          <span className="card-title" style={{ marginBottom: 0 }}>Últimas facturas</span>
          <button className="btn btn-sm" onClick={() => navigate('/facturacion')}>Ver todas →</button>
        </div>
        {facturas.length === 0 ? (
          <div className="empty-state" style={{ padding: 24 }}>Sin facturas aún</div>
        ) : (
          <table>
            <thead><tr><th>Número</th><th>Cliente</th><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
            <tbody>
              {facturas.map(f => (
                <tr key={f.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/facturacion')}>
                  <td><code>{f.numero}</code></td>
                  <td>{f.cliente}</td>
                  <td>{f.fecha}</td>
                  <td><strong>{fmt(f.total)}</strong></td>
                  <td><span className={`badge ${ESTADO_CLASS[f.estado] || 'badge-gray'}`}>{ESTADO_LABEL[f.estado] || f.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

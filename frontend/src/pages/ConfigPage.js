import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import api from '../lib/api';

export default function ConfigPage() {
  const { user } = useAuth();
  const [empresa, setEmpresa] = useState({ razon_social: '', nombre_comercial: '', cuit: '', tipo_iva: 'RI', direc: '', localidad: '', provincia: '', codpos: '', telefono: '', ingresos_brutos: '', cbu: '' });
  const [passForm, setPassForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/api/config/empresa').then(r => setEmpresa(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function saveEmpresa() {
    setSaving(true);
    try {
      await api.put('/api/config/empresa', empresa);
      toast.success('Datos guardados correctamente');
    } catch (e) { toast.error(e.response?.data?.detail || 'Error al guardar'); }
    finally { setSaving(false); }
  }

  async function changePassword() {
    if (!passForm.actual || !passForm.nueva) return toast.error('Completá todos los campos');
    if (passForm.nueva !== passForm.confirmar) return toast.error('Las contraseñas nuevas no coinciden');
    if (passForm.nueva.length < 6) return toast.error('La contraseña debe tener al menos 6 caracteres');
    try {
      await api.post('/api/auth/change-password', { current_password: passForm.actual, new_password: passForm.nueva });
      toast.success('Contraseña cambiada correctamente');
      setPassForm({ actual: '', nueva: '', confirmar: '' });
    } catch (e) { toast.error(e.response?.data?.detail || 'Contraseña actual incorrecta'); }
  }

  const set = (k, v) => setEmpresa(f => ({ ...f, [k]: v }));

  if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }}></div></div>;

  return (
    <div>
      <div className="page-header"><h1 className="page-title">Configuración</h1></div>

      <div className="card mb-4">
        <div className="card-title">🏢 Datos de la empresa</div>
        <div className="form-grid mb-4">
          <div className="form-group"><label>Razón social</label><input value={empresa.razon_social || ''} onChange={e => set('razon_social', e.target.value)} /></div>
          <div className="form-group"><label>Nombre comercial</label><input value={empresa.nombre_comercial || ''} onChange={e => set('nombre_comercial', e.target.value)} /></div>
          <div className="form-group"><label>CUIT</label><input value={empresa.cuit || ''} onChange={e => set('cuit', e.target.value)} placeholder="30-00000000-0" /></div>
          <div className="form-group"><label>Condición IVA</label>
            <select value={empresa.tipo_iva || 'RI'} onChange={e => set('tipo_iva', e.target.value)}>
              <option value="RI">Responsable Inscripto</option>
              <option value="MO">Monotributista</option>
              <option value="EX">Exento</option>
            </select>
          </div>
          <div className="form-group"><label>Ingresos Brutos</label><input value={empresa.ingresos_brutos || ''} onChange={e => set('ingresos_brutos', e.target.value)} /></div>
          <div className="form-group"><label>Teléfono</label><input value={empresa.telefono || ''} onChange={e => set('telefono', e.target.value)} /></div>
          <div className="form-group"><label>Dirección</label><input value={empresa.direc || ''} onChange={e => set('direc', e.target.value)} /></div>
          <div className="form-group"><label>Localidad</label><input value={empresa.localidad || ''} onChange={e => set('localidad', e.target.value)} /></div>
          <div className="form-group"><label>Provincia</label><input value={empresa.provincia || ''} onChange={e => set('provincia', e.target.value)} /></div>
          <div className="form-group"><label>Código postal</label><input value={empresa.codpos || ''} onChange={e => set('codpos', e.target.value)} /></div>
          <div className="form-group" style={{ gridColumn: 'span 2' }}><label>CBU</label><input value={empresa.cbu || ''} onChange={e => set('cbu', e.target.value)} placeholder="Opcional — para mostrar en facturas" /></div>
        </div>
        <button className="btn btn-primary" onClick={saveEmpresa} disabled={saving}>{saving ? <span className="spinner"></span> : '💾'} Guardar datos</button>
      </div>

      <div className="card mb-4">
        <div className="card-title">🔒 Cambiar contraseña</div>
        <div style={{ maxWidth: 400 }}>
          <div className="form-group mb-4"><label>Contraseña actual</label><input type="password" value={passForm.actual} onChange={e => setPassForm(f => ({ ...f, actual: e.target.value }))} /></div>
          <div className="form-group mb-4"><label>Nueva contraseña</label><input type="password" value={passForm.nueva} onChange={e => setPassForm(f => ({ ...f, nueva: e.target.value }))} /></div>
          <div className="form-group mb-4"><label>Confirmar nueva contraseña</label><input type="password" value={passForm.confirmar} onChange={e => setPassForm(f => ({ ...f, confirmar: e.target.value }))} /></div>
          <button className="btn btn-primary" onClick={changePassword}>🔒 Cambiar contraseña</button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">ℹ️ Información del sistema</div>
        <table style={{ maxWidth: 400 }}>
          <tbody>
            <tr><td className="text-muted" style={{ paddingRight: 24 }}>Usuario activo</td><td><strong>{user?.nombre}</strong></td></tr>
            <tr><td className="text-muted">Rol</td><td>{user?.es_admin ? '⭐ Administrador' : 'Usuario'}</td></tr>
            <tr><td className="text-muted">Versión</td><td>Zeppelin Web 1.0</td></tr>
            <tr><td className="text-muted">API</td><td><a href={`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/docs`} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>Ver documentación →</a></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

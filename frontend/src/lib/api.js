import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ---- helpers ----
export const auth = {
  login: (username, password) => {
    const form = new URLSearchParams();
    form.append('username', username);
    form.append('password', password);
    return api.post('/api/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  },
};

export const dashboard = {
  kpis: () => api.get('/api/dashboard/kpis'),
  ultimasFacturas: () => api.get('/api/dashboard/ultimas-facturas'),
  stockBajo: () => api.get('/api/dashboard/stock-bajo'),
};

export const clientes = {
  listar: (params) => api.get('/api/clientes/', { params }),
  obtener: (id) => api.get(`/api/clientes/${id}`),
  crear: (data) => api.post('/api/clientes/', data),
  actualizar: (id, data) => api.put(`/api/clientes/${id}`, data),
  eliminar: (id) => api.delete(`/api/clientes/${id}`),
  ctaCte: (id) => api.get(`/api/clientes/${id}/cuenta-corriente`),
};

export const articulos = {
  listar: (params) => api.get('/api/articulos/', { params }),
  obtener: (id) => api.get(`/api/articulos/${id}`),
  crear: (data) => api.post('/api/articulos/', data),
  actualizar: (id, data) => api.put(`/api/articulos/${id}`, data),
  eliminar: (id) => api.delete(`/api/articulos/${id}`),
  marcas: () => api.get('/api/articulos/maestros/marcas'),
  rubros: () => api.get('/api/articulos/maestros/rubros'),
};

export const facturacion = {
  listar: (params) => api.get('/api/facturacion/', { params }),
  obtener: (id) => api.get(`/api/facturacion/${id}`),
  crear: (data) => api.post('/api/facturacion/', data),
  anular: (id) => api.post(`/api/facturacion/${id}/anular`),
  cobrar: (id) => api.post(`/api/facturacion/${id}/cobrar`),
  tipos: () => api.get('/api/facturacion/tipos/lista'),
};

export const cobranzas = {
  pendientes: (params) => api.get('/api/cobranzas/pendientes', { params }),
  registrar: (data) => api.post('/api/cobranzas/registrar', data),
  resumen: () => api.get('/api/cobranzas/resumen'),
};

export const proveedores = {
  listar: (params) => api.get('/api/proveedores/', { params }),
  obtener: (id) => api.get(`/api/proveedores/${id}`),
  crear: (data) => api.post('/api/proveedores/', data),
  actualizar: (id, data) => api.put(`/api/proveedores/${id}`, data),
};

export const caja = {
  listar: (params) => api.get('/api/caja/', { params }),
  saldo: () => api.get('/api/caja/saldo'),
  crear: (data) => api.post('/api/caja/', data),
};

export const bancos = {
  listar: () => api.get('/api/bancos/'),
  movimientos: (id) => api.get(`/api/bancos/${id}/movimientos`),
  agregarMov: (data) => api.post('/api/bancos/movimiento', data),
};

export const vendedores = {
  listar: () => api.get('/api/vendedores/'),
  crear: (data) => api.post('/api/vendedores/', data),
  actualizar: (id, data) => api.put(`/api/vendedores/${id}`, data),
};

export const pedidos = {
  listar: (params) => api.get('/api/pedidos/', { params }),
  obtener: (id) => api.get(`/api/pedidos/${id}`),
  crear: (data) => api.post('/api/pedidos/', data),
  cambiarEstado: (id, estado) => api.put(`/api/pedidos/${id}/estado`, null, { params: { estado } }),
};

export const reportes = {
  ventasPorVendedor: (params) => api.get('/api/reportes/ventas-por-vendedor', { params }),
  articulosMasVendidos: (params) => api.get('/api/reportes/articulos-mas-vendidos', { params }),
  ivaVentas: (params) => api.get('/api/reportes/iva-ventas', { params }),
  ctaCteClientes: (params) => api.get('/api/reportes/cuenta-corriente-clientes', { params }),
  cajaDiaria: (params) => api.get('/api/reportes/caja-diaria', { params }),
};

export default api;

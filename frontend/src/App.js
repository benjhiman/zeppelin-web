import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import ArticulosPage from './pages/ArticulosPage';
import FacturacionPage from './pages/FacturacionPage';
import NuevaFacturaPage from './pages/NuevaFacturaPage';
import CobranzasPage from './pages/CobranzasPage';
import PedidosPage from './pages/PedidosPage';
import StockPage from './pages/StockPage';
import ComprasPage from './pages/ComprasPage';
import CajaPage from './pages/CajaPage';
import BancosPage from './pages/BancosPage';
import VendedoresPage from './pages/VendedoresPage';
import ProveedoresPage from './pages/ProveedoresPage';
import ReportesPage from './pages/ReportesPage';
import ConfigPage from './pages/ConfigPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"    element={<DashboardPage />} />
            <Route path="clientes"     element={<ClientesPage />} />
            <Route path="articulos"    element={<ArticulosPage />} />
            <Route path="facturacion"  element={<FacturacionPage />} />
            <Route path="facturacion/nueva" element={<NuevaFacturaPage />} />
            <Route path="cobranzas"    element={<CobranzasPage />} />
            <Route path="pedidos"      element={<PedidosPage />} />
            <Route path="stock"        element={<StockPage />} />
            <Route path="compras"      element={<ComprasPage />} />
            <Route path="caja"         element={<CajaPage />} />
            <Route path="bancos"       element={<BancosPage />} />
            <Route path="vendedores"   element={<VendedoresPage />} />
            <Route path="proveedores"  element={<ProveedoresPage />} />
            <Route path="reportes"     element={<ReportesPage />} />
            <Route path="config"       element={<ConfigPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

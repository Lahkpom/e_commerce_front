import { createBrowserRouter, Navigate } from 'react-router-dom';

import Layout from '../components/layout/Layout';

import Home from '../pages/Home';
import ProductsPage from '../pages/ProductsPage';
import ProductDetails from '../pages/ProductDetails';
import ContactPage from '../pages/ContactPage';
import PaymentShippingPage from '../pages/PaymentShippingPage';

import Login from '../pages/login/Login';
import Signup from '../pages/login/Signup';

import Error404 from '../pages/errors/Error404';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminLayout from '../components/admin/layout/AdminLayout';
import AdminHome from '../pages/admin/AdminHome';
import AdminProducts from '../pages/admin/AdminProducts';
import AdminVariants from '../pages/admin/AdminVariants';
import AdminColors from '../pages/admin/AdminColors';
import AdminSales from '../pages/admin/AdminSales';
import AdminReturnsPage from '../pages/admin/AdminReturnsPage';
import AdminUsers from '../pages/admin/AdminUsers';

import Cart from '../pages/user/Cart';
import Checkout from '../pages/Checkout';
import MyAccountPage from '../pages/user/MyAccountPage';
import MyOrders from '../components/userDashboard/MyOrders';
import UserDashboardLayout from '../components/userDashboard/UserDashboardLayout';
import CheckoutSuccessPage from '../pages/checkout/CheckoutSuccessPage';
import CheckoutPendingPage from '../pages/checkout/CheckoutPendingPage';
import CheckoutFailurePage from '../pages/checkout/CheckoutFailurePage';
import MercadoPagoSandboxPage from '../pages/checkout/MercadoPagoSandboxPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    errorElement: <Error404 />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'productos',
        element: <ProductsPage />,
      },
      {
        path: 'productos/:id_product',
        element: <ProductDetails />,
      },
      {
        path: 'pagos_envios',
        element: <PaymentShippingPage />,
      },
      {
        path: 'contacto',
        element: <ContactPage />,
      },
      {
        path: 'iniciar_sesion',
        element: <Login />,
      },
      {
        path: 'registrarse',
        element: <Signup />,
      },
      {
        path: 'carrito',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
      {
        path: 'checkout/success',
        element: <CheckoutSuccessPage />,
      },
      {
        path: 'checkout/pending',
        element: <CheckoutPendingPage />,
      },
      {
        path: 'checkout/failure',
        element: <CheckoutFailurePage />,
      },
      {
        path: 'checkout/mp-sandbox',
        element: import.meta.env.DEV ? <MercadoPagoSandboxPage /> : <Navigate to="/" replace />,
      },
      {
        path: 'mi_cuenta',
        element: <ProtectedRoute><UserDashboardLayout /></ProtectedRoute>,
        children: [
          {
            index: true,
            element: <MyAccountPage />,
          },
          {
            path: 'ordenes_activas',
            element: <MyOrders mode="active" />,
          },
          {
            path: 'historial',
            element: <MyOrders mode="history" />,
          },
        ],
      },
    ],
  },
  {
    path: '/admin',
    element: <ProtectedRoute roles={['ADMIN', 'OPERATOR']}><AdminLayout /></ProtectedRoute>,
    errorElement: <Error404 />,
    children: [
      { index: true, element: <AdminHome /> },
      { path: 'productos', element: <AdminProducts /> },
      { path: 'variantes', element: <AdminVariants /> },
      { path: 'colores', element: <AdminColors /> },
      { path: 'ventas', element: <AdminSales /> },
      { path: 'devoluciones', element: <AdminReturnsPage /> },
      { path: 'usuarios', element: <AdminUsers /> },
    ],
  },
]);

export default router;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth';
import { remoteAuthService } from './services/remoteAuth';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import CustomerPortal from './pages/CustomerPortal';
import AdminPortal from './pages/AdminPortal';
import RemoteCustomerLogin from './pages/RemoteCustomerLogin';
import RemoteCustomerRegister from './pages/RemoteCustomerRegister';
import RemoteCustomerPortal from './pages/RemoteCustomerPortal';
import './App.css';

// Admin Protected Route
function ProtectedRoute({ children }) {
    const isAuth = authService.isAuthenticated();
    return isAuth ? children : <Navigate to="/admin/login" />;
}

// Remote Customer Protected Route
function RemoteProtectedRoute({ children }) {
    const isAuth = remoteAuthService.isAuthenticated();
    return isAuth ? children : <Navigate to="/remote-customer/login" />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Trang chủ */}
                <Route path="/" element={<HomePage />} />

                {/* Admin routes */}
                <Route path="/admin/login" element={<LoginPage />} />
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute>
                            <AdminPortal />
                        </ProtectedRoute>
                    }
                />

                {/* Khách hàng nội bộ (không cần đăng nhập) */}
                <Route path="/customer/*" element={<CustomerPortal />} />

                {/* Khách hàng từ xa (cần đăng nhập) */}
                <Route path="/remote-customer/login" element={<RemoteCustomerLogin />} />
                <Route path="/remote-customer/register" element={<RemoteCustomerRegister />} />
                <Route
                    path="/remote-customer/portal/*"
                    element={
                        <RemoteProtectedRoute>
                            <RemoteCustomerPortal />
                        </RemoteProtectedRoute>
                    }
                />
                {/* Redirect /remote-customer → login */}
                <Route path="/remote-customer" element={<Navigate to="/remote-customer/login" />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

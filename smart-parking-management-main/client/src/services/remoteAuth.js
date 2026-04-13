const REMOTE_CUSTOMER_TOKEN_KEY = 'remote_customer_token';
const REMOTE_CUSTOMER_INFO_KEY = 'remote_customer_info';

export const remoteAuthService = {
    async register({ email, fullName, dateOfBirth, phone, password }) {
        try {
            const res = await fetch('/api/remote-auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, fullName, dateOfBirth, phone, password })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Đăng ký thất bại' };
            return { success: true, message: data.message };
        } catch {
            return { success: false, error: 'Không thể kết nối server' };
        }
    },

    async login(email, password) {
        try {
            const res = await fetch('/api/remote-auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) return { success: false, error: data.error || 'Đăng nhập thất bại' };

            sessionStorage.setItem(REMOTE_CUSTOMER_TOKEN_KEY, data.token);
            sessionStorage.setItem(REMOTE_CUSTOMER_INFO_KEY, JSON.stringify(data.customer));
            return { success: true, customer: data.customer };
        } catch {
            return { success: false, error: 'Không thể kết nối server' };
        }
    },

    logout() {
        sessionStorage.removeItem(REMOTE_CUSTOMER_TOKEN_KEY);
        sessionStorage.removeItem(REMOTE_CUSTOMER_INFO_KEY);
    },

    isAuthenticated() {
        const token = sessionStorage.getItem(REMOTE_CUSTOMER_TOKEN_KEY);
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch {
            return false;
        }
    },

    getToken() {
        return sessionStorage.getItem(REMOTE_CUSTOMER_TOKEN_KEY);
    },

    getCustomer() {
        const info = sessionStorage.getItem(REMOTE_CUSTOMER_INFO_KEY);
        try { return info ? JSON.parse(info) : null; } catch { return null; }
    }
};

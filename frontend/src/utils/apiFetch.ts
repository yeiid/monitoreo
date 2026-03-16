/**
 * apiFetch: Wrapper global sobre fetch() que inyecta automáticamente
 * el JWT token desde localStorage en el header Authorization.
 * 
 * Úsalo como reemplazo directo de fetch():
 *   import { apiFetch } from '../utils/apiFetch';
 *   const res = await apiFetch(`${API_BASE}/nodes`);
 */
export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('ftth_token');
    const headers = new Headers(options.headers);

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    // Auto-set Content-Type for JSON bodies
    if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, { ...options, headers });

    // Si el token expiró (401), redirigir al login
    if (res.status === 401) {
        localStorage.removeItem('ftth_token');
        localStorage.removeItem('ftth_user');
        window.location.href = '/login';
    }

    return res;
}

# ArenaOps Auth Service — Frontend Integration Guide

> **Base URL**: `http://localhost:5170/api/auth`
> **Auth Method**: HTTP-only cookies (set automatically by the server)

---

## How Authentication Works

```
1. Login/Register → Server sets httpOnly cookies (accessToken + refreshToken)
2. All requests   → Browser sends cookies automatically (no manual headers)
3. Token expires  → Frontend calls POST /refresh → new cookies set
4. Logout         → Server clears cookies + blacklists token
```

| Cookie | Scope | Expiry | Notes |
|---|---|---|---|
| `accessToken` | `Path=/` (all routes) | 30 minutes | Sent with every request |
| `refreshToken` | `Path=/api/auth` (auth routes only) | 7 days | Only sent to auth endpoints |

Both cookies are `HttpOnly` (no JS access), `Secure` in production, `SameSite=Strict` in production / `Lax` in dev.

> **Frontend does NOT need to store tokens in localStorage.** The browser handles cookies automatically. Tokens are also returned in the response body for Swagger/Postman testing.

---

## Response Format

```json
// ✅ Success
{
  "success": true,
  "data": { ... },
  "message": "Human-readable message",
  "error": null
}

// ❌ Error
{
  "success": false,
  "data": null,
  "message": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `EMAIL_EXISTS` | 409 | Email already registered |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `ACCOUNT_DISABLED` | 401 | Account deactivated |
| `INVALID_REFRESH_TOKEN` | 401 | Refresh token not found |
| `TOKEN_REVOKED` | 401 | Refresh token was revoked |
| `TOKEN_EXPIRED` | 401 | Refresh token expired |
| `INVALID_OTP` | 400 | OTP wrong, expired (15 min), or used |
| `WRONG_PASSWORD` | 401 | Current password incorrect |
| `NO_PASSWORD` | 400 | Google-only account, no password set |
| `MISSING_REFRESH_TOKEN` | 400 | No refresh token in cookie or body |
| `INVALID_TOKEN` | 401 | Could not extract user from JWT |
| `RATE_LIMITED` | 429 | Too many requests, try again later |

---

## Roles

| Role | Created Via |
|---|---|
| `User` | Self-registration (default) |
| `Organizer` | Self-registration (`role: "Organizer"`) |
| `StadiumOwner` | Admin creates via `/stadium-manager` |
| `Admin` | Database-seeded only |

---

## Rate Limiting

All auth endpoints are rate-limited **per IP address** to prevent brute-force attacks.

| Policy | Limit | Endpoints |
|---|---|---|
| `auth-strict` | **5 requests / minute** | `/login`, `/forgot-password`, `/reset-password` |
| `auth-general` | **20 requests / minute** | `/register`, `/google`, `/refresh` |

When the limit is exceeded, the API returns `429 Too Many Requests`:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

**Frontend handling:**
```typescript
if (err.response?.status === 429) {
  toast.error('Too many attempts. Please wait a minute and try again.');
}
```

---

## Axios Setup (One-Time)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5170/api',
  withCredentials: true,  // ← CRITICAL: sends cookies with every request
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true;
      try {
        await api.post('/auth/refresh'); // Cookie sent automatically
        return api(err.config);          // Retry original request
      } catch {
        window.location.href = '/login'; // Refresh failed → force login
      }
    }
    return Promise.reject(err);
  }
);

export default api;
```

> **IMPORTANT:** `withCredentials: true` is required on every request. Without it, cookies won't be sent.

---

## 1. Register

```
POST /api/auth/register                    [No Auth] [Rate: 20/min]
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | ✅ | Valid email |
| `password` | string | ✅ | 8–100 chars |
| `fullName` | string | ✅ | Max 200 chars |
| `role` | string | ❌ | `"User"` (default) or `"Organizer"` |

**cURL — Register as User:**
```bash
curl -X POST http://localhost:5170/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "MyPassword123",
    "fullName": "John Doe"
  }'
```

**cURL — Register as Organizer:**
```bash
curl -X POST http://localhost:5170/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "organizer@example.com",
    "password": "MyPassword123",
    "fullName": "Jane Smith",
    "role": "Organizer"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "a1b2c3d4-e5f6-...",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "roles": ["Organizer"],
    "isNewUser": true
  },
  "message": "Registration successful"
}
```

**Response Headers:**
```
Set-Cookie: accessToken=eyJhbG...; HttpOnly; Path=/; Expires=...
Set-Cookie: refreshToken=a1b2c3...; HttpOnly; Path=/api/auth; Expires=...
```

**Errors:** `409 EMAIL_EXISTS` · `400 Validation`

**Frontend:**
```typescript
const register = async (email: string, password: string, fullName: string, role?: string) => {
  const { data } = await api.post('/auth/register', { email, password, fullName, role });
  // Cookies set automatically — just redirect
  const userRole = data.data.roles[0];
  router.push(userRole === 'Organizer' ? '/organizer/dashboard' : '/dashboard');
};
```

---

## 2. Login

```
POST /api/auth/login                       [No Auth] [Rate: 5/min]
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `password` | string | ✅ |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "user@example.com",
    "password": "MyPassword123"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "a1b2c3d4-e5f6-...",
    "userId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "roles": ["User"],
    "isNewUser": false
  },
  "message": "Login successful"
}
```

**Errors:** `401 INVALID_CREDENTIALS` · `401 ACCOUNT_DISABLED`

**Frontend:**
```typescript
const login = async (email: string, password: string) => {
  const { data } = await api.post('/auth/login', { email, password });
  // Cookies set automatically — store non-sensitive data for UI
  localStorage.setItem('userId', data.data.userId);
  localStorage.setItem('roles', JSON.stringify(data.data.roles));
  router.push('/dashboard');
};
```

---

## 3. Google OAuth Login

```
POST /api/auth/google                      [No Auth] [Rate: 20/min]
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `code` | string | ✅ | Google authorization code |
| `redirectUri` | string | ✅ | Must match Google Console |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/google \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "code": "4/0AX4XfWh...",
    "redirectUri": "http://localhost:3000/auth/google/callback"
  }'
```

**Response (200):** Same as Login. `isNewUser: true` for first-time Google sign-in.

**Frontend:**
```typescript
// After Google redirects with ?code=... in URL
const handleGoogleCallback = async (code: string) => {
  const { data } = await api.post('/auth/google', {
    code,
    redirectUri: `${window.location.origin}/auth/google/callback`
  });
  localStorage.setItem('userId', data.data.userId);
  localStorage.setItem('roles', JSON.stringify(data.data.roles));
  router.push(data.data.isNewUser ? '/onboarding' : '/dashboard');
};
```

---

## 4. Refresh Token

```
POST /api/auth/refresh                     [No Auth] [Rate: 20/min]
```

**No request body needed** — the `refreshToken` cookie is sent automatically by the browser.

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt
```

**Response (200):** Same structure as Login. **New cookies are set** — old refresh token is revoked.

**Errors:** `401 INVALID_REFRESH_TOKEN` · `401 TOKEN_REVOKED` · `401 TOKEN_EXPIRED`

> **Frontend:** Handled automatically by the Axios interceptor (see Axios Setup above). You should never need to call this manually.

---

## 5. Logout

```
POST /api/auth/logout                                [Auth Required]
```

**No request body needed** — refresh token read from cookie.

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

**Response (200):**
```json
{
  "success": true,
  "data": {},
  "message": "Logged out successfully"
}
```

**What happens server-side:**
1. Access token **blacklisted** (immediately invalid)
2. Refresh token **deleted** from database
3. Both cookies **cleared**

**Frontend:**
```typescript
const logout = async () => {
  await api.post('/auth/logout');
  localStorage.clear();
  router.push('/login');
};
```

---

## 6. Forgot Password

```
POST /api/auth/forgot-password             [No Auth] [Rate: 5/min]
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{ "email": "user@example.com" }'
```

**Response (always 200):**
```json
{
  "success": true,
  "data": {},
  "message": "If the email exists, a reset code has been sent."
}
```

> 🔒 Always returns 200 — even if email doesn't exist (prevents email enumeration).
> 🛠️ In dev, the 6-digit OTP is printed in the backend console.

**Frontend:**
```typescript
const forgotPassword = async (email: string) => {
  const { data } = await api.post('/auth/forgot-password', { email });
  toast.success(data.message);
  router.push(`/reset-password?email=${encodeURIComponent(email)}`);
};
```

---

## 7. Reset Password

```
POST /api/auth/reset-password              [No Auth] [Rate: 5/min]
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | ✅ | Valid email |
| `otp` | string | ✅ | 6-digit code |
| `newPassword` | string | ✅ | Min 8 chars |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "482917",
    "newPassword": "MyNewPassword456"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {},
  "message": "Password has been reset successfully."
}
```

**Errors:** `400 INVALID_OTP`

**Security effects:**
- All refresh tokens revoked (force re-login on all devices)
- Auth cookies cleared
- OTP marked as used (single-use)

**Frontend:**
```typescript
const resetPassword = async (email: string, otp: string, newPassword: string) => {
  try {
    const { data } = await api.post('/auth/reset-password', { email, otp, newPassword });
    toast.success(data.message);
    router.push('/login');
  } catch (err: any) {
    toast.error(err.response?.data?.error?.message || 'Invalid or expired OTP');
  }
};
```

---

## 8. Change Password

```
POST /api/auth/change-password                       [Auth Required]
```

| Field | Type | Required |
|---|---|---|
| `currentPassword` | string | ✅ |
| `newPassword` | string | ✅ |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/change-password \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "currentPassword": "MyPassword123",
    "newPassword": "MyNewPassword456"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {},
  "message": "Password changed successfully."
}
```

**Errors:** `401 WRONG_PASSWORD` · `400 NO_PASSWORD` (Google-only account)

**Security effects:** Same as reset — all tokens revoked, cookies cleared.

**Frontend:**
```typescript
const changePassword = async (currentPassword: string, newPassword: string) => {
  try {
    await api.post('/auth/change-password', { currentPassword, newPassword });
    toast.success('Password changed. Please log in again.');
    localStorage.clear();
    router.push('/login');
  } catch (err: any) {
    toast.error(err.response?.data?.error?.message || 'Failed');
  }
};
```

---

## 9. Create Stadium Manager *(Admin Only)*

```
POST /api/auth/stadium-manager                       [Admin Only]
```

| Field | Type | Required |
|---|---|---|
| `email` | string | ✅ |
| `fullName` | string | ✅ |
| `phoneNumber` | string | ❌ |

**cURL:**
```bash
curl -X POST http://localhost:5170/api/auth/stadium-manager \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "email": "manager@stadium.com",
    "fullName": "Stadium Manager",
    "phoneNumber": "+91-9876543210"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "userId": "3fa85f64-...",
    "email": "manager@stadium.com",
    "fullName": "Stadium Manager",
    "role": "StadiumOwner",
    "message": "Stadium Manager account created. Temporary password sent to their email."
  },
  "message": "Account created successfully"
}
```

**Errors:** `401 Unauthorized` · `403 Forbidden` · `409 EMAIL_EXISTS`

**What happens server-side:**
1. A new user is created with role `StadiumOwner`
2. A **temporary password** (12 chars, mixed case + digits + special) is generated
3. The temp password is hashed with BCrypt and stored as the user's `PasswordHash`
4. The **plain-text temp password** is emailed to the manager
5. **No time limit** — the temp password never expires (unlike OTPs)

### Stadium Manager Onboarding Flow

```
[Admin creates manager] → POST /stadium-manager → Temp password emailed
[Manager logs in]       → POST /login (email + temp password)
[Manager changes pwd]   → POST /change-password (temp → new password)
                          — OR —
                          POST /forgot-password → POST /reset-password (OTP flow)
```

> 🔑 The temp password works as a normal password — no special setup step needed.
> The manager simply logs in with `POST /login` and then changes their password.
> In dev mode, the temp password is printed to the console (MockEmailService).

---

## 10. JWKS *(Internal — Not for Frontend)*

```
GET /api/auth/.well-known/jwks                       [No Auth]
```

Returns the RSA public key in JWKS format. Used by other microservices — **frontend does not need this**.

---

## Frontend Checklist

### ✅ Required Setup
- [ ] Axios `withCredentials: true` on every request
- [ ] Axios interceptor for automatic 401 → refresh → retry
- [ ] Store `userId` and `roles` in localStorage (for UI only, not auth)

### ✅ Route Protection
```typescript
const roles = JSON.parse(localStorage.getItem('roles') || '[]');

if (roles.includes('Admin'))        → /admin/*
if (roles.includes('StadiumOwner')) → /manager/*
if (roles.includes('Organizer'))    → /organizer/*
if (roles.includes('User'))         → /dashboard/*
```

### ✅ UI Flows

**Forgot Password:**
```
[Enter Email] → POST /forgot-password → [Enter OTP + New Password] → POST /reset-password → [Login]
```

**Change Password (Settings Page):**
```
[Enter Current + New Password] → POST /change-password → Auto logout → [Login]
```

### ✅ What NOT to Do
- ❌ Don't store `accessToken` or `refreshToken` in localStorage
- ❌ Don't send `Authorization: Bearer ...` header manually
- ❌ Don't read cookies from JavaScript (they're `HttpOnly`)
- ❌ Don't forget `withCredentials: true`

<!-- PURPOSE OF THIS FILE: JWT implementation best practice'leri — AI ajanının uyması gereken ZORUNLU/YASAK/ÖNERİLEN kurallar -->
# JWT Implementation Pattern

## Genel Prensipler

- 🔴 **ZORUNLU:** Access token ömrü ≤ 15 dakika. Refresh token ömrü ≤ 7 gün. Bu süreler aşılamaz.
- 🔴 **ZORUNLU:** JWT_SECRET en az 256-bit (32 byte) rastgele değerdir. Production'da environment variable / Key Vault dışında hiçbir yerde bulunmaz.
- 🔴 **ZORUNLU:** Token payload'ı MİNİMAL tutulur: `{ sub: userId, role: 'user', iat, exp }`. Hassas veri (email, password hash, PII) ASLA token'da saklanmaz.
- 🔴 **ZORUNLU:** Refresh token httpOnly + Secure + SameSite=Strict cookie olarak saklanır. LocalStorage'da SAKLANMAZ (XSS riski).
- 🟠 **YASAK:** `HS256` production'da tek başına kullanılmaz. Asimetrik algoritma (RS256, ES256) tercih edilir.

## Güvenlik

### Token Taşıma
```javascript
// ✅ DOĞRU — Cookie ayarları
res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 gün
});
```

### Token Yenileme (Rotation)
```javascript
// ✅ DOĞRU — Her refresh'te hem access hem refresh token yenilenir
router.post('/auth/refresh', async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) return sendError(res, 401, 'Refresh token eksik');

  try {
    const payload = verifyToken(oldRefreshToken);

    // Eski token'ı blacklist'e al
    await blacklistToken(oldRefreshToken, payload.exp);

    // Yeni token çifti
    const newAccessToken = signToken({ sub: payload.sub, role: payload.role }, '15m');
    const newRefreshToken = signToken({ sub: payload.sub }, '7d');

    res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: true, sameSite: 'strict', path: '/auth/refresh' });
    return sendJson(res, 200, { accessToken: newAccessToken });
  } catch {
    res.clearCookie('refreshToken');
    return sendError(res, 401, 'Geçersiz veya süresi dolmuş refresh token');
  }
});
```

## Kodlama Standartları

### Node.js (jsonwebtoken)
```javascript
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '{{JWT_SECRET}}';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// ✅ DOĞRU — Minimal payload
function signToken(payload, expiresIn = ACCESS_TOKEN_EXPIRY) {
  if (!JWT_SECRET || JWT_SECRET === '{{JWT_SECRET}}') {
    throw new Error('JWT_SECRET environment variable tanımlanmamış!');
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn, algorithm: 'HS256' });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
}

// ✅ DOĞRU — Auth middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'Authorization header eksik');
  }

  try {
    const token = authHeader.split(' ')[1];
    req.user = verifyToken(token);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 401, 'Token süresi doldu, lütfen yenileyin');
    }
    return sendError(res, 401, 'Geçersiz token');
  }
}
```

### .NET (JwtBearer)
```csharp
// Program.cs
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Secret"]
                    ?? throw new InvalidOperationException("JWT Secret tanımlı değil")))
        };
    });
```

## Yaygın Hatalar

1. **Refresh token'ı localStorage'da saklamak** — XSS saldırısında çalınır, httpOnly cookie şart.
2. **Access token ömrü > 15dk** — Token çalındığında saldırgan uzun süre kullanabilir.
3. **Token'a email/şifre koymak** — JWT payload'ı base64 encoded, şifreli DEĞİL. Herkes okuyabilir.
4. **HS256 ile tek secret** — RS256 asimetrik algoritma daha güvenli (public key dağıtımı).
5. **Refresh token rotation yapmamak** — Eski refresh token geçerli kalır, token çalma riski.
6. **JWT_SECRET zayıf veya varsayılan** — `secret123` gibi değerler brute-force edilebilir.
7. **`exp` claim kontrolü yapmamak** — JWT verify zaten exp'i kontrol eder ama manual check ihmal edilmemeli.

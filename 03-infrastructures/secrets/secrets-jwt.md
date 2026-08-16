<!--
  BU DOSYANIN AMACI:
  JWT signing key'lerinin güvenli yönetimini, key rotation stratejisini, RS256 vs HS256 kararını ve token güvenlik best practice'lerini AI'a öğretir.

  İLGİLİ DOSYALAR:
  - 04-frameworks/jwt/config-rules.md
  - 04-frameworks/jwt/best-practices.md
  - 03-infrastructures/secrets/
-->

# SECRETS + JWT ENTEGRASYONU

## 1. ALGORİTMA SEÇİMİ: HS256 vs RS256

| Özellik | HS256 (HMAC) | RS256 (RSA) |
|---------|-------------|-------------|
| Key tipi | Simetrik (tek secret) | Asimetrik (public + private) |
| Key yönetimi | Tek secret paylaşılır | Private key gizli, public key dağıtılabilir |
| Token doğrulama | Aynı secret gerekli | Sadece public key yeterli |
| Mikroservis uyumu | Zayıf (her servis secret'ı bilmeli) | İdeal (auth service imzalar, diğerleri public key ile doğrular) |
| Öneri | Monolith uygulama | Mikroservis mimarisi |

## 2. HS256 SECRET YÖNETİMİ (Monolith)

```env
# .env:
JWT_SECRET=minimum-32-karakter-uzun-gizli-anahtar-buraya!!!128bit
# veya openssl ile üret:
# openssl rand -hex 64
```

```ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

// Secret validasyonu:
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET en az 32 karakter olmalı');
}

// Token oluşturma:
const token = jwt.sign(
  { sub: user.id, role: user.role },
  JWT_SECRET,
  { algorithm: 'HS256', expiresIn: '15m' }
);

// Token doğrulama:
const payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
```

## 3. RS256 KEY YÖNETİMİ (Mikroservis)

```bash
# RSA key pair üret:
openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -pubout -in private.pem -out public.pem

# VEYA Ed25519 (daha yeni, daha hızlı, daha kısa):
openssl genpkey -algorithm Ed25519 -out ed25519-private.pem
openssl pkey -in ed25519-private.pem -pubout -out ed25519-public.pem
```

```ts
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Auth service — private key ile imzalar:
const privateKey = fs.readFileSync('/etc/ssl/private/jwt-private.pem');
const token = jwt.sign(
  { sub: user.id, role: user.role },
  privateKey,
  { algorithm: 'RS256', expiresIn: '15m' }
);

// API service — public key ile doğrular:
const publicKey = fs.readFileSync('/etc/ssl/certs/jwt-public.pem');
try {
  const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
} catch (err) {
  // Token geçersiz veya süresi dolmuş
}
```

## 4. KEY ROTATION STRATEJİSİ

```ts
// Çoklu key desteği (jwks benzeri):
interface KeyPair {
  kid: string;       // Key ID
  privateKey: string;
  publicKey: string;
  active: boolean;
}

const keys: KeyPair[] = [
  {
    kid: 'v2-2026-07',
    privateKey: fs.readFileSync('/etc/ssl/private/jwt-v2-private.pem', 'utf-8'),
    publicKey: fs.readFileSync('/etc/ssl/certs/jwt-v2-public.pem', 'utf-8'),
    active: true,   // Aktif imzalama key'i
  },
  {
    kid: 'v1-2026-01',
    privateKey: fs.readFileSync('/etc/ssl/private/jwt-v1-private.pem', 'utf-8'),
    publicKey: fs.readFileSync('/etc/ssl/certs/jwt-v1-public.pem', 'utf-8'),
    active: false,  // Sadece doğrulama için
  },
];

function sign(payload: object): string {
  const active = keys.find(k => k.active)!;
  return jwt.sign(payload, active.privateKey, {
    algorithm: 'RS256',
    expiresIn: '15m',
    keyid: active.kid,
  });
}

function verify(token: string): jwt.JwtPayload {
  const decoded = jwt.decode(token, { complete: true });
  const kid = decoded?.header.kid;
  const key = keys.find(k => k.kid === kid);
  if (!key) throw new Error('Bilinmeyen key ID');

  return jwt.verify(token, key.publicKey, {
    algorithms: ['RS256'],
  }) as jwt.JwtPayload;
}
```

## 5. KEY ROTATION ZAMAN ÇİZELGESİ

```
Gün 0:   v1 active (imzalar + doğrular)
Gün 7:   v2 oluştur, inactive (sadece doğrular)
Gün 8:   v2 → active, v1 → inactive
         v1 hâlâ doğrulama yapar (mevcut token'lar için)
Gün 15:  v1'i kaldır (tüm v1 token'ların süresi doldu)
         maxAge = 7 gün → tüm v1 token'lar expire oldu
```

## 6. JWKS ENDPOINT (Public Key Dağıtımı)

```ts
// GET /.well-known/jwks.json
import express from 'express';

app.get('/.well-known/jwks.json', (_req, res) => {
  const jwks = {
    keys: keys
      .filter(k => k.active || k.kid) // Tüm geçerli key'ler
      .map(k => {
        // PEM'den JWK'ye dönüştür (jose veya pem-jwk kütüphanesi ile)
        const jwk = pemToJwk(k.publicKey);
        return { ...jwk, kid: k.kid, use: 'sig', alg: 'RS256' };
      }),
  };
  res.json(jwks);
});
```

## 7. REFRESH TOKEN GÜVENLİĞİ

```ts
// Refresh token'lar JWT değil, opaque token olmalı:
interface RefreshToken {
  id: string;          // UUID
  userId: string;
  family: string;      // Token ailesi (rotation tracking)
  expiresAt: Date;
  revoked: boolean;
}

// Refresh token rotation:
// 1. Kullanıcı refresh token ile yeni access token ister
// 2. Eski refresh token revoke edilir
// 3. Yeni refresh token verilir (aynı family'de)
// 4. Eski token tekrar kullanılırsa → tüm family revoke edilir (token theft detection)

async function rotateRefreshToken(oldTokenId: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const oldToken = await db.refreshToken.findUnique({ where: { id: oldTokenId } });

  if (!oldToken || oldToken.revoked) {
    // Token zaten kullanılmış → theft!
    await db.refreshToken.updateMany({
      where: { family: oldToken?.family },
      data: { revoked: true },
    });
    throw new Error('Token theft detected — tüm oturumlar kapatıldı');
  }

  // Eski token'ı revoke et:
  await db.refreshToken.update({
    where: { id: oldTokenId },
    data: { revoked: true },
  });

  // Yeni token oluştur:
  const newRefresh = await db.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      userId: oldToken.userId,
      family: oldToken.family,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 gün
    },
  });

  const accessToken = sign({ sub: oldToken.userId });

  return { accessToken, refreshToken: newRefresh.id };
}
```

## 8. YAPILMAMASI GEREKENLER

- **H256 ile mikroservis mimarisi** — Her servis aynı secret'ı bilmek zorunda kalır, RS256 kullan
- **Key rotasyonu yapmama** — En az 6 ayda bir key değiştir
- **Refresh token'ı JWT yapma** — Opaque token + veritabanı takibi daha güvenli
- **`expiresIn` vermeme** — Token süresiz olur, çalıntı token sonsuza kadar geçerli
- **JWT_SECRET'i 32 karakterden kısa yapma** — HS256 için minimum 256-bit (32 byte)
- **Token'da hassas veri (password hash, kredi kartı) saklama** — JWT payload base64 decode edilebilir, şifreli DEĞİL
- **`algorithms: ['none']` kabul etme** — jwt.verify'da algorithms parametresini MUTLAKA belirt

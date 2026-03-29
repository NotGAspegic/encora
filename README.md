# Encora

> End-to-end encrypted real-time chat — messages are encrypted on your device before they ever leave it.

![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## What is Encora?

Encora is a production-quality secure messaging app built as a portfolio project. It demonstrates end-to-end encryption in the browser using the native **Web Crypto API** — no third-party crypto libraries. The Supabase database stores only ciphertext and initialization vectors. Plaintext never touches the server.

---

## Features

### Core
- User authentication (signup, login, logout) via Supabase Auth
- Real-time 1-to-1 messaging with Supabase Realtime
- Message persistence in Postgres
- Online / offline presence indicators
- Typing indicators
- Read receipts

### Security
- **AES-GCM 256-bit** message encryption in the browser
- **ECDH P-256** key exchange — shared secret derived without transmitting private keys
- **HKDF** key derivation for a proper symmetric key from the ECDH shared secret
- Private keys stored in **IndexedDB** — never transmitted to the server
- Only the public key is stored in the database
- Zero plaintext in the database — ever
- Row Level Security (RLS) on all Supabase tables
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- HTTP-only session cookies (via `@supabase/ssr`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | TailwindCSS |
| Backend / DB | Supabase (Postgres + Auth + Realtime) |
| Encryption | Web Crypto API (`crypto.subtle`) |
| State | Zustand |
| Deployment | Vercel |

---

## How the Encryption Works

```
Alice                                    Bob
  │                                        │
  │  Generate ECDH P-256 key pair          │  Generate ECDH P-256 key pair
  │  Store private key → IndexedDB         │  Store private key → IndexedDB
  │  Upload public key → Supabase          │  Upload public key → Supabase
  │                                        │
  │  Fetch Bob's public key                │
  │  ECDH(Alice private, Bob public)       │
  │       └─ shared secret                 │
  │  HKDF(shared secret) → AES-GCM key    │
  │                                        │
  │  plaintext                             │
  │    └─ AES-GCM encrypt (random IV)      │
  │         └─ { ciphertext, iv }          │
  │              └─ INSERT into Supabase   │
  │                                        │
  │                        Realtime push ──┤
  │                                        │  Fetch Alice's public key
  │                                        │  ECDH(Bob private, Alice public)
  │                                        │       └─ same shared secret
  │                                        │  HKDF → same AES-GCM key
  │                                        │  AES-GCM decrypt({ ciphertext, iv })
  │                                        │       └─ plaintext ✓
```

**Key insight:** Because ECDH is commutative, Alice and Bob independently derive the same shared secret without ever sending it over the network. The server only ever sees encrypted blobs.

---

## Project Structure

```
encora/
├── app/
│   ├── (auth)/              # Login, signup pages + server actions
│   ├── (app)/               # Protected chat interface
│   └── api/                 # API routes (key exchange, presence)
├── components/
│   ├── auth/                # LoginForm, SignupForm
│   ├── chat/                # MessageBubble, MessageInput, etc.
│   └── ui/                  # Avatar, StatusDot, LoadingSpinner
├── lib/
│   ├── supabase/            # Browser + server clients
│   └── crypto/              # keys.ts, encrypt.ts, keyDerivation.ts
├── store/                   # Zustand stores
├── hooks/                   # useMessages, usePresence, useTyping
├── types/                   # Shared TypeScript types
└── supabase/
    └── migrations/          # SQL schema + RLS policies
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works)
- Git

### 1. Clone the repo

```bash
git clone https://github.com/NotGAspegic/encora.git
cd encora
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, then grab your keys from **Project Settings → API**.

### 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Run database migrations

In the **Supabase SQL Editor**, run each file in order:

```
supabase/migrations/001_profiles.sql
supabase/migrations/002_conversations.sql
supabase/migrations/003_messages.sql
supabase/migrations/004_rls_policies.sql
```

### 6. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

---

## Security Design Decisions

**Why IndexedDB for private keys?**
`localStorage` only stores strings, so you'd have to export the key to store it — exposing raw key material to JavaScript. IndexedDB can store `CryptoKey` objects directly in their opaque, non-extractable form.

**Why AES-GCM?**
AES-GCM is authenticated encryption — it provides both confidentiality and integrity. If a ciphertext is tampered with, decryption fails loudly rather than silently producing corrupt plaintext.

**Why a new random IV per message?**
AES-GCM is catastrophically broken if the same key+IV pair is ever reused. Generating a random 96-bit IV per message via `crypto.getRandomValues` makes reuse computationally impossible.

**Why HKDF instead of using the ECDH output directly?**
The raw ECDH shared secret has non-uniform distribution. HKDF extracts entropy and expands it into a proper symmetric key, also allowing context binding (the `info` parameter is set to `encora-v1`).

**What about forward secrecy?**
The current implementation derives one shared key per user pair. For stronger forward secrecy, a Double Ratchet (as used by Signal) would derive a new key per message. This is planned as an advanced feature.

---

## Roadmap

- [x] Auth (signup / login / logout)
- [x] ECDH + AES-GCM encryption layer
- [x] Message persistence (encrypted)
- [ ] Real-time messaging (Day 4)
- [ ] Typing indicators + read receipts (Day 5)
- [ ] Online / offline presence (Day 5)
- [ ] Full chat UI (Day 6)
- [ ] File sharing (encrypted) (advanced)
- [ ] Group chat (advanced)
- [ ] Double Ratchet forward secrecy (advanced)

---

## License

[MIT](./LICENSE) © 2026 NotGAspegic

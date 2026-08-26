# NONNA authentication and authorization security package

**Status:** design and review artifact only. Nothing in this directory is loaded by the application, deployed, or published to Firebase.

## Scope and evidence reviewed

The audit reviewed the local NONNA source tree under `donnapizza/`, especially:

- `js/firebase/config.js`
- `js/firebase/loader.js`
- `js/firebase/firebase-storage.js`
- `js/firebase/db-adapter.js`
- `pizzaria/js/auth.js`
- `pizzaria/js/painel.js`
- `garcom/js/garcom.js`
- `caixa/js/caixa.js`
- `motoboy/js/motoboy.js`
- `cliente/js/app.js`
- `cozinha/index.html`, `gestao/js/gestao.js`, and the route entry HTML files

This is a source audit, not a live Firebase rules test. No network write, Firebase CLI command, or rules deployment was performed.

## Current architecture and limitation

The application is a static front end. Firebase Realtime Database is accessed directly by browser JavaScript when the configured Firebase project is active; otherwise the adapter falls back to browser `localStorage`.

There is currently **no Firebase Authentication flow** in the reviewed application: no Firebase Auth SDK load, no `signIn*` call, no `onAuthStateChanged`, and no ID-token-based authorization check. The gates are client-side UI gates only:

- `pizzaria/js/auth.js` hashes a submitted value in the browser, compares it with constants shipped to every visitor, and stores a profile in `sessionStorage`.
- `garcom/js/garcom.js` does the same with a browser hash and `sessionStorage`.
- `caixa/js/caixa.js` does the same with a browser hash and `sessionStorage`.
- `motoboy/js/motoboy.js` uses a browser hash plus a selected ID in `localStorage`.
- Some pages expose a login/screen selection without a server-verifiable identity (for example `motoboy/index.html`).

These mechanisms can improve navigation UX, but they do **not** authenticate a person or protect data. A user can inspect, alter, bypass, or replay all front-end state and JavaScript. Browser-side role hiding/removal in `pizzaria/js/auth.js` is not authorization.

## Data exposure and authorization risks

`firebase-storage.js` and `db-adapter.js` directly read and write these top-level RTDB locations:

- `pedidos/` (including customer details, addresses, payment/order metadata, timeline, and courier assignment)
- `motoboys/` (including names, phones, vehicle details and location fields)
- `config/` (operational settings and active coupons)
- `cardapio/` (menu and pricing)
- `clientes/<telephone-key>/` (customer records keyed by phone)
- `caixa/atual` and related cash movement paths used by the adapter

The current adapter also installs broad listeners (for example `pedidos`, `motoboys`, `config`, `cardapio`, and `clientes`). If database rules are public or broadly authenticated, a normal browser user can potentially read or mutate other customers, orders, staff records, locations, menu, or cash data. Rules cannot make an insecure client-side identity trustworthy.

The source also contains credential-verification material in shipped JavaScript (hash constants and, in one path, a legacy fallback password comparison). Values are intentionally not repeated here. They must be treated as compromised credentials and rotated/removed during migration; changing only the hash is not a server-side security boundary.

## Security target

Use Firebase Authentication for identity and Firebase custom claims for coarse role and tenant/restaurant scope. Enforce every read and write in Realtime Database rules. Keep privileged operations (claim assignment, user provisioning, destructive administration, payment verification, and any cross-customer query) in a trusted server/Admin SDK environment, never in static browser code.

The companion `database.rules.json` is a **draft**. It starts with deny-by-default and contains a deliberately explicit schema proposal. It is not compatible with the current unauthenticated client until the migration checklist is completed.

## Proposed roles and claims

Every authenticated user should receive claims set only by a trusted provisioning service:

```json
{
  "role": "owner | manager | kitchen | cashier | waiter | courier | customer",
  "restaurantId": "nonna-restaurant-id",
  "customerId": "firebase-auth-uid"
}
```

Use one canonical role, not a client-supplied role field. `restaurantId` must be a stable opaque identifier, not a phone number or secret. A customer should have a UID-based path (`customers/<uid>` and `customerOrders/<uid>/<orderId>`); do not use a phone number as the authorization key. Claims are authorization inputs, not profile storage: update profiles in the database and refresh ID tokens after claim changes.

Suggested least privilege:

- `owner`/`manager`: operational reads and approved administration within their `restaurantId`; destructive actions should still be server-mediated.
- `kitchen`: read the minimum order fields needed for preparation and update preparation status only.
- `cashier`: read menu and appropriate order/payment projections; write cash operations only.
- `waiter`: create/read only the table orders they are permitted to handle; no customer or cash-wide read.
- `courier`: read assigned delivery projections and update own delivery status/location only.
- `customer`: read own customer profile and own order projection; create an order through a validated write or trusted backend, never arbitrary order totals/status.

A role claim is not enough to protect an object: each rule must also compare the record's `restaurantId`, owner UID, or assignment UID.

## Files in this package

- `README.md` — current-state findings, limitations, proposed identity model, and safe-use notes.
- `database.rules.json` — draft Realtime Database rules with root deny-by-default and explicit proposed paths.
- `MIGRATION-CHECKLIST.md` — ordered migration, validation, rollback, and operational checklist.

No existing application file was changed.

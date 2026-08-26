# NONNA authentication/authorization migration checklist

This checklist is intentionally separate from the running app. Do not apply `database.rules.json` until the application has been migrated and tested against a staging Firebase project.

## 0. Freeze and inventory

- [ ] Export a verified backup of the current RTDB data using an authorized, trusted environment; do not put the export, service-account key, or tokens in this repository.
- [ ] Record the current Firebase project, deployed site origins, current RTDB schema, Storage rules, Authentication providers, and existing operator accounts in a private change record.
- [ ] Identify all clients still using legacy roots (`pedidos`, `motoboys`, `config`, `cardapio`, `clientes`, `caixa`) and all non-production/debug HTML pages. Legacy/debug pages must not be treated as secure clients.
- [ ] Decide whether customer ordering remains public. If it does, use a narrow server endpoint or a carefully validated anonymous-auth flow; never make the entire RTDB public merely to support it.

## 1. Establish identity and claims

- [ ] Enable only the Firebase Auth providers actually needed; require verified email or an equivalent approved operator enrollment process.
- [ ] Create operator accounts in Firebase Auth without putting passwords in source or static HTML.
- [ ] Create a trusted provisioning service using the Firebase Admin SDK. It alone may set custom claims.
- [ ] Assign exactly one canonical role claim from: `owner`, `manager`, `kitchen`, `cashier`, `waiter`, `courier`, or `customer`.
- [ ] Assign `restaurantId` to every operator and customer. Use a stable opaque ID, not a phone number, password, or display name.
- [ ] For customers, set `customerId` only if needed; authorization should use `auth.uid`, not a client-provided customer ID.
- [ ] Document claim revocation and token-refresh procedure. Role changes require revoking sessions where appropriate and forcing clients to refresh their ID token.
- [ ] Do not expose Admin SDK credentials, service-account keys, or provisioning endpoints to the browser.

## 2. Migrate data to an authorization-friendly shape

- [ ] Add `restaurantId` to every operational record and verify it server-side during migration.
- [ ] Assign immutable `customerUid` to each customer/order. Do not use a telephone-number key as the authorization boundary.
- [ ] Assign immutable `courierUid` to delivery records when dispatched.
- [ ] Split broad legacy collections into scoped projections such as `restaurants/<restaurantId>/orders`, `restaurants/<restaurantId>/couriers`, and `customerOrders/<uid>`.
- [ ] Keep payment/cash details out of customer-visible order projections.
- [ ] Define allowed status transitions on a trusted backend. RTDB rules should be defense in depth, not the only business-logic validator.
- [ ] Decide whether menu/config data is public. If the public menu is needed, publish a deliberately minimal `publicCatalog` projection containing no staff, operational, or private data.
- [ ] Preserve the legacy roots read-only during a short dual-read period, then remove all application reads/writes and delete or archive them only after validation. The draft rules explicitly deny these roots.

## 3. Migrate the clients without weakening rules

- [ ] Load Firebase Auth and sign in through Firebase Auth; remove client-side password/hash comparisons from access control.
- [ ] Gate UI on `onAuthStateChanged`, but rely on RTDB rules for the actual boundary.
- [ ] Replace broad listeners (`pedidos`, `motoboys`, `clientes`, etc.) with scoped listeners at the smallest permitted path. RTDB rules do not filter a broad read into safe per-record results.
- [ ] Use Firebase UID and claim scope from the verified Auth session; never trust role/profile/restaurant fields supplied by forms, localStorage, or sessionStorage.
- [ ] Create orders through a trusted, validated write path (or a restricted create rule) that calculates totals, validates catalog item IDs/prices, and prevents clients from assigning themselves staff roles or changing status.
- [ ] Ensure courier location writes can only update the authenticated courier's own location and only within the restaurant scope.
- [ ] Remove or protect debug/setup pages and any convenience login routes before production rollout.
- [ ] Keep this package and all rules out of script tags; deployment of rules is a separate, explicitly reviewed operation.

## 4. Rules testing in staging

- [ ] Run the Firebase Emulator Suite rules tests for unauthenticated, wrong-restaurant, wrong-customer, wrong-courier, and each supported role.
- [ ] Assert unauthenticated reads and writes fail at root and at every legacy root.
- [ ] Assert a customer cannot read another customer, list all orders, alter totals, alter `restaurantId`, assign a courier, or transition an order to staff-only states.
- [ ] Assert a courier can read only assigned delivery projections and cannot read customer-wide, menu-admin, cash, or other-courier data.
- [ ] Assert kitchen/cashier/waiter permissions are distinct and cannot escalate by editing a profile or claim-like field.
- [ ] Assert owner/manager access is limited to their own `restaurantId`; test a second restaurant fixture.
- [ ] Assert malformed records, negative totals, missing ownership fields, and illegal status transitions fail validation.
- [ ] Test query/list behavior, not only direct known-key reads. A broad listener must fail if its parent is not explicitly permitted.
- [ ] Review Firebase Rules Playground/emulator logs for unexpected grants and run static JSON/rules syntax validation.

## 5. Controlled rollout and rollback

- [ ] Deploy the migrated client and rules to a staging project first; validate sign-in, order creation, kitchen, cash, waiter, courier, and customer journeys.
- [ ] Back up the exact pre-change rules and data metadata privately, with access logging.
- [ ] Roll out to a small operator cohort; monitor denied reads/writes, Auth failures, unexpected data access, and order completion.
- [ ] Only after successful staging and canary checks, publish the reviewed rules through an authorized Firebase deployment process. This package does not publish them.
- [ ] Have a rollback plan that restores the last known-good application/rules pair without reverting to public database access.
- [ ] After stabilization, disable legacy credentials, rotate any credentials that were shipped in front-end code, remove unused Auth users/providers, and delete legacy/debug paths.
- [ ] Schedule periodic review of claims, rules, Firebase Audit Logs, dependency versions, and least-privilege role definitions.

## Acceptance criteria

- [ ] No security decision depends on localStorage, sessionStorage, hidden DOM elements, browser hashes, or hardcoded passwords.
- [ ] A fresh unauthenticated browser receives no RTDB data and cannot write any RTDB data.
- [ ] Every readable record is scoped by verified UID, verified assignment, or verified restaurant claim.
- [ ] No client can alter money, identity, restaurant scope, or privileged status without trusted validation.
- [ ] Rules tests cover both positive and negative cases for every role and every migrated path.

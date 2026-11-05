# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every path outside `/worldSaves/{userId}` (including `/test/connection`) denies all reads and writes (`allow read, write: if false;`).
2. **Strict Owner & Path Binding**: A `WorldSave` document at `/worldSaves/{userId}` can ONLY be read (`get`), created, updated, or deleted when `request.auth != null`, `isValidId(userId)` holds, `userId == request.auth.uid`, and `incoming().ownerId == request.auth.uid`.
3. **Verified Email Requirement**: Every write (`create`, `update`, `delete`) requires `request.auth.token.email_verified == true`.
4. **No List Enumeration**: `list` queries on `/worldSaves` are completely disallowed (`allow list: if false;`), eliminating cross-user scraping and O(n) query cost vectors.
5. **Zero Shadow Fields & Strict Schema**: `create` enforces `hasAll` and `hasOnly` across the exact 28 schema keys (including bounded tamed companion fields `petKind`, `petName`, `petLoyalty`, `petMode`, and passive skill tree array `unlockedSkills`); `update` wraps `isValidWorldSave(incoming())` first and restricts modified keys via named action gates using `affectedKeys().hasOnly(...)`.
6. **Immutability & Server Timestamps**: `ownerId` and `createdAt` are immutable across updates (`incoming().ownerId == existing().ownerId && incoming().createdAt == existing().createdAt`). `createdAt` must equal `request.time` on `create`, and `updatedAt` must equal `request.time` on both `create` and `update`.
7. **Volumetric, Companion & Array Guards**: `petKind` matches `^[A-Z_]*$` (`<= 32` chars), `petName` is bounded to `<= 32` chars, `petLoyalty` is bounded `0..100`, and `petMode` must be one of `['BALANCED', 'COMBAT', 'GATHER', 'FOLLOW']`. `discoveredSpecies` is bounded to `size() <= 80`, `discoveredLocations` is bounded to `size() <= 24`, and `unlockedSkills` is bounded to `size() <= 24`, with first-element string + length validation when non-empty.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: `auth = null`, valid payload to `/worldSaves/user_1` -> `PERMISSION_DENIED`.
2. **Unverified Email Spoof**: `auth = { uid: 'user_1', token: { email_verified: false } }` writing to `/worldSaves/user_1` -> `PERMISSION_DENIED`.
3. **Cross-Tenant Path Hijack**: `auth = { uid: 'attacker_1', token: { email_verified: true } }` writing to `/worldSaves/victim_1` -> `PERMISSION_DENIED`.
4. **OwnerId Payload Mismatch**: `auth.uid = 'user_1'` writing to `/worldSaves/user_1` with `ownerId: 'victim_2'` -> `PERMISSION_DENIED`.
5. **ID Poisoning (2KB Junk Document ID)**: `userId` containing spaces/slashes or `> 128` characters -> `PERMISSION_DENIED`.
6. **Shadow / Ghost Field Injection**: Valid `WorldSave` payload plus `"isAdmin": true` -> `PERMISSION_DENIED`.
7. **Client-Forged `createdAt` Timestamp**: `createdAt: Timestamp.fromMillis(1700000000000)` instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
8. **Immutable Field Mutation on Update**: Updating `createdAt` or `ownerId` during `update` -> `PERMISSION_DENIED`.
9. **Denial-of-Wallet Unbounded Array / Oversized Pet Name**: `discoveredSpecies` containing 250 items (`> 80` limit) or `petName` of 5000 chars (`> 32` limit) -> `PERMISSION_DENIED`.
10. **Array Element Type Poisoning**: `discoveredSpecies: [12345]` (non-string first element) -> `PERMISSION_DENIED`.
11. **Value Type / Range Poisoning on Update**: Updating `petLoyalty: 999`, `petMode: "HACKED"`, `hp: -500`, or `exploredPercent: 9999` -> `PERMISSION_DENIED`.
12. **Blanket Collection List Scraping**: Authenticated user issuing `getDocs(collection(db, 'worldSaves'))` -> `PERMISSION_DENIED`.

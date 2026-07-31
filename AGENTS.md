# AI Agent Rules (TautanLumina)
Auto-read by AI.

1. **Appwrite Config**: MUST read `/APPWRITE_CONFIG.md`. Endpt: `https://sgp.cloud.appwrite.io/v1`, Proj: `6a616ac3001f1f3875c5`, DB: `6a616b8f00229e5d63da`, Storage: `6a61c1ac0024510878a6`. Colls: `tautanlumina`, `announcements`, `private_messages`.
2. **Voice Chat**: Max 30s. Auto-stop at 30s -> Preview. User must confirm (Play/Cancel/Send). NEVER auto-send.
3. **Query & Timestamp**: Double try-catch for `listDocuments` (try `createdAt`, fallback `$createdAt`). Parse timestamp: `typeof doc.createdAt === 'number' ? doc.createdAt : (doc.$createdAt ? new Date(doc.$createdAt).getTime() : Date.now())`.
4. **LocalStorage Quota**: Use `safeSetLocalStorage()`. Trim old messages on `QuotaExceededError`.
5. **UI/UX**: Tailwind CSS. ALWAYS prioritize Mobile-first layout to ensure it fits perfectly and is never cut off (use `flex-col sm:flex-row`, `w-full`, `min-w-0`, `overflow-hidden`, `break-words`). Tooltips for buttons. Progressive enhancement.
6. **Chat UI**: Compact header (tabs + X close). Minimalist, hide unnecessary sync/refresh icons.
7. **Model Picker**: Default filter to **🎁 Free**. Auto-sort models by score (no manual sort dropdown, no decorative badges like "🔥 Top").
8. **i18n**: Base ID. Auto-translate to EN, ZH, JA, KO, RU in `src/lib/i18n-missing.ts` for all UI text changes.
9. **Free vs Pro**: Core (Sync, AI Tag/Summary, PIN) always free. Pro limits for Free: 1 announce comment/day, 3 admin PMs/day, 2 AI regens/day, 1 locked folder. Pro/Admin is unlimited.
10. **Auto-Updates**: Update `metadata.json`, landing page, `i18n-missing.ts`, and `GuideTabContent.tsx` (ID + 5 langs) automatically on feature changes.

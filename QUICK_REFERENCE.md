# 🚀 Quick Reference Card

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite + Wrangler)
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare
npx wrangler deploy

# View logs
npx wrangler tail

# Test locally
npm run preview
```

## Environment Setup

```bash
# Create .dev.vars file
cat > .dev.vars << EOF
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret
OWM_API_KEY=your_key
ADMIN_USER_ID=your_github_id
EOF
```

## Common Issues & Fixes

### Issue: Panels not animating
**Fix**: Check browser support for `@starting-style` (Chrome 117+, Firefox 117+, Safari 17.4+)

### Issue: Swipe not working
**Fix**: Ensure `{ passive: true }` on touch event listeners

### Issue: OAuth failing
**Fix**: Check `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in environment

### Issue: Weather not loading
**Fix**: Verify `OWM_API_KEY` is set correctly

### Issue: Session expired
**Fix**: Sessions expire after 24 hours, re-login required

## API Endpoints

```
GET  /api/me                    - Get current user
GET  /api/login                 - Start OAuth flow
GET  /api/auth/callback         - OAuth callback
GET  /api/logout                - Logout user
POST /api/save                  - Save game state
GET  /api/load?slotId=X         - Load game state
GET  /api/saves                 - List saved games
GET  /api/leaderboard           - Get leaderboard
POST /api/leaderboard/submit    - Submit score
GET  /api/chat                  - WebSocket chat (upgrade)
GET  /weather?lat=X&lon=Y       - Weather proxy
```

## Responsive Breakpoints

```css
/* Small Mobile */
@media (max-width: 480px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Tablet */
@media (max-width: 1024px) { }

/* Desktop */
@media (min-width: 1200px) { }
```

## Key Files

```
_worker.js                      - Main worker entry
src/workers/authHandlers.js     - OAuth logic
src/workers/gameHandlers.js     - Save/load logic
src/js/gameState.js             - Game state management
src/js/gameLoop.js              - Game tick logic
src/js/uiControls.js            - Panel interactions
src/css/main.css                - Core styles
src/css/responsive.css          - Responsive utilities
```

## Testing Checklist

- [ ] Desktop: Click buttons, panels open
- [ ] Mobile: Tap buttons, panels slide up
- [ ] Mobile: Swipe down to close
- [ ] Keyboard: Tab, Enter, ESC work
- [ ] Screen reader: Announces correctly
- [ ] Landscape: Layout adapts
- [ ] Notched devices: Safe areas respected

## Performance Tips

```javascript
// ✅ DO: Non-blocking cache
ctx.waitUntil(cache.put(key, value));

// ✅ DO: Single-pass calculations
for (const city of cities) {
  total += city.value || 0;
}

// ✅ DO: Direct mutations
state.cities[i] = { ...state.cities[i], ...updates };

// ❌ DON'T: Blocking operations
await cache.put(key, value);
return response;

// ❌ DON'T: Multiple passes
cities.forEach(c => total += c.value);
const avg = total / cities.length;
```

## Security Checklist

- [ ] Input validation on all user data
- [ ] CSRF protection (state parameter)
- [ ] Secure cookies (HttpOnly, Secure, SameSite)
- [ ] Admin authorization checks
- [ ] Security headers on responses
- [ ] Error messages don't leak info

## Debugging

```javascript
// Enable verbose logging
console.log("Debug:", { request, env, ctx });

// Check session
const sessionId = getSessionId(request);
const session = await env.SESSIONS.get(sessionId);
console.log("Session:", JSON.parse(session));

// Check KV
const value = await env.SAVED_GAMES.get(key);
console.log("KV value:", value);

// Check Durable Object
const id = env.CHAT_ROOM.idFromName("global");
const room = env.CHAT_ROOM.get(id);
```

## Useful Links

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [KV Storage](https://developers.cloudflare.com/kv/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [CSS @starting-style](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)

## Quick Fixes

### Reset game state
```javascript
localStorage.clear();
location.reload();
```

### Clear session
```javascript
document.cookie = "session_id=; Max-Age=0";
location.reload();
```

### Force cache refresh
```javascript
caches.delete('default');
location.reload();
```

## Support

- 📚 Documentation: See `COMPLETE_SUMMARY.md`
- 🐛 Issues: Check `API_DEBUGGING_SUMMARY.md`
- 📱 Responsive: See `RESPONSIVE_SUMMARY.md`
- 🧪 Testing: Use `TESTING_CHECKLIST.md`

---

**Version**: 1.0.0
**Status**: Production Ready ✅

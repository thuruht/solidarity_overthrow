---
alwaysApply: true
---

Never log the full request object (e.g., `c.req`, `request`) or any sensitive properties from it (e.g., `request.cf`, headers containing IPs). Only log specific, non-sensitive, and sanitized information such as error messages, status codes, or generated IDs. All logging must be intentional and privacy-preserving.
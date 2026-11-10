# Security Documentation

## Binding Configuration

- **Default bind address**: `127.0.0.1` (loopback only)
- **Default port**: `3000`
- **Remote binding**: Not enabled by default. Requires explicit `HOST` environment variable.

## CORS Policy

- **Default**: Same-origin only (no CORS headers sent)
- **Configurable**: Set `ALLOWED_ORIGINS` environment variable to comma-separated list of allowed origins
- **Credentials**: Only sent when origin is explicitly allowed

## Authentication

- **None implemented** in Stage 0/1
- Remote binding without authentication is **not recommended**
- If remote binding is enabled, appropriate authentication should be configured

## Code Execution Permissions

- Host C++ and Python code runs with the **local operating system user's permissions**
- This is **NOT a sandbox** — code has full access to the host system
- Users must be aware that running untrusted code can compromise their system

## Session Handling

- Session IDs use `crypto.randomUUID()` (cryptographically strong)
- Each session has independent process, I/O, and cleanup
- Session termination is idempotent (repeated stops return 404)
- No cross-session data leakage

## Resource Limits

- **Max body size**: 1 MB (`MAX_BODY_SIZE`)
- **Max buffer size**: 1000 lines (auto-trimmed to 500)
- **Compilation timeout**: 15 seconds
- **Process kill timeout**: 2 seconds (SIGTERM → SIGKILL)

## Remaining Risks

1. **No rate limiting** — Not implemented in Stage 0/1
2. **No input sanitization beyond validation** — Code is executed as-is
3. **No process isolation** — Child processes inherit parent environment
4. **No output size limits per session** — Bounded buffer prevents memory growth
5. **No authentication** — Anyone with network access can execute code if remote binding enabled

## Safe Development Recommendations

1. Always run on `127.0.0.1` (default)
2. Never expose to untrusted networks without authentication
3. Do not run untrusted code
4. Keep compiler/Python updated
5. Review code before execution
6. Use environment variables for configuration, not hardcoded paths
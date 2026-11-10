# Known Limitations

## Stage 0 and Stage 1 Limitations

### Environment Dependencies

1. **C++ compiler not available on this Windows installation**
   - `clang++`, `g++`, and `cl` are not found in PATH
   - Native C++ execution is unavailable until a compiler is installed
   - Install MinGW, LLVM, or Visual C++ Build Tools to enable

2. **Python not in PATH on this Windows installation**
   - `python3` alias is not available
   - `python` points to WindowsApps store alias (non-functional)
   - Set `ESP_SIM_PYTHON` environment variable to full path of Python executable

### Security Limitations

3. **No sandboxing** — Host code execution runs with user permissions
   - C++ and Python code has full access to the host system
   - Not suitable for running untrusted code
   - Process cleanup and validation are NOT equivalent to a security sandbox

4. **No rate limiting** — API endpoints have no request rate limits
5. **No authentication** — Remote binding requires manual security configuration
6. **No process isolation** — Child processes inherit parent environment

### Functional Limitations

7. **Visual-only boards** — 22+ board definitions exist but have no native runtime support
8. **No genuine ESP emulation** — Host C++ is not real ESP firmware
9. **No official MicroPython VM** — Python compatibility uses host CPython with shim
10. **No SPICE simulation** — Circuit simulation is visual/logical only
11. **No advanced peripheral emulation** — Limited to basic GPIO/ADC/Serial

### Testing Limitations

12. **Compiler-dependent tests skipped** — 5 tests skipped due to missing compiler/Python
13. **No frontend automated tests** — UI testing is manual only
14. **No load testing** — Performance under heavy load not verified

### Repository Limitations

15. **Duplicate files present** — `public copy/`, `backend copy/`, `server copy.js`, etc.
16. **No `.gitignore`** — Generated files not excluded from version control
17. **No Git repository** — Version control not initialized

### Resolved Limitations

- ~~Session concurrency bug~~ — Fixed: new runs no longer kill existing sessions
- ~~Server file corruption~~ — Fixed: server.js restored
- ~~Idempotent session cleanup~~ — Fixed: repeated stops return 404
- ~~Environment variable support~~ — Fixed: ESP_SIM_CXX and ESP_SIM_PYTHON configurable
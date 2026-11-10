# Desktop Storage

## Data Directory Structure

User data is stored in Electron's `app.getPath('userData')` directory:

**Windows (per-user):**
```
%APPDATA%\ESP Simulator Studio\
├── projects\          # Saved project JSON files
├── settings.json      # Application settings
├── backups\           # Automatic backups before overwrites
└── temp\              # Temporary simulation files
```

## Data Categories

| Category | Location | Persistence | Notes |
|----------|----------|-------------|-------|
| Application code | Installation directory | Read-only | Inside app.asar when packaged |
| User projects | `%APPDATA%\ESP Simulator Studio\projects\` | Read-write | Survives upgrades/reinstalls |
| Settings | `%APPDATA%\ESP Simulator Studio\settings.json` | Read-write | Window state, runtime config |
| Backups | `%APPDATA%\ESP Simulator Studio\backups\` | Read-write | Auto-created before project overwrites |
| Temp files | `%APPDATA%\ESP Simulator Studio\temp\` | Read-write | Cleared on session end |
| Logs | Console output | Ephemeral | Not persisted to disk |

## Project Persistence

Projects are saved as JSON files containing:
- Project name
- Board selection
- Language (cpp/python)
- Runner mode (native/browser)
- Source code
- Component definitions
- Wire connections
- Last modified timestamp

### Save Flow
1. User clicks Save or Save As
2. Desktop IPC: `project:save` with project data
3. StorageManager validates and writes to projects directory
4. Automatic backup created if file already exists
5. Confirmation sent to renderer

### Load Flow
1. User selects project from project list
2. Desktop IPC: `project:load` with filename
3. StorageManager reads and parses JSON
4. Project data sent to renderer for restoration

## Browser Data Migration

The desktop application does NOT automatically inherit browser localStorage or IndexedDB data.

**Migration Options:**
1. **Export from browser**: Use the browser version's Export Project feature
2. **Import to desktop**: Use Desktop > Import Project to load the exported JSON
3. **Manual copy**: Copy project JSON files to the projects directory

## Portable Mode

When running as a portable executable:
- User data is stored alongside the executable in a `user-data\` directory
- Falls back to `%APPDATA%` if portable directory is not writable
- Projects and settings are preserved between portable runs

## Uninstall Behavior

- User projects are **NOT** deleted during uninstall
- Application settings are **NOT** deleted during uninstall
- Backups are **NOT** deleted during uninstall
- Only application files are removed

## Storage Limits

- No enforced project size limit
- No enforced project count limit
- Users should manage their own project archives
- Automatic backups are limited to one per file overwrite
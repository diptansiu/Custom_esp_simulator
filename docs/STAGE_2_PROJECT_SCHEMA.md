# ESP Simulator Studio — Stage 2 Project Schema

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Project Schema Version 1

The project schema defines the structure for saved project files. All projects must conform to this schema.

### Schema Definition

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `id` | string | Yes | Unique project identifier | `"proj_abc123"` |
| `name` | string | Yes | Human-readable project name | `"ESP8266 Blink"` |
| `schemaVersion` | number | Yes | Schema version (currently 1) | `1` |
| `board` | string | Yes | Selected board ID | `"esp8266-nodemcu"` |
| `language` | string | Yes | Source language | `"cpp"` |
| `runnerMode` | string | Yes | Execution runner mode | `"browser"` |
| `code` | string | Yes | Source code content | `"void setup()..."` |
| `components` | array | Yes | Component instances | `[{id, type, x, y, props}]` |
| `wires` | array | Yes | Wire connections | `[{id, from, to, color}]` |
| `description` | string | No | Optional description | `"My blink project"` |
| `createdAt` | string | No | ISO 8601 creation timestamp | `"2026-11-08T10:00:00Z"` |
| `updatedAt` | string | No | ISO 8601 last update timestamp | `"2026-11-08T10:30:00Z"` |
| `assetReferences` | array | No | External asset references | `[]` |

### Component Instance Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique component instance ID |
| `type` | string | Yes | Component type (matches COMPONENTS keys) |
| `x` | number | Yes | Canvas X position |
| `y` | number | Yes | Canvas Y position |
| `props` | object | Yes | Component-specific properties |

### Wire Connection Structure

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique wire ID |
| `from.target` | string | Yes | Source target (board ID or component ID) |
| `from.pin` | string | Yes | Source pin ID |
| `to.target` | string | Yes | Target target (board ID or component ID) |
| `to.pin` | string | Yes | Target pin ID |
| `color` | string | No | Wire color (hex) |

## 2. Schema Versioning

### Current Version: 1

The initial project schema (v1) is used for all saved projects. The `schemaVersion` field is included in every project file to enable future migrations.

### Migration Strategy

When a new schema version is introduced:
1. Add a migration function in `core/contracts/project-schema.js`
2. The migration transforms a project from version N to N+1
3. Projects are automatically migrated on load via `Project.fromJSON().migrate()`
4. Unknown fields are preserved (not silently discarded)

### Example Migration (Future)

```javascript
// Migration from v1 to v2
MIGRATIONS[1] = (project) => {
  return {
    ...project,
    schemaVersion: 2,
    // New field with default value
    tags: project.tags || [],
    // Restructured components
    components: project.components.map(c => ({
      ...c,
      zIndex: c.zIndex || 0
    }))
  };
};
```

## 3. Project Validation

Projects are validated on:
- **Import**: When loading from file or API
- **Export**: Before serialization for save/download
- **Save**: Before persisting to storage

Validation checks:
- Required fields present and correct type
- Enum values valid (language, runnerMode)
- Component instances have valid id and type
- Wire connections have valid from/to with target and pin
- Schema version is recognized

## 4. Backward Compatibility

### Guarantees

1. **All existing project files remain valid** — Projects saved with v1 schema continue to load
2. **No fields are removed** — Existing fields are preserved in all versions
3. **Unknown fields are preserved** — If a future version adds fields, older versions won't strip them
4. **Export format is stable** — Exported projects can be imported by any compatible version

### Example Project File

```json
{
  "id": "proj_abc123",
  "name": "ESP8266 Blink",
  "schemaVersion": 1,
  "board": "esp8266-nodemcu",
  "language": "cpp",
  "runnerMode": "browser",
  "code": "void setup() {\n  Serial.begin(115200);\n}\nvoid loop() {\n  delay(1000);\n}\n",
  "components": [
    {
      "id": "c_led1",
      "type": "led",
      "x": 380,
      "y": 150,
      "props": { "color": "red", "isOn": false }
    }
  ],
  "wires": [
    {
      "id": "w_xyz789",
      "from": { "target": "board", "pin": "D1" },
      "to": { "target": "c_led1", "pin": "anode" },
      "color": "#38bdf8"
    }
  ],
  "description": "LED blink example",
  "createdAt": "2026-11-08T10:00:00Z",
  "updatedAt": "2026-11-08T10:30:00Z",
  "assetReferences": []
}
```

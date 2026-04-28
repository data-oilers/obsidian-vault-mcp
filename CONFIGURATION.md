# Configuración MCP Obsidian - Guía Completa

## Status Actual

El MCP está compilado y listo. Necesitas completar 3 pasos para conectarlo con Obsidian.

---

## Paso 1: Configurar Rutas de Vaults de Obsidian

### 1a. Encontrar tus vaults

Abre Obsidian y ve a Settings → About → Vault location para ver dónde están guardados.

Ubicaciones típicas por OS:

| OS | Ruta típica |
|---|---|
| Linux | `/home/<usuario>/Documentos/<NombreVault>` |
| macOS | `/Users/<usuario>/Documentos/<NombreVault>` |
| Windows | `C:\Users\<usuario>\Documentos\<NombreVault>` |

### 1b. Elegir cómo override el default (2 opciones)

Desde la refactorización multi-OS, el código usa `~/Documentos/<NAME>` como default cross-platform — **si tus vaults viven ahí, no tenés que cambiar nada** y podés saltear 1b completo.

Si tus vaults están en otra ruta, elegí UNA de estas dos opciones:

#### Opción A — Variables de entorno (recomendado, no requiere recompilar)

En tu `.env` (copiado de `.env.example`):

```bash
# Descomentar y ajustar al path real:
VAULTS_DATAOILERS_PATH=/ruta/absoluta/a/DATAOILERS
VAULTS_DATAOILERS_PATH=/ruta/absoluta/a/DATAOILERS
VAULTS_DATAOILERS_PATH=/ruta/absoluta/a/DATAOILERS
```

Ejemplos por OS:

```bash
# Linux
VAULTS_DATAOILERS_PATH=/home/juan/mis-notas/DATAOILERS

# macOS
VAULTS_DATAOILERS_PATH=/Users/juan/Documents/DATAOILERS

# Windows (doble backslash o forward slash)
VAULTS_DATAOILERS_PATH=C:\\Users\\Juan\\Obsidian\\DATAOILERS
# o
VAULTS_DATAOILERS_PATH=C:/Users/Juan/Obsidian/DATAOILERS
```

Con esta opción **no hay que recompilar** — solo reiniciar el MCP.

#### Opción B — Editar `src/config.ts` directamente

Si preferís dejarlo fijo en código (útil si los vaults nunca cambian de lugar):

```typescript
export const VAULTS: Record<string, VaultConfig> = {
  DATAOILERS: {
    name: "DATAOILERS",
    path: "/ruta/absoluta/a/DATAOILERS",   // Linux/Mac
    // path: "C:\\Users\\Juan\\Documentos\\DATAOILERS",  // Windows
    hasGit: true,
  },
  // ...
};
```

**Importante:**
- En Windows usá `\\` (doble backslash) o `/` (forward slash).
- Las rutas DEBEN existir como carpetas reales en tu disco.
- Si no tenés los 3 vaults, eliminá los que no uses.
- Con esta opción **hay que recompilar** (`npm run build`) después de cambiar.

### 1c. Recompila (solo si elegiste Opción B)

```bash
npm run build
```

Verifica que no haya errores TypeScript.

---

## Paso 2: Configurar GitHub Organization (Opcional)

Si quieres que el MCP auto-descubra repos desde tu org de GitHub:

### 2a. Crear GitHub Token

1. Ve a https://github.com/settings/personal-access-tokens/new
2. Scopes necesarios: `repo:read` + `org:read`
3. Copia el token

### 2b. Configurar variables de entorno

Opción A — Archivo `.env` del proyecto (recomendado):
```bash
# Desde la raíz del repo del MCP
cp .env.example .env
# Editar .env y completar:
GITHUB_ORG=tu-organizacion
GITHUB_TOKEN=ghp_xxxxx
```

`.env` está en `.gitignore` — no lo commitees.

Opción B — Variables del sistema (permanente por máquina):
```bash
# Linux/macOS: agregar a ~/.bashrc o ~/.zshrc
export GITHUB_TOKEN=ghp_xxxxx
export GITHUB_ORG=tu-organizacion

# Windows: Settings → Environment Variables
# Variable: GITHUB_TOKEN  Value: ghp_xxxxx
# Variable: GITHUB_ORG    Value: tu-organizacion
```

### 2c. Verificar

Ejecuta:
```bash
npm run build
node dist/index.js
```

Si conecta correctamente a GitHub org, verás repos descubiertos al llamar a `list_repos`.

---

## Paso 3: Registrar MCP en Claude Code

### Método recomendado: CLI (1 comando)

```bash
# macOS / Linux
claude mcp add -s user obsidian-vault-team-context -- node "$HOME/obsidian-vault-mcp/dist/index.js"

# Windows (PowerShell)
claude mcp add -s user obsidian-vault-team-context -- node "C:/Users/<usuario>/obsidian-vault-mcp/dist/index.js"
```

Ajustá el path al lugar real donde clonaste el repo (ej: `~/Development/obsidian-vault-mcp/dist/index.js`).

**Scopes disponibles** (`-s`):
- `user` — registrado en `~/.claude.json`, disponible en todos los proyectos. **Recomendado** para este MCP.
- `project` — crea `.mcp.json` en el repo actual, lo comparte el equipo via git.
- `local` (default si no pasás `-s`) — solo este checkout, no se comparte.

Verificá que arrancó OK:

```bash
claude mcp list | grep obsidian
# Esperado: obsidian-vault-team-context: node ... - ✓ Connected
```

Si querés removerlo después: `claude mcp remove obsidian-vault-team-context -s user`.

### Método alternativo: Settings UI

Si preferís la UI:

1. Abrí Claude Code Settings → buscá "MCP Servers" o "Model Context Protocol"
2. Click "Add MCP Server"
3. Completá:

   ```
   Name: obsidian-vault-team-context
   Type: StdIO
   Command: node
   Arguments: <ruta absoluta a dist/index.js>
   ```

   Ejemplos de path por OS:

   ```bash
   # macOS
   /Users/<usuario>/obsidian-vault-mcp/dist/index.js

   # Linux
   /home/<usuario>/obsidian-vault-mcp/dist/index.js

   # Windows (forward slash recomendado en JSON)
   C:/Users/<usuario>/obsidian-vault-mcp/dist/index.js
   ```

   **Nota:** La ruta DEBE ser absoluta y apuntar a `dist/index.js`. En Windows usá `/` o `\\` — no `\` solo.

### Reiniciá Claude Code

Cerrá y reabrí Claude Code completamente para que las tools del MCP queden disponibles en sesiones nuevas.

---

## Paso 4: Verifica la Conexión

En Claude Code, en una nueva conversación, intenta:

```
/mcp list
```

Deberías ver listado `obsidian-vault-team-context`.

Luego intenta una herramienta simple:

```
Tool: list_repos
```

Debería retornar JSON con repos (vacío si no configuraste GitHub).

---

## Checklist de Configuración

- [ ] Rutas de vaults actualizadas en `config.ts`
- [ ] `npm run build` sin errores
- [ ] MCP registrado en Claude Code
- [ ] Claude Code reiniciado
- [ ] `list_repos` retorna sin errores
- [ ] Puedo crear una reunión con `create_meeting_note`

---

## Test Completo

Una vez todo configurado, prueba esto en Claude Code:

```
Herramienta: create_meeting_note
Inputs:
  vault: DATAOILERS
  date: 2026-04-15
  title: Test Reunion
  participants: [Alice, Bob]
  decisions: 
    - Use OAuth2
  actionItems:
    - task: Implement OAuth2
      owner: Alice
      dueDate: 2026-04-20
  summary: Testing the MCP connection
```

Debería crear una nota en tu vault DATAOILERS en la carpeta `meetings/`.

---

## Troubleshooting

### Error: "Vault no encontrado"
- Verifica que la ruta en `config.ts` existe realmente
- Usa `C:\...` con barras invertidas escapadas: `C:\\...`

### Error: "MCP not found"
- Reinicia Claude Code
- Verifica la ruta en el MCP server config
- Abre terminal y prueba: `node <ruta-absoluta>/dist/index.js` (ajustá según tu OS)

### Error: "Repositorio no encontrado"
- Si usas repos, asegúrate que GITHUB_TOKEN está configurado
- O configura repos locales manualmente en `config.ts`

### Las herramientas no aparecen
- Abre Developer Tools en Claude Code (F12)
- Busca mensajes de error en la consola
- Verifica que dist/index.js existe y es ejecutable

---

## Próximos Pasos

Una vez que todo funcione:

1. Lee `USAGE.md` para ver qué herramientas tienes disponibles
2. Lee `EXAMPLES.md` para casos de uso reales
3. Crea tu primer meeting note y prueba linking automático
4. Prueba `advanced_search` para encontrar decisiones

¡Listo para usar Phase 2!

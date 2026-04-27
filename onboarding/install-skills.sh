#!/usr/bin/env bash
# install-skills.sh — Instala skill packs recomendados en ~/.claude/skills/.
# CONSERVADOR por default: no toca packs ya instalados (cualquier forma — repo, dir, symlink).
# Idempotente: re-ejecutable sin romper nada.
#
# Uso:
#   ./install-skills.sh                 # set --dev (default), modo skip-if-exists
#   ./install-skills.sh --minimal       # solo esenciales
#   ./install-skills.sh --dev           # esenciales + dev
#   ./install-skills.sh --all           # todo
#
# Flags adicionales (combinables con set):
#   --update                            # hace `git pull --ff-only` en packs ya clonados
#   --list                              # muestra plan, no toca disco
#   --skills-dir <path>                 # override destino (default: ~/.claude/skills)

set -uo pipefail

RED=$'\033[0;31m'
GRN=$'\033[0;32m'
YLW=$'\033[1;33m'
BLU=$'\033[0;34m'
NC=$'\033[0m'

log()  { printf "%s✓%s %s\n" "$GRN" "$NC" "$1"; }
warn() { printf "%s!%s %s\n" "$YLW" "$NC" "$1"; }
err()  { printf "%s✗%s %s\n" "$RED" "$NC" "$1" >&2; }
sec()  { printf "\n%s━━ %s ━━%s\n" "$BLU" "$1" "$NC"; }

# Defaults
SET="--dev"
DO_UPDATE=0
DRY_RUN=0
SKILLS_DIR="$HOME/.claude/skills"

# Parse args (orden libre, flags combinables)
while [[ $# -gt 0 ]]; do
  case "$1" in
    --minimal|--dev|--all) SET="$1"; shift ;;
    --update)              DO_UPDATE=1; shift ;;
    --list|--dry-run)      DRY_RUN=1; shift ;;
    --skills-dir)          SKILLS_DIR="$2"; shift 2 ;;
    -h|--help)
      grep '^#' "$0" | sed 's|^# \?||'
      exit 0
      ;;
    *)
      err "Flag desconocido: $1. Usá --help."
      exit 1
      ;;
  esac
done

# name::repo-url
MINIMAL=(
  "obsidian-skills::https://github.com/kepano/obsidian-skills.git"
  "skills::https://github.com/anthropics/skills.git"
)

DEV=(
  "${MINIMAL[@]}"
  "superpowers::https://github.com/obra/superpowers.git"
  "claude-skills::https://github.com/jezweb/claude-skills.git"
  "agent-skills::https://github.com/vercel-labs/agent-skills.git"
)

ALL=(
  "${DEV[@]}"
  "marketingskills::https://github.com/coreyhaines31/marketingskills.git"
  "youtube-skills::https://github.com/ZeroPointRepo/youtube-skills.git"
  "awesome-claude-skills::https://github.com/ComposioHQ/awesome-claude-skills.git"
)

case "$SET" in
  --minimal) LIST=("${MINIMAL[@]}"); LABEL="minimal (${#MINIMAL[@]} packs)" ;;
  --dev)     LIST=("${DEV[@]}");     LABEL="dev (${#DEV[@]} packs)" ;;
  --all)     LIST=("${ALL[@]}");     LABEL="all (${#ALL[@]} packs)" ;;
esac

# ───────────────────────────────────────────────────────
sec "Plan"
# ───────────────────────────────────────────────────────

cat <<EOF
  Set            : $LABEL
  Destino        : $SKILLS_DIR
  Modo update    : $([[ $DO_UPDATE -eq 1 ]] && echo "SÍ (pull en packs ya clonados)" || echo "NO (skip-if-exists — los ya instalados no se tocan)")
  Dry-run        : $([[ $DRY_RUN -eq 1 ]] && echo "SÍ (no toca disco)" || echo "no")
EOF

if [[ $DRY_RUN -eq 0 ]]; then
  mkdir -p "$SKILLS_DIR"
fi

# Counters para el resumen
CLONED=0
UPDATED=0
SKIPPED=0
FAILED=0
SKIPPED_NAMES=()
FAILED_NAMES=()

sec "Procesando packs"

for entry in "${LIST[@]}"; do
  NAME="${entry%%::*}"
  URL="${entry##*::}"
  DEST="$SKILLS_DIR/$NAME"

  # Detectar estado actual sin seguir symlinks
  if [[ -L "$DEST" ]]; then
    STATE="symlink"
  elif [[ -d "$DEST/.git" ]]; then
    STATE="git-repo"
  elif [[ -e "$DEST" ]]; then
    STATE="non-git-path"
  else
    STATE="absent"
  fi

  case "$STATE" in
    symlink)
      warn "[$NAME] ya existe como symlink → $(readlink "$DEST"). NO TOCO."
      SKIPPED=$((SKIPPED+1)); SKIPPED_NAMES+=("$NAME (symlink)")
      ;;
    non-git-path)
      warn "[$NAME] existe pero no es git ni symlink. NO TOCO. Resolvé manualmente: $DEST"
      SKIPPED=$((SKIPPED+1)); SKIPPED_NAMES+=("$NAME (non-git path)")
      ;;
    git-repo)
      if [[ $DO_UPDATE -eq 1 ]]; then
        if [[ $DRY_RUN -eq 1 ]]; then
          log "[$NAME] (dry-run) git pull --ff-only en $DEST"
          UPDATED=$((UPDATED+1))
        else
          if git -C "$DEST" pull --ff-only --quiet 2>/dev/null; then
            log "[$NAME] actualizado (pull OK)"
            UPDATED=$((UPDATED+1))
          else
            err "[$NAME] pull falló (branch divergente, cambios locales o conflicto). Skipping."
            FAILED=$((FAILED+1)); FAILED_NAMES+=("$NAME (pull failed)")
          fi
        fi
      else
        log "[$NAME] ya clonado, --update no pasado → skip"
        SKIPPED=$((SKIPPED+1)); SKIPPED_NAMES+=("$NAME (already cloned)")
      fi
      ;;
    absent)
      if [[ $DRY_RUN -eq 1 ]]; then
        log "[$NAME] (dry-run) git clone --depth 1 $URL → $DEST"
        CLONED=$((CLONED+1))
      else
        if git clone --depth 1 "$URL" "$DEST" --quiet 2>/dev/null; then
          log "[$NAME] clonado"
          CLONED=$((CLONED+1))
        else
          err "[$NAME] falló el clone desde $URL"
          FAILED=$((FAILED+1)); FAILED_NAMES+=("$NAME (clone failed)")
        fi
      fi
      ;;
  esac
done

# ───────────────────────────────────────────────────────
sec "Resumen"
# ───────────────────────────────────────────────────────

printf "  %sClonado: %d%s   %sActualizado: %d%s   %sSkipped: %d%s   %sFallado: %d%s\n" \
  "$GRN" "$CLONED" "$NC" "$GRN" "$UPDATED" "$NC" "$YLW" "$SKIPPED" "$NC" "$RED" "$FAILED" "$NC"

if [[ ${#SKIPPED_NAMES[@]} -gt 0 ]]; then
  echo
  echo "Skipped:"
  for n in "${SKIPPED_NAMES[@]}"; do echo "  - $n"; done
fi

if [[ ${#FAILED_NAMES[@]} -gt 0 ]]; then
  echo
  echo "Fallados:"
  for n in "${FAILED_NAMES[@]}"; do echo "  - $n"; done
fi

if [[ $DRY_RUN -eq 1 ]]; then
  echo
  warn "Dry-run: no se modificó nada. Re-ejecutá sin --list/--dry-run para aplicar."
  exit 0
fi

echo
echo "Próximos pasos:"
echo "  1. Reiniciá Claude Code para que reindexe las skills."
echo "  2. Probá /help dentro de Claude para ver las nuevas."
echo "  3. Para actualizar packs ya clonados: ./install-skills.sh --update"

[[ $FAILED -gt 0 ]] && exit 1 || exit 0

import { resolve, join } from "node:path";
import { mkdir } from "node:fs/promises";
import { VAULTS } from "./config.js";

export function sanitizeFilename(title: string): string {
  return title.replace(/[/\\:*?"<>|]/g, "-").trim();
}

export function formatDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function resolveNotePath(vaultKey: string, relativePath: string): string {
  const vault = VAULTS[vaultKey];
  if (!vault) throw new Error(`Vault "${vaultKey}" no existe`);

  const full = resolve(vault.path, relativePath);
  if (!full.startsWith(vault.path)) {
    throw new Error("Path traversal detectado: la ruta escapa del vault");
  }
  return full;
}

export async function ensureDir(dirPath: string): Promise<void> {
  await mkdir(dirPath, { recursive: true });
}

export function buildNotePath(
  vaultKey: string,
  title: string,
  subject?: string,
): string {
  const vault = VAULTS[vaultKey];
  if (!vault) throw new Error(`Vault "${vaultKey}" no existe`);

  const filename = sanitizeFilename(title) + ".md";

  if (vaultKey === "DATAOILERS" || !subject) {
    return join(vault.path, filename);
  }
  return join(vault.path, subject, filename);
}

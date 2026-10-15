// Кладёт Pyodide в public/py/<версия>/ (каталог в git не попадает, ADR 0002).
// Ядро — из npm-пакета pyodide (версия закреплена в package-lock), пакеты (numpy и зависимости) — из CDN Pyodide,
// а если он недоступен — из архива релиза на GitHub. Каждый пакет сверяется с sha256 из pyodide-lock.json;
// то, что уже лежит на месте и совпадает, не копируется и не скачивается заново.
//
//   npm run py:fetch            — вызывается перед dev и build
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { PY_PACKAGES, PYODIDE_VERSION } from "../src/python/version";

const root = path.resolve(import.meta.dirname, "..");
const pkgDir = path.join(root, "node_modules/pyodide");
const outDir = path.join(root, "public/py", PYODIDE_VERSION);
const CORE = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
const CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const RELEASE = `https://github.com/pyodide/pyodide/releases/download/${PYODIDE_VERSION}/pyodide-${PYODIDE_VERSION}.tar.bz2`;

interface LockPackage {
  name: string;
  file_name: string;
  sha256: string;
  depends: string[];
}

const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const fail = (msg: string): never => {
  console.error(`fetch-pyodide: ${msg}`);
  process.exit(1);
};

// 1. Ядро из node_modules: версия пакета должна совпасть с src/python/version.ts
const installed = JSON.parse(readFileSync(path.join(pkgDir, "package.json"), "utf8")).version as string;
if (installed !== PYODIDE_VERSION) {
  fail(`в node_modules pyodide ${installed}, а src/python/version.ts ждёт ${PYODIDE_VERSION}: выровняйте версии и запустите npm ci`);
}
mkdirSync(outDir, { recursive: true });
let copied = 0;
for (const name of CORE) {
  const from = path.join(pkgDir, name);
  const to = path.join(outDir, name);
  if (!existsSync(to) || sha256(from) !== sha256(to)) {
    copyFileSync(from, to);
    copied++;
  }
}

// 2. Пакеты с зависимостями по lock-файлу
const lock = JSON.parse(readFileSync(path.join(outDir, "pyodide-lock.json"), "utf8")) as { packages: Record<string, LockPackage> };
const wanted = new Map<string, LockPackage>();
const visit = (name: string) => {
  const pkg = lock.packages[name] ?? fail(`пакета ${name} нет в pyodide-lock.json`);
  if (wanted.has(name)) return;
  wanted.set(name, pkg);
  pkg.depends.forEach(visit);
};
PY_PACKAGES.forEach(visit);

const ok = (pkg: LockPackage, file = path.join(outDir, pkg.file_name)) => existsSync(file) && sha256(file) === pkg.sha256;
const missing = [...wanted.values()].filter((pkg) => !ok(pkg));

// ошибку CDN не печатаем: следом пробуем архив релиза и сообщаем об этом
const curl = (url: string, to: string) => spawnSync("curl", ["-fsSL", "--retry", "2", "-o", to, url], { stdio: "ignore" }).status === 0;

for (const pkg of [...missing]) {
  const tmp = path.join(outDir, `${pkg.file_name}.part`);
  if (curl(CDN + pkg.file_name, tmp) && ok(pkg, tmp)) {
    renameSync(tmp, path.join(outDir, pkg.file_name));
    missing.splice(missing.indexOf(pkg), 1);
  } else rmSync(tmp, { force: true });
}

if (missing.length > 0) {
  // CDN недоступен (сеть с белым списком): полный архив релиза ~340 MB, из потока извлекаем только нужные файлы
  console.log(`fetch-pyodide: CDN недоступен, извлекаю ${missing.map((p) => p.name).join(", ")} из архива релиза…`);
  const tmp = mkdtempSync(path.join(tmpdir(), "pyodide-"));
  const members = missing.map((p) => `pyodide/${p.file_name}`).join(" ");
  const res = spawnSync("bash", ["-o", "pipefail", "-c", `curl -fsSL --retry 3 "${RELEASE}" | tar -xjf - -C "${tmp}" ${members}`], { stdio: "inherit" });
  if (res.status !== 0) fail(`не удалось скачать ${RELEASE}`);
  for (const pkg of missing) {
    const file = path.join(tmp, "pyodide", pkg.file_name);
    if (!ok(pkg, file)) fail(`sha256 ${pkg.file_name} не совпал с pyodide-lock.json`);
    copyFileSync(file, path.join(outDir, pkg.file_name));
  }
  rmSync(tmp, { recursive: true, force: true });
}

const fetched = [...wanted.values()].length;
console.log(`fetch-pyodide: ${path.relative(root, outDir)} — ядро ${copied ? `обновлено (${copied})` : "на месте"}, пакеты: ${[...wanted.keys()].join(", ")} (${fetched}).`);

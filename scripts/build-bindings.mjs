import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const compiler = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));
for (const entry of readdirSync(resolve(root, 'packages'), { withFileTypes: true })) {
  const project = resolve(root, 'packages', entry.name, 'tsconfig.json');
  if (!entry.isDirectory() || !existsSync(project)) continue;
  const result = spawnSync(process.execPath, [compiler, '--project', project], { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

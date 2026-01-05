import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';

const projectRoot = resolve(process.cwd());
const srcRoot = join(projectRoot, 'client/src');

const dependencies = new Map();

function getDependencies(filePath) {
  if (dependencies.has(filePath)) return dependencies.get(filePath);

  const deps = new Set();
  dependencies.set(filePath, deps);

  try {
    const content = readFileSync(filePath, 'utf8');
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      let resolvedPath = '';

      if (importPath.startsWith('@/')) {
        resolvedPath = resolve(srcRoot, importPath.slice(2));
      } else if (importPath.startsWith('.')) {
        resolvedPath = resolve(dirname(filePath), importPath);
      }

      if (resolvedPath) {
        const extensions = ['.tsx', '.ts', '.js', '.jsx'];
        let found = false;
        for (const ext of extensions) {
          if (statSync(resolvedPath + ext, { throwIfNoEntry: false })) {
            deps.add(resolvedPath + ext);
            found = true;
            break;
          }
          if (statSync(join(resolvedPath, 'index' + ext), { throwIfNoEntry: false })) {
            deps.add(join(resolvedPath, 'index' + ext));
            found = true;
            break;
          }
        }
      }
    }
  } catch (e) {
    // Skip if can't read
  }

  return deps;
}

function findCycles(filePath, path = [], visited = new Set()) {
  if (path.includes(filePath)) {
    console.log('Cycle found:', path.slice(path.indexOf(filePath)).map(p => p.replace(projectRoot, '')).join(' -> '), '->', filePath.replace(projectRoot, ''));
    return;
  }

  if (visited.has(filePath)) return;
  visited.add(filePath);

  const deps = getDependencies(filePath);
  for (const dep of deps) {
    findCycles(dep, [...path, filePath], visited);
  }
}

function walk(dir) {
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      findCycles(fullPath);
    }
  }
}

walk(srcRoot);

import fs from "node:fs";
import path from "node:path";

const landingPath = path.resolve("client/src/pages/landing.tsx");
const content = fs.readFileSync(landingPath, "utf8");

const hrefRegex = /href\s*=\s*(?:"(#[-\w]+)"|'(#[-\w]+)'|\{\s*"(#[-\w]+)"\s*\}|\{\s*'(#[-\w]+)'\s*\})/g;
const idRegex = /id\s*=\s*(?:"([\w-]+)"|'([\w-]+)'|\{\s*"([\w-]+)"\s*\}|\{\s*'([\w-]+)'\s*\})/g;

const toLineNumber = (source, index) => source.slice(0, index).split("\n").length;

const hrefTargets = [];
for (const match of content.matchAll(hrefRegex)) {
  const rawTarget = match[1] ?? match[2] ?? match[3] ?? match[4];
  if (!rawTarget) {
    continue;
  }

  hrefTargets.push({
    id: rawTarget.slice(1),
    line: toLineNumber(content, match.index ?? 0),
  });
}

const idTargets = new Set();
for (const match of content.matchAll(idRegex)) {
  const id = match[1] ?? match[2] ?? match[3] ?? match[4];
  if (id) {
    idTargets.add(id);
  }
}

const missing = hrefTargets.filter((target) => !idTargets.has(target.id));

if (missing.length > 0) {
  const details = missing
    .map((target) => `- #${target.id} (referenced at line ${target.line})`)
    .join("\n");

  console.error(
    `Landing anchor integrity check failed for ${landingPath}:\n${details}`,
  );
  process.exit(1);
}

console.log(
  `Landing anchor integrity check passed: ${hrefTargets.length} in-page href targets and ${idTargets.size} IDs found.`,
);

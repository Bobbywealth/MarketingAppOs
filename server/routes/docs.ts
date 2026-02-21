/**
 * /api/docs — Interactive API documentation served via Swagger UI (CDN).
 *
 *   GET /api/docs           → Swagger UI HTML (interactive explorer)
 *   GET /api/docs/spec.yaml → Raw OpenAPI 3.0 YAML spec
 *   GET /api/docs/spec.json → OpenAPI spec as JSON (spec-only parsing, no external deps)
 *
 * No authentication required — the docs are public.
 * Individual endpoints within the spec still require a Bearer API key or session.
 */

import { Router, Request, Response } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router = Router();

// Load the YAML spec once at startup and cache it.
let specYaml: string;
let specJson: string;

function loadSpec() {
  const specPath = join(process.cwd(), "docs", "api-spec.yaml");
  specYaml = readFileSync(specPath, "utf-8");

  // Minimal YAML → JSON conversion for OpenAPI specs.
  // We serve the same YAML to Swagger UI (which handles it natively),
  // but also expose a JSON variant for tools that need it.
  specJson = JSON.stringify(parseOpenApiYaml(specYaml), null, 2);
}

// Load eagerly; re-throw on startup failure so it's obvious.
loadSpec();

// ─── Swagger UI HTML ─────────────────────────────────────────────────────────

const SWAGGER_UI_VERSION = "5.17.14";

const swaggerHtml = (specUrl: string) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MarketingTeam.app — API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; background: #f8f8f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #swagger-ui { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { font-size: 2rem; }
    .api-banner {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      color: white;
      padding: 28px 24px 20px;
      text-align: center;
    }
    .api-banner h1 { margin: 0 0 6px; font-size: 1.6rem; font-weight: 700; }
    .api-banner p { margin: 0 0 14px; opacity: 0.85; font-size: 0.95rem; }
    .api-banner a {
      display: inline-block;
      margin: 0 6px;
      padding: 6px 14px;
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 6px;
      color: white;
      text-decoration: none;
      font-size: 0.85rem;
      transition: background 0.15s;
    }
    .api-banner a:hover { background: rgba(255,255,255,0.15); }
  </style>
</head>
<body>
  <div class="api-banner">
    <h1>MarketingTeam.app API</h1>
    <p>Full CRM + Marketing Automation REST API &mdash; authenticate with a Bearer API key.</p>
    <a href="/api/docs/spec.yaml" target="_blank">Download YAML</a>
    <a href="/api/docs/spec.json" target="_blank">Download JSON</a>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: "${specUrl}",
        dom_id: "#swagger-ui",
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
        displayRequestDuration: true,
        filter: true,
        tryItOutEnabled: true,
        persistAuthorization: true,
        requestInterceptor: (req) => {
          // Prepend /api if the server URL in the spec doesn't include a full origin.
          return req;
        },
      });
    };
  </script>
</body>
</html>`;

// ─── Routes ──────────────────────────────────────────────────────────────────

/** Interactive Swagger UI */
router.get("/", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(swaggerHtml("/api/docs/spec.yaml"));
});

/** Raw OpenAPI YAML */
router.get("/spec.yaml", (_req: Request, res: Response) => {
  // Re-read on every request in development so edits are reflected without restart.
  if (process.env.NODE_ENV !== "production") {
    try { loadSpec(); } catch { /* keep cached version */ }
  }
  res.setHeader("Content-Type", "application/yaml; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(specYaml);
});

/** OpenAPI as JSON (useful for code generators) */
router.get("/spec.json", (_req: Request, res: Response) => {
  if (process.env.NODE_ENV !== "production") {
    try { loadSpec(); } catch { /* keep cached version */ }
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.send(specJson);
});

export default router;

// ─── Minimal OpenAPI YAML parser ─────────────────────────────────────────────
// Converts OpenAPI-flavoured YAML to a JS object without external dependencies.
// Only handles the subset of YAML used in api-spec.yaml (scalars, mappings,
// sequences, block style, folded/literal strings, anchors not needed here).

function parseOpenApiYaml(yaml: string): unknown {
  const lines = yaml.split("\n");
  return parseBlock(lines, 0, 0).value;
}

interface ParseResult {
  value: unknown;
  nextLine: number;
}

function parseBlock(lines: string[], startLine: number, indent: number): ParseResult {
  let i = startLine;

  // Skip empty / comment lines at this level.
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimStart();
    if (trimmed === "" || trimmed.startsWith("#")) { i++; continue; }
    break;
  }

  if (i >= lines.length) return { value: null, nextLine: i };

  const firstRaw = lines[i];
  const firstTrimmed = firstRaw.trimStart();
  const firstIndent = firstRaw.length - firstTrimmed.length;

  if (firstIndent < indent) return { value: null, nextLine: i };

  // Sequence item?
  if (firstTrimmed.startsWith("- ")) {
    return parseSequence(lines, i, firstIndent);
  }

  // Mapping?
  if (/^\w/.test(firstTrimmed) || /^['"#?]/.test(firstTrimmed) || firstTrimmed.includes(":")) {
    const colonIdx = getColonIndex(firstTrimmed);
    if (colonIdx !== -1) {
      return parseMapping(lines, i, firstIndent);
    }
  }

  // Scalar fallback.
  return { value: parseScalar(firstTrimmed), nextLine: i + 1 };
}

function parseMapping(lines: string[], startLine: number, indent: number): ParseResult {
  const obj: Record<string, unknown> = {};
  let i = startLine;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimStart();
    if (trimmed === "" || trimmed.startsWith("#")) { i++; continue; }
    const lineIndent = raw.length - trimmed.length;
    if (lineIndent < indent) break;
    if (lineIndent > indent) { i++; continue; } // nested content, skip

    const colonIdx = getColonIndex(trimmed);
    if (colonIdx === -1) { i++; continue; }

    const key = trimmed.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, "");
    const rest = trimmed.slice(colonIdx + 1).trim();

    if (rest === "" || rest.startsWith("#")) {
      // Value on next lines.
      i++;
      // Skip blank/comment
      while (i < lines.length && (lines[i].trim() === "" || lines[i].trim().startsWith("#"))) i++;

      if (i >= lines.length) { obj[key] = null; break; }

      const nextRaw = lines[i];
      const nextTrimmed = nextRaw.trimStart();
      const nextIndent = nextRaw.length - nextTrimmed.length;

      if (nextIndent <= indent) {
        obj[key] = null;
      } else if (nextTrimmed.startsWith("- ")) {
        const r = parseSequence(lines, i, nextIndent);
        obj[key] = r.value;
        i = r.nextLine;
      } else {
        const r = parseMapping(lines, i, nextIndent);
        obj[key] = r.value;
        i = r.nextLine;
      }
    } else if (rest.startsWith("|") || rest.startsWith(">")) {
      // Block scalar — collect indented lines.
      const blockIndent = indent + 2;
      const parts: string[] = [];
      i++;
      while (i < lines.length) {
        const bRaw = lines[i];
        const bIndent = bRaw.length - bRaw.trimStart().length;
        if (bRaw.trim() === "") { parts.push(""); i++; continue; }
        if (bIndent < blockIndent) break;
        parts.push(bRaw.slice(blockIndent));
        i++;
      }
      obj[key] = parts.join("\n").trimEnd();
    } else if (rest === "{}" ) {
      obj[key] = {};
      i++;
    } else if (rest === "[]") {
      obj[key] = [];
      i++;
    } else {
      obj[key] = parseScalar(rest.replace(/\s*#.*$/, "").trim());
      i++;
    }
  }

  return { value: obj, nextLine: i };
}

function parseSequence(lines: string[], startLine: number, indent: number): ParseResult {
  const arr: unknown[] = [];
  let i = startLine;

  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimStart();
    if (trimmed === "" || trimmed.startsWith("#")) { i++; continue; }
    const lineIndent = raw.length - trimmed.length;
    if (lineIndent < indent) break;
    if (lineIndent > indent) { i++; continue; }

    if (!trimmed.startsWith("- ")) break;

    const itemContent = trimmed.slice(2).trim();

    if (itemContent === "" || itemContent.startsWith("#")) {
      // Value on next lines.
      i++;
      while (i < lines.length && lines[i].trim() === "") i++;
      if (i >= lines.length) { arr.push(null); continue; }
      const nRaw = lines[i];
      const nTrimmed = nRaw.trimStart();
      const nIndent = nRaw.length - nTrimmed.length;
      if (nTrimmed.startsWith("- ")) {
        const r = parseSequence(lines, i, nIndent);
        arr.push(r.value);
        i = r.nextLine;
      } else {
        const r = parseMapping(lines, i, nIndent);
        arr.push(r.value);
        i = r.nextLine;
      }
    } else {
      const colonIdx = getColonIndex(itemContent);
      if (colonIdx !== -1) {
        // Inline mapping starting on same line as "- "
        const key = itemContent.slice(0, colonIdx).trim().replace(/^['"]|['"]$/g, "");
        const val = itemContent.slice(colonIdx + 1).trim();
        const innerIndent = indent + 2;
        let innerObj: Record<string, unknown> = {};
        if (val !== "" && !val.startsWith("#")) {
          innerObj[key] = parseScalar(val.replace(/\s*#.*$/, "").trim());
        } else {
          innerObj[key] = null;
        }
        i++;
        // Collect following keys at innerIndent
        const r = parseMapping(lines, i, innerIndent);
        arr.push({ ...innerObj, ...(r.value as Record<string, unknown>) });
        i = r.nextLine;
      } else {
        arr.push(parseScalar(itemContent.replace(/\s*#.*$/, "").trim()));
        i++;
      }
    }
  }

  return { value: arr, nextLine: i };
}

function getColonIndex(s: string): number {
  // Find ": " or end-of-string colon that acts as key separator.
  // Avoid matching colons inside URLs (http://, https://).
  let inSingle = false, inDouble = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === "'" && !inDouble) { inSingle = !inSingle; continue; }
    if (c === '"' && !inSingle) { inDouble = !inDouble; continue; }
    if (inSingle || inDouble) continue;
    if (c === ":" && (i + 1 >= s.length || s[i + 1] === " " || s[i + 1] === "\t" || s[i + 1] === "#")) {
      // Skip if this looks like part of a URL scheme
      if (i >= 1 && /[a-z]/.test(s[i - 1]) && s[i + 1] === "/") continue;
      return i;
    }
  }
  return -1;
}

function parseScalar(s: string): unknown {
  if (s === "~" || s === "null" || s === "") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  // Remove surrounding quotes.
  if ((s.startsWith("'") && s.endsWith("'")) || (s.startsWith('"') && s.endsWith('"'))) {
    return s.slice(1, -1);
  }
  return s;
}

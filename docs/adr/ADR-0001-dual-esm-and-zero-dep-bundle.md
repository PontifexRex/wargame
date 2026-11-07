# ADR-0001: Dual ES6 Module Architecture & Zero-Dependency `file://` Bundler

- **Status**: Accepted
- **Date**: 2026-11-07
- **Context**: `v0.4.0-inc4` / `v0.4.5-atlas`

## Context & Problem Statement

Originally (`v0.1.0` – `v0.3.1`), Aethelgard lived inside a single monolithic `index.html` file so players could double-click `index.html` over the `file://` protocol without installing Node.js, npm, or external bundlers. However, as the codebase grew past 2,500+ lines, maintaining data catalogs, procedural generation, combat, UI synchronization, and automated self-tests inside one `<script>` tag became error-prone for both humans and AI agents.

At the same time:
1. Browsers block native `<script type="module">` imports over `file://` due to CORS restrictions.
2. The target Windows development environment does not require Node.js or Python to be installed; headless verification executes via Windows PowerShell + `C:\Windows\System32\chakra.dll` P/Invoke.

## Decision

We adopt a **Dual ES6 Module + Auto-Compiled IIFE Bundle** architecture:
1. **Modular Source of Truth (`src/`)**: All source code is authored in clean, domain-segregated ES6 modules under `src/` (`constants.js`, `src/data/*`, `src/engine/*`, `src/ui/*`, `src/test/*`, `src/main.js`).
2. **Zero-Dependency PowerShell Topological Bundler (`scripts/build.ps1`)**:
   - Parses `import` and `export` statements across `src/`, verifies that every imported symbol is exported by its target module, rejects circular dependencies, checks for top-level identifier collisions across modules, and emits a single IIFE bundle at `dist/bundle.js`.
3. **Protocol-Aware Bootloader in `index.html`**:
   - When opened via `http://` or `https://` (`./scripts/serve.ps1`), `index.html` loads `./src/main.js` as a native ES6 module.
   - When opened directly via `file://`, `index.html` automatically loads `./dist/bundle.js`.
4. **ES2017 Syntax Ceiling (Chakra Compatibility)**:
   - Because headless CLI verification (`./scripts/test.ps1`) executes `dist/bundle.js` inside Windows `chakra.dll` when Node.js is absent, modules must use ES6/ES2017 syntax (`const`/`let`, arrow functions, template literals, `Uint8Array`, `Int32Array`, `Object.assign`) and avoid ES2020 optional chaining (`?.`) or object rest/spread (`{...obj}`).

## Consequences

- **Positive**: Clean separation of concerns across 24+ small ES6 modules; zero npm/Node installation requirement; works both over `file://` and local HTTP servers; instant `<4s` headless CLI verification.
- **Negative / Guardrails**: Developers and agents must run `./scripts/test.ps1` (which runs `./scripts/build.ps1`) after editing `src/` so `dist/bundle.js` stays synchronized, and must avoid duplicate top-level identifier names across modules (enforced automatically by `scripts/build.ps1`).

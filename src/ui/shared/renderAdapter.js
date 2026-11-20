// =============================================================================
// DECOUPLED RENDER ADAPTER (Stage E.5 — Golden Slice / ADR-0013)
// Isolates rendering backend selection (PixiJS v8 WebGPU/WebGL2 vs. Canvas 2D fallback)
// from core simulation modules while resolving assets strictly through AssetRegistry.
// =============================================================================

import { resolveAsset, getAssetRegistryStats, getCachedImage } from './assetRegistry.js';

export const RENDER_BACKENDS = {
  PIXI_WEBGPU: 'pixi_webgpu',
  PIXI_WEBGL2: 'pixi_webgl2',
  CANVAS_2D: 'canvas2d'
};

export function detectRenderCapabilities() {
  const hasWindow = typeof window !== 'undefined';
  const hasDocument = typeof document !== 'undefined';
  const hasPixi = Boolean(hasWindow && window.PIXI && typeof window.PIXI.Application === 'function');
  let hasWebGL2 = false;
  let hasWebGPU = false;

  if (hasWindow && typeof navigator !== 'undefined' && navigator.gpu) {
    hasWebGPU = true;
  }
  if (hasDocument) {
    try {
      const testCanvas = document.createElement('canvas');
      if (testCanvas && typeof testCanvas.getContext === 'function') {
        hasWebGL2 = Boolean(testCanvas.getContext('webgl2'));
      }
    } catch (_err) {
      hasWebGL2 = false;
    }
  }

  return {
    hasWindow: hasWindow,
    hasDocument: hasDocument,
    hasPixi: hasPixi,
    hasWebGL2: hasWebGL2,
    hasWebGPU: hasWebGPU
  };
}

export function createRenderAdapter(options) {
  const opts = options || {};
  const preferred = opts.mode || 'auto';
  const caps = detectRenderCapabilities();

  let activeBackend = RENDER_BACKENDS.CANVAS_2D;
  if (preferred !== 'canvas2d' && caps.hasPixi) {
    activeBackend = caps.hasWebGPU ? RENDER_BACKENDS.PIXI_WEBGPU : RENDER_BACKENDS.PIXI_WEBGL2;
  }

  return {
    backend: activeBackend,
    capabilities: caps,
    resolveSprite: function(assetId) {
      return resolveAsset(assetId);
    },
    getCachedImage: function(assetId, onLoad) {
      return getCachedImage(assetId, onLoad);
    },
    getStats: function() {
      return Object.assign({ backend: activeBackend }, getAssetRegistryStats());
    }
  };
}

let sharedAdapter = null;

export function getActiveRenderAdapter() {
  if (!sharedAdapter) {
    sharedAdapter = createRenderAdapter({ mode: 'auto' });
  }
  return sharedAdapter;
}

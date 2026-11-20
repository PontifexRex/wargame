// =============================================================================
// SHARED SEMANTIC ASSET REGISTRY (Stage E.5 — Golden Slice / ADR-0013)
// Resolves all Tier 1-3 visual assets strictly by semantic ID via assets/manifest.json,
// with graceful procedural fallback and zero-CORS file:// support.
// =============================================================================

export const ASSET_ID_REGEX = /^[a-z]+_[a-z]+_[a-z0-9_]+_[a-z0-9_]+_[a-z0-9_]+$/;

// Facility buildingId -> Canonical Tier 1 Interior Asset ID mapping
export const FACILITY_INTERIOR_ASSET_MAP = {
  guild_hall: 'city_interior_adventurers_guild_default_static',
  adventurers_guild: 'city_interior_adventurers_guild_default_static',
  fighters_guild: 'city_interior_fighters_guild_default_static',
  thieves_guild: 'city_interior_thieves_guild_default_static',
  mages_guild: 'city_interior_mages_guild_default_static',
  rangers_lodge: 'city_interior_rangers_lodge_default_static',
  temple_chapterhouse: 'city_interior_temple_chapterhouse_default_static',
  garrison: 'city_interior_garrison_default_static',
  smeltery: 'city_interior_smeltery_default_static',
  apothecary: 'city_interior_apothecary_default_static',
  blacksmith: 'city_interior_blacksmith_default_static',
  lapidary: 'city_interior_lapidary_default_static',
  warehouse: 'city_interior_warehouse_default_static'
};

// Embedded manifest mirror for instant file:// & headless execution (synced with assets/manifest.json)
export const DEFAULT_ASSET_MANIFEST = {
  schemaVersion: '1.0.0',
  project: 'Aethelgard: The Starfall Vaults',
  artBibleRef: 'docs/art_bible.md',
  pipelineRef: 'docs/asset_pipeline.md',
  cdnBaseUrl: '',
  assets: {
    char_portrait_adventurer_default_idle: {
      id: 'char_portrait_adventurer_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_adventurer_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_fighter_default_idle: {
      id: 'char_portrait_fighter_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_fighter_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_thief_default_idle: {
      id: 'char_portrait_thief_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_thief_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_mage_default_idle: {
      id: 'char_portrait_mage_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_mage_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_ranger_default_idle: {
      id: 'char_portrait_ranger_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_ranger_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_cleric_default_idle: {
      id: 'char_portrait_cleric_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/portraits/char_portrait_cleric_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    char_portrait_paladin_default_idle: {
      id: 'char_portrait_paladin_default_idle',
      tier: 1,
      domain: 'char',
      category: 'portrait',
      status: 'production',
      src: 'assets/runtime/tier1/portraits/char_portrait_paladin_default_idle.jpg',
      atlasFrame: null,
      width: 512,
      height: 512,
      anchor: [0.5, 0.5],
      fallback: 'procedural_class_badge'
    },
    city_interior_adventurers_guild_default_static: {
      id: 'city_interior_adventurers_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_adventurers_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_fighters_guild_default_static: {
      id: 'city_interior_fighters_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_fighters_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_thieves_guild_default_static: {
      id: 'city_interior_thieves_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_thieves_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_mages_guild_default_static: {
      id: 'city_interior_mages_guild_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_mages_guild_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_rangers_lodge_default_static: {
      id: 'city_interior_rangers_lodge_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_rangers_lodge_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_temple_chapterhouse_default_static: {
      id: 'city_interior_temple_chapterhouse_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_temple_chapterhouse_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_garrison_default_static: {
      id: 'city_interior_garrison_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_garrison_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_smeltery_default_static: {
      id: 'city_interior_smeltery_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_smeltery_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_apothecary_default_static: {
      id: 'city_interior_apothecary_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_apothecary_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_blacksmith_default_static: {
      id: 'city_interior_blacksmith_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'production',
      src: 'assets/runtime/tier1/interiors/city_interior_blacksmith_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_lapidary_default_static: {
      id: 'city_interior_lapidary_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_lapidary_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    city_interior_warehouse_default_static: {
      id: 'city_interior_warehouse_default_static',
      tier: 1,
      domain: 'city',
      category: 'interior',
      status: 'procedural_fallback',
      src: 'assets/runtime/tier1/interiors/city_interior_warehouse_default_static.jpg',
      atlasFrame: null,
      width: 1280,
      height: 400,
      anchor: [0.5, 0.5],
      fallback: 'css_gradient_banner'
    },
    dng_container_chest_gilded_closed: {
      id: 'dng_container_chest_gilded_closed',
      tier: 2,
      domain: 'dng',
      category: 'container',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_container_chest_gilded_closed',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawGildedChestProp'
    },
    dng_container_chest_gilded_open: {
      id: 'dng_container_chest_gilded_open',
      tier: 2,
      domain: 'dng',
      category: 'container',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_container_chest_gilded_open',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawGildedChestProp'
    },
    dng_prop_oil_barrel_default_intact: {
      id: 'dng_prop_oil_barrel_default_intact',
      tier: 2,
      domain: 'dng',
      category: 'prop',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_props_hazards.webp',
      atlasFrame: 'dng_prop_oil_barrel_default_intact',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawWorldObject'
    },
    dng_tile_wall_catacombs_ashlar_static: {
      id: 'dng_tile_wall_catacombs_ashlar_static',
      tier: 2,
      domain: 'dng',
      category: 'tile',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/dungeon_catacombs_kit.webp',
      atlasFrame: 'dng_tile_wall_catacombs_ashlar_static',
      width: 128,
      height: 128,
      anchor: [0.5, 0.5],
      fallback: 'drawAshlarWall'
    },
    ow_poi_dungeon_starfall_idle: {
      id: 'ow_poi_dungeon_starfall_idle',
      tier: 3,
      domain: 'ow',
      category: 'poi',
      status: 'procedural_fallback',
      src: 'assets/runtime/atlases/overworld_cartography.webp',
      atlasFrame: 'ow_poi_dungeon_starfall_idle',
      width: 128,
      height: 128,
      anchor: [0.5, 0.85],
      fallback: 'drawOverworldPoi'
    }
  }
};

let activeManifest = DEFAULT_ASSET_MANIFEST;
const imageCache = {};

export function validateAssetManifest(manifestObj) {
  const errors = [];
  if (!manifestObj || typeof manifestObj !== 'object') {
    return { valid: false, errors: ['Manifest must be an object'], total: 0, productionCount: 0 };
  }
  if (!manifestObj.schemaVersion) {
    errors.push('Missing schemaVersion');
  }
  const assets = manifestObj.assets;
  if (!assets || typeof assets !== 'object') {
    return { valid: false, errors: ['Missing assets map'], total: 0, productionCount: 0 };
  }

  const keys = Object.keys(assets);
  let productionCount = 0;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const entry = assets[key];
    if (!ASSET_ID_REGEX.test(key)) {
      errors.push('Invalid canonical asset ID: ' + key);
    }
    if (!entry || entry.id !== key) {
      errors.push('Entry id mismatch for key: ' + key);
      continue;
    }
    if (entry.tier !== 1 && entry.tier !== 2 && entry.tier !== 3) {
      errors.push('Invalid tier for ' + key);
    }
    if (!entry.src || typeof entry.src !== 'string') {
      errors.push('Missing src for ' + key);
    }
    if (entry.status === 'production') {
      productionCount++;
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    total: keys.length,
    productionCount: productionCount
  };
}

export function getAssetRegistry() {
  return activeManifest;
}

export function resolveAsset(assetId) {
  if (!assetId || !activeManifest || !activeManifest.assets) return null;
  const entry = activeManifest.assets[assetId];
  if (!entry) return null;
  const base = activeManifest.cdnBaseUrl || '';
  return {
    id: entry.id,
    tier: entry.tier,
    domain: entry.domain,
    category: entry.category,
    status: entry.status,
    src: base ? (base + entry.src) : entry.src,
    atlasFrame: entry.atlasFrame || null,
    width: entry.width || 0,
    height: entry.height || 0,
    anchor: entry.anchor || [0.5, 0.5],
    fallback: entry.fallback || null,
    isProduction: entry.status === 'production'
  };
}

export function getProductionImageSrc(assetId) {
  const resolved = resolveAsset(assetId);
  if (!resolved || !resolved.isProduction) return null;
  return resolved.src;
}

export function getFacilityInteriorAssetId(buildingId) {
  if (!buildingId) return null;
  return FACILITY_INTERIOR_ASSET_MAP[buildingId] || null;
}

export function getHeroPortraitAssetId(classId) {
  if (!classId) return null;
  return 'char_portrait_' + String(classId).toLowerCase() + '_default_idle';
}

export function getCachedImage(assetId, onLoad) {
  const src = getProductionImageSrc(assetId);
  if (!src) return null;
  if (typeof Image === 'undefined') return null;

  if (imageCache[assetId]) {
    const existing = imageCache[assetId];
    return existing.loaded ? existing.img : null;
  }

  const img = new Image();
  const rec = { img: img, loaded: false, failed: false };
  imageCache[assetId] = rec;

  img.onload = function() {
    rec.loaded = true;
    if (typeof onLoad === 'function') onLoad(img, assetId);
  };
  img.onerror = function() {
    rec.failed = true;
  };
  img.src = src;
  return null;
}

export function getAssetRegistryStats() {
  const check = validateAssetManifest(activeManifest);
  return {
    schemaVersion: activeManifest.schemaVersion,
    totalAssets: check.total,
    productionAssets: check.productionCount,
    fallbackAssets: check.total - check.productionCount,
    valid: check.valid
  };
}

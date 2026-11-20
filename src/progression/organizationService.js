// =============================================================================
// GUILD & ALLIANCE RESEARCH OWNERSHIP & CONTRIBUTION SERVICE (Inc 10.3 / Spec §3, §5, §7.6, §9)
// Separates Multiplayer Player Guilds (Adventurer, War, Artisan) and Alliances
// from local City Class Halls. Manages organization-owned research accounts,
// multi-member Alliance contribution pools with attribution, and membership rules.
// =============================================================================

import {
  OWNER_TYPES,
  TRANSACTION_TYPES,
  recordCurrencyTransaction,
  getCurrencyBalance
} from './currencyService.js';
import { startOrEnqueueResearch } from './queueService.js';

export const PLAYER_GUILD_SPECIALIZATIONS = {
  adventurer: {
    id: 'adventurer',
    name: 'Adventurers Guild Order',
    currencyId: 'rp_guild_adventurer',
    desc: 'Multiplayer guild order focused on dungeon exploration, discoveries, and relic recovery.'
  },
  war: {
    id: 'war',
    name: 'War Guild Order',
    currencyId: 'rp_guild_war',
    desc: 'Multiplayer guild order focused on military warfare, battles, and tactical campaigns.'
  },
  artisan: {
    id: 'artisan',
    name: 'Artisan Guild Order',
    currencyId: 'rp_guild_artisan',
    desc: 'Multiplayer guild order focused on city engineering, smelting, forging, and crafting.'
  }
};

export const PROTOTYPE_ORG_RESEARCH_TREES = {
  tree_guild_adventurers: {
    treeId: 'tree_guild_adventurers',
    domainId: 'adventuring',
    name: 'Guild Expedition Archive',
    shortDescription: 'Guild-owned exploration knowledge funded by member delving activity.',
    icon: '🧭',
    ownershipType: OWNER_TYPES.GUILD,
    requiredGuildType: 'adventurer',
    itemIds: ['GLD_ADV_MAP_001'],
    version: '1.0.0',
    status: 'active'
  },
  tree_alliance_citadel: {
    treeId: 'tree_alliance_citadel',
    domainId: 'logistics',
    name: 'Alliance Supply Network',
    shortDescription: 'Shared Alliance-owned logistics research funded by member contributions.',
    icon: '🏛️',
    ownershipType: OWNER_TYPES.ALLIANCE,
    itemIds: ['ALL_CITADEL_001'],
    version: '1.0.0',
    status: 'active'
  }
};

export const PROTOTYPE_ORG_RESEARCH_ITEMS = {
  GLD_ADV_MAP_001: {
    researchItemId: 'GLD_ADV_MAP_001',
    treeId: 'tree_guild_adventurers',
    domainId: 'adventuring',
    name: 'Shared Cartography Archive',
    description: 'Guild-owned archive granting +10% dungeon discovery yield to all guild members.',
    icon: '🗺️',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.GUILD,
    subjectType: 'guild',
    prerequisites: { type: 'guild_type', operator: 'equals', value: 'adventurer' },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 60,  costs: [{ kind: 'currency', currencyId: 'rp_guild_adventurer', amount: 2.0 }], benefits: [{ effectType: 'probability_modifier', target: 'guild_discovery_yield', op: 'additive', value: 0.10 }] },
      { level: 2, durationSec: 180, costs: [{ kind: 'currency', currencyId: 'rp_guild_adventurer', amount: 5.0 }], benefits: [{ effectType: 'probability_modifier', target: 'guild_discovery_yield', op: 'additive', value: 0.10 }] }
    ],
    queueType: 'guild_research',
    version: '1.0.0',
    status: 'active'
  },
  ALL_CITADEL_001: {
    researchItemId: 'ALL_CITADEL_001',
    treeId: 'tree_alliance_citadel',
    domainId: 'logistics',
    name: 'Alliance Caravan Corridors',
    description: 'Alliance-owned logistics network accelerating member marches and caravan transit by +12%.',
    icon: '🏛️',
    itemType: 'modifier',
    ownershipType: OWNER_TYPES.ALLIANCE,
    subjectType: 'alliance',
    prerequisites: { type: 'alliance_membership', operator: 'equals', value: true },
    levelLimit: 2,
    levelDefinitions: [
      { level: 1, durationSec: 90,  costs: [{ kind: 'currency', currencyId: 'rp_alliance', amount: 10.0 }], benefits: [{ effectType: 'efficiency_modifier', target: 'alliance_march_speed', op: 'additive', value: 0.12 }] },
      { level: 2, durationSec: 300, costs: [{ kind: 'currency', currencyId: 'rp_alliance', amount: 25.0 }], benefits: [{ effectType: 'efficiency_modifier', target: 'alliance_march_speed', op: 'additive', value: 0.12 }] }
    ],
    queueType: 'alliance_research',
    version: '1.0.0',
    status: 'active'
  }
};

export function createPlayerGuild(progression, params) {
  if (!progression || !params || !params.guildId) return { ok: false, reason: 'invalid_params' };
  const spec = PLAYER_GUILD_SPECIALIZATIONS[params.specialization || 'adventurer'];
  if (!spec) return { ok: false, reason: 'invalid_guild_specialization' };

  const orgs = progression.organizations;
  const guild = {
    id: String(params.guildId),
    name: params.name || spec.name,
    type: spec.id,
    currencyId: spec.currencyId,
    members: params.founderPlayerId ? [String(params.founderPlayerId)] : [],
    researchQueue: {
      queueId: 'q_guild_' + params.guildId,
      queueType: 'guild_research',
      capacity: 1,
      activeItems: [],
      pendingItems: [],
      enabled: true
    },
    createdAt: typeof params.nowMs === 'number' ? params.nowMs : 0
  };
  orgs.guilds[guild.id] = guild;
  if (params.founderPlayerId === 'player_1' || params.setAsPrimary) {
    orgs.playerGuildId = guild.id;
  }
  return { ok: true, guild: guild };
}

export function createAlliance(progression, params) {
  if (!progression || !params || !params.allianceId) return { ok: false, reason: 'invalid_params' };
  const orgs = progression.organizations;
  const alliance = {
    id: String(params.allianceId),
    name: params.name || 'Starfall Pact',
    currencyId: 'rp_alliance',
    allowsTraining: false, // Clarified Decision #1: Alliance level supports Research ONLY (no Alliance training)
    members: params.founderPlayerId ? [String(params.founderPlayerId)] : [],
    researchQueue: {
      queueId: 'q_alliance_' + params.allianceId,
      queueType: 'alliance_research',
      capacity: 1,
      activeItems: [],
      pendingItems: [],
      enabled: true
    },
    createdAt: typeof params.nowMs === 'number' ? params.nowMs : 0
  };
  orgs.alliances[alliance.id] = alliance;
  if (params.founderPlayerId === 'player_1' || params.setAsPrimary) {
    orgs.playerAllianceId = alliance.id;
  }
  return { ok: true, alliance: alliance };
}

export function joinOrganization(org, playerId) {
  if (!org || !playerId) return { ok: false, reason: 'invalid_params' };
  const pid = String(playerId);
  if (org.members.indexOf(pid) === -1) {
    org.members.push(pid);
  }
  return { ok: true, members: org.members };
}

export function leaveOrganization(org, playerId) {
  if (!org || !playerId) return { ok: false, reason: 'invalid_params' };
  const pid = String(playerId);
  const idx = org.members.indexOf(pid);
  if (idx !== -1) org.members.splice(idx, 1);
  // Spec §9.4: Organization retains all completed & in-progress organization research
  return { ok: true, departedPlayerId: pid, orgRetainsResearch: true };
}

export function isPlayerEligibleForOrgBenefits(org, playerId) {
  if (!org || !playerId) return false;
  return org.members.indexOf(String(playerId)) !== -1;
}

// Award Guild Research Points into the Guild's own currency account & record contributor attribution
export function recordGuildActivityContribution(progression, params) {
  if (!progression || !params) return { ok: false, reason: 'invalid_params' };
  const guild = progression.organizations.guilds[params.guildId];
  if (!guild) return { ok: false, reason: 'guild_not_found' };
  const contributor = String(params.contributorPlayerId || 'player_1');
  if (guild.members.indexOf(contributor) === -1) {
    return { ok: false, reason: 'not_guild_member' };
  }

  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : 0;
  const txRes = recordCurrencyTransaction(progression.currencyLedger, {
    ownerId: guild.id,
    ownerType: OWNER_TYPES.GUILD,
    currencyId: guild.currencyId,
    amount: params.amount,
    transactionType: TRANSACTION_TYPES.CONTRIBUTION,
    source: params.source || 'guild_activity',
    referenceId: params.eventId || null,
    idempotencyKey: params.eventId ? ('gcontrib:' + guild.id + ':' + contributor + ':' + params.eventId) : null,
    nowMs: nowMs
  });

  if (!txRes.ok || txRes.duplicate) return txRes;

  const contrib = {
    contributionId: 'contrib_' + String(progression.contributions.length + 1),
    contributorPlayerId: contributor,
    targetOwnerId: guild.id,
    targetOwnerType: OWNER_TYPES.GUILD,
    currencyId: guild.currencyId,
    amount: txRes.transaction.amount,
    amountScaled: txRes.transaction.amountScaled,
    source: params.source || 'guild_activity',
    referenceId: params.eventId || null,
    timestamp: nowMs,
    transactionId: txRes.transaction.transactionId
  };
  progression.contributions.push(contrib);
  return { ok: true, contribution: contrib, balance: txRes.balance };
}

// Multi-member contribution into a shared Alliance Research Pool (Spec §3.3 & §5.4)
export function contributeToAlliancePool(progression, params) {
  if (!progression || !params) return { ok: false, reason: 'invalid_params' };
  const alliance = progression.organizations.alliances[params.allianceId];
  if (!alliance) return { ok: false, reason: 'alliance_not_found' };
  const contributor = String(params.contributorPlayerId || 'player_1');
  if (alliance.members.indexOf(contributor) === -1) {
    return { ok: false, reason: 'not_alliance_member' };
  }

  const nowMs = typeof params.nowMs === 'number' ? params.nowMs : 0;
  const txRes = recordCurrencyTransaction(progression.currencyLedger, {
    ownerId: alliance.id,
    ownerType: OWNER_TYPES.ALLIANCE,
    currencyId: alliance.currencyId,
    amount: params.amount,
    transactionType: TRANSACTION_TYPES.CONTRIBUTION,
    source: params.source || 'member_direct_contribution',
    referenceId: params.eventId || null,
    idempotencyKey: params.eventId ? ('acontrib:' + alliance.id + ':' + contributor + ':' + params.eventId) : null,
    nowMs: nowMs
  });

  if (!txRes.ok || txRes.duplicate) return txRes;

  const contrib = {
    contributionId: 'contrib_' + String(progression.contributions.length + 1),
    contributorPlayerId: contributor,
    targetOwnerId: alliance.id,
    targetOwnerType: OWNER_TYPES.ALLIANCE,
    currencyId: alliance.currencyId,
    amount: txRes.transaction.amount,
    amountScaled: txRes.transaction.amountScaled,
    source: params.source || 'member_direct_contribution',
    referenceId: params.eventId || null,
    timestamp: nowMs,
    transactionId: txRes.transaction.transactionId
  };
  progression.contributions.push(contrib);
  return { ok: true, contribution: contrib, allianceBalance: txRes.balance };
}

export function getContributionReport(progression, filter) {
  const f = filter || {};
  const byMember = {};
  let totalScaled = 0;
  const records = [];

  for (let i = 0; i < (progression.contributions || []).length; i++) {
    const c = progression.contributions[i];
    if (f.targetOwnerType && c.targetOwnerType !== f.targetOwnerType) continue;
    if (f.targetOwnerId && c.targetOwnerId !== String(f.targetOwnerId)) continue;
    if (f.contributorPlayerId && c.contributorPlayerId !== String(f.contributorPlayerId)) continue;
    records.push(c);
    totalScaled += (c.amountScaled || 0);
    byMember[c.contributorPlayerId] = (byMember[c.contributorPlayerId] || 0) + (c.amountScaled || 0);
  }

  return {
    count: records.length,
    totalScaled: totalScaled,
    total: totalScaled / 100000,
    byMemberScaled: byMember,
    records: records
  };
}

export function startOrganizationResearch(progression, params) {
  if (!progression || !params) return { ok: false, reason: 'invalid_params' };
  const orgType = params.orgType;
  if (params.isTraining && orgType === OWNER_TYPES.ALLIANCE) {
    return { ok: false, reason: 'alliance_training_not_supported' };
  }

  const org = orgType === OWNER_TYPES.GUILD
    ? progression.organizations.guilds[params.orgId]
    : (orgType === OWNER_TYPES.ALLIANCE ? progression.organizations.alliances[params.orgId] : null);
  if (!org) return { ok: false, reason: 'organization_not_found' };

  return startOrEnqueueResearch(progression, {
    ownerId: org.id,
    ownerType: orgType,
    researchItemId: params.researchItemId,
    nowMs: params.nowMs || 0,
    queue: org.researchQueue,
    catalog: PROTOTYPE_ORG_RESEARCH_ITEMS,
    eligibilityCtx: {
      guild: orgType === OWNER_TYPES.GUILD ? org : null,
      alliance: orgType === OWNER_TYPES.ALLIANCE ? org : null
    }
  });
}

export function getOrganizationResearchBalance(progression, orgType, orgId) {
  const org = orgType === OWNER_TYPES.GUILD
    ? progression.organizations.guilds[orgId]
    : progression.organizations.alliances[orgId];
  if (!org) return null;
  return getCurrencyBalance(progression.currencyLedger, org.id, orgType, org.currencyId);
}

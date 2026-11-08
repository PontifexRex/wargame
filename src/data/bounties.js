// Procedural Guild Notice Board Contract Templates & Generator

export const BOUNTY_SLAY_TEMPLATES = [
  { targetId: 'crawler',     label: 'Vault Crawlers',     minQty: 4, maxQty: 6, minPermit: 5,  baseGold: 85 },
  { targetId: 'archer',      label: 'Ranged Cultists & Archers', minQty: 3, maxQty: 5, minPermit: 5, baseGold: 95 },
  { targetId: 'monster_any', label: 'Subterranean Hostiles', minQty: 6, maxQty: 9, minPermit: 5, baseGold: 100 }
];

export const BOUNTY_ORE_TEMPLATES = [
  { targetId: 'copper',      label: 'Copper Ore',     minQty: 4, maxQty: 6, reqGeo: 0, baseGold: 80 },
  { targetId: 'iron',        label: 'Iron Ore',       minQty: 3, maxQty: 5, reqGeo: 1, baseGold: 115 },
  { targetId: 'mithril',     label: 'Mithril Ore',    minQty: 3, maxQty: 4, reqGeo: 2, baseGold: 165 },
  { targetId: 'geode',       label: 'Relic Geodes',   minQty: 2, maxQty: 3, reqGeo: 2, baseGold: 175 },
  { targetId: 'starcrystal', name: 'Star-Crystal', label: 'Star-Crystal', minQty: 2, maxQty: 3, reqGeo: 3, baseGold: 220 }
];

export const BOUNTY_SPECIAL_TEMPLATES = [
  { kind: 'slay',       targetId: 'elite',      titlePrefix: 'Champion Hunt', descVerb: 'Vanquish', label: 'Elite Champions', minQty: 1, maxQty: 2, minGeo: 0, baseGold: 140 },
  { kind: 'open_chest', targetId: 'chest',      titlePrefix: 'Relic Recovery', descVerb: 'Open',    label: 'Gilded Vault Chests', minQty: 2, maxQty: 3, minGeo: 0, baseGold: 110 }
];

let bountySeqCounter = 100;

export function buildProceduralBountySet(geologyRank = 0, cartographyRank = 0) {
  const contracts = [];
  const tierScale = 1 + cartographyRank * 0.25;

  // Slot 1: Monster Cull Contract (Vault Gold Reward)
  const slayTpl = BOUNTY_SLAY_TEMPLATES[Math.floor(Math.random() * BOUNTY_SLAY_TEMPLATES.length)];
  const slayQty = slayTpl.minQty + Math.floor(Math.random() * (slayTpl.maxQty - slayTpl.minQty + 1));
  const slayGold = Math.round(slayTpl.baseGold * tierScale);
  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: 'slay',
    targetId: slayTpl.targetId,
    title: `Cull: ${slayTpl.label}`,
    desc: `Slay ${slayQty} ${slayTpl.label} in the vaults.`,
    reqQty: slayQty,
    curQty: 0,
    completed: false,
    rewardType: 'gold',
    rewardId: 'gold',
    rewardQty: slayGold,
    rewardLabel: `+${slayGold} Vault Gold`
  });

  // Slot 2: Geological Quota Contract (Rare Material or Uncut Gem Reward)
  const unlockedOres = BOUNTY_ORE_TEMPLATES.filter(o => geologyRank >= o.reqGeo);
  const orePool = unlockedOres.length > 0 ? unlockedOres : [BOUNTY_ORE_TEMPLATES[0]];
  const oreTpl = orePool[Math.floor(Math.random() * orePool.length)];
  const oreQty = oreTpl.minQty + Math.floor(Math.random() * (oreTpl.maxQty - oreTpl.minQty + 1));

  const gemChoices = [
    { id: 'ruby', name: 'Ruby of Might' },
    { id: 'emerald', name: 'Emerald of the Wind' },
    { id: 'sapphire', name: 'Sapphire of Will' },
    { id: 'topaz', name: 'Topaz of Dawn' }
  ];
  if (cartographyRank >= 2) {
    gemChoices.push({ id: 'void_diamond', name: 'Void Diamond' });
  }
  const chosenGem = gemChoices[Math.floor(Math.random() * gemChoices.length)];

  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: 'mine',
    targetId: oreTpl.targetId,
    title: `Quota: ${oreTpl.label}`,
    desc: `Mine ${oreQty} ${oreTpl.label} veins.`,
    reqQty: oreQty,
    curQty: 0,
    completed: false,
    rewardType: 'gem',
    rewardId: chosenGem.id,
    rewardQty: 1,
    rewardLabel: `+1 ${chosenGem.name}`
  });

  // Slot 3: High-Value Tactical Contract (Talent Tome or Bonus Gold + Star-Crystal)
  const specTpl = BOUNTY_SPECIAL_TEMPLATES[Math.floor(Math.random() * BOUNTY_SPECIAL_TEMPLATES.length)];
  const specQty = specTpl.minQty + Math.floor(Math.random() * (specTpl.maxQty - specTpl.minQty + 1));
  const awardTome = Math.random() < 0.6;

  contracts.push({
    id: `bty_${Date.now()}_${bountySeqCounter++}`,
    kind: specTpl.kind,
    targetId: specTpl.targetId,
    title: `${specTpl.titlePrefix}`,
    desc: `${specTpl.descVerb} ${specQty} ${specTpl.label}.`,
    reqQty: specQty,
    curQty: 0,
    completed: false,
    rewardType: awardTome ? 'talent_tome' : 'ore',
    rewardId: awardTome ? 'talent' : (geologyRank >= 2 ? 'starcrystal' : 'mithril'),
    rewardQty: awardTome ? 1 : 2,
    rewardLabel: awardTome
      ? '+1 Talent Tome (+1 Talent Pt)'
      : (geologyRank >= 2 ? '+2 Star-Crystal' : '+2 Mithril Ore')
  });

  return contracts;
}

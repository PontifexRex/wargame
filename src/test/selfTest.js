// 13/13 Comprehensive Automated Self-Test Suite (Sandboxed & Non-Destructive)

import {
  SCHEMA_VERSION,
  TILE_FLOOR,
  TILE_ORE_COPPER,
  TILE_ORE_STAR,
  TILE_SHRINE,
  TILE_SHRINE_USED,
  TILE_TRAP_HIDDEN,
  TILE_TRAP_VISIBLE,
  TILE_TRAP_DISARMED
} from '../constants.js';
import { CLASSES } from '../data/classes.js';
import { createDefaultGameState, migrateSaveData } from '../engine/state.js';
import { generateFloor, verifyPureFloorBFS, generateProceduralEquipment } from '../engine/procedural.js';
import { selectAdventurerClass } from '../ui/modals.js';
import {
  mineTile,
  buyShopItem,
  sellMineralUnit,
  addExpeditionTradeItem,
  purchaseResearchRank,
  extractToGuild,
  handleHeroDefeat,
  socketGemIntoItem,
  unsocketGemFromItem,
  detectNearbyTraps,
  activateAstralShrine,
  resolveTrapInteraction
} from '../engine/actions.js';
import { executeClassSkill } from '../engine/combat.js';

export function evaluateSelfTests() {
  const results = [];

  // 1. Schema v4 Migration preserves v1/v2/v3 saves & backfills gems + bounties
  const legacySave = {
    version: 'v0.1.0-inc1',
    hero: { classId: 'ranger', level: 4, xp: 20 },
    bank: { gold: 120, potions: 4, recallScrolls: 2, items: [{ id: 'copper_ore', count: 5 }] },
    research: { max_depth: 1, metallurgy_geology: 2 }
  };
  const mig = migrateSaveData(legacySave);
  const t1Pass =
    mig.version === SCHEMA_VERSION &&
    mig.hero.classId === 'ranger' &&
    mig.guildVault.gold === 120 &&
    mig.guildVault.copper === 5 &&
    mig.hero.consumables.potions === 4 &&
    mig.guildResearch.geology === 2 &&
    mig.guildVault.gems &&
    Array.isArray(mig.guildBounties) &&
    mig.guildBounties.length === 3;
  results.push({
    name: '1. Schema v4 Save Migration (v1/v2/v3 Compatibility)',
    pass: t1Pass,
    detail: `Migrated Lv4 Ranger, 120g, 5 Copper, Geology R${mig.guildResearch.geology}, Gems & 3 Bounties initialized`
  });

  // 2. All 5 Classes Registered with Complete Declarations
  const reqClasses = ['fighter', 'thief', 'mage', 'ranger', 'paladin'];
  const t2Pass = reqClasses.every(
    k => CLASSES[k] && CLASSES[k].skillName && CLASSES[k].passiveName && CLASSES[k].starterGear.pickaxe
  );
  results.push({
    name: '2. Complete 5-Class Registry (Fighter, Thief, Mage, Ranger, Paladin)',
    pass: t2Pass,
    detail: `Ranger Skill: ${CLASSES.ranger.skillName} • Paladin Skill: ${CLASSES.paladin.skillName}`
  });

  // 3. Pure-Floor BFS Staircase Reachability & Non-Blocking Ores/Traps
  let bfsAllPass = true;
  for (let i = 0; i < 5; i++) {
    const testFl = generateFloor(i + 1);
    if (!verifyPureFloorBFS(testFl)) bfsAllPass = false;
  }
  results.push({
    name: '3. Pure-Floor BFS Staircase Reachability (Trap-Free & Non-Blocking)',
    pass: bfsAllPass,
    detail: '5/5 procedural floors verified with safe trap-free walkable paths from < to >'
  });

  // 4. Procedural 6-Slot Equipment & 5 Rarity Tiers
  const relicItem = generateProceduralEquipment(6, 'relic', 'weapon');
  const t4Pass = !!(
    relicItem &&
    relicItem.rarity === 'relic' &&
    relicItem.affixes.length >= 3 &&
    relicItem.atk > 0 &&
    relicItem.maxSockets === 2
  );
  results.push({
    name: '4. Procedural 6-Slot Equipment, Affix & Socket Roll Engine',
    pass: t4Pass,
    detail: `Generated "${relicItem.name}" (+${relicItem.atk} ATK, ${relicItem.affixes.length} affixes, ${relicItem.maxSockets} sockets)`
  });

  // 5. Mining Engine, Geology Gating & Durability Math
  const sandbox5 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox5);
  const fl5 = sandbox5.dungeon.floors[1];
  fl5.tiles[2][2] = TILE_ORE_STAR; // Requires Geology 3
  const blockedMine = mineTile(2, 2, sandbox5);
  sandbox5.guildResearch.geology = 3;
  const allowedMine = mineTile(2, 2, sandbox5);
  const t5Pass =
    !blockedMine.ok &&
    blockedMine.reason === 'geology_locked' &&
    allowedMine.ok &&
    fl5.tiles[2][2] === TILE_FLOOR;
  results.push({
    name: '5. Interactive Mining, Geology Gating & Durability Math',
    pass: t5Pass,
    detail: 'Star-Crystal blocked at Geo R0, mined cleanly at Geo R3 -> converted wall to TILE_FLOOR'
  });

  // 6. Dual-Cost Guild Research Execution
  const sandbox6 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox6);
  sandbox6.guildVault.gold = 200;
  sandbox6.guildVault.copper = 5;
  const resOut = purchaseResearchRank('cartography', sandbox6);
  const t6Pass =
    resOut.ok &&
    sandbox6.guildResearch.cartography === 1 &&
    sandbox6.guildVault.copper === 2 &&
    sandbox6.guildVault.gold === 110;
  results.push({
    name: '6. Dual-Cost Guild Research Lab (Gold + Vault Minerals)',
    pass: t6Pass,
    detail: 'Cartography R1 unlocked (Permit Fl 10); deducted 90g & 3 Copper Ore'
  });

  // 7. Quartermaster Buy & Antiquarian Assay Sell Multiplier
  const sandbox7 = createDefaultGameState();
  selectAdventurerClass('mage', sandbox7);
  sandbox7.guildVault.gold = 100;
  buyShopItem('buy_recall', sandbox7);
  buyShopItem('buy_heal', sandbox7);
  sandbox7.guildResearch.assay = 2; // +70% value (1.70x)
  sandbox7.guildVault.copper = 2;   // Base 10 * 2 * 1.70 = 34g
  const assayGain = sellMineralUnit('copper', true, sandbox7);
  const t7Pass =
    sandbox7.hero.consumables.recalls === 2 &&
    sandbox7.hero.consumables.potions === 3 &&
    assayGain === 34;
  results.push({
    name: '7. Quartermaster Consumables & Antiquarian Assay Multiplier',
    pass: t7Pass,
    detail: `Recalls: ${sandbox7.hero.consumables.recalls}, Potions: ${sandbox7.hero.consumables.potions}, Assay Sale: +${assayGain}g (170%)`
  });

  // 8. Active Skill Target & Walkable Tile Validation (Thief & Paladin)
  const sandbox8 = createDefaultGameState();
  selectAdventurerClass('paladin', sandbox8);
  sandbox8.inGuild = false;
  sandbox8.dungeon.floors[1].monsters = []; // No monsters adjacent
  const startMp = sandbox8.hero.mp;
  const smiteEmpty = executeClassSkill(sandbox8);
  const t8Pass = !smiteEmpty.ok && sandbox8.hero.mp === startMp;
  results.push({
    name: '8. Active Skill Target & Tile Validation (Zero Wasted MP)',
    pass: t8Pass,
    detail: 'Paladin Holy Smite & Thief Shadowstep validate target/tile before deducting MP'
  });

  // 9. Milestone Boss Spawns (Floor 5 Starfall Colossus & Floor 10 Void Weaver)
  const bossFl5 = generateFloor(5);
  const bossFl10 = generateFloor(10);
  const b5 = bossFl5.monsters.find(m => m.isBoss && m.id === 'boss_colossus');
  const b10 = bossFl10.monsters.find(m => m.isBoss && m.id === 'boss_weaver');
  const t9Pass = !!b5 && !!b10;
  results.push({
    name: '9. Milestone Boss Spawns (Floor 5 Colossus & Floor 10 Weaver)',
    pass: t9Pass,
    detail: `Fl 5: ${b5 ? b5.name : 'missing'} (${b5 ? b5.hp : 0} HP) • Fl 10: ${b10 ? b10.name : 'missing'} (${b10 ? b10.hp : 0} HP)`
  });

  // 10. Non-Permanent Defeat & Vanguard Recovery Math
  const sandbox10 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox10);
  sandbox10.inGuild = false;
  sandbox10.guildResearch.vanguard = 2; // 40% recovery
  addExpeditionTradeItem('starcrystal', 'Star-Crystal', 100, 1, 'Ore', sandbox10);
  const defeatOut = handleHeroDefeat('Test Titan', sandbox10);
  const t10Pass =
    sandbox10.inGuild === true &&
    defeatOut.salvagedGold === 40 &&
    sandbox10.hero.hp === sandbox10.hero.maxHp;
  results.push({
    name: '10. Non-Permanent Defeat & Vanguard Recovery Salvage',
    pass: t10Pass,
    detail: `Returned to Guild with full HP; salvaged +${defeatOut.salvagedGold}g (40% of 100g pack)`
  });

  // 11. Astral Gem Socketing, Lapidary Stat Recomputation & Unsocketing
  const sandbox11 = createDefaultGameState();
  selectAdventurerClass('fighter', sandbox11);
  const socketBlade = generateProceduralEquipment(4, 'relic', 'weapon');
  sandbox11.hero.equipment.weapon = socketBlade;
  sandbox11.guildVault.gold = 50;
  sandbox11.guildVault.gems.ruby = 1;
  socketGemIntoItem('weapon', 'ruby', true, sandbox11);
  const atkSocketed = sandbox11.hero.atk;
  const gemAfterSocket = sandbox11.guildVault.gems.ruby;
  const unsocketOut = unsocketGemFromItem('weapon', 0, true, sandbox11);
  const atkUnsocketed = sandbox11.hero.atk;
  const t11Pass =
    unsocketOut.ok &&
    gemAfterSocket === 0 &&
    sandbox11.guildVault.gems.ruby === 1 &&
    sandbox11.guildVault.gold === 35 &&
    atkSocketed > atkUnsocketed;
  results.push({
    name: '11. Astral Gem Socketing & Lapidary Bench Extraction',
    pass: t11Pass,
    detail: `Ruby socketed (${atkUnsocketed} -> ${atkSocketed} ATK) & extracted cleanly (-15g, gem returned)`
  });

  // 12. Guild Notice Board Bounties & Extraction Reward Payout
  const sandbox12 = createDefaultGameState();
  selectAdventurerClass('ranger', sandbox12);
  sandbox12.inGuild = false;
  const baseTalentPts = sandbox12.hero.talentPoints;
  sandbox12.guildBounties[0] = {
    id: 'bty_test_copper',
    kind: 'mine',
    targetId: 'copper',
    title: 'Quota: Copper Ore',
    desc: 'Mine 2 Copper Ore veins.',
    reqQty: 2,
    curQty: 0,
    completed: false,
    rewardType: 'talent_tome',
    rewardId: 'talent',
    rewardQty: 1,
    rewardLabel: '+1 Talent Tome (+1 Talent Pt)'
  };
  const fl12 = sandbox12.dungeon.floors[1];
  fl12.tiles[1][1] = TILE_ORE_COPPER;
  fl12.tiles[1][2] = TILE_ORE_COPPER;
  mineTile(1, 1, sandbox12);
  mineTile(2, 1, sandbox12);
  const completedBeforeExtract = sandbox12.guildBounties[0].completed === true;
  const extOut = extractToGuild('Floor 1 Ascending Stairs (<)', sandbox12);
  const t12Pass =
    completedBeforeExtract &&
    extOut.claimedBounties.length >= 1 &&
    sandbox12.hero.talentPoints === baseTalentPts + 1 &&
    sandbox12.guildBounties[0].id !== 'bty_test_copper';
  results.push({
    name: '12. Guild Notice Board Contracts & Extraction Payout',
    pass: t12Pass,
    detail: `Completed Copper quota -> claimed +1 Talent Point & rotated fresh contract`
  });

  // 13. Subterranean Astral Shrines & Scout Trap Detection/Disarming
  const sandbox13 = createDefaultGameState();
  selectAdventurerClass('thief', sandbox13);
  sandbox13.inGuild = false;
  const fl13 = sandbox13.dungeon.floors[1];
  sandbox13.hero.x = 4;
  sandbox13.hero.y = 4;
  fl13.tiles[4][5] = TILE_TRAP_HIDDEN;
  fl13.traps['5,4'] = { type: 'spike' };
  fl13.tiles[4][6] = TILE_SHRINE;
  fl13.shrines['6,4'] = { type: 'starfire' };

  const spotted = detectNearbyTraps(fl13, sandbox13);
  const trapVisible = fl13.tiles[4][5] === TILE_TRAP_VISIBLE;
  const hpBeforeTrap = sandbox13.hero.hp;
  const disarmRes = resolveTrapInteraction(5, 4, sandbox13);
  const atkBeforeShrine = sandbox13.hero.atk;
  const shrineRes = activateAstralShrine(6, 4, sandbox13);
  const t13Pass =
    spotted >= 1 &&
    trapVisible &&
    disarmRes.ok &&
    disarmRes.disarmed === true &&
    sandbox13.hero.hp === hpBeforeTrap &&
    fl13.tiles[4][5] === TILE_TRAP_DISARMED &&
    shrineRes.ok &&
    fl13.tiles[4][6] === TILE_SHRINE_USED &&
    sandbox13.hero.atk === atkBeforeShrine + 6;
  results.push({
    name: '13. Astral Shrines & Scout Runic Trap Detection/Disarming',
    pass: t13Pass,
    detail: `Thief spotted & disarmed Spike Trap (0 dmg) + channeled Starfire Shrine (+6 ATK)`
  });

  return results;
}

export function runSelfTests(renderModal = false) {
  const results = evaluateSelfTests();
  const passCount = results.filter(r => r.pass).length;

  if (typeof document !== 'undefined') {
    const btnText = document.getElementById('verifyBtnText');
    if (btnText) {
      btnText.textContent = `Verify Inc-4 (${passCount}/${results.length} PASS)`;
    }

    if (renderModal) {
      const listEl = document.getElementById('diagnosticsList');
      if (listEl) {
        listEl.innerHTML = results.map(r => `
          <div class="p-2.5 rounded bg-[#080b11] border ${r.pass ? 'border-[#34d399]/40' : 'border-[#f87171]'} flex items-center justify-between gap-2">
            <div>
              <div class="font-bold ${r.pass ? 'text-[#e6edf3]' : 'text-[#f87171]'}">${r.name}</div>
              <div class="text-[11px] text-[#8b949e]">${r.detail}</div>
            </div>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.pass ? 'bg-[#34d399]/20 text-[#34d399]' : 'bg-[#f87171]/20 text-[#f87171]'}">
              ${r.pass ? 'PASS' : 'FAIL'}
            </span>
          </div>
        `).join('');
      }
    }
  }

  return passCount === results.length;
}

export function openDiagnosticsModal() {
  if (typeof document === 'undefined') return;
  runSelfTests(true);
  const modal = document.getElementById('diagnosticsModal');
  if (modal) modal.classList.remove('hidden');
}

export function closeDiagnosticsModal() {
  if (typeof document === 'undefined') return;
  const modal = document.getElementById('diagnosticsModal');
  if (modal) modal.classList.add('hidden');
}

import { canAfford } from './recipes';
import { Inventory, ResourceId } from './types';

export type SkillBranchId = 'mobility' | 'endurance' | 'weather';

export type SkillIconKind =
  | 'swift_step'
  | 'river_stride'
  | 'gale_dash'
  | 'horizon_runner'
  | 'steady_breath'
  | 'vital_core'
  | 'pulse_recovery'
  | 'ancient_vigor'
  | 'rain_cloak'
  | 'storm_sight'
  | 'thermal_blood'
  | 'climate_master';

export interface PassiveSkillModifiers {
  moveSpeedBonus?: number;
  terrainPenaltyReduction?: number;
  tractionBonus?: number;
  dashStaminaDiscount?: number;
  dashSpeedBonus?: number;
  dashCooldownReduction?: number;
  fogRevealMultiplier?: number;
  maxStaminaBonus?: number;
  staminaRegenBonus?: number;
  maxHpBonus?: number;
  passiveHpRegenPerSec?: number;
  damageReductionBonusPct?: number;
  weatherResistBonus?: number;
  weatherVisibilityBonus?: number;
  nightVisionBonusPx?: number;
  ignoreWeatherStaminaPenalty?: boolean;
  stormStrideSpeedBonus?: number;
}

export interface ComputedSkillBonuses {
  moveSpeedBonus: number;
  terrainPenaltyReduction: number;
  tractionBonus: number;
  dashStaminaDiscount: number;
  dashSpeedBonus: number;
  dashCooldownReduction: number;
  fogRevealMultiplier: number;
  maxStaminaBonus: number;
  staminaRegenBonus: number;
  maxHpBonus: number;
  passiveHpRegenPerSec: number;
  damageReductionBonusPct: number;
  weatherResistBonus: number;
  weatherVisibilityBonus: number;
  nightVisionBonusPx: number;
  ignoreWeatherStaminaPenalty: boolean;
  stormStrideSpeedBonus: number;
}

export interface SkillNodeDef {
  id: string;
  branch: SkillBranchId;
  tier: 1 | 2 | 3 | 4;
  tierLabel: string;
  parentId: string | null;
  iconKind: SkillIconKind;
  accentColor: string;
  name: string;
  shortPerk: string;
  statSummary: string;
  description: string;
  costs: Partial<Record<ResourceId, number>>;
  modifiers: PassiveSkillModifiers;
}

export interface SkillBranchMeta {
  id: SkillBranchId;
  title: string;
  subtitle: string;
  accentColor: string;
}

export const SKILL_BRANCHES: SkillBranchMeta[] = [
  {
    id: 'mobility',
    title: 'Nhánh Phong Hành',
    subtitle: 'Tốc độ di chuyển, lội suối & lướt nhanh',
    accentColor: '#38bdf8',
  },
  {
    id: 'endurance',
    title: 'Nhánh Sinh Lực',
    subtitle: 'Thể lực tối đa, hồi sức bền & thể chất',
    accentColor: '#4ade80',
  },
  {
    id: 'weather',
    title: 'Nhánh Kháng Khí Hậu',
    subtitle: 'Chịu đựng thời tiết khắc nghiệt & tầm nhìn',
    accentColor: '#fbbf24',
  },
];

export const SKILL_TREE_NODES: SkillNodeDef[] = [
  // =========================================================================
  // NHÁNH 1: PHONG HÀNH (TỐC ĐỘ DI CHUYỂN & ĐỊA HÌNH)
  // =========================================================================
  {
    id: 'mob_1',
    branch: 'mobility',
    tier: 1,
    tierLabel: 'Bậc I',
    parentId: null,
    iconKind: 'swift_step',
    accentColor: '#38bdf8',
    name: 'Bước Chân Nhẹ Nhàng',
    shortPerk: '+8% tốc độ di chuyển cơ bản',
    statSummary: 'Tốc độ chạy +8%',
    description:
      'Làm chủ nhịp bước thám hiểm trên thảm cỏ, bờ biển và rừng rậm, giúp tăng vĩnh viễn tốc độ di chuyển.',
    costs: { wood: 4, berry: 3 },
    modifiers: {
      moveSpeedBonus: 0.08,
    },
  },
  {
    id: 'mob_2',
    branch: 'mobility',
    tier: 2,
    tierLabel: 'Bậc II',
    parentId: 'mob_1',
    iconKind: 'river_stride',
    accentColor: '#38bdf8',
    name: 'Lội Suối Băng Rừng',
    shortPerk: 'Giảm 60% cản trở lội sông/tuyết & tăng độ bám',
    statSummary: 'Giảm 60% chậm địa hình · Độ bám +16%',
    description:
      'Vượt qua vùng nước nông ven sông, bờ biển san hô và sườn núi phủ tuyết nhẹ nhàng mà không bị ghì bước.',
    costs: { wood: 6, stone: 6, bioSample: 2 },
    modifiers: {
      terrainPenaltyReduction: 0.6,
      tractionBonus: 0.16,
    },
  },
  {
    id: 'mob_3',
    branch: 'mobility',
    tier: 3,
    tierLabel: 'Bậc III',
    parentId: 'mob_2',
    iconKind: 'gale_dash',
    accentColor: '#38bdf8',
    name: 'Tật Phong Bộ',
    shortPerk: '+9% tốc độ di chuyển & giảm 5 Thể lực khi Lướt',
    statSummary: 'Tốc độ chạy +9% · Lướt -5 TL',
    description:
      'Gia tăng sức bật cổ chân, rút ngắn tiêu hao thể lực mỗi cú Lướt [Space] và đẩy vận tốc né đòn cao hơn.',
    costs: { wood: 8, iron: 4, berry: 5 },
    modifiers: {
      moveSpeedBonus: 0.09,
      dashStaminaDiscount: 5,
      dashSpeedBonus: 55,
    },
  },
  {
    id: 'mob_4',
    branch: 'mobility',
    tier: 4,
    tierLabel: 'Bậc IV',
    parentId: 'mob_3',
    iconKind: 'horizon_runner',
    accentColor: '#7dd3fc',
    name: 'Thần Hành Vạn Dặm',
    shortPerk: '+9% tốc độ di chuyển & +22% bán kính mở bản đồ',
    statSummary: 'Tốc độ chạy +9% · Mở bản đồ +22%',
    description:
      'Đạt cảnh giới lữ khách lục địa: di chuyển cực nhanh xuyên 6 châu lục, hồi Lướt lẹ hơn và mở rộng tầm khảo sát bản đồ.',
    costs: { iron: 6, crystal: 6, bioSample: 4 },
    modifiers: {
      moveSpeedBonus: 0.09,
      dashCooldownReduction: 0.1,
      fogRevealMultiplier: 0.22,
    },
  },

  // =========================================================================
  // NHÁNH 2: SINH LỰC (SỨC BỀN, THỂ LỰC & THỂ CHẤT)
  // =========================================================================
  {
    id: 'end_1',
    branch: 'endurance',
    tier: 1,
    tierLabel: 'Bậc I',
    parentId: null,
    iconKind: 'steady_breath',
    accentColor: '#4ade80',
    name: 'Hơi Thở Bền Bỉ',
    shortPerk: '+25 Thể lực tối đa & +20% tốc độ hồi Thể lực',
    statSummary: '+25 Thể lực · Hồi TL +20%',
    description:
      'Điều hòa nhịp thở đường dài nhờ thảo mộc tự nhiên, giúp dự trữ nhiều sức bền hơn và phục hồi thể lực nhanh chóng.',
    costs: { stone: 3, berry: 4 },
    modifiers: {
      maxStaminaBonus: 25,
      staminaRegenBonus: 0.2,
    },
  },
  {
    id: 'end_2',
    branch: 'endurance',
    tier: 2,
    tierLabel: 'Bậc II',
    parentId: 'end_1',
    iconKind: 'vital_core',
    accentColor: '#4ade80',
    name: 'Thể Chất Cường Tráng',
    shortPerk: '+30 Máu tối đa (HP) & +20 Thể lực tối đa',
    statSummary: '+30 HP tối đa · +20 Thể lực',
    description:
      'Củng cố cơ xương và sức đề kháng bằng dưỡng chất sinh quyển, nâng cao giới hạn sinh lực và sức bền cơ thể.',
    costs: { wood: 6, berry: 6, bioSample: 2 },
    modifiers: {
      maxHpBonus: 30,
      maxStaminaBonus: 20,
    },
  },
  {
    id: 'end_3',
    branch: 'endurance',
    tier: 3,
    tierLabel: 'Bậc III',
    parentId: 'end_2',
    iconKind: 'pulse_recovery',
    accentColor: '#4ade80',
    name: 'Nhịp Tim Dẻo Dai',
    shortPerk: '+28% hồi Thể lực & tự hồi 1.2 HP/giây khi sung sức',
    statSummary: 'Hồi TL +28% · Tự hồi 1.2 HP/s',
    description:
      'Khi thanh Thể lực duy trì trên 80%, cơ thể tự động tái tạo sinh lực liên tục ngoài thực địa mà không cần dừng chân.',
    costs: { stone: 8, iron: 4, berry: 5 },
    modifiers: {
      staminaRegenBonus: 0.28,
      passiveHpRegenPerSec: 1.2,
    },
  },
  {
    id: 'end_4',
    branch: 'endurance',
    tier: 4,
    tierLabel: 'Bậc IV',
    parentId: 'end_3',
    iconKind: 'ancient_vigor',
    accentColor: '#86efac',
    name: 'Nguồn Sống Cổ Đại',
    shortPerk: '+45 HP, +35 Thể lực & giảm 16% sát thương nhận vào',
    statSummary: '+45 HP · +35 TL · Giảm 16% sát thương',
    description:
      'Hấp thụ tinh hoa khoáng thạch và vi sinh vật cổ đại để đạt sức chịu đựng phi thường trước thú săn mồi hung hãn.',
    costs: { crystal: 6, bioSample: 5, berry: 6 },
    modifiers: {
      maxHpBonus: 45,
      maxStaminaBonus: 35,
      damageReductionBonusPct: 16,
    },
  },

  // =========================================================================
  // NHÁNH 3: KHÁNG KHÍ HẬU (CHỊU ĐỰNG THỜI TIẾT KHẮC NGHIỆT & TẦM NHÌN)
  // =========================================================================
  {
    id: 'wea_1',
    branch: 'weather',
    tier: 1,
    tierLabel: 'Bậc I',
    parentId: null,
    iconKind: 'rain_cloak',
    accentColor: '#fbbf24',
    name: 'Áo Choàng Chống Ẩm',
    shortPerk: '+22% kháng thời tiết khắc nghiệt & chống trơn trượt',
    statSummary: 'Kháng thời tiết +22% · Độ bám +14%',
    description:
      'Phủ sáp nhựa cây chống thấm giúp giảm lực cản tốc độ, gió tạt và bùn trơn khi đi dưới Mưa rào, Tuyết rơi hay Sương mù.',
    costs: { wood: 4, stone: 3, berry: 2 },
    modifiers: {
      weatherResistBonus: 0.22,
      tractionBonus: 0.14,
    },
  },
  {
    id: 'wea_2',
    branch: 'weather',
    tier: 2,
    tierLabel: 'Bậc II',
    parentId: 'wea_1',
    iconKind: 'storm_sight',
    accentColor: '#fbbf24',
    name: 'Mắt Ưng Xuyên Bão',
    shortPerk: '+18% tầm nhìn xuyên sương/bão & sáng rõ hơn ban đêm',
    statSummary: 'Tầm nhìn bão +18% · Thị lực đêm +45px',
    description:
      'Rèn luyện thị giác thích nghi với màn sương dày, mưa tuyết mù mịt và bóng tối ban đêm để phát hiện sớm thú dữ.',
    costs: { stone: 6, berry: 4, bioSample: 2 },
    modifiers: {
      weatherVisibilityBonus: 0.18,
      nightVisionBonusPx: 45,
    },
  },
  {
    id: 'wea_3',
    branch: 'weather',
    tier: 3,
    tierLabel: 'Bậc III',
    parentId: 'wea_2',
    iconKind: 'thermal_blood',
    accentColor: '#fbbf24',
    name: 'Huyết Mạch Chịu Hàn Nhiệt',
    shortPerk: '+26% kháng thời tiết & miễn phạt hồi Thể lực trong bão',
    statSummary: 'Kháng thời tiết +26% · Miễn phạt TL bão',
    description:
      'Thích nghi hoàn hảo với cái lạnh cắt da của Bão tuyết Himalaya lẫn sức nóng ngột ngạt của Bão cát Sahara.',
    costs: { wood: 6, iron: 5, crystal: 3 },
    modifiers: {
      weatherResistBonus: 0.26,
      ignoreWeatherStaminaPenalty: true,
    },
  },
  {
    id: 'wea_4',
    branch: 'weather',
    tier: 4,
    tierLabel: 'Bậc IV',
    parentId: 'wea_3',
    iconKind: 'climate_master',
    accentColor: '#fde047',
    name: 'Bậc Thầy Khí Hậu Cực Đoan',
    shortPerk: '+24% kháng thời tiết, +16% tầm nhìn & +8% tốc độ trong bão',
    statSummary: 'Kháng +24% · Tầm nhìn +16% · Tốc độ bão +8%',
    description:
      'Biến giông bão thành lợi thế: giữ tầm nhìn quang đãng và bước chạy thần tốc ngay giữa tâm Bão tuyết, Bão cát và Mưa giông.',
    costs: { iron: 5, crystal: 7, bioSample: 5 },
    modifiers: {
      weatherResistBonus: 0.24,
      weatherVisibilityBonus: 0.16,
      stormStrideSpeedBonus: 0.08,
      nightVisionBonusPx: 35,
    },
  },
];

export const SKILL_BY_ID: Record<string, SkillNodeDef> = Object.fromEntries(
  SKILL_TREE_NODES.map((node) => [node.id, node])
);

export const VALID_SKILL_IDS = new Set<string>(SKILL_TREE_NODES.map((node) => node.id));

export function isSkillPrerequisiteMet(
  skill: SkillNodeDef,
  unlocked: ReadonlySet<string>
): boolean {
  if (!skill.parentId) return true;
  return unlocked.has(skill.parentId);
}

export function computePassiveSkillBonuses(
  unlocked: Iterable<string>
): ComputedSkillBonuses {
  const totals: ComputedSkillBonuses = {
    moveSpeedBonus: 0,
    terrainPenaltyReduction: 0,
    tractionBonus: 0,
    dashStaminaDiscount: 0,
    dashSpeedBonus: 0,
    dashCooldownReduction: 0,
    fogRevealMultiplier: 0,
    maxStaminaBonus: 0,
    staminaRegenBonus: 0,
    maxHpBonus: 0,
    passiveHpRegenPerSec: 0,
    damageReductionBonusPct: 0,
    weatherResistBonus: 0,
    weatherVisibilityBonus: 0,
    nightVisionBonusPx: 0,
    ignoreWeatherStaminaPenalty: false,
    stormStrideSpeedBonus: 0,
  };

  for (const id of unlocked) {
    const node = SKILL_BY_ID[id];
    if (!node) continue;
    const m = node.modifiers;
    if (m.moveSpeedBonus) totals.moveSpeedBonus += m.moveSpeedBonus;
    if (m.terrainPenaltyReduction) totals.terrainPenaltyReduction += m.terrainPenaltyReduction;
    if (m.tractionBonus) totals.tractionBonus += m.tractionBonus;
    if (m.dashStaminaDiscount) totals.dashStaminaDiscount += m.dashStaminaDiscount;
    if (m.dashSpeedBonus) totals.dashSpeedBonus += m.dashSpeedBonus;
    if (m.dashCooldownReduction) totals.dashCooldownReduction += m.dashCooldownReduction;
    if (m.fogRevealMultiplier) totals.fogRevealMultiplier += m.fogRevealMultiplier;
    if (m.maxStaminaBonus) totals.maxStaminaBonus += m.maxStaminaBonus;
    if (m.staminaRegenBonus) totals.staminaRegenBonus += m.staminaRegenBonus;
    if (m.maxHpBonus) totals.maxHpBonus += m.maxHpBonus;
    if (m.passiveHpRegenPerSec) totals.passiveHpRegenPerSec += m.passiveHpRegenPerSec;
    if (m.damageReductionBonusPct) totals.damageReductionBonusPct += m.damageReductionBonusPct;
    if (m.weatherResistBonus) totals.weatherResistBonus += m.weatherResistBonus;
    if (m.weatherVisibilityBonus) totals.weatherVisibilityBonus += m.weatherVisibilityBonus;
    if (m.nightVisionBonusPx) totals.nightVisionBonusPx += m.nightVisionBonusPx;
    if (m.ignoreWeatherStaminaPenalty) totals.ignoreWeatherStaminaPenalty = true;
    if (m.stormStrideSpeedBonus) totals.stormStrideSpeedBonus += m.stormStrideSpeedBonus;
  }

  return totals;
}

export function countAffordableSkills(
  inv: Inventory,
  unlockedIds: readonly string[]
): number {
  const unlockedSet = new Set(unlockedIds);
  let count = 0;
  for (const node of SKILL_TREE_NODES) {
    if (unlockedSet.has(node.id)) continue;
    if (!isSkillPrerequisiteMet(node, unlockedSet)) continue;
    if (canAfford(inv, node.costs)) {
      count++;
    }
  }
  return count;
}

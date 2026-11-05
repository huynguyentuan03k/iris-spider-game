import { REGION_LABELS } from './biodiversity';
import { Inventory, PlayerEquipment, ResourceId, StructureKind } from './types';

export { REGION_LABELS as BIOME_LABELS };

export interface ResourceMeta {
  id: ResourceId;
  name: string;
  shortName: string;
  color: string;
}

export const RESOURCE_META: Record<ResourceId, ResourceMeta> = {
  wood: { id: 'wood', name: 'Gỗ Tự Nhiên', shortName: 'Gỗ', color: '#c88a4b' },
  stone: { id: 'stone', name: 'Đá Trầm Tích', shortName: 'Đá', color: '#94a3b8' },
  iron: { id: 'iron', name: 'Quặng Sắt', shortName: 'Sắt', color: '#cbd5e1' },
  crystal: { id: 'crystal', name: 'Khoáng Thạch Tinh Thể', shortName: 'Tinh Thể', color: '#38bdf8' },
  berry: { id: 'berry', name: 'Trái Cây & Thực Vật', shortName: 'Trái Cây', color: '#fb7185' },
  bioSample: { id: 'bioSample', name: 'Mẫu Vi Sinh & Côn Trùng', shortName: 'Mẫu Vi Sinh', color: '#a3e635' },
  potion: { id: 'potion', name: 'Kháng Sinh Tự Nhiên', shortName: 'Dược Thảo', color: '#34d399' },
};

export type CraftCategory = 'weapon' | 'tool' | 'armor' | 'refining';

export type RecipeIconKind =
  | 'sword_iron'
  | 'sword_crystal'
  | 'sword_storm'
  | 'sword_biosphere'
  | 'tool_alloy'
  | 'tool_crystal'
  | 'tool_bio'
  | 'armor_stone'
  | 'armor_iron'
  | 'armor_crystal'
  | 'armor_biosphere'
  | 'refine_iron'
  | 'refine_crystal'
  | 'potion_bio'
  | 'potion_herb';

export interface CraftRecipe {
  id: string;
  category: CraftCategory;
  tierLabel: string;
  targetTier?: number;
  iconKind: RecipeIconKind;
  accentColor: string;
  name: string;
  description: string;
  specialPerk: string;
  outputLabel: string;
  costs: Partial<Record<ResourceId, number>>;
  isAvailable: (eq: PlayerEquipment) => boolean;
  isMaxed?: (eq: PlayerEquipment) => boolean;
  applyUpgrade?: (eq: PlayerEquipment, inv: Inventory) => { maxHpBonus: number };
}

export const SWORD_NAMES: Record<number, string> = {
  1: 'Đoản Kiếm Thám Hiểm',
  2: 'Trường Kiếm Thạch Thiết',
  3: 'Kiếm Tinh Thể Địa Mạch',
  4: 'Đại Kiếm Tinh Thể Lôi Quang',
  5: 'Thánh Kiếm Sinh Quyển',
};

export const SWORD_DAMAGE: number[] = [0, 16, 26, 40, 56, 74];
export const SWORD_REACH: number[] = [0, 63, 68, 73, 78, 83];

export const SPEAR_NAMES: Record<number, string> = {
  0: 'Không có',
  1: 'Giáo Gỗ Thô',
  2: 'Giáo Sắt',
  3: 'Giáo Tinh Thể',
  4: 'Giáo Lôi Quang',
  5: 'Giáo Sinh Quyển',
};

export const SPEAR_DAMAGE: number[] = [0, 12, 20, 32, 45, 60];
export const SPEAR_REACH: number[] = [0, 90, 100, 110, 120, 130];

export const SHIELD_NAMES: Record<number, string> = {
  0: 'Không có',
  1: 'Khiên Gỗ',
  2: 'Khiên Sắt',
  3: 'Khiên Tinh Thể',
  4: 'Khiên Lôi Quang',
  5: 'Khiên Sinh Quyển',
};


export const SHIELD_DEFENSE: number[] = [0, 0.1, 0.2, 0.35, 0.5, 0.7];

export const UPGRADE_TYPES: { id: string; label: string; icon: string }[] = [
  { id: 'durability', label: 'Độ Bền (+10%)', icon: '🛡️' },
  { id: 'attackSpeed', label: 'Tốc Độ (+5%)', icon: '⚡' },
  { id: 'elementalFire', label: 'Sát Thương Lửa (+5)', icon: '🔥' },
  { id: 'elementalIce', label: 'Sát Thương Băng (+5)', icon: '❄️' },
  { id: 'elementalPoison', label: 'Sát Thương Độc (+5)', icon: '🧪' },
  { id: 'elementalElectric', label: 'Sát Thương Điện (+5)', icon: '⚡' },
];

export const TOOL_NAMES: Record<number, string> = {
  1: 'Rìu Cuốc Thạch Khí',
  2: 'Bộ Khai Khoáng Đá Cứng',
  3: 'Búa Rìu Tinh Thể Cộng Hưởng',
  4: 'Lưỡi Cắt Tinh Thể Sinh Học',
};

export const TOOL_POWER: number[] = [0, 18, 32, 48, 68];
export const TOOL_YIELD_BONUS: number[] = [0, 0, 1, 2, 3];

export const ARMOR_NAMES: Record<number, string> = {
  0: 'Áo Khoác Khảo Thực Địa',
  1: 'Giáp Gỗ Đá Đa Địa Hình',
  2: 'Giáp Thiết Thạch Kiên Cố',
  3: 'Giáp Tinh Thể Kháng Bão',
  4: 'Giáp Sinh Quyển Vĩnh Cửu',
};

export const ARMOR_HP_BONUS: number[] = [0, 30, 70, 120, 180];
export const ARMOR_DAMAGE_REDUCTION_PCT: number[] = [0, 15, 26, 36, 46];
export const ARMOR_WEATHER_RESIST: number[] = [0, 0.2, 0.35, 0.6, 0.8];

export const CRAFT_RECIPES: CraftRecipe[] = [
  // =========================================================================
  // 1. VŨ KHÍ (WEAPONS: BẬC II -> BẬC V)
  // =========================================================================
  {
    id: 'sword_2',
    category: 'weapon',
    tierLabel: 'Bậc II',
    targetTier: 2,
    iconKind: 'sword_iron',
    accentColor: '#93c5fd',
    name: 'Trường Kiếm Thạch Thiết',
    description: 'Kết hợp cán gỗ cứng, đá mài sắc và quặng sắt rèn thành lưỡi kiếm dài bền bỉ.',
    specialPerk: 'Mở rộng tầm chém cận chiến lên 68px',
    outputLabel: 'Vũ khí chính · 26 Sát thương',
    costs: { wood: 8, stone: 10, iron: 4 },
    isAvailable: (eq) => eq.swordTier < 2,
    isMaxed: (eq) => eq.swordTier >= 2,
    applyUpgrade: (eq) => {
      eq.swordTier = Math.max(eq.swordTier, 2);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'sword_3',
    category: 'weapon',
    tierLabel: 'Bậc III',
    targetTier: 3,
    iconKind: 'sword_crystal',
    accentColor: '#38bdf8',
    name: 'Kiếm Tinh Thể Địa Mạch',
    description: 'Dung hợp trực tiếp gỗ cổ thụ, đá trầm tích và tinh thể lam để dẫn truyền xung năng lượng.',
    specialPerk: 'Đòn liên hoàn thứ 3 phóng sóng kiếm tinh thể tầm xa',
    outputLabel: 'Vũ khí tinh thể · 40 Sát thương',
    costs: { wood: 10, stone: 10, crystal: 6 },
    isAvailable: (eq) => eq.swordTier < 3,
    isMaxed: (eq) => eq.swordTier >= 3,
    applyUpgrade: (eq) => {
      eq.swordTier = Math.max(eq.swordTier, 3);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'sword_4',
    category: 'weapon',
    tierLabel: 'Bậc IV',
    targetTier: 4,
    iconKind: 'sword_storm',
    accentColor: '#c084fc',
    name: 'Đại Kiếm Tinh Thể Lôi Quang',
    description: 'Gia cố lõi tinh thể kép trên khung đá sắt nặng, chém xuyên lớp giáp dày của thú săn mồi.',
    specialPerk: 'Sóng tinh thể phóng ra xuyên thấu nhiều mục tiêu liên tiếp',
    outputLabel: 'Vũ khí cao cấp · 56 Sát thương',
    costs: { wood: 12, stone: 14, iron: 8, crystal: 10 },
    isAvailable: (eq) => eq.swordTier < 4,
    isMaxed: (eq) => eq.swordTier >= 4,
    applyUpgrade: (eq) => {
      eq.swordTier = Math.max(eq.swordTier, 4);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'spear_1',
    category: 'weapon',
    tierLabel: 'Bậc I',
    targetTier: 1,
    iconKind: 'sword_iron',
    accentColor: '#d6b265',
    name: 'Giáo Gỗ Thô',
    description: 'Một cành cây cứng được vót nhọn, gia cố bằng đá thô. Dùng để tấn công từ xa.',
    specialPerk: 'Tầm đánh xa hơn kiếm',
    outputLabel: 'Vũ khí tầm xa · 12 Sát thương',
    costs: { wood: 6, stone: 2 },
    isAvailable: (eq) => eq.spearTier < 1,
    isMaxed: (eq) => eq.spearTier >= 1,
    applyUpgrade: (eq) => {
      eq.spearTier = Math.max(eq.spearTier, 1);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'shield_1',
    category: 'weapon',
    tierLabel: 'Bậc I',
    targetTier: 1,
    iconKind: 'armor_stone',
    accentColor: '#94a3b8',
    name: 'Khiên Gỗ',
    description: 'Tấm ván gỗ dày giúp chặn đứng các đòn tấn công cơ bản từ thú săn mồi.',
    specialPerk: 'Giảm sát thương khi bị tấn công',
    outputLabel: 'Vũ khí phòng thủ · 10% Giảm sát thương',
    costs: { wood: 8, stone: 4 },
    isAvailable: (eq) => eq.shieldTier < 1,
    isMaxed: (eq) => eq.shieldTier >= 1,
    applyUpgrade: (eq) => {
      eq.shieldTier = Math.max(eq.shieldTier, 1);
      return { maxHpBonus: 0 };
    },
  },

  {
    id: 'sword_5',
    category: 'weapon',
    tierLabel: 'Bậc V',
    targetTier: 5,
    iconKind: 'sword_biosphere',
    accentColor: '#a3e635',
    name: 'Thánh Kiếm Sinh Quyển',
    description: 'Tuyệt tác kết hợp gỗ đại ngàn, đá núi cao, tinh thể thuần khiết và hoạt chất vi sinh phát quang.',
    specialPerk: 'Đòn thứ 3 phóng 3 luồng sóng sinh quyển hình quạt xuyên thấu',
    outputLabel: 'Vũ khí tối thượng · 74 Sát thương',
    costs: { wood: 10, stone: 12, crystal: 14, bioSample: 10 },
    isAvailable: (eq) => eq.swordTier < 5,
    isMaxed: (eq) => eq.swordTier >= 5,
    applyUpgrade: (eq) => {
      eq.swordTier = Math.max(eq.swordTier, 5);
      return { maxHpBonus: 0 };
    },
  },

  // =========================================================================
  // 2. CÔNG CỤ KHAI THÁC (TOOLS: BẬC II -> BẬC IV)
  // =========================================================================
  {
    id: 'tool_2',
    category: 'tool',
    tierLabel: 'Bậc II',
    targetTier: 2,
    iconKind: 'tool_alloy',
    accentColor: '#cbd5e1',
    name: 'Bộ Khai Khoáng Đá Cứng',
    description: 'Cán gỗ dẻo kết hợp lưỡi búa đá sắt giúp đốn gỗ, đập tảng đá và mạch quặng nhanh vượt trội.',
    specialPerk: 'Tăng +1 sản lượng nguyên liệu mỗi lần thu hoạch',
    outputLabel: 'Công cụ · Sức phá 32 (+1 Sản lượng)',
    costs: { wood: 8, stone: 12, iron: 3 },
    isAvailable: (eq) => eq.toolTier < 2,
    isMaxed: (eq) => eq.toolTier >= 2,
    applyUpgrade: (eq) => {
      eq.toolTier = Math.max(eq.toolTier, 2);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'tool_3',
    category: 'tool',
    tierLabel: 'Bậc III',
    targetTier: 3,
    iconKind: 'tool_crystal',
    accentColor: '#38bdf8',
    name: 'Búa Rìu Tinh Thể Cộng Hưởng',
    description: 'Ghép mũi tinh thể sắc bén lên thân gỗ đá giúp tách vỉa khoáng thạch chỉ với vài nhát bổ.',
    specialPerk: 'Tăng +2 sản lượng nguyên liệu mỗi lần thu hoạch',
    outputLabel: 'Công cụ tinh thể · Sức phá 48 (+2 Sản lượng)',
    costs: { wood: 8, stone: 10, crystal: 6 },
    isAvailable: (eq) => eq.toolTier < 3,
    isMaxed: (eq) => eq.toolTier >= 3,
    applyUpgrade: (eq) => {
      eq.toolTier = Math.max(eq.toolTier, 3);
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'tool_4',
    category: 'tool',
    tierLabel: 'Bậc IV',
    targetTier: 4,
    iconKind: 'tool_bio',
    accentColor: '#a3e635',
    name: 'Lưỡi Cắt Tinh Thể Sinh Học',
    description: 'Ứng dụng enzyme phân giải khoáng và mũi cắt tinh thể cho tốc độ khai thác tối đa.',
    specialPerk: 'Tăng +3 sản lượng nguyên liệu & thu mẫu cực nhanh',
    outputLabel: 'Công cụ tối thượng · Sức phá 68 (+3 Sản lượng)',
    costs: { wood: 10, stone: 12, crystal: 10, bioSample: 6 },
    isAvailable: (eq) => eq.toolTier < 4,
    isMaxed: (eq) => eq.toolTier >= 4,
    applyUpgrade: (eq) => {
      eq.toolTier = Math.max(eq.toolTier, 4);
      return { maxHpBonus: 0 };
    },
  },

  // =========================================================================
  // 3. GIÁP BẢO HỘ & KHÁNG THỜI TIẾT (ARMOR: BẬC I -> BẬC IV)
  // =========================================================================
  {
    id: 'armor_1',
    category: 'armor',
    tierLabel: 'Bậc I',
    targetTier: 1,
    iconKind: 'armor_stone',
    accentColor: '#d6b265',
    name: 'Giáp Gỗ Đá Đa Địa Hình',
    description: 'Tấm chắn ngực bằng thớ gỗ ép và phiến đá mỏng, chế tạo dễ dàng ngay từ nguyên liệu thô.',
    specialPerk: 'Giảm 20% lực cản tốc độ khi gặp mưa, sương mù hoặc bão',
    outputLabel: 'Giáp nhẹ · Tổng +30 HP · Giảm 15% sát thương',
    costs: { wood: 6, stone: 8 },
    isAvailable: (eq) => eq.armorTier < 1,
    isMaxed: (eq) => eq.armorTier >= 1,
    applyUpgrade: (eq) => {
      const prevBonus = ARMOR_HP_BONUS[eq.armorTier] || 0;
      eq.armorTier = Math.max(eq.armorTier, 1);
      return { maxHpBonus: ARMOR_HP_BONUS[eq.armorTier] - prevBonus };
    },
  },
  {
    id: 'armor_2',
    category: 'armor',
    tierLabel: 'Bậc II',
    targetTier: 2,
    iconKind: 'armor_iron',
    accentColor: '#94a3b8',
    name: 'Giáp Thiết Thạch Kiên Cố',
    description: 'Khung sắt đúc lót gỗ và đá phiến bảo vệ toàn diện trước thú săn mồi ở rừng mưa và núi đá.',
    specialPerk: 'Giảm 35% lực cản di chuyển và hao thể lực do thời tiết xấu',
    outputLabel: 'Giáp trung · Tổng +70 HP · Giảm 26% sát thương',
    costs: { wood: 8, stone: 10, iron: 6 },
    isAvailable: (eq) => eq.armorTier < 2,
    isMaxed: (eq) => eq.armorTier >= 2,
    applyUpgrade: (eq) => {
      const prevBonus = ARMOR_HP_BONUS[eq.armorTier] || 0;
      eq.armorTier = Math.max(eq.armorTier, 2);
      return { maxHpBonus: ARMOR_HP_BONUS[eq.armorTier] - prevBonus };
    },
  },
  {
    id: 'armor_3',
    category: 'armor',
    tierLabel: 'Bậc III',
    targetTier: 3,
    iconKind: 'armor_crystal',
    accentColor: '#38bdf8',
    name: 'Giáp Tinh Thể Kháng Bão',
    description: 'Kết hợp gỗ giữ nhiệt, đá cách âm và mạng tinh thể tỏa nhiệt chống chọi bão tuyết, bão cát.',
    specialPerk: 'Kháng 60% hiệu ứng làm chậm & gió đẩy của Bão Tuyết / Bão Cát / Mưa',
    outputLabel: 'Giáp tinh thể · Tổng +120 HP · Giảm 36% sát thương',
    costs: { wood: 10, stone: 12, crystal: 6 },
    isAvailable: (eq) => eq.armorTier < 3,
    isMaxed: (eq) => eq.armorTier >= 3,
    applyUpgrade: (eq) => {
      const prevBonus = ARMOR_HP_BONUS[eq.armorTier] || 0;
      eq.armorTier = Math.max(eq.armorTier, 3);
      return { maxHpBonus: ARMOR_HP_BONUS[eq.armorTier] - prevBonus };
    },
  },
  {
    id: 'armor_4',
    category: 'armor',
    tierLabel: 'Bậc IV',
    targetTier: 4,
    iconKind: 'armor_biosphere',
    accentColor: '#34d399',
    name: 'Giáp Sinh Quyển Vĩnh Cửu',
    description: 'Lớp giáp đỉnh cao tích hợp màng vi khuẩn Deinococcus chịu bức xạ và tinh thể địa nhiệt.',
    specialPerk: 'Kháng 80% mọi cản trở thời tiết khắc nghiệt trên toàn lục địa',
    outputLabel: 'Giáp tối thượng · Tổng +180 HP · Giảm 46% sát thương',
    costs: { wood: 10, stone: 14, crystal: 10, bioSample: 8 },
    isAvailable: (eq) => eq.armorTier < 4,
    isMaxed: (eq) => eq.armorTier >= 4,
    applyUpgrade: (eq) => {
      const prevBonus = ARMOR_HP_BONUS[eq.armorTier] || 0;
      eq.armorTier = Math.max(eq.armorTier, 4);
      return { maxHpBonus: ARMOR_HP_BONUS[eq.armorTier] - prevBonus };
    },
  },

  // =========================================================================
  // 4. LUYỆN KIM NGUYÊN LIỆU THÔ & DƯỢC PHẨM (REFINING & ALCHEMY)
  // =========================================================================
  {
    id: 'refine_iron',
    category: 'refining',
    tierLabel: 'Luyện Kim',
    iconKind: 'refine_iron',
    accentColor: '#cbd5e1',
    name: 'Nung Luyện Quặng Sắt (+2 Sắt)',
    description: 'Đốt than gỗ tự nhiên ở nhiệt độ cao để tách lọc sắt nguyên chất từ đá trầm tích giàu khoáng.',
    specialPerk: 'Chuyển hóa Gỗ + Đá dư thừa thành Quặng Sắt rèn trang bị',
    outputLabel: 'Nhận ngay +2 Quặng Sắt',
    costs: { wood: 5, stone: 7 },
    isAvailable: () => true,
    applyUpgrade: (_eq, inv) => {
      inv.iron += 2;
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'refine_crystal',
    category: 'refining',
    tierLabel: 'Kết Tinh',
    iconKind: 'refine_crystal',
    accentColor: '#38bdf8',
    name: 'Kết Tinh Khoáng Thạch (+2 Tinh Thể)',
    description: 'Nung ép gỗ, đá trầm tích và mạt sắt dưới áp suất cao để tổng hợp tinh thể lam tinh khiết.',
    specialPerk: 'Tổng hợp Khoáng Thạch Tinh Thể ngay từ nguyên liệu thô',
    outputLabel: 'Nhận ngay +2 Tinh Thể',
    costs: { wood: 6, stone: 10, iron: 3 },
    isAvailable: () => true,
    applyUpgrade: (_eq, inv) => {
      inv.crystal += 2;
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'antibiotic_streptomyces',
    category: 'refining',
    tierLabel: 'Dược Phẩm',
    iconKind: 'potion_bio',
    accentColor: '#34d399',
    name: 'Dược Thảo Kháng Sinh (+1 Dược Thảo)',
    description: 'Chiết xuất từ xạ khuẩn Streptomyces rừng mưa và trái cây giúp hồi nhanh 60 HP (Phím 4 / Q).',
    specialPerk: 'Hồi phục lập tức +60 HP trong giao chiến',
    outputLabel: 'Nhận +1 Dược Thảo (+60 HP)',
    costs: { berry: 2, bioSample: 2 },
    isAvailable: () => true,
    applyUpgrade: (_eq, inv) => {
      inv.potion += 1;
      return { maxHpBonus: 0 };
    },
  },
  {
    id: 'herbal_salve',
    category: 'refining',
    tierLabel: 'Dược Phẩm',
    iconKind: 'potion_herb',
    accentColor: '#fb7185',
    name: 'Thuốc Sơ Cứu Thảo Mộc (+1 Dược Thảo)',
    description: 'Chưng cất nhựa gỗ ấm và trái cây tự nhiên thành bình dược thảo dự phòng.',
    specialPerk: 'Điều chế thuốc hồi 60 HP không tốn Mẫu Vi Sinh',
    outputLabel: 'Nhận +1 Dược Thảo (+60 HP)',
    costs: { wood: 2, berry: 5 },
    isAvailable: () => true,
    applyUpgrade: (_eq, inv) => {
      inv.potion += 1;
      return { maxHpBonus: 0 };
    },
  },
];

export type StructureCategory = 'UTILITY' | 'DEFENSE' | 'FOUNDATION';

export interface BuildableStructureSpec {
  id: string;
  kind: StructureKind;
  category: StructureCategory;
  categoryLabel: string;
  name: string;
  shortDesc: string;
  specialPerk: string;
  costs: Partial<Record<ResourceId, number>>;
  iconSymbol: string;
  accentColor: string;
  hp: number;
}

export const ALL_BUILDABLE_STRUCTURES: BuildableStructureSpec[] = [
  // --- UTILITY & STORAGE ---
  {
    id: 'food_preserver',
    kind: StructureKind.FOOD_PRESERVER,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Thùng Bảo Quản Thực Địa',
    shortDesc: 'Khí lạnh bảo quản Trái Cây & Mẫu Vi Sinh không bị phân hủy',
    specialPerk: 'Khả năng cất giữ đồ đạc an toàn 100% không lo ôi hỏng',
    costs: { wood: 6, stone: 4, iron: 1 },
    iconSymbol: '❄️',
    accentColor: '#38bdf8',
    hp: 240,
  },
  {
    id: 'campfire',
    kind: StructureKind.CAMPFIRE,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Lửa Trại Dã Ngoại',
    shortDesc: 'Sưởi ấm chống Bão Tuyết, hồi sinh lực & tạo điểm Dịch Chuyển',
    specialPerk: 'Xua tan khí lạnh subzero & hồi HP chậm cho người chơi',
    costs: { wood: 8, stone: 4 },
    iconSymbol: '🔥',
    accentColor: '#f97316',
    hp: 200,
  },
  {
    id: 'bio_lantern',
    kind: StructureKind.BIO_LANTERN,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Đèn Phát Quang Vibrio',
    shortDesc: 'Nuôi vi khuẩn Vibrio fischeri chiếu sáng & xua tan sương mù',
    specialPerk: 'Tăng tầm nhìn ban đêm & đẩy lùi bóng tối dày đặc',
    costs: { wood: 4, stone: 2, bioSample: 2 },
    iconSymbol: '💡',
    accentColor: '#2dd4bf',
    hp: 180,
  },
  {
    id: 'research_tent',
    kind: StructureKind.RESEARCH_TENT,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Lều Dã Ngoại Sinh Quyển',
    shortDesc: 'Trạm lưu trú viễn chinh cao cấp giúp bảo quản thực phẩm & nghỉ ngơi',
    specialPerk: 'Phục hồi sinh lực nhanh & tự động phân tích sinh vật xung quanh',
    costs: { wood: 12, stone: 8, bioSample: 3 },
    iconSymbol: '⛺',
    accentColor: '#a3e635',
    hp: 380,
  },
  {
    id: 'rain_collector',
    kind: StructureKind.RAIN_COLLECTOR,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Tháp Thu Nước Mưa & Sương',
    shortDesc: 'Tự động tích tụ giọt sương & nước mưa tinh khiết khi trời mưa/sương mù',
    specialPerk: 'Tự động ngưng tụ Trái cây/Dược thảo [Nhấn E thu hoạch]',
    costs: { wood: 8, stone: 6, iron: 2 },
    iconSymbol: '🌧️',
    accentColor: '#60a5fa',
    hp: 260,
  },
  {
    id: 'repair_station',
    kind: StructureKind.REPAIR_STATION,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Trạm Bảo Trì Công Trình',
    shortDesc: 'Phát sóng bảo dưỡng giúp tự động phục hồi máu cho các công trình lân cận',
    specialPerk: 'Hồi 15 HP/giây cho tất cả tường & công trình quanh căn cứ',
    costs: { wood: 10, stone: 10, iron: 4, crystal: 1 },
    iconSymbol: '🔧',
    accentColor: '#facc15',
    hp: 420,
  },

  // --- WALLS & DEFENSIVE STRUCTURES ---
  {
    id: 'wood_wall',
    kind: StructureKind.WOOD_WALL,
    category: 'DEFENSE',
    categoryLabel: 'Tường & Phòng Thủ',
    name: 'Tường Gỗ Phòng Thủ',
    shortDesc: 'Rào chắn gỗ kiên cố ngăn chặn hoàn toàn thú dữ & quái vật đột nhập',
    specialPerk: 'Vật cản vật lý cứng vững (HP 350) bảo vệ khu vực lưu trú',
    costs: { wood: 6 },
    iconSymbol: '🪵',
    accentColor: '#d97706',
    hp: 350,
  },
  {
    id: 'stone_wall',
    kind: StructureKind.STONE_WALL,
    category: 'DEFENSE',
    categoryLabel: 'Tường & Phòng Thủ',
    name: 'Tường Đá Thạch Thiết',
    shortDesc: 'Bức tường đá kiên cố hạng nặng chịu lực va đập cực cao từ mãnh thú',
    specialPerk: 'Khả năng chịu đựng vượt trội (HP 750) trước các cú húc của Titan & Gấu',
    costs: { stone: 8, iron: 1 },
    iconSymbol: '🧱',
    accentColor: '#94a3b8',
    hp: 750,
  },
  {
    id: 'spike_trap',
    kind: StructureKind.SPIKE_TRAP,
    category: 'DEFENSE',
    categoryLabel: 'Tường & Phòng Thủ',
    name: 'Bẫy Chông Nanh Thạch',
    shortDesc: 'Chông nhọn phản đòn gây sát thương lớn khi dã thú giẫm vào chu vi căn cứ',
    specialPerk: 'Phản đòn 45 sát thương lên dã thú tấn công tường hoặc vượt qua',
    costs: { wood: 4, stone: 4, iron: 1 },
    iconSymbol: '🪤',
    accentColor: '#ef4444',
    hp: 220,
  },

  // --- FOUNDATION FLOORS ---
  {
    id: 'wood_floor',
    kind: StructureKind.WOOD_FLOOR,
    category: 'FOUNDATION',
    categoryLabel: 'Sàn & Nền Móng',
    name: 'Sàn Gỗ Dã Ngoại',
    shortDesc: 'Lát nền gỗ sạch sẽ giúp tăng 20% tốc độ di chuyển và loại bỏ lầy bãi',
    specialPerk: 'Tăng 20% tốc độ di chuyển khi bước đi trên nền sàn gỗ',
    costs: { wood: 4 },
    iconSymbol: '🟫',
    accentColor: '#b45309',
    hp: 280,
  },
  {
    id: 'stone_floor',
    kind: StructureKind.STONE_FLOOR,
    category: 'FOUNDATION',
    categoryLabel: 'Sàn & Nền Móng',
    name: 'Sàn Đá Lát Địa Cầu',
    shortDesc: 'Lát đá bằng phẳng cao cấp tăng 30% tốc độ di chuyển & kháng hoàn toàn trơn trượt',
    specialPerk: 'Tăng 30% tốc độ chạy & triệt tiêu mọi hiệu ứng sa lầy do bão mưa',
    costs: { stone: 6 },
    iconSymbol: '⬜',
    accentColor: '#cbd5e1',
    hp: 550,
  },
  {
    id: 'upgrade_bench',
    kind: StructureKind.UPGRADE_BENCH,
    category: 'UTILITY',
    categoryLabel: 'Bảo Quản & Tiện Ích',
    name: 'Bàn Nâng Cấp Vũ Khí',
    shortDesc: 'Tổ hợp công cụ tinh luyện cho phép tăng cường thuộc tính vũ khí',
    specialPerk: 'Nâng cấp Độ bền, Tốc độ đánh & Sát thương nguyên tố',
    costs: { wood: 10, stone: 10, iron: 5, crystal: 5 },
    iconSymbol: '🛠️',
    accentColor: '#a3e635',
    hp: 300,
  },
];

export interface BuildableSlot {
  slotIndex: number;
  kind: StructureKind;
  name: string;
  shortDesc: string;
  costs: Partial<Record<ResourceId, number>>;
}

export const BUILDABLE_SLOTS: BuildableSlot[] = ALL_BUILDABLE_STRUCTURES.map((spec, idx) => ({
  slotIndex: 4 + idx,
  kind: spec.kind,
  name: spec.name,
  shortDesc: spec.shortDesc,
  costs: spec.costs,
}));

export function canAfford(inv: Inventory, costs: Partial<Record<ResourceId, number>>): boolean {
  for (const [key, amount] of Object.entries(costs)) {
    if ((inv[key as ResourceId] || 0) < (amount || 0)) return false;
  }
  return true;
}

export function spendCosts(inv: Inventory, costs: Partial<Record<ResourceId, number>>): void {
  for (const [key, amount] of Object.entries(costs)) {
    inv[key as ResourceId] = Math.max(0, (inv[key as ResourceId] || 0) - (amount || 0));
  }
}

export function countAffordableUpgrades(inv: Inventory, eq: PlayerEquipment): number {
  let count = 0;
  for (const r of CRAFT_RECIPES) {
    if (r.category === 'refining') continue;
    const maxed = r.isMaxed ? r.isMaxed(eq) : false;
    if (!maxed && r.isAvailable(eq) && canAfford(inv, r.costs)) {
      count++;
    }
  }
  return count;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterAppearance {
  name: string;
  color: string;
  skinColor: string;
  hairStyle: 'cap' | 'hood' | 'ponytail' | 'wild' | 'short' | 'wizard' | 'crown';
  hairColor: string;
  outfitStyle: 'explorer' | 'botanist' | 'guardian' | 'shaman' | 'ranger';
}

export const DEFAULT_CHARACTER: CharacterAppearance = {
  name: 'Nhà Thám Hiểm',
  color: '#38bdf8', // Lam Biển Tinh Khôi
  skinColor: '#fde68a', // Da Sáng Ấm Áp
  hairStyle: 'cap', // Mũ Thám Hiểm
  hairColor: '#475569', // Tóc Xám Than
  outfitStyle: 'explorer', // Nhà Thám Hiểm
};

export const OUTFIT_COLORS = [
  { hex: '#38bdf8', name: 'Lam Biển Tinh Khôi', desc: 'Sáng như bầu trời và biển cả' },
  { hex: '#10b981', name: 'Lục Bảo Rừng Rậm', desc: 'Hài hòa với cây cỏ và sinh quyển' },
  { hex: '#f59e0b', name: 'Hổ Phách Mặt Trời', desc: 'Ấm áp rực rỡ như bình minh' },
  { hex: '#f43f5e', name: 'Huyết Hồng Liều Lĩnh', desc: 'Mạnh mẽ, quả cảm trong hiểm nguy' },
  { hex: '#a855f7', name: 'Tím Huyền Bí', desc: 'Thần bí như tinh thể cổ đại' },
  { hex: '#06b6d4', name: 'Băng Tuyết Lam', desc: 'Thanh khiết như băng hà cực bắc' },
  { hex: '#ec4899', name: 'Anh Đào Mộng Mơ', desc: 'Ngọt ngào như hoa rừng nở rộ' },
  { hex: '#e2e8f0', name: 'Bạch Kim Hiệp Sĩ', desc: 'Cao quý và vững chãi' },
  { hex: '#334155', name: 'Dạ Hành Bóng Tối', desc: 'Bí ẩn như bóng đêm rừng thẳm' },
  { hex: '#84cc16', name: 'Mầm Xanh Sự Sống', desc: 'Tràn đầy sinh khí diệp lục' },
];

export const SKIN_COLORS = [
  { hex: '#fde68a', name: 'Sáng Ấm' },
  { hex: '#fbcfe8', name: 'Hồng Hào' },
  { hex: '#f5d0a6', name: 'Tự Nhiên' },
  { hex: '#d97706', name: 'Nắng Gắt' },
  { hex: '#92400e', name: 'Nâu Trầm' },
  { hex: '#78350f', name: 'Gỗ Mun' },
  { hex: '#67e8f9', name: 'Huyền Bí' },
];

export const HAIR_STYLES: { id: CharacterAppearance['hairStyle']; name: string; desc: string; icon: string }[] = [
  { id: 'cap', name: 'Mũ Thám Hiểm', desc: 'Mũ lưỡi trai phong trần có đính lông chim thám hiểm', icon: '🧢' },
  { id: 'hood', name: 'Mũ Trùm Lữ Khách', desc: 'Áo choàng trùm đầu lãng du cản gió bão', icon: '🧣' },
  { id: 'ponytail', name: 'Tóc Đuôi Ngựa', desc: 'Gọn gàng năng động, tung bay khi chạy', icon: '👱' },
  { id: 'wild', name: 'Tóc Bồng Lãng Tử', desc: 'Phóng khoáng, tự do như ngọn gió rừng', icon: '🦁' },
  { id: 'short', name: 'Tóc Ngắn Cổ Điển', desc: 'Gọn gàng, chuẩn xác của nhà nghiên cứu', icon: '💇' },
  { id: 'wizard', name: 'Mũ Pháp Sư', desc: 'Mũ chóp nhọn uyên bác của học giả cổ đại', icon: '🧙' },
  { id: 'crown', name: 'Vương Miện Cổ', desc: 'Vòng vương miện gắn ngọc của người dẫn lối', icon: '👑' },
];

export const HAIR_COLORS = [
  { hex: '#1e293b', name: 'Đen Tuyển' },
  { hex: '#78350f', name: 'Nâu Hạt Dẻ' },
  { hex: '#fbbf24', name: 'Vàng Hoàng Kim' },
  { hex: '#ea580c', name: 'Cam Lửa' },
  { hex: '#f1f5f9', name: 'Bạch Ngân' },
  { hex: '#0284c7', name: 'Lam Tinh Thể' },
  { hex: '#10b981', name: 'Ngọc Bích' },
];

export const OUTFIT_CLASSES: { id: CharacterAppearance['outfitStyle']; name: string; title: string; desc: string; perk: string }[] = [
  {
    id: 'explorer',
    name: 'Nhà Thám Hiểm',
    title: 'Người Tiên Phong Sinh Quyển',
    desc: 'Trang bị dây đai túi mẫu vật, la bàn đồng cổ và giày vạn dặm.',
    perk: 'Tầm quan sát rộng, di chuyển nhạy bén trên mọi địa hình.',
  },
  {
    id: 'botanist',
    name: 'Dược Sư Sinh Học',
    title: 'Chuyên Gia Diệp Lục & Mầm Sống',
    desc: 'Khoác áo choàng vi sinh, ống nghiệm chứa dịch sinh học và túi thảo mộc.',
    perk: 'Nhận diện nhanh vi khuẩn và tăng hiệu quả phục hồi sinh lực.',
  },
  {
    id: 'guardian',
    name: 'Dũng Sĩ Hộ Vệ',
    title: 'Khiên Thép Sinh Tồn',
    desc: 'Giáp vai kim loại mạ bạc, thắt lưng chiến binh kiên cố chống chịu thú dữ.',
    perk: 'Giảm sát thương va chạm và giữ vững thể lực khi cận chiến.',
  },
  {
    id: 'shaman',
    name: 'Pháp Sư Tự Nhiên',
    title: 'Sứ Giả Giao Hòa Đất Trời',
    desc: 'Khăn choàng cổ ngữ phù chú, linh cầu ánh sáng vần vũ quanh vai.',
    perk: 'Tỏa hào quang soi sáng ban đêm và cộng hưởng năng lượng sinh quyển.',
  },
  {
    id: 'ranger',
    name: 'Xạ Thủ Rừng Thẳm',
    title: 'Thợ Săn Dấu Vết',
    desc: 'Dây đeo ống tên chéo ngực, bao tay da dẻo dai thích nghi rừng rậm.',
    perk: 'Bước đi êm ái, tiếp cận động vật quý hiếm mà không làm chúng hoảng sợ.',
  },
];

export const RANDOM_NAMES = [
  'Iris', 'Lâm Phong', 'Zephyr', 'Aria', 'Kaelen',
  'Thảo My', 'Bách Tùng', 'Lyra', 'Solomon', 'Maya',
  'Duy Anh', 'Hải Đăng', 'Valen', 'Vân Anh', 'Rowan',
  'Ngọc Linh', 'Phong Lan', 'Huy Hoàng', 'Thiên Ân', 'Tuyết Mai',
  'Atlas', 'Seraphina', 'Minh Triết', 'Kim Ngưu', 'Hải Yến'
];

export function getRandomName(): string {
  const idx = Math.floor(Math.random() * RANDOM_NAMES.length);
  return RANDOM_NAMES[idx];
}

const STORAGE_KEY_PROFILE = 'iris_character_profile';
const STORAGE_KEY_SETUP_DONE = 'iris_character_setup_done';

export function loadCharacterProfile(): CharacterAppearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        name: parsed.name || localStorage.getItem('coop_player_name') || DEFAULT_CHARACTER.name,
        color: parsed.color || localStorage.getItem('coop_player_color') || DEFAULT_CHARACTER.color,
        skinColor: parsed.skinColor || DEFAULT_CHARACTER.skinColor,
        hairStyle: parsed.hairStyle || DEFAULT_CHARACTER.hairStyle,
        hairColor: parsed.hairColor || DEFAULT_CHARACTER.hairColor,
        outfitStyle: parsed.outfitStyle || DEFAULT_CHARACTER.outfitStyle,
      };
    }
  } catch (e) {
    console.warn('Failed to load character profile from localStorage:', e);
  }

  // Fallback to existing coop legacy keys if present
  const legacyName = localStorage.getItem('coop_player_name');
  const legacyColor = localStorage.getItem('coop_player_color');
  return {
    ...DEFAULT_CHARACTER,
    name: legacyName || DEFAULT_CHARACTER.name,
    color: legacyColor || DEFAULT_CHARACTER.color,
  };
}

export function saveCharacterProfile(profile: CharacterAppearance): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    localStorage.setItem('coop_player_name', profile.name);
    localStorage.setItem('coop_player_color', profile.color);
    localStorage.setItem(STORAGE_KEY_SETUP_DONE, 'true');
  } catch (e) {
    console.warn('Failed to save character profile:', e);
  }
}

export function hasCompletedCharacterSetup(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_SETUP_DONE) === 'true';
  } catch {
    return false;
  }
}

export function setCompletedCharacterSetup(done: boolean): void {
  try {
    if (done) {
      localStorage.setItem(STORAGE_KEY_SETUP_DONE, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEY_SETUP_DONE);
    }
  } catch (e) {
    console.warn('Failed to set character setup flag:', e);
  }
}

export interface DrawCharacterSpriteOptions {
  x: number;
  y: number;
  scale?: number;
  facing?: 'left' | 'right';
  appearance: CharacterAppearance;
  anim?: 'idle' | 'walk' | 'attack';
  animTime?: number;
  showNametag?: boolean;
  nametagSubtitle?: string;
  isLocalPlayer?: boolean;
  weaponTier?: number;
  armorTier?: number;
  swingAngle?: number;
  isSwinging?: boolean;
  hitFlash?: boolean;
  glowAura?: boolean;
  shadow?: boolean;
}

/**
 * Unified high-fidelity 2D fantasy character drawer used across:
 * - Character Customizer Live Preview
 * - Private Lobby Hero Showcase
 * - In-Game Local Player
 * - In-Game Multiplayer Allies
 */
export function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  options: DrawCharacterSpriteOptions
): void {
  const {
    x,
    y,
    scale = 1,
    facing = 'right',
    appearance,
    anim = 'idle',
    animTime = 0,
    showNametag = false,
    nametagSubtitle,
    weaponTier = 1,
    armorTier = 0,
    swingAngle = 0,
    isSwinging = false,
    hitFlash = false,
    glowAura = false,
    shadow = true,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const isLeft = facing === 'left';
  const flip = isLeft ? -1 : 1;

  // 1. Soft Shadow
  if (shadow) {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 10, 14, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Radiant Hero Aura (for Private Lobby showcase or Shaman class)
  if (glowAura || appearance.outfitStyle === 'shaman') {
    ctx.save();
    const auraPulse = Math.sin(animTime * 2.5) * 0.12 + 0.88;
    const grad = ctx.createRadialGradient(0, -6, 8, 0, -6, 28 * auraPulse);
    grad.addColorStop(0, `${appearance.color}44`);
    grad.addColorStop(0.6, `${appearance.color}18`);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, -6, 28 * auraPulse, 0, Math.PI * 2);
    ctx.fill();

    // Floating mystical motes
    for (let m = 0; m < 4; m++) {
      const ma = animTime * 1.8 + (m * Math.PI) / 2;
      const mr = 20 + Math.sin(animTime * 3 + m) * 4;
      const mx = Math.cos(ma) * mr;
      const my = -8 + Math.sin(ma) * (mr * 0.45);
      ctx.fillStyle = m % 2 === 0 ? '#fde047' : appearance.color;
      ctx.globalAlpha = 0.65 + Math.sin(animTime * 4 + m) * 0.3;
      ctx.beginPath();
      ctx.arc(mx, my, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Animation Bobbing
  let bobY = 0;
  let legSwing = 0;
  if (anim === 'walk') {
    bobY = Math.abs(Math.sin(animTime * 8)) * 2.5;
    legSwing = Math.sin(animTime * 8) * 3.5;
  } else if (anim === 'idle') {
    bobY = Math.sin(animTime * 2.2) * 0.8;
  }

  // 3. Legs / Boots
  ctx.save();
  ctx.fillStyle = '#1e293b';
  // Left leg
  ctx.fillRect(-6.5, 2 - bobY + legSwing, 4.5, 8);
  // Right leg
  ctx.fillRect(2, 2 - bobY - legSwing, 4.5, 8);
  // Boots bottom trim
  ctx.fillStyle = '#475569';
  ctx.fillRect(-7, 7.5 - bobY + legSwing, 5.5, 2.5);
  ctx.fillRect(1.5, 7.5 - bobY - legSwing, 5.5, 2.5);
  ctx.restore();

  // 4. Weapon attack swing if swinging
  if (isSwinging || anim === 'attack') {
    const tierColors = ['#cbd5e1', '#e2e8f0', '#93c5fd', '#38bdf8', '#c084fc', '#a3e635'];
    const bladeColor = tierColors[weaponTier] || appearance.color;
    const reach = 26 + weaponTier * 2;
    const curAng = swingAngle || (isLeft ? Math.PI : 0);

    ctx.save();
    ctx.strokeStyle = bladeColor;
    ctx.lineWidth = 4.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.arc(0, -6, reach, curAng - 0.8, curAng + 0.8, false);
    ctx.stroke();

    ctx.rotate(curAng);
    ctx.fillStyle = bladeColor;
    ctx.fillRect(6, -2, reach - 6, 4);
    ctx.restore();
  }

  // 5. Body / Torso & Outfit
  ctx.save();
  const bodyY = -3 - bobY;

  // Main Tunic / Coat
  ctx.fillStyle = hitFlash ? '#ffffff' : appearance.color;
  ctx.beginPath();
  ctx.arc(0, bodyY, 12.5, 0, Math.PI * 2);
  ctx.fill();

  // Outer rim / armor outline
  ctx.strokeStyle = armorTier >= 3 ? '#7dd3fc' : armorTier >= 1 ? '#fbbf24' : 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1.6;
  ctx.stroke();

  // Class / Archetype Outfit Flairs
  if (appearance.outfitStyle === 'explorer') {
    // Utility cross-strap + brass compass buckle
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-7 * flip, bodyY - 9);
    ctx.lineTo(6 * flip, bodyY + 7);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, bodyY - 1, 2.8, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.outfitStyle === 'botanist') {
    // Emerald herbal pouch & glass vial
    ctx.fillStyle = '#065f46';
    ctx.fillRect(-7 * flip, bodyY + 1, 5, 5);
    ctx.fillStyle = '#a3e635';
    ctx.beginPath();
    ctx.arc(3 * flip, bodyY + 3, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.outfitStyle === 'guardian') {
    // Steel shoulder pauldrons
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(-9 * flip, bodyY - 5, 4, 3, 0.3 * flip, 0, Math.PI * 2);
    ctx.ellipse(9 * flip, bodyY - 5, 4, 3, -0.3 * flip, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();
  } else if (appearance.outfitStyle === 'shaman') {
    // Mystic glowing talisman on chest
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.moveTo(0, bodyY - 5);
    ctx.lineTo(3.5, bodyY);
    ctx.lineTo(0, bodyY + 5);
    ctx.lineTo(-3.5, bodyY);
    ctx.closePath();
    ctx.fill();
  } else if (appearance.outfitStyle === 'ranger') {
    // Dual hunting straps & green trim
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-6 * flip, bodyY - 8);
    ctx.lineTo(6 * flip, bodyY + 6);
    ctx.moveTo(6 * flip, bodyY - 8);
    ctx.lineTo(-6 * flip, bodyY + 6);
    ctx.stroke();
  }

  // Belt
  ctx.fillStyle = '#334155';
  ctx.fillRect(-9, bodyY + 4, 18, 2.6);
  ctx.fillStyle = '#fde047';
  ctx.fillRect(-2, bodyY + 3.8, 4, 3);
  ctx.restore();

  // 6. Head & Skin
  const headY = -14 - bobY;
  ctx.save();
  ctx.fillStyle = hitFlash ? '#ffffff' : appearance.skinColor;
  ctx.beginPath();
  ctx.arc(0, headY, 8.5, 0, Math.PI * 2);
  ctx.fill();

  // Cute rosy cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.28)';
  ctx.beginPath();
  ctx.arc(-4 * flip, headY + 2.2, 1.8, 0, Math.PI * 2);
  ctx.arc(4 * flip, headY + 2.2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  const eyeShiftX = 2.4 * flip;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(eyeShiftX - 2.2, headY, 1.4, 0, Math.PI * 2);
  ctx.arc(eyeShiftX + 2.2, headY, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeShiftX - 2.6, headY - 0.4, 0.55, 0, Math.PI * 2);
  ctx.arc(eyeShiftX + 1.8, headY - 0.4, 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Hair & Headwear
  ctx.save();
  const hairCol = appearance.hairColor;
  const outfitCol = appearance.color;

  if (appearance.hairStyle === 'cap') {
    // Explorer cap: base hair peeking out, then adventurer peaked cap
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(-2 * flip, headY + 2, 8, Math.PI * 0.7, Math.PI * 1.8, false);
    ctx.fill();

    // Cap crown
    ctx.fillStyle = outfitCol;
    ctx.beginPath();
    ctx.arc(0, headY - 3, 8.8, Math.PI, 0, false);
    ctx.fill();

    // Cap visor brim
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(3.5 * flip, headY - 2, 7, 2.5, 0.15 * flip, 0, Math.PI * 2);
    ctx.fill();

    // Traveler feather on side
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.ellipse(-5 * flip, headY - 7, 1.8, 4.5, -0.4 * flip, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.hairStyle === 'hood') {
    // Traveler Cowl / Hood framing face
    ctx.fillStyle = outfitCol;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.8, 0, Math.PI * 2);
    ctx.fill();

    // Face opening cutout
    ctx.fillStyle = hitFlash ? '#ffffff' : appearance.skinColor;
    ctx.beginPath();
    ctx.ellipse(1.5 * flip, headY + 0.5, 6.5, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Re-draw eyes in hood opening
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeShiftX - 2, headY, 1.4, 0, Math.PI * 2);
    ctx.arc(eyeShiftX + 2, headY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Peeking hair fringe
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.ellipse(1 * flip, headY - 5, 4.5, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.hairStyle === 'ponytail') {
    // Hair base
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.2, Math.PI * 0.85, Math.PI * 2.15, false);
    ctx.fill();

    // Bouncing ponytail on opposite side of facing
    const ponyAngle = -0.5 * flip + Math.sin(animTime * 6) * 0.2;
    ctx.save();
    ctx.translate(-7 * flip, headY - 2);
    ctx.rotate(ponyAngle);
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.ellipse(0, 0, 4.5, 9, 0.3 * flip, 0, Math.PI * 2);
    ctx.fill();
    // Ponytail ribbon
    ctx.fillStyle = outfitCol;
    ctx.beginPath();
    ctx.arc(0, -3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (appearance.hairStyle === 'wild') {
    // Fluffy adventurer spiky locks
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.5, 0, Math.PI * 2);
    ctx.fill();

    // Tuft spikes
    for (let t = -3; t <= 3; t++) {
      const tx = t * 2.8;
      const ty = headY - 9 + Math.abs(t) * 1.2;
      ctx.beginPath();
      ctx.arc(tx, ty, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (appearance.hairStyle === 'short') {
    // Neat cropped hair with parted fringe
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.2, Math.PI * 0.9, Math.PI * 2.1, false);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, headY - 5.5, 8.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (appearance.hairStyle === 'wizard') {
    // Hair base
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headY + 1, 9, Math.PI * 0.7, Math.PI * 2.3, false);
    ctx.fill();

    // Wide wizard brim
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.ellipse(0, headY - 4, 13, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pointed cone hat with buckle
    ctx.fillStyle = '#312e81';
    ctx.beginPath();
    ctx.moveTo(-8, headY - 4);
    ctx.lineTo(8, headY - 4);
    ctx.quadraticCurveTo(2 * flip, headY - 14, 6 * flip, headY - 21);
    ctx.closePath();
    ctx.fill();

    // Gold buckle
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-3, headY - 6.5, 6, 3);
  } else if (appearance.hairStyle === 'crown') {
    // Majestic hair with knight circlet crown
    ctx.fillStyle = hairCol;
    ctx.beginPath();
    ctx.arc(0, headY - 2, 9.4, 0, Math.PI * 2);
    ctx.fill();

    // Golden circlet
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-9, headY - 8, 18, 3.5);

    // Crown peaks
    ctx.beginPath();
    ctx.moveTo(-9, headY - 8);
    ctx.lineTo(-6, headY - 12);
    ctx.lineTo(-3, headY - 8);
    ctx.lineTo(0, headY - 13);
    ctx.lineTo(3, headY - 8);
    ctx.lineTo(6, headY - 12);
    ctx.lineTo(9, headY - 8);
    ctx.closePath();
    ctx.fill();

    // Embedded jewel
    ctx.fillStyle = outfitCol;
    ctx.beginPath();
    ctx.arc(0, headY - 6.2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 8. Overhead Nametag & Class Badge (if requested)
  if (showNametag) {
    ctx.save();
    const tagY = headY - 16;
    ctx.font = '600 10.5px "Plus Jakarta Sans", sans-serif';
    const nameStr = appearance.name || 'Nhà Thám Hiểm';
    const textW = ctx.measureText(nameStr).width;
    const pillW = Math.max(textW + 18, 48);
    const pillH = nametagSubtitle ? 24 : 16;

    // Glassmorphism background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(-pillW / 2, tagY - (nametagSubtitle ? 12 : 8), pillW, pillH, 6);
    ctx.fill();

    ctx.strokeStyle = `${appearance.color}99`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Color dot
    ctx.fillStyle = appearance.color;
    ctx.beginPath();
    ctx.arc(-pillW / 2 + 7, tagY - (nametagSubtitle ? 4 : 0), 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Name text
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameStr, 3, tagY - (nametagSubtitle ? 4 : 0));

    // Optional subtitle (e.g. Class title or Room Host)
    if (nametagSubtitle) {
      ctx.font = '500 8.5px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(nametagSubtitle, 0, tagY + 6);
    }
    ctx.restore();
  }

  ctx.restore();
}


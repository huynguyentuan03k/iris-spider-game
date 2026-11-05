/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeatherKind } from './types';

export interface WeatherGameplayPerks {
  weather: WeatherKind;
  name: string;
  bonusSummary: string;
  challengeSummary: string;
  bonuses: string[];
  challenges: string[];
  staminaRegenMult: number; // e.g., 1.45 for +45% in rain
  moveSpeedMult: number; // e.g., 0.88 for -12%
  tractionMult: number;
  critChanceBonus: number; // e.g., 0.15 for +15%
  damageReductionBonus: number; // e.g., 0.20 for +20%
  floraExtraYield: number; // +1 extra berry/wood
  mineralExtraYield: number; // +1 extra mineral in sandstorm
  stealthBonus: number; // 0..1 reduced predator detection radius
  microbeExtraYield: number; // +1 extra bioSample in fog
  dashCooldownMult: number; // 0.65 in windy
  dashDistanceMult: number; // 1.35 in sandstorm/wind
  accentColor: string;
}

export function computeWeatherGameplayPerks(
  weather: WeatherKind,
  intensity: number,
  nearCampfire: boolean,
  nearBioLantern: boolean,
  weatherResist: number = 0
): WeatherGameplayPerks {
  const wInt = Math.max(0, Math.min(1, intensity));
  const resistFactor = Math.max(0.15, 1 - weatherResist);

  switch (weather) {
    case WeatherKind.RAIN: {
      // COOLING DOWNPOUR: Rapid stamina regen (+45%), fertile flora double harvest, stealth against beast ears
      const stamBoost = 1 + 0.45 * wInt;
      const speedSlow = 1 - (nearCampfire ? 0.05 : 0.14 * wInt * resistFactor);
      return {
        weather,
        name: 'Mưa Nhiệt Đới & Gió Mùa',
        bonusSummary: 'Hồi Thể Lực +45% · Thu Hoạch Cây Cỏ +100% · Ẩn Thân Tiếng Mưa',
        challengeSummary: 'Đất Bùn Trơn Trượt · Tầm Nhìn Giảm -25%',
        bonuses: [
          'Làn nước mát mẻ hạ nhiệt cơ thể: Thể lực hồi phục nhanh gấp 1.45x',
          'Đất ngấm nước ngọt: Thu hoạch thực vật, gỗ & dâu có cơ hội nhận gấp đôi sản vật',
          'Tiếng mưa rào che lấp tiếng bước chân: Thú săn mồi giảm 30% cự ly phát hiện',
        ],
        challenges: [
          'Đất bùn ẩm ướt giảm độ bám chân (trơn trượt, di chuyển chậm -12%)',
          'Màn mưa che phủ làm giảm tầm quan sát phương xa',
        ],
        staminaRegenMult: stamBoost,
        moveSpeedMult: speedSlow,
        tractionMult: 0.65 + 0.35 * weatherResist,
        critChanceBonus: 0,
        damageReductionBonus: 0.05,
        floraExtraYield: 1,
        mineralExtraYield: 0,
        stealthBonus: 0.35 * wInt,
        microbeExtraYield: 0,
        dashCooldownMult: 1.0,
        dashDistanceMult: 1.0,
        accentColor: '#38bdf8',
      };
    }

    case WeatherKind.SANDSTORM: {
      // SAHARA GALE: Unearthed mineral veins (+1 extra ore), wind-boosted dash, severe blinding drag
      const speedSlow = 1 - 0.28 * wInt * resistFactor;
      const stamDrain = 1 - 0.22 * wInt * resistFactor;
      return {
        weather,
        name: 'Bão Cát Sa Mạc',
        bonusSummary: 'Lộ Vỉa Quặng Cổ (+1 Sắt/Đá/Pha Lê) · Lướt Theo Gió Cực Nhanh (+35%)',
        challengeSummary: 'Gió Ngược Cản Bước (Tốc Độ -28%) · Bụi Cát Che Khuất (-50%)',
        bonuses: [
          'Gió bão bào mòn cát bụi để lộ vỉa khoáng sản ngầm: Khai thác đá, sắt & pha lê nhận thêm +1 quặng',
          'Lướt (Dash) theo luồng bão cát được gia tốc tăng 35% khoảng cách lướt',
        ],
        challenges: [
          'Bụi cát và lực cản gió làm giảm 28% tốc độ di chuyển ngược chiều',
          'Không khí khô ran làm tiêu hao thể lực nhanh hơn khi di chuyển nặng nhọc',
          'Bão cát dày đặc che khuất nghiêm trọng tầm nhìn viễn cảnh',
        ],
        staminaRegenMult: Math.max(0.65, stamDrain),
        moveSpeedMult: speedSlow,
        tractionMult: 0.7 + 0.3 * weatherResist,
        critChanceBonus: 0.05,
        damageReductionBonus: 0,
        floraExtraYield: 0,
        mineralExtraYield: 1,
        stealthBonus: 0.2 * wInt,
        microbeExtraYield: 0,
        dashCooldownMult: 0.85,
        dashDistanceMult: 1.35,
        accentColor: '#facc15',
      };
    }

    case WeatherKind.SNOW: {
      // HUSHED WINTER: Subzero precision (+15% Critical Chance), peaceful fauna docile, soft snow drag
      const speedSlow = 1 - (nearCampfire ? 0.04 : 0.16 * wInt * resistFactor);
      const stamMult = nearCampfire ? 1.15 : 1 - 0.1 * wInt * resistFactor;
      return {
        weather,
        name: 'Tuyết Phủ Mùa Đông',
        bonusSummary: 'Chí Mạng Sắc Lạnh +15% · Thú Hoang Hiền Hòa Dễ Thuần Phục',
        challengeSummary: 'Tuyết Dày Làm Chậm Bước · Cần Lửa Trại Sưởi Ấm',
        bonuses: [
          'Không khí băng giá tĩnh mịch tăng cường độ tập trung: Đòn tấn công tăng +15% tỷ lệ Chí Mạng',
          'Thú hoang di chuyển chậm trên tuyết: Tiến lại gần thuần hóa nhanh hơn 25%',
          'Bên Lửa Trại được thưởng ấm áp: Tăng hồi máu và thể lực vượt trội',
        ],
        challenges: [
          'Lớp tuyết xốp làm chậm bước chân khi đi bộ trên địa hình dốc',
          'Nhiệt độ thấp làm giảm nhẹ tốc độ hồi phục thể lực nếu ở xa nguồn nhiệt',
        ],
        staminaRegenMult: stamMult,
        moveSpeedMult: speedSlow,
        tractionMult: 0.72 + 0.28 * weatherResist,
        critChanceBonus: 0.15 * wInt,
        damageReductionBonus: 0.08,
        floraExtraYield: 0,
        mineralExtraYield: 0,
        stealthBonus: 0.15 * wInt,
        microbeExtraYield: 0,
        dashCooldownMult: 1.0,
        dashDistanceMult: 1.0,
        accentColor: '#cbd5e1',
      };
    }

    case WeatherKind.BLIZZARD: {
      // SUBZERO WHITEOUT: Cryo-armor (+25% Damage Reduction), beasts frozen & sluggish, whiteout
      const speedSlow = nearCampfire ? 0.94 : 1 - 0.32 * wInt * resistFactor;
      const stamMult = nearCampfire ? 1.25 : 1 - 0.3 * wInt * resistFactor;
      return {
        weather,
        name: 'Bão Tuyết Cực Hạn (Blizzard)',
        bonusSummary: 'Giáp Băng Tự Nhiên (Giảm Sát Thương +25%) · Thú Dữ Tê Cóng Tấn Công Chậm',
        challengeSummary: 'Bão Tuyết Trắng Xóa (-60% Tầm Nhìn) · Lạnh Cắt Da Thịt',
        bonuses: [
          'Băng tuyết đóng cứng tạo lớp giáp băng hấp thụ: Giảm 25% sát thương nhận vào từ thú dữ',
          'Thú săn mồi bị tê cóng trong gió tuyết: Đòn đánh của chúng chậm hơn 30%',
          'Đứng cạnh Lửa Trại được hồi phục sinh lực thần tốc (x3 tốc độ hồi máu)',
        ],
        challenges: [
          'Tầm nhìn bị bão tuyết trắng xóa che phủ gần như hoàn toàn',
          'Gió tuyết gầm thét làm giảm tốc độ di chuyển và gây trượt băng',
          'Ở xa Lửa Trại sẽ bị rút cạn thể lực nhanh chóng',
        ],
        staminaRegenMult: Math.max(0.55, stamMult),
        moveSpeedMult: speedSlow,
        tractionMult: 0.55 + 0.45 * weatherResist,
        critChanceBonus: 0.2 * wInt,
        damageReductionBonus: 0.25 * wInt,
        floraExtraYield: 0,
        mineralExtraYield: 0,
        stealthBonus: 0.4 * wInt,
        microbeExtraYield: 0,
        dashCooldownMult: 1.15,
        dashDistanceMult: 0.9,
        accentColor: '#93c5fd',
      };
    }

    case WeatherKind.FOG: {
      // DEEP MIST: Stealth camouflage (55% reduced aggro), sneak attack crit, bacterial bloom (+2 bioSamples)
      const speedSlow = nearBioLantern || nearCampfire ? 0.98 : 1 - 0.1 * wInt * resistFactor;
      return {
        weather,
        name: 'Sương Mù Dày Đặc',
        bonusSummary: 'Tàng Hình Trong Sương (-55% Bị Phát Hiện) · Bùng Nổ Vi Khuẩn (+1 Mẫu Quét)',
        challengeSummary: 'Tầm Nhìn Thu Hẹp (-55%) · Mất Phương Hướng Mặt Trời',
        bonuses: [
          'Màn sương che giấu hoàn hảo: Thú săn mồi giảm 55% khả năng phát hiện người chơi',
          'Độ ẩm cao kích thích vi khuẩn cổ đại phát triển: Quét vi sinh nhận thêm +1 Mẫu Vi Khuẩn',
          'Tập kích bất ngờ từ trong sương mù gây sát thương chí mạng uy lực',
        ],
        challenges: [
          'Tầm nhìn phương xa bị sương mù nuốt chửng (giải tỏa bằng Đèn Sinh Học hoặc Lửa Trại)',
          'Không nhìn thấy mặt trời để định hướng thiên văn học',
        ],
        staminaRegenMult: 1.05,
        moveSpeedMult: speedSlow,
        tractionMult: 0.88 + 0.12 * weatherResist,
        critChanceBonus: 0.1 * wInt,
        damageReductionBonus: 0,
        floraExtraYield: 0,
        mineralExtraYield: 0,
        stealthBonus: 0.55 * wInt,
        microbeExtraYield: 1,
        dashCooldownMult: 1.0,
        dashDistanceMult: 1.0,
        accentColor: '#a7f3d0',
      };
    }

    case WeatherKind.WINDY: {
      // MONSOON GALE: Tailwind speed surge (+22%), dash cooldown reduced (-35%), airborne spores
      return {
        weather,
        name: 'Gió Mùa Lộng Thảo Nguyên',
        bonusSummary: 'Gió Xuôi Tăng Tốc (+22%) · Lướt Hồi Chiêu Nhanh Hơn (-35%)',
        challengeSummary: 'Gió Ngược Cản Nhẹ Khi Đi Ngược Hướng',
        bonuses: [
          'Gió xuôi trợ lực đẩy người chơi lướt đi thoăn thoắt (tăng 22% tốc độ chạy)',
          'Không khí lưu thông nhanh giảm 35% thời gian hồi chiêu kỹ năng Lướt (Dash)',
          'Phấn hoa và côn trùng bay lượn nhiều hơn, dễ thu thập mẫu vật sinh thái',
        ],
        challenges: [
          'Khi chạy ngược hướng gió sẽ cảm thấy sức ép cản lại của dòng khí',
        ],
        staminaRegenMult: 1.1,
        moveSpeedMult: 1.08,
        tractionMult: 0.95,
        critChanceBonus: 0.05,
        damageReductionBonus: 0,
        floraExtraYield: 0,
        mineralExtraYield: 0,
        stealthBonus: 0.1,
        microbeExtraYield: 0,
        dashCooldownMult: 0.65,
        dashDistanceMult: 1.25,
        accentColor: '#bef264',
      };
    }

    case WeatherKind.CLEAR:
    default: {
      // SUNNY CLEAR SKY: 100% visibility, extended scanner range (+25%), optimal baseline
      return {
        weather: WeatherKind.CLEAR,
        name: 'Trời Quang Mây Tạnh',
        bonusSummary: 'Tầm Nhìn 100% Hoàn Hảo · Tốc Độ Cân Bằng (+5%) · Quét Sinh Học Tối Ưu',
        challengeSummary: 'Nắng Gắt Vào Giữa Trưa Ở Sa Mạc',
        bonuses: [
          'Tầm nhìn quang đãng 100%, dễ dàng quan sát mọi địa danh và kỳ quan từ xa',
          'Nhiệt độ cân bằng lý tưởng giúp duy trì thể lực và tốc độ di chuyển ổn định',
          'Sóng quét Kính Hiển Vi Vi Sinh đạt hiệu quả phát hiện chuẩn xác nhất',
        ],
        challenges: [
          'Trời nắng chang chang giữa trưa tại sa mạc làm tiêu hao thể lực nhanh hơn',
        ],
        staminaRegenMult: 1.0,
        moveSpeedMult: 1.05,
        tractionMult: 1.0,
        critChanceBonus: 0,
        damageReductionBonus: 0,
        floraExtraYield: 0,
        mineralExtraYield: 0,
        stealthBonus: 0,
        microbeExtraYield: 0,
        dashCooldownMult: 1.0,
        dashDistanceMult: 1.0,
        accentColor: '#fde047',
      };
    }
  }
}

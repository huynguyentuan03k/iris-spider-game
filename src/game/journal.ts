/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeRegion, REGION_LABELS } from './biodiversity';

export type JournalCategory = 'BIOME' | 'OBELISK' | 'TITAN' | 'SPECIES' | 'SURVIVAL';

export interface JournalEntry {
  id: string;
  category: JournalCategory;
  title: string;
  narrative: string;
  timestamp: string; // e.g., "Ngày 1 · 08:30 · Ban Mai"
  dayCount: number;
  locationName: string;
  coords: string;
  icon?: string;
  accentColor?: string;
}

export const BIOME_JOURNAL_LORE: Record<
  BiomeRegion,
  {
    title: string;
    narrative: string;
    icon: string;
    accentColor: string;
  }
> = {
  [BiomeRegion.SANCTUARY]: {
    title: 'Thiết Lập Trạm Sinh Quyển Địa Cầu',
    narrative:
      'Chuyến hải trình khảo sát địa cầu chính thức khởi đầu tại Trạm Sinh Quyển Trung Tâm. Nằm ở ngã ba giao thoa lục địa Á - Âu - Phi, nơi đây sở hữu nguồn năng lượng phòng hộ ổn định và trang thiết bị vi sinh chuẩn mực. Mọi khám phá sắp tới về hành tinh sẽ được ghi chép tường tận vào cuốn biên niên sử này.',
    icon: 'compass',
    accentColor: '#34d399',
  },
  [BiomeRegion.FOREST]: {
    title: 'Tiến Sâu Vào Rừng Mưa Cổ Đại',
    narrative:
      'Vượt qua bìa rừng rậm rạp, những tán cây đại ngàn che khuất ánh mặt trời, rủ xuống những giàn rễ đa kỳ vĩ. Không khí ẩm ướt phảng phất hương vị rêu ẩm và phấn hoa nhiệt đới. Những vết chân báo đốm in hằn trên thảm lá mục nhắc nhở nhà thám hiểm luôn phải giữ chặt vũ khí và cảnh giác trước mọi chuyển động.',
    icon: 'tree',
    accentColor: '#4ade80',
  },
  [BiomeRegion.DESERT]: {
    title: 'Đối Mặt Với Biển Cát Sa Mạc Sahara',
    narrative:
      'Không khí đột ngột chuyển sang khô khốc và rực lửa khi bước chân chạm vào dải cát vàng mênh mông. Những trận gió lốc cuốn theo bụi cát amber che khuất chân trời. Tại miền đất khắc nghiệt này, xương rồng saguaro kiêu hãnh tích nước, bọ cạp hoàng đế ẩn mình dưới lòng cát, và những loài vi khuẩn kháng bức xạ kiên cường sinh tồn.',
    icon: 'sun',
    accentColor: '#facc15',
  },
  [BiomeRegion.MOUNTAIN]: {
    title: 'Chinh Phục Dãy Núi Đá Bạc Hiểm Trở',
    narrative:
      'Độ cao tăng vọt khi leo lên các triền đá dốc đứng của dãy núi cổ. Gió núi rít qua các khe nứt lộ thiên những mạch sắt và quặng đá quý giá. Tầm mắt mở rộng nhìn thấu những thung lũng sương mù bên dưới, nhưng sự hiện diện của gấu xám hung tợn đòi hỏi sự khôn khéo và vũ trang vững chắc.',
    icon: 'mountain',
    accentColor: '#94a3b8',
  },
  [BiomeRegion.SNOW_PEAK]: {
    title: 'Đặt Chân Lên Đỉnh Băng Tuyết Vĩnh Cửu',
    narrative:
      'Vùng đất cực hàn trên nóc nhà thế giới, nơi bão tuyết gầm thét và cái lạnh đóng băng từng giọt sương trên kính quan sát. Giữa tuyết trắng bao la, loài hoa nhung tuyết Edelweiss nở rộ như một phép màu sinh học, trong khi đàn dê núi sừng cong thoăn thoắt lướt trên vách đá cheo leo.',
    icon: 'snowflake',
    accentColor: '#e0f2fe',
  },
  [BiomeRegion.SAVANNA]: {
    title: 'Mở Lối Vào Thảo Nguyên Bát Ngát',
    narrative:
      'Đồng cỏ xanh dập dờn như sóng lượn theo từng đợt gió ấm phương nam. Đàn hươu sao thong dong gặm cỏ, ong rừng cần mẫn tìm mật hoa, trong khi bầy sói đồng cỏ rình rập săn mồi từ các bụi cây thưa. Một vòng tuần hoàn sinh thái tự nhiên tràn ngập sức sống nguyên sơ.',
    icon: 'grass',
    accentColor: '#a3e635',
  },
  [BiomeRegion.RIVER]: {
    title: 'Khám Phá Dòng Sông Mẹ Huyền Thoại',
    narrative:
      'Dòng nước xanh biếc cuộn chảy mang theo nguồn sống cho cả lục địa. Hoa sen hồng thanh khiết nở rộ ven bờ, từng đàn cá bơi lội dưới bóng liễu rủ. Dòng sông là mạch máu nối liền các sinh cảnh, cung cấp nguồn nước ngọt và cá tôm trù phú cho mọi sinh linh.',
    icon: 'water',
    accentColor: '#38bdf8',
  },
  [BiomeRegion.RIVERBANK]: {
    title: 'Đặt Chân Đến Vùng Châu Thổ Phù Sa',
    narrative:
      'Lớp bùn phù sa màu mỡ trải dài nơi cửa sông hội tụ. Đất đai màu mỡ tạo điều kiện cho thảm thực vật phát triển xanh tốt kỳ lạ. Rái cá sông nô đùa trên cồn cát, trong khi cá sấu khổng lồ ngụy trang hoàn hảo dưới làn nước đục rình chờ con mồi.',
    icon: 'waves',
    accentColor: '#84cc16',
  },
  [BiomeRegion.COAST]: {
    title: 'Lắng Nghe Tiếng Sóng Vỗ Bờ Cát Trắng',
    narrative:
      'Hàng dừa nhiệt đới đung đưa đón gió biển mặn mòi. Bờ cát trắng mịn lấp lánh vỏ sò và những chú rùa biển bơi vào bờ cát đẻ trứng. Xa xa là những rạn san hô kỳ thú và sóng biển phát quang sinh học về đêm kỳ ảo như một bức tranh thần tiên.',
    icon: 'shell',
    accentColor: '#fef08a',
  },
  [BiomeRegion.OCEAN]: {
    title: 'Chiêm Ngưỡng Đại Dương Thế Giới Vô Tận',
    narrative:
      'Mặt nước xanh thẳm nối liền đường chân trời vô cực. Rừng tảo bẹ khổng lồ chao đảo dưới lòng biển sâu, nơi ẩn chứa những bí mật cổ xưa của thuở hồng hoang Trái Đất. Bước chân thám hiểm đứng trước biển khơi cảm nhận rõ sự nhỏ bé của con người trước thiên nhiên kỳ vĩ.',
    icon: 'anchor',
    accentColor: '#0ea5e9',
  },
};

export function buildObeliskJournalEntry(
  beaconName: string,
  locationName: string,
  coords: string,
  timestamp: string,
  dayCount: number,
  activatedCount: number,
  totalBeacons: number
): JournalEntry {
  return {
    id: `obelisk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: 'OBELISK',
    title: `Thắp Sáng ${beaconName}`,
    narrative: `Cột Tháp Obelisk Cổ Đại [${beaconName}] đã được kích hoạt thành công! Luồng năng lượng thiên thanh tinh khiết bắn thẳng lên tầng bình lưu, xua tan bức màn sương mù hàng trăm dặm xung quanh và tái lập mạng lưới quan trắc viễn thám Địa Cầu (${activatedCount}/${totalBeacons} tháp đã hoạt động). Tần số cộng hưởng đang truyền tín hiệu về bệ thờ cổ đại...`,
    timestamp,
    dayCount,
    locationName,
    coords,
    icon: 'beacon',
    accentColor: '#38bdf8',
  };
}

export function buildTitanAwakeningEntry(
  timestamp: string,
  dayCount: number,
  coords: string
): JournalEntry {
  return {
    id: `titan_awake_${Date.now()}`,
    category: 'TITAN',
    title: 'Cổ Thần Titan Thức Giấc Tại Bệ Thờ Cổ',
    narrative:
      'Khi luồng năng lượng từ ba Trạm Quan Trắc cộng hưởng hội tụ về Bệ Thờ Cổ, mặt đất rung chuyển dữ dội. Băng tuyết Himalaya nứt toác, nham thạch cổ xưa bừng sáng rực rỡ khi Cổ Thần Titan - hộ thần mang sức mạnh kiến tạo sinh quyển Trái Đất - trỗi dậy từ lòng đất sâu sau ngàn năm say ngủ để thử thách ý chí của nhà thám hiểm!',
    timestamp,
    dayCount,
    locationName: 'Bệ Thờ Cổ Thần Himalaya',
    coords,
    icon: 'skull',
    accentColor: '#f59e0b',
  };
}

export function buildTitanDefeatedEntry(
  timestamp: string,
  dayCount: number,
  coords: string
): JournalEntry {
  return {
    id: `titan_defeated_${Date.now()}`,
    category: 'TITAN',
    title: 'Khải Hoàn Sinh Quyển: Thuần Phục Cổ Thần Titan',
    narrative:
      'Trận quyết chiến long trời lở đất đã khép lại trong vinh quang! Cổ Thần Titan cúi đầu công nhận người kế thừa xứng đáng của Trái Đất trước khi hòa mình vào lòng đất mẹ. Cân bằng năng lượng địa nhiệt được phục hồi trọn vẹn, mở ra kỷ nguyên hài hòa mới cho vạn vật trên toàn cầu.',
    timestamp,
    dayCount,
    locationName: 'Bệ Thờ Cổ Thần Himalaya',
    coords,
    icon: 'trophy',
    accentColor: '#fbbf24',
  };
}

export function buildCompanionJournalEntry(
  petName: string,
  speciesName: string,
  timestamp: string,
  dayCount: number,
  locationName: string,
  coords: string
): JournalEntry {
  return {
    id: `pet_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: 'SPECIES',
    title: `Cảm Hóa Bạn Đồng Hành: ${petName}`,
    narrative: `Vượt qua ranh giới hoang dã của thiên nhiên bằng sự kiên nhẫn và thức ăn sẻ chia, nhà thám hiểm đã thuần hóa thành công ${petName} (loài ${speciesName}). Một mối liên kết trung thành đặc biệt được hình thành giữa người và thú, cùng nhau chia ngọt sẻ bùi trên mọi chặng đường khảo sát hành tinh.`,
    timestamp,
    dayCount,
    locationName,
    coords,
    icon: 'paw',
    accentColor: '#a3e635',
  };
}

export function buildSpeciesMilestoneEntry(
  count: number,
  total: number,
  latestSpeciesName: string,
  timestamp: string,
  dayCount: number,
  locationName: string,
  coords: string
): JournalEntry {
  let title = `Cột Mốc Sinh Học: ${count} Loài Đã Khám Phá`;
  let narrative = `Bách Khoa Sinh Quyển vừa ghi nhận mẫu vật của [${latestSpeciesName}], nâng tổng số loài khảo sát lên ${count}/${total}. Mạng lưới sinh thái Trái Đất ngày càng hiển lộ rõ nét trước mắt nhà thám hiểm.`;

  if (count === 1) {
    title = `Mẫu Sinh Học Đầu Tiên: ${latestSpeciesName}`;
    narrative = `Mẫu vật đầu tiên [${latestSpeciesName}] đã được phân tích bằng Kính Hiển Vi Vi Sinh và lưu giữ vào kho lưu trữ khoa học. Bước khởi đầu nhỏ cho một hành trình thám hiểm vĩ đại bảo tồn di sản Địa Cầu.`;
  } else if (count === 10) {
    title = 'Chuyên Gia Thực Địa Sinh Học (10 Loài)';
    narrative = `Khám phá thành công 10 loài sinh vật độc đáo trải rộng trên nhiều châu lục. Khả năng nhận biết đặc tính sinh thái và sinh cảnh tự nhiên của nhà thám hiểm đã đạt đến trình độ bậc thầy.`;
  } else if (count === 20) {
    title = 'Đại Sứ Bảo Tồn Sinh Quyển (20 Loài)';
    narrative = `Hơn một nửa hệ sinh thái Địa Cầu đã được giải mã và ghi nhận vào biên niên sử. Dữ liệu quý giá này sẽ bảo vệ muôn loài trước sự biến đổi khí hậu khắc nghiệt.`;
  } else if (count >= total) {
    title = 'Kỳ Tích Toàn Bích: Toàn Bộ Sinh Quyển Địa Cầu';
    narrative = `Tất cả ${total} loài động thực vật, côn trùng và vi khuẩn trên hành tinh đã được khám phá đầy đủ! Đây là kiệt tác nghiên cứu khoa học vĩ đại nhất lịch sử văn minh.`;
  }

  return {
    id: `species_milestone_${count}_${Date.now()}`,
    category: 'SPECIES',
    title,
    narrative,
    timestamp,
    dayCount,
    locationName,
    coords,
    icon: 'leaf',
    accentColor: count >= total ? '#fbbf24' : '#4ade80',
  };
}

export function buildSurvivalMilestoneEntry(
  title: string,
  narrative: string,
  icon: string,
  accentColor: string,
  timestamp: string,
  dayCount: number,
  locationName: string,
  coords: string
): JournalEntry {
  return {
    id: `survival_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    category: 'SURVIVAL',
    title,
    narrative,
    timestamp,
    dayCount,
    locationName,
    coords,
    icon,
    accentColor,
  };
}

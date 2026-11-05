import React, { useState } from 'react';
import {
  RESOURCE_META,
  UPGRADE_TYPES,
  SWORD_NAMES,
  SPEAR_NAMES,
  SHIELD_NAMES,
} from '../game/recipes';
import { HudSnapshot } from '../game/types';

interface WeaponUpgradeModalProps {
  hud: HudSnapshot;
  onClose: () => void;
  onUpgrade: (weaponId: string, upgradeId: string) => void;
}

export const WeaponUpgradeModal: React.FC<WeaponUpgradeModalProps> = ({
  hud,
  onClose,
  onUpgrade,
}) => {
  const [selectedWeapon, setSelectedWeapon] = useState<string>('sword');
  const [selectedUpgrade, setSelectedUpgrade] = useState<string>(UPGRADE_TYPES[0].id);

  const weapons = [
    { id: 'sword', name: SWORD_NAMES[hud.equipment.swordTier] || 'Kiếm' },
    { id: 'spear', name: SPEAR_NAMES[hud.equipment.spearTier] || 'Giáo' },
    { id: 'shield', name: SHIELD_NAMES[hud.equipment.shieldTier] || 'Khiên' },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-[#080d0b]/85">
      <div className="w-full max-w-2xl bg-[#101815] border border-[#2d4038] rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#f7f4eb]">Bàn Nâng Cấp Vũ Khí</h2>
        <p className="text-xs text-[#94a3b8] mt-1">Sử dụng nguyên liệu hiếm để tăng cường thuộc tính vũ khí.</p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {weapons.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWeapon(w.id)}
              className={`p-3 rounded-lg border text-sm font-semibold ${selectedWeapon === w.id ? 'bg-[#182822] border-[#e8c468] text-[#f7f4eb]' : 'bg-[#141f1b] border-[#2d443a] text-[#94a3b8]'}`}
            >
              {w.name}
            </button>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {UPGRADE_TYPES.map((u) => (
            <button
              key={u.id}
              onClick={() => setSelectedUpgrade(u.id)}
              className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${selectedUpgrade === u.id ? 'bg-[#182822] border-[#a3e635] text-[#f7f4eb]' : 'bg-[#141f1b] border-[#2d443a] text-[#94a3b8]'}`}
            >
              {u.icon} {u.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#182420] text-xs text-[#e7e5dc]">Đóng</button>
          <button 
            onClick={() => onUpgrade(selectedWeapon, selectedUpgrade)}
            className="px-4 py-2 rounded-lg bg-[#e8c468] text-[#111916] text-xs font-semibold"
          >
            Nâng cấp (Cần 5 Tinh Thể)
          </button>
        </div>
      </div>
    </div>
  );
};

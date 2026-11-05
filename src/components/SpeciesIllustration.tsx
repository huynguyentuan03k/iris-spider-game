import React from 'react';
import { SpeciesEntry } from '../game/biodiversity';
import { AnimalKind } from '../game/types';

export const ANIMAL_KIND_SPECIES_MAP: Record<AnimalKind, string> = {
  [AnimalKind.SEA_TURTLE]: 'sea_turtle',
  [AnimalKind.REEF_CRAB]: 'reef_crab',
  [AnimalKind.RIVER_CROC]: 'river_croc',
  [AnimalKind.RIVER_OTTER]: 'river_otter',
  [AnimalKind.SPOTTED_DEER]: 'spotted_deer',
  [AnimalKind.PRAIRIE_WOLF]: 'prairie_wolf',
  [AnimalKind.WILD_BOAR]: 'wild_boar',
  [AnimalKind.JUNGLE_JAGUAR]: 'jungle_jaguar',
  [AnimalKind.DESERT_CAMEL]: 'desert_camel',
  [AnimalKind.EMPEROR_SCORPION]: 'emperor_scorpion',
  [AnimalKind.ALPINE_IBEX]: 'alpine_ibex',
  [AnimalKind.MOUNTAIN_BEAR]: 'mountain_bear',
  [AnimalKind.ANCIENT_TITAN]: 'mountain_bear',
};

interface SpeciesIllustrationProps {
  speciesId: string;
  species?: SpeciesEntry;
  discovered?: boolean;
  className?: string;
}

export const SpeciesIllustration: React.FC<SpeciesIllustrationProps> = ({
  speciesId,
  discovered = true,
  className = 'w-14 h-14',
}) => {
  const c = (hex: string, mutedFallback = '#475569') => (discovered ? hex : mutedFallback);

  const renderArtwork = () => {
    switch (speciesId) {
      // =====================================================================
      // 1. FLORA (THỰC VẬT — 11 LOÀI)
      // =====================================================================
      case 'palm_coconut':
        return (
          <>
            <ellipse cx="32" cy="56" rx="18" ry="4" fill={c('#cfb67c', '#1e293b')} opacity="0.55" />
            <path
              d="M28 55 Q23 39 33 21"
              stroke={c('#8c5e35', '#475569')}
              strokeWidth="5.5"
              strokeLinecap="round"
              fill="none"
            />
            <path d="M26 46 L31 45 M26 38 L31 37 M28 30 L33 29" stroke={c('#5c3a21', '#334155')} strokeWidth="1.4" />
            {/* Lush pinnate palm fronds */}
            <path d="M33 20 Q16 14 9 25 Q20 22 33 21 Z" fill={c('#4d9c46', '#64748b')} />
            <path d="M33 20 Q49 13 56 24 Q45 21 33 21 Z" fill={c('#4d9c46', '#64748b')} />
            <path d="M33 19 Q21 7 13 13 Q24 14 33 20 Z" fill={c('#65a30d', '#475569')} />
            <path d="M33 19 Q45 7 52 13 Q42 14 33 20 Z" fill={c('#65a30d', '#475569')} />
            <path d="M33 21 Q22 25 17 34 Q26 28 33 22 Z" fill={c('#3f7d44', '#475569')} />
            <path d="M33 21 Q45 25 49 34 Q40 28 33 22 Z" fill={c('#3f7d44', '#475569')} />
            {/* Coconuts */}
            <circle cx="30" cy="23.5" r="2.8" fill={c('#713f12', '#334155')} />
            <circle cx="35.5" cy="23.5" r="2.8" fill={c('#854d0e', '#334155')} />
            <circle cx="33" cy="26" r="2.6" fill={c('#713f12', '#334155')} />
          </>
        );

      case 'giant_kelp':
        return (
          <>
            {/* Coral reef holdfast */}
            <path d="M16 56 Q24 49 32 52 Q40 48 48 56 Z" fill={c('#f43f5e', '#334155')} opacity="0.8" />
            {/* Swaying kelp stipes & blades */}
            <path d="M22 54 Q16 40 23 26 Q27 16 21 9" stroke={c('#0d9488', '#475569')} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M33 54 Q39 38 31 24 Q28 14 35 7" stroke={c('#14b8a6', '#64748b')} strokeWidth="3.6" strokeLinecap="round" fill="none" />
            <path d="M43 54 Q48 41 41 29 Q38 20 45 13" stroke={c('#0f766e', '#475569')} strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Blades & gas bladders (pneumatocysts) */}
            <ellipse cx="17" cy="34" rx="5" ry="2.3" transform="rotate(-25 17 34)" fill={c('#2dd4bf', '#64748b')} />
            <ellipse cx="26" cy="21" rx="5" ry="2.3" transform="rotate(22 26 21)" fill={c('#2dd4bf', '#64748b')} />
            <ellipse cx="38" cy="31" rx="5.5" ry="2.4" transform="rotate(25 38 31)" fill={c('#5eead4', '#64748b')} />
            <ellipse cx="29" cy="16" rx="5" ry="2.2" transform="rotate(-24 29 16)" fill={c('#2dd4bf', '#64748b')} />
            <circle cx="35" cy="26" r="2" fill={c('#99f6e4', '#94a3b8')} />
            <circle cx="22" cy="28" r="1.8" fill={c('#99f6e4', '#94a3b8')} />
          </>
        );

      case 'weeping_willow':
        return (
          <>
            <path d="M28 56 Q27 42 31 30 L35 30 Q33 43 36 56 Z" fill={c('#6b4423', '#475569')} />
            <ellipse cx="32" cy="22" rx="19" ry="11" fill={c('#4d7c0f', '#475569')} />
            <ellipse cx="24" cy="20" rx="11" ry="8" fill={c('#65a30d', '#64748b')} />
            <ellipse cx="40" cy="20" rx="11" ry="8" fill={c('#65a30d', '#64748b')} />
            {/* Cascading weeping fronds */}
            {[15, 21, 27, 37, 43, 49].map((x, idx) => (
              <path
                key={x}
                d={`M${x} 18 Q${x + (idx % 2 === 0 ? -2 : 2)} 34 ${x} 49`}
                stroke={c('#a3e635', '#94a3b8')}
                strokeWidth="1.8"
                strokeDasharray="4 2"
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </>
        );

      case 'sacred_lotus':
        return (
          <>
            {/* Cattail reeds behind */}
            <path d="M15 50 Q13 30 16 12" stroke={c('#15803d', '#475569')} strokeWidth="2" fill="none" />
            <rect x="14" y="15" width="3.6" height="9" rx="1.8" fill={c('#78350f', '#334155')} />
            <path d="M50 50 Q52 32 48 15" stroke={c('#15803d', '#475569')} strokeWidth="2" fill="none" />
            {/* Notched lotus lily pad */}
            <path
              d="M32 46 L42 51 A18 7 0 1 1 37 44 Z"
              fill={c('#22c55e', '#475569')}
            />
            {/* Multi-layered pink lotus petals */}
            <ellipse cx="23" cy="35" rx="6.5" ry="3.4" transform="rotate(-22 23 35)" fill={c('#f472b6', '#64748b')} />
            <ellipse cx="41" cy="35" rx="6.5" ry="3.4" transform="rotate(22 41 35)" fill={c('#f472b6', '#64748b')} />
            <ellipse cx="26" cy="31" rx="4.5" ry="8" transform="rotate(-22 26 31)" fill={c('#fb7185', '#94a3b8')} />
            <ellipse cx="38" cy="31" rx="4.5" ry="8" transform="rotate(22 38 31)" fill={c('#fb7185', '#94a3b8')} />
            <ellipse cx="32" cy="29" rx="4.8" ry="9.5" fill={c('#fbcfe8', '#cbd5e1')} />
            <circle cx="32" cy="33" r="3.6" fill={c('#facc15', '#64748b')} />
          </>
        );

      case 'ancient_oak':
        return (
          <>
            {/* Gnarled roots & trunk */}
            <path d="M22 56 Q28 50 28 34 L36 34 Q36 50 42 56 L35 55 L32 52 L29 55 Z" fill={c('#6b4423', '#475569')} />
            <path d="M29 36 L21 28 M35 36 L43 28" stroke={c('#6b4423', '#475569')} strokeWidth="3.5" strokeLinecap="round" />
            {/* Layered oak canopy */}
            <circle cx="20" cy="25" r="10" fill={c('#2f6e3b', '#475569')} />
            <circle cx="44" cy="25" r="10" fill={c('#2f6e3b', '#475569')} />
            <circle cx="32" cy="18" r="13" fill={c('#3f7d44', '#64748b')} />
            <circle cx="25" cy="17" r="7" fill={c('#65a30d', '#94a3b8')} opacity="0.65" />
            {/* Acorns */}
            <circle cx="22" cy="31" r="2.2" fill={c('#d97706', '#334155')} />
            <circle cx="41" cy="30" r="2.2" fill={c('#d97706', '#334155')} />
          </>
        );

      case 'wild_berry':
        return (
          <>
            <path d="M24 52 L19 38 M32 52 L32 34 M40 52 L45 38" stroke={c('#5c3a21', '#334155')} strokeWidth="2.5" />
            <circle cx="21" cy="38" r="11" fill={c('#166534', '#475569')} />
            <circle cx="43" cy="38" r="11" fill={c('#166534', '#475569')} />
            <circle cx="32" cy="31" r="13" fill={c('#2f6e3b', '#64748b')} />
            {/* Glossy ruby berries & blossoms */}
            {[
              [22, 35],
              [30, 26],
              [39, 32],
              [27, 40],
              [43, 41],
            ].map(([bx, by], idx) => (
              <g key={idx}>
                <circle cx={bx} cy={by} r="3.4" fill={c('#fb7185', '#94a3b8')} />
                <circle cx={bx - 1} cy={by - 1} r="1" fill="#ffffff" opacity="0.75" />
              </g>
            ))}
          </>
        );

      case 'rainforest_banyan':
        return (
          <>
            {/* Aerial prop roots */}
            {[16, 22, 42, 48].map((rx) => (
              <line key={rx} x1={rx} y1="27" x2={rx + (rx < 32 ? -2 : 2)} y2="55" stroke={c('#78350f', '#334155')} strokeWidth="2" />
            ))}
            <path d="M24 56 Q28 45 27 30 L37 30 Q36 45 40 56 Z" fill={c('#573a22', '#475569')} />
            <ellipse cx="32" cy="21" rx="23" ry="12" fill={c('#14532d', '#475569')} />
            <ellipse cx="22" cy="20" rx="13" ry="9" fill={c('#15803d', '#64748b')} />
            <ellipse cx="42" cy="20" rx="13" ry="9" fill={c('#15803d', '#64748b')} />
            <ellipse cx="32" cy="14" rx="14" ry="8" fill={c('#22c55e', '#94a3b8')} opacity="0.6" />
          </>
        );

      case 'glow_mushroom':
        return (
          <>
            {/* Unfurling fern fronds */}
            <path d="M16 53 Q10 41 18 33 Q22 30 20 35" stroke={c('#15803d', '#475569')} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M48 53 Q54 41 46 33 Q42 30 44 35" stroke={c('#15803d', '#475569')} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* 3 Mycena bioluminescent mushrooms */}
            <path d="M23 54 Q22 43 24 36" stroke={c('#dcfce7', '#64748b')} strokeWidth="3" strokeLinecap="round" />
            <path d="M15 37 Q24 24 33 37 Z" fill={c('#22c55e', '#64748b')} />
            <path d="M32 54 Q33 38 32 26" stroke={c('#ecfccb', '#94a3b8')} strokeWidth="3.8" strokeLinecap="round" />
            <path d="M20 28 Q32 11 44 28 Z" fill={c('#4ade80', '#94a3b8')} />
            <path d="M42 54 Q43 45 41 39" stroke={c('#dcfce7', '#64748b')} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M35 40 Q41 30 48 40 Z" fill={c('#86efac', '#64748b')} />
            {/* Bioluminescent spore dots */}
            <circle cx="28" cy="16" r="1.5" fill={c('#bbf7d0', '#cbd5e1')} />
            <circle cx="44" cy="19" r="1.4" fill={c('#bbf7d0', '#cbd5e1')} />
            <circle cx="17" cy="24" r="1.3" fill={c('#bbf7d0', '#cbd5e1')} />
          </>
        );

      case 'saguaro_cactus':
        return (
          <>
            <rect x="27" y="13" width="10" height="43" rx="5" fill={c('#4d7c0f', '#475569')} />
            <path d="M27 36 H18 Q14 36 14 31 V21 A3.5 3.5 0 0 1 21 21 V29 H27" fill={c('#4d7c0f', '#475569')} />
            <path d="M37 31 H46 Q50 31 50 26 V18 A3.5 3.5 0 0 0 43 18 V24 H37" fill={c('#65a30d', '#64748b')} />
            {/* Pleated ribs */}
            <line x1="30" y1="16" x2="30" y2="53" stroke={c('#bef264', '#94a3b8')} strokeWidth="1" opacity="0.6" />
            <line x1="34" y1="16" x2="34" y2="53" stroke={c('#365314', '#334155')} strokeWidth="1" opacity="0.7" />
            {/* Desert crown blossoms */}
            <circle cx="32" cy="12" r="3" fill={c('#fef08a', '#cbd5e1')} />
            <circle cx="17.5" cy="17.5" r="2.3" fill={c('#fef08a', '#cbd5e1')} />
            <circle cx="46.5" cy="15" r="2.3" fill={c('#fef08a', '#cbd5e1')} />
          </>
        );

      case 'alpine_pine':
        return (
          <>
            <rect x="29" y="44" width="6" height="12" fill={c('#4a321f', '#334155')} />
            {[
              { top: 24, bot: 46, w: 21 },
              { top: 15, bot: 35, w: 17 },
              { top: 7, bot: 24, w: 12 },
            ].map((t, i) => (
              <g key={i}>
                <polygon
                  points={`32,${t.top} ${32 - t.w},${t.bot} ${32 + t.w},${t.bot}`}
                  fill={c('#1e4631', '#475569')}
                />
                <polygon
                  points={`32,${t.top} ${32 - t.w * 0.48},${t.top + 8} ${32 + t.w * 0.48},${t.top + 8}`}
                  fill={c('#f1f5f9', '#94a3b8')}
                />
              </g>
            ))}
          </>
        );

      case 'edelweiss_herb':
        return (
          <>
            {/* Lichen rock base */}
            <ellipse cx="32" cy="48" rx="18" ry="7" fill={c('#475569', '#334155')} />
            <circle cx="22" cy="48" r="3" fill={c('#84cc16', '#64748b')} opacity="0.7" />
            {/* Stem & basal leaves */}
            <path d="M32 46 V28" stroke={c('#4d7c0f', '#64748b')} strokeWidth="2.8" />
            <ellipse cx="25" cy="42" rx="7" ry="2.5" transform="rotate(-25 25 42)" fill={c('#65a30d', '#64748b')} />
            <ellipse cx="39" cy="42" rx="7" ry="2.5" transform="rotate(25 39 42)" fill={c('#65a30d', '#64748b')} />
            {/* 8 woolly white star bracts */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <ellipse
                key={deg}
                cx="32"
                cy="25"
                rx="12"
                ry="3.4"
                transform={`rotate(${deg} 32 25)`}
                fill={c('#f8fafc', '#94a3b8')}
              />
            ))}
            <circle cx="32" cy="25" r="4.8" fill={c('#fde047', '#64748b')} />
            <circle cx="30.5" cy="24" r="1.2" fill={c('#ca8a04', '#334155')} />
            <circle cx="33.5" cy="26" r="1.2" fill={c('#ca8a04', '#334155')} />
          </>
        );

      // =====================================================================
      // 2. FAUNA (ĐỘNG VẬT — 12 LOÀI)
      // =====================================================================
      case 'sea_turtle':
        return (
          <>
            {/* 4 swimming flippers */}
            <ellipse cx="25" cy="17" rx="10" ry="4.2" transform="rotate(-38 25 17)" fill={c('#34d399', '#64748b')} />
            <ellipse cx="25" cy="47" rx="10" ry="4.2" transform="rotate(38 25 47)" fill={c('#34d399', '#64748b')} />
            <ellipse cx="14" cy="24" rx="6" ry="3" transform="rotate(25 14 24)" fill={c('#059669', '#475569')} />
            <ellipse cx="14" cy="40" rx="6" ry="3" transform="rotate(-25 14 40)" fill={c('#059669', '#475569')} />
            {/* Head */}
            <ellipse cx="50" cy="32" rx="6.5" ry="5" fill={c('#34d399', '#64748b')} />
            <circle cx="52.5" cy="30.5" r="1.3" fill="#0f172a" />
            {/* Hexagonal carapace shell */}
            <ellipse cx="30" cy="32" rx="16" ry="12.5" fill={c('#065f46', '#334155')} stroke={c('#6ee7b7', '#94a3b8')} strokeWidth="1.5" />
            <polygon points="25,27 34,27 37,32 34,37 25,37 22,32" fill={c('#10b981', '#475569')} />
            <line x1="25" y1="27" x2="21" y2="22" stroke={c('#6ee7b7', '#94a3b8')} strokeWidth="1.2" />
            <line x1="34" y1="27" x2="38" y2="22" stroke={c('#6ee7b7', '#94a3b8')} strokeWidth="1.2" />
            <line x1="25" y1="37" x2="21" y2="42" stroke={c('#6ee7b7', '#94a3b8')} strokeWidth="1.2" />
            <line x1="34" y1="37" x2="38" y2="42" stroke={c('#6ee7b7', '#94a3b8')} strokeWidth="1.2" />
          </>
        );

      case 'reef_crab':
        return (
          <>
            {/* 8 jointed walking legs */}
            {[-8, -3, 3, 8].map((dy, idx) => (
              <g key={idx} stroke={c('#dc2626', '#475569')} strokeWidth="2.4" strokeLinecap="round" fill="none">
                <path d={`M20 ${34 + dy * 0.6} L11 ${33 + dy} L7 ${39 + dy * 0.8}`} />
                <path d={`M44 ${34 + dy * 0.6} L53 ${33 + dy} L57 ${39 + dy * 0.8}`} />
              </g>
            ))}
            {/* 2 large pincer claws */}
            <path d="M22 25 Q14 16 18 11 Q23 13 21 19 Q25 14 26 19" fill={c('#ef4444', '#64748b')} stroke={c('#fca5a5', '#94a3b8')} strokeWidth="1.2" />
            <path d="M42 25 Q50 16 46 11 Q41 13 43 19 Q39 14 38 19" fill={c('#ef4444', '#64748b')} stroke={c('#fca5a5', '#94a3b8')} strokeWidth="1.2" />
            {/* Wide serrated shell */}
            <ellipse cx="32" cy="34" rx="14" ry="10" fill={c('#ef4444', '#64748b')} />
            <circle cx="27" cy="24" r="2" fill="#0f172a" />
            <circle cx="37" cy="24" r="2" fill="#0f172a" />
          </>
        );

      case 'river_croc':
        return (
          <>
            {/* Muscular notched tail + body + long toothed jaw */}
            <path
              d="M6 34 Q14 26 26 28 L44 28 L58 30 L57 34 L44 35 L56 37 L55 39 L41 38 L24 39 Q13 40 6 34 Z"
              fill={c('#3f6212', '#475569')}
            />
            {/* Legs */}
            <path d="M24 38 L20 46 M38 38 L41 46" stroke={c('#365314', '#334155')} strokeWidth="3.5" strokeLinecap="round" />
            {/* Dorsal osteoderm scutes & white teeth */}
            {[16, 22, 28, 34, 40].map((sx) => (
              <polygon key={sx} points={`${sx},28 ${sx + 2.5},23.5 ${sx + 5},28`} fill={c('#84cc16', '#94a3b8')} />
            ))}
            <path d="M47 34 L48 36 M51 34 L52 36 M54 34 L55 36" stroke="#fef9c3" strokeWidth="1.3" />
            <circle cx="44" cy="29" r="2" fill={c('#fde047', '#cbd5e1')} />
          </>
        );

      case 'river_otter':
        return (
          <>
            {/* Sleek arched otter body & tapered tail */}
            <path
              d="M8 42 Q16 44 22 35 Q30 24 42 28 Q50 25 53 31 Q54 36 47 37 Q39 38 33 41 Q22 45 8 42 Z"
              fill={c('#92400e', '#475569')}
            />
            {/* Cream throat & belly */}
            <path d="M36 36 Q45 36 50 33" stroke={c('#fde68a', '#94a3b8')} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Short webbed legs */}
            <line x1="26" y1="41" x2="24" y2="48" stroke={c('#78350f', '#334155')} strokeWidth="3.2" strokeLinecap="round" />
            <line x1="41" y1="38" x2="43" y2="47" stroke={c('#78350f', '#334155')} strokeWidth="3.2" strokeLinecap="round" />
            <circle cx="49" cy="29.5" r="1.4" fill="#0f172a" />
            <line x1="52" y1="32" x2="57" y2="30" stroke={c('#fef3c7', '#cbd5e1')} strokeWidth="1" />
            <line x1="52" y1="33.5" x2="57" y2="34" stroke={c('#fef3c7', '#cbd5e1')} strokeWidth="1" />
          </>
        );

      case 'spotted_deer':
        return (
          <>
            {/* Slender legs */}
            <path d="M22 39 L20 54 M27 39 L27 54 M38 39 L37 54 M42 39 L45 54" stroke={c('#b45309', '#475569')} strokeWidth="2.6" strokeLinecap="round" />
            {/* Body & neck */}
            <ellipse cx="31" cy="35" rx="13" ry="7.5" fill={c('#d97706', '#64748b')} />
            <path d="M39 32 L45 20 L51 22 L44 35 Z" fill={c('#d97706', '#64748b')} />
            <ellipse cx="48" cy="21" rx="5.5" ry="3.8" fill={c('#d97706', '#64748b')} />
            {/* White tail & star spots */}
            <ellipse cx="17" cy="33" rx="3" ry="2" fill={c('#fef3c7', '#cbd5e1')} />
            {[
              [25, 33],
              [30, 31],
              [35, 34],
              [28, 36],
            ].map(([sx, sy], i) => (
              <circle key={i} cx={sx} cy={sy} r="1.4" fill={c('#fef3c7', '#cbd5e1')} />
            ))}
            {/* Branching antlers */}
            <path d="M46 18 L43 9 M44.5 13 L40 12 M48 18 L50 9 M49 13 L53 12" stroke={c('#fef3c7', '#94a3b8')} strokeWidth="2" strokeLinecap="round" />
            <circle cx="49.5" cy="20.5" r="1.2" fill="#0f172a" />
          </>
        );

      case 'prairie_wolf':
        return (
          <>
            {/* Bushy tail */}
            <ellipse cx="14" cy="36" rx="7" ry="3.5" transform="rotate(28 14 36)" fill={c('#64748b', '#475569')} />
            {/* Legs */}
            <path d="M22 39 L20 53 M27 39 L28 53 M39 39 L38 53 M43 39 L46 53" stroke={c('#64748b', '#475569')} strokeWidth="2.8" strokeLinecap="round" />
            {/* Body, ruff & pointed lupine snout */}
            <ellipse cx="32" cy="34" rx="13.5" ry="7.8" fill={c('#94a3b8', '#64748b')} />
            <circle cx="42" cy="30" r="6.8" fill={c('#cbd5e1', '#94a3b8')} />
            <polygon points="44,25 56,28 55,32 45,33" fill={c('#94a3b8', '#64748b')} />
            {/* Pointed ears */}
            <polygon points="40,25 42,17 45,24" fill={c('#475569', '#334155')} />
            <polygon points="44,25 47,18 48,25" fill={c('#475569', '#334155')} />
            <circle cx="47.5" cy="27.5" r="1.3" fill={c('#fde047', '#e2e8f0')} />
          </>
        );

      case 'wild_boar':
        return (
          <>
            <path d="M21 42 L20 52 M27 42 L28 52 M39 42 L38 52 M44 42 L46 52" stroke={c('#451a03', '#334155')} strokeWidth="3.2" strokeLinecap="round" />
            {/* Bristled spine ridge */}
            <path d="M18 26 Q31 19 44 26" stroke={c('#451a03', '#334155')} strokeWidth="4" strokeDasharray="3 2" fill="none" />
            <ellipse cx="32" cy="35" rx="16" ry="11" fill={c('#7c2d12', '#475569')} />
            <ellipse cx="48" cy="36" rx="6" ry="5" fill={c('#9a3412', '#64748b')} />
            {/* Curved white tusks */}
            <path d="M49 39 Q55 36 53 30" stroke={c('#fef3c7', '#cbd5e1')} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <circle cx="45" cy="32" r="1.4" fill="#0f172a" />
          </>
        );

      case 'jungle_jaguar':
        return (
          <>
            {/* Long curling feline tail */}
            <path d="M17 34 Q8 33 9 24 Q10 20 13 22" stroke={c('#d97706', '#475569')} strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <path d="M22 39 L20 52 M27 39 L28 52 M39 39 L38 52 M44 39 L47 52" stroke={c('#b45309', '#475569')} strokeWidth="3" strokeLinecap="round" />
            <ellipse cx="32" cy="34" rx="15" ry="8" fill={c('#f59e0b', '#64748b')} />
            <circle cx="46" cy="29" r="6.5" fill={c('#f59e0b', '#64748b')} />
            <circle cx="43" cy="23.5" r="2.3" fill={c('#b45309', '#475569')} />
            <circle cx="48" cy="23.5" r="2.3" fill={c('#b45309', '#475569')} />
            {/* Jaguar rosette rings */}
            {[
              [24, 33],
              [31, 31],
              [37, 35],
              [28, 37],
            ].map(([rx, ry], idx) => (
              <circle key={idx} cx={rx} cy={ry} r="2.2" stroke={c('#451a03', '#1e293b')} strokeWidth="1.4" fill="none" />
            ))}
            <circle cx="48.5" cy="28.5" r="1.3" fill={c('#bef264', '#e2e8f0')} />
          </>
        );

      case 'desert_camel':
        return (
          <>
            {/* 4 long desert legs */}
            <path d="M21 38 L20 55 M26 38 L26 55 M36 38 L36 55 M41 38 L42 55" stroke={c('#b45309', '#475569')} strokeWidth="2.8" strokeLinecap="round" />
            {/* Single prominent hump & U-curved neck */}
            <ellipse cx="30" cy="34" rx="13" ry="8" fill={c('#d97706', '#64748b')} />
            <circle cx="29" cy="24" r="7.5" fill={c('#ca8a04', '#475569')} />
            <path d="M40 34 Q47 34 48 20" stroke={c('#d97706', '#64748b')} strokeWidth="5.5" strokeLinecap="round" fill="none" />
            <ellipse cx="50" cy="18" rx="5.5" ry="3.8" fill={c('#fde68a', '#94a3b8')} />
            <circle cx="51" cy="17.5" r="1.2" fill="#0f172a" />
          </>
        );

      case 'emperor_scorpion':
        return (
          <>
            {/* 8 arachnid legs */}
            {[-5, -1, 3, 7].map((off, idx) => (
              <path
                key={idx}
                d={`M28 ${37 + off * 0.4} L22 ${45 + off * 0.5} M36 ${37 + off * 0.4} L42 ${45 + off * 0.5}`}
                stroke={c('#92400e', '#475569')}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            ))}
            {/* Segmented body */}
            <ellipse cx="33" cy="36" rx="11" ry="6.5" fill={c('#b45309', '#64748b')} />
            {/* Pedipalp pincers */}
            <path d="M42 33 Q51 28 54 32 M42 38 Q51 43 54 38" stroke={c('#d97706', '#94a3b8')} strokeWidth="2.8" strokeLinecap="round" fill="none" />
            {/* Curved segmented metasoma tail + venomous telson stinger */}
            <path d="M23 35 Q13 31 15 21 Q18 13 28 15" stroke={c('#f59e0b', '#94a3b8')} strokeWidth="4" strokeDasharray="4 1.5" strokeLinecap="round" fill="none" />
            <polygon points="28,13 35,16 29,19" fill={c('#fde047', '#cbd5e1')} />
          </>
        );

      case 'alpine_ibex':
        return (
          <>
            <path d="M22 39 L20 53 M27 39 L27 53 M38 39 L38 53 M42 39 L45 53" stroke={c('#475569', '#334155')} strokeWidth="2.8" strokeLinecap="round" />
            <ellipse cx="31" cy="35" rx="13" ry="8" fill={c('#cbd5e1', '#64748b')} />
            <path d="M40 33 L45 23 L51 26 L44 36 Z" fill={c('#cbd5e1', '#64748b')} />
            {/* Chin beard */}
            <path d="M49 28 L48 33" stroke={c('#334155', '#1e293b')} strokeWidth="2" />
            {/* Sweeping ridged scimitar horns */}
            <path d="M45 23 Q36 8 21 15" stroke={c('#475569', '#94a3b8')} strokeWidth="3.4" strokeDasharray="3.5 1.2" strokeLinecap="round" fill="none" />
            <circle cx="47.5" cy="25" r="1.2" fill="#0f172a" />
          </>
        );

      case 'mountain_bear':
        return (
          <>
            <path d="M20 41 L19 53 M27 41 L27 53 M39 41 L39 53 M45 41 L46 53" stroke={c('#451a03', '#334155')} strokeWidth="4.5" strokeLinecap="round" />
            {/* Humped grizzly shoulders & body */}
            <ellipse cx="31" cy="34" rx="17" ry="12" fill={c('#573a22', '#475569')} />
            <circle cx="38" cy="25" r="8" fill={c('#573a22', '#475569')} />
            {/* Head, rounded ears & tan snout */}
            <circle cx="47" cy="29" r="7.5" fill={c('#78350f', '#64748b')} />
            <circle cx="43" cy="22" r="2.8" fill={c('#451a03', '#334155')} />
            <circle cx="50" cy="22.5" r="2.8" fill={c('#451a03', '#334155')} />
            <ellipse cx="53" cy="31" rx="4" ry="3" fill={c('#d6d3d1', '#94a3b8')} />
            <circle cx="49" cy="28" r="1.3" fill="#0f172a" />
          </>
        );

      // =====================================================================
      // 3. INSECTS (CÔN TRÙNG — 10 LOÀI)
      // =====================================================================
      case 'emperor_dragonfly':
      case 'coastal_skimmer': {
        const bodyCol = speciesId === 'emperor_dragonfly' ? '#06b6d4' : '#38bdf8';
        return (
          <>
            {/* 4 veined dragonfly wings */}
            <ellipse cx="20" cy="24" rx="13" ry="3.8" transform="rotate(-14 20 24)" fill={c('#bae6fd', '#64748b')} opacity="0.72" stroke={c(bodyCol, '#94a3b8')} strokeWidth="0.9" />
            <ellipse cx="44" cy="24" rx="13" ry="3.8" transform="rotate(14 44 24)" fill={c('#bae6fd', '#64748b')} opacity="0.72" stroke={c(bodyCol, '#94a3b8')} strokeWidth="0.9" />
            <ellipse cx="21" cy="31" rx="11.5" ry="3.4" transform="rotate(12 21 31)" fill={c('#e0f2fe', '#64748b')} opacity="0.68" stroke={c(bodyCol, '#94a3b8')} strokeWidth="0.9" />
            <ellipse cx="43" cy="31" rx="11.5" ry="3.4" transform="rotate(-12 43 31)" fill={c('#e0f2fe', '#64748b')} opacity="0.68" stroke={c(bodyCol, '#94a3b8')} strokeWidth="0.9" />
            {/* Segmented slender abdomen + thorax + compound eyes */}
            <rect x="30.2" y="27" width="3.6" height="27" rx="1.8" fill={c(bodyCol, '#94a3b8')} />
            <path d="M30 33 H34 M30 39 H34 M30 45 H34" stroke="#0f172a" strokeWidth="1.2" />
            <ellipse cx="32" cy="24" rx="4" ry="5" fill={c('#10b981', '#64748b')} />
            <circle cx="30" cy="17.5" r="2.6" fill={c('#0284c7', '#cbd5e1')} />
            <circle cx="34" cy="17.5" r="2.6" fill={c('#0284c7', '#cbd5e1')} />
          </>
        );
      }

      case 'monarch_butterfly':
      case 'morpho_butterfly':
      case 'apollo_butterfly': {
        const primary =
          speciesId === 'morpho_butterfly'
            ? '#3b82f6'
            : speciesId === 'monarch_butterfly'
            ? '#fb923c'
            : '#f1f5f9';
        const rim = speciesId === 'apollo_butterfly' ? '#64748b' : '#1e293b';
        return (
          <>
            {/* Upper Forewings */}
            <path
              d="M31 29 C22 12, 8 13, 11 27 C13 33, 23 34, 31 31 Z"
              fill={c(primary, '#64748b')}
              stroke={c(rim, '#334155')}
              strokeWidth="1.6"
            />
            <path
              d="M33 29 C42 12, 56 13, 53 27 C51 33, 41 34, 33 31 Z"
              fill={c(primary, '#64748b')}
              stroke={c(rim, '#334155')}
              strokeWidth="1.6"
            />
            {/* Lower Hindwings */}
            <path
              d="M31 32 C21 34, 15 45, 22 50 C27 53, 31 45, 31 35 Z"
              fill={c(primary, '#475569')}
              stroke={c(rim, '#334155')}
              strokeWidth="1.5"
            />
            <path
              d="M33 32 C43 34, 49 45, 42 50 C37 53, 33 45, 33 35 Z"
              fill={c(primary, '#475569')}
              stroke={c(rim, '#334155')}
              strokeWidth="1.5"
            />
            {/* Apollo red eyespots or Morpho/Monarch highlights */}
            {speciesId === 'apollo_butterfly' ? (
              <>
                <circle cx="23" cy="43" r="2.8" fill={c('#ef4444', '#94a3b8')} stroke="#0f172a" strokeWidth="0.9" />
                <circle cx="41" cy="43" r="2.8" fill={c('#ef4444', '#94a3b8')} stroke="#0f172a" strokeWidth="0.9" />
              </>
            ) : (
              <>
                <circle cx="18" cy="23" r="2.2" fill={c('#bae6fd', '#94a3b8')} opacity="0.7" />
                <circle cx="46" cy="23" r="2.2" fill={c('#bae6fd', '#94a3b8')} opacity="0.7" />
              </>
            )}
            {/* Body & Antennae */}
            <rect x="30.5" y="21" width="3" height="23" rx="1.5" fill="#1e293b" />
            <path d="M31 21 Q27 14 24 14 M33 21 Q37 14 40 14" stroke="#94a3b8" strokeWidth="1.2" fill="none" />
          </>
        );
      }

      case 'golden_honeybee':
        return (
          <>
            {/* Translucent wings */}
            <ellipse cx="21" cy="28" rx="10" ry="4.8" transform="rotate(-25 21 28)" fill={c('#e0f2fe', '#64748b')} opacity="0.75" />
            <ellipse cx="43" cy="28" rx="10" ry="4.8" transform="rotate(25 43 28)" fill={c('#e0f2fe', '#64748b')} opacity="0.75" />
            {/* Striped golden abdomen */}
            <ellipse cx="32" cy="40" rx="8.5" ry="11" fill={c('#facc15', '#64748b')} />
            <path d="M24.5 36 H39.5 M24 41 H40 M25.5 46 H38.5" stroke="#1e293b" strokeWidth="2.5" />
            {/* Fuzzy thorax & head */}
            <circle cx="32" cy="26" r="6.5" fill={c('#ca8a04', '#475569')} />
            <circle cx="32" cy="18.5" r="4.2" fill="#1e293b" />
            <path d="M30 15 L26 11 M34 15 L38 11" stroke="#94a3b8" strokeWidth="1.4" strokeLinecap="round" />
          </>
        );

      case 'water_firefly':
        return (
          <>
            {/* Bioluminescent glow halo */}
            <circle cx="32" cy="45" r="11" fill={c('#fde047', '#475569')} opacity="0.28" />
            {/* Glowing lantern abdomen */}
            <ellipse cx="32" cy="44" rx="6.5" ry="8" fill={c('#fde047', '#94a3b8')} />
            {/* Slightly parted dark elytra */}
            <ellipse cx="26.5" cy="33" rx="5" ry="11" transform="rotate(14 26.5 33)" fill={c('#334155', '#475569')} />
            <ellipse cx="37.5" cy="33" rx="5" ry="11" transform="rotate(-14 37.5 33)" fill={c('#334155', '#475569')} />
            {/* Reddish pronotum shield & antennae */}
            <ellipse cx="32" cy="21" rx="5.5" ry="4" fill={c('#f97316', '#64748b')} />
            <path d="M29 18 L24 11 M35 18 L40 11" stroke={c('#cbd5e1', '#64748b')} strokeWidth="1.4" strokeLinecap="round" />
          </>
        );

      case 'hercules_beetle':
        return (
          <>
            {/* 6 spiny beetle legs */}
            <path d="M23 30 L14 26 M22 38 L13 39 M23 46 L15 51 M41 30 L50 26 M42 38 L51 39 M41 46 L49 51" stroke={c('#422006', '#334155')} strokeWidth="2.2" strokeLinecap="round" />
            {/* Golden olive elytra */}
            <ellipse cx="32" cy="41" rx="10" ry="12.5" fill={c('#ca8a04', '#64748b')} />
            <line x1="32" y1="29" x2="32" y2="53.5" stroke="#422006" strokeWidth="1.4" />
            {/* Dark pronotum + giant curved Hercules pincer horns! */}
            <ellipse cx="32" cy="26" rx="8.5" ry="5.5" fill={c('#422006', '#475569')} />
            <path d="M30 22 Q28 11 35 7 M34 23 Q37 15 35 11" stroke={c('#fef08a', '#94a3b8')} strokeWidth="3" strokeLinecap="round" fill="none" />
          </>
        );

      case 'sacred_scarab':
      case 'tiger_beetle': {
        const isTiger = speciesId === 'tiger_beetle';
        return (
          <>
            <path d="M22 27 L13 22 M21 36 L12 36 M22 45 L14 51 M42 27 L51 22 M43 36 L52 36 M42 45 L50 51" stroke={c('#713f12', '#475569')} strokeWidth="2.2" strokeLinecap="round" />
            <ellipse cx="32" cy="38" rx={isTiger ? 8.5 : 11} ry="12" fill={c('#eab308', '#64748b')} />
            <line x1="32" y1="26" x2="32" y2="50" stroke="#422006" strokeWidth="1.4" />
            {isTiger && (
              <path d="M25 34 L39 34 M25 42 L39 42" stroke={c('#fef9c3', '#cbd5e1')} strokeWidth="2" />
            )}
            <ellipse cx="32" cy="23" rx="7" ry="4.8" fill={c('#a16207', '#475569')} />
            {/* Sickle mandibles or notched scarab clypeus */}
            <path d="M29 18 Q26 12 31 12 M35 18 Q38 12 33 12" stroke={c('#fef08a', '#94a3b8')} strokeWidth="2" fill="none" />
          </>
        );
      }

      // =====================================================================
      // 4. BACTERIA (VI KHUẨN — 9 LOÀI PHÓNG ĐẠI 400X)
      // =====================================================================
      case 'spirulina_platensis':
        return (
          <>
            <circle cx="32" cy="32" r="24" fill="#071512" stroke={c('#10b981', '#334155')} strokeWidth="1.5" />
            <path
              d="M13 25 Q18 16 23 25 T33 25 T43 25 T51 25"
              stroke={c('#10b981', '#64748b')}
              strokeWidth="4.2"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M15 40 Q20 32 25 40 T35 40 T45 40"
              stroke={c('#6ee7b7', '#94a3b8')}
              strokeWidth="3.4"
              strokeLinecap="round"
              fill="none"
            />
          </>
        );

      case 'deinococcus_radiodurans':
        return (
          <>
            <circle cx="32" cy="32" r="24" fill="#140c08" stroke={c('#f97316', '#334155')} strokeWidth="1.5" />
            {/* Signature radiation-resistant 4-cell Tetrad (Tứ cầu khuẩn) */}
            <circle cx="32" cy="32" r="14" stroke={c('#fdba74', '#64748b')} strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
            <circle cx="26.5" cy="26.5" r="5.5" fill={c('#f97316', '#64748b')} />
            <circle cx="37.5" cy="26.5" r="5.5" fill={c('#fb923c', '#94a3b8')} />
            <circle cx="26.5" cy="37.5" r="5.5" fill={c('#fb923c', '#94a3b8')} />
            <circle cx="37.5" cy="37.5" r="5.5" fill={c('#f97316', '#64748b')} />
          </>
        );

      case 'streptomyces_griseus':
        return (
          <>
            <circle cx="32" cy="32" r="24" fill="#071512" stroke={c('#34d399', '#334155')} strokeWidth="1.5" />
            {/* Branching mycelial hyphae + spore chains */}
            <path
              d="M16 42 Q26 35 32 30 Q39 24 47 19 M32 30 Q38 36 45 43 M25 36 Q22 25 27 17"
              stroke={c('#34d399', '#64748b')}
              strokeWidth="2.6"
              strokeLinecap="round"
              fill="none"
            />
            {[
              [48, 18],
              [50, 15],
              [28, 15],
              [46, 45],
            ].map(([sx, sy], i) => (
              <circle key={i} cx={sx} cy={sy} r="2.2" fill={c('#a7f3d0', '#94a3b8')} />
            ))}
          </>
        );

      case 'prochlorococcus':
      case 'psychrobacter_arcticus': {
        const col = speciesId === 'prochlorococcus' ? '#2dd4bf' : '#7dd3fc';
        const sub = speciesId === 'prochlorococcus' ? '#99f6e4' : '#ecfeff';
        return (
          <>
            <circle cx="32" cy="32" r="24" fill="#07141a" stroke={c(col, '#334155')} strokeWidth="1.5" />
            {/* Diplococci & thylakoid / cryo-capsule rings */}
            <circle cx="25" cy="28" r="7.5" fill={c(col, '#64748b')} opacity="0.35" />
            <circle cx="25" cy="28" r="5" fill={c(col, '#64748b')} />
            <circle cx="38" cy="36" r="8.5" fill={c(sub, '#94a3b8')} opacity="0.3" />
            <circle cx="38" cy="36" r="5.5" fill={c(sub, '#94a3b8')} />
            <circle cx="40" cy="21" r="2" fill={c('#ffffff', '#cbd5e1')} opacity="0.8" />
          </>
        );
      }

      default: {
        // Rod bacilli with polar flagella & nucleoid (Vibrio, Nitrosomonas, Rhizobium, Thermus)
        const rodCol =
          speciesId === 'vibrio_fischeri'
            ? '#38bdf8'
            : speciesId === 'thermus_aquaticus'
            ? '#f59e0b'
            : '#a3e635';
        return (
          <>
            <circle cx="32" cy="32" r="24" fill="#071414" stroke={c(rodCol, '#334155')} strokeWidth="1.5" />
            <g transform="rotate(-18 30 28)">
              <rect x="17" y="23" width="21" height="9" rx="4.5" fill={c(rodCol, '#64748b')} />
              <path d="M21 27.5 Q27 25 34 27.5" stroke="#ffffff" strokeWidth="1.3" opacity="0.7" fill="none" />
              <path d="M38 27.5 Q44 23 49 28 Q52 31 54 27" stroke={c('#bae6fd', '#94a3b8')} strokeWidth="1.5" fill="none" />
            </g>
            <g transform="rotate(15 34 42)">
              <rect x="22" y="38" width="17" height="7.5" rx="3.75" fill={c(rodCol, '#475569')} opacity="0.85" />
              <path d="M12 41.5 Q17 38 22 41.5" stroke={c('#bae6fd', '#94a3b8')} strokeWidth="1.3" fill="none" />
            </g>
          </>
        );
      }
    }
  };

  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      {renderArtwork()}
    </svg>
  );
};

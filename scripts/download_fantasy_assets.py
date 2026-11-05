import os
import struct
import urllib.request
import json

BASE_DIR = "public/assets/fantasy"
os.makedirs(f"{BASE_DIR}/characters/hero", exist_ok=True)
os.makedirs(f"{BASE_DIR}/characters/units", exist_ok=True)
os.makedirs(f"{BASE_DIR}/vegetation/trees", exist_ok=True)
os.makedirs(f"{BASE_DIR}/vegetation/foliage", exist_ok=True)
os.makedirs(f"{BASE_DIR}/vegetation/decor", exist_ok=True)
os.makedirs(f"{BASE_DIR}/animals", exist_ok=True)
os.makedirs(f"{BASE_DIR}/terrain/tiles", exist_ok=True)
os.makedirs(f"{BASE_DIR}/structures", exist_ok=True)
os.makedirs(f"{BASE_DIR}/atlases", exist_ok=True)

KENNEY_BASE = "https://raw.githubusercontent.com/shorepine/kenney/master/2d"
GJMCN_BASE = "https://raw.githubusercontent.com/gjmcn/sprites/master/sprite-sheets"

assets_to_download = [
    # 1. Main Character Hero (Paladin / Adventurer) Animation Frames
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_idle.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_idle_0.png",
        "category": "character",
        "id": "hero_idle_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_walk0.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_walk_0.png",
        "category": "character",
        "id": "hero_walk_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_walk1.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_walk_1.png",
        "category": "character",
        "id": "hero_walk_1"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_walk2.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_walk_2.png",
        "category": "character",
        "id": "hero_walk_2"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_walk3.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_walk_3.png",
        "category": "character",
        "id": "hero_walk_3"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_run0.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_run_0.png",
        "category": "character",
        "id": "hero_run_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_run1.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_run_1.png",
        "category": "character",
        "id": "hero_run_1"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_run2.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_run_2.png",
        "category": "character",
        "id": "hero_run_2"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_attack0.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_attack_0.png",
        "category": "character",
        "id": "hero_attack_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_attack1.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_attack_1.png",
        "category": "character",
        "id": "hero_attack_1"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_attack2.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_attack_2.png",
        "category": "character",
        "id": "hero_attack_2"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_hurt.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_hurt_0.png",
        "category": "character",
        "id": "hero_hurt_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_fallDown.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_death_0.png",
        "category": "character",
        "id": "hero_death_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_interact.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_interact_0.png",
        "category": "character",
        "id": "hero_interact_0"
    },
    {
        "url": f"{KENNEY_BASE}/Toon%20Characters/Male%20adventurer/Poses%20HD/character_maleAdventurer_cheer0.png",
        "dest": f"{BASE_DIR}/characters/hero/hero_cheer_0.png",
        "category": "character",
        "id": "hero_cheer_0"
    },

    # 2. Medieval Units (Paladin, Knight, Archer, Swordsman)
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Unit/medievalUnit_01.png",
        "dest": f"{BASE_DIR}/characters/units/paladin_champion.png",
        "category": "unit",
        "id": "unit_paladin"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Unit/medievalUnit_02.png",
        "dest": f"{BASE_DIR}/characters/units/royal_knight.png",
        "category": "unit",
        "id": "unit_knight"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Unit/medievalUnit_03.png",
        "dest": f"{BASE_DIR}/characters/units/forest_ranger.png",
        "category": "unit",
        "id": "unit_ranger"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Unit/medievalUnit_10.png",
        "dest": f"{BASE_DIR}/characters/units/heavy_cavalry.png",
        "category": "unit",
        "id": "unit_cavalry"
    },

    # 3. Hand-Painted Environment Trees & Vegetation (Retina Resolution)
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_01.png",
        "dest": f"{BASE_DIR}/vegetation/trees/ancient_oak_full.png",
        "category": "tree",
        "id": "tree_ancient_oak"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_02.png",
        "dest": f"{BASE_DIR}/vegetation/trees/fantasy_pine_tall.png",
        "category": "tree",
        "id": "tree_pine_tall"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_03.png",
        "dest": f"{BASE_DIR}/vegetation/trees/fantasy_pine_medium.png",
        "category": "tree",
        "id": "tree_pine_med"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_04.png",
        "dest": f"{BASE_DIR}/vegetation/trees/forest_oak_small.png",
        "category": "tree",
        "id": "tree_oak_small"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_05.png",
        "dest": f"{BASE_DIR}/vegetation/foliage/forest_bush_large.png",
        "category": "foliage",
        "id": "bush_large"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_06.png",
        "dest": f"{BASE_DIR}/vegetation/foliage/forest_bush_small.png",
        "category": "foliage",
        "id": "bush_small"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_07.png",
        "dest": f"{BASE_DIR}/vegetation/decor/mossy_boulder_large.png",
        "category": "decor",
        "id": "rock_boulder_large"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_08.png",
        "dest": f"{BASE_DIR}/vegetation/decor/mossy_boulder_small.png",
        "category": "decor",
        "id": "rock_boulder_small"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_09.png",
        "dest": f"{BASE_DIR}/vegetation/decor/ancient_tree_stump.png",
        "category": "decor",
        "id": "tree_stump"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_10.png",
        "dest": f"{BASE_DIR}/vegetation/decor/fallen_moss_log.png",
        "category": "decor",
        "id": "fallen_log"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_11.png",
        "dest": f"{BASE_DIR}/vegetation/decor/wildflower_patch_red.png",
        "category": "decor",
        "id": "flowers_red"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_12.png",
        "dest": f"{BASE_DIR}/vegetation/decor/wildflower_patch_blue.png",
        "category": "decor",
        "id": "flowers_blue"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Environment/medievalEnvironment_14.png",
        "dest": f"{BASE_DIR}/vegetation/decor/forest_mushrooms.png",
        "category": "decor",
        "id": "mushrooms_cluster"
    },

    # Additional Shaded Foliage Sprites
    {
        "url": f"{KENNEY_BASE}/Foliage%20Sprites/Shaded/sprite_0052.png",
        "dest": f"{BASE_DIR}/vegetation/trees/canopy_foliage_slice.png",
        "category": "foliage",
        "id": "foliage_canopy_slice"
    },
    {
        "url": f"{KENNEY_BASE}/Foliage%20Sprites/Shaded/sprite_0056.png",
        "dest": f"{BASE_DIR}/vegetation/foliage/lush_canopy_cluster.png",
        "category": "foliage",
        "id": "foliage_canopy_cluster"
    },

    # 4. Illustrated Terrain Tiles (Retina)
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_01.png",
        "dest": f"{BASE_DIR}/terrain/tiles/grass_lush_meadow.png",
        "category": "terrain",
        "id": "tile_grass_meadow"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_02.png",
        "dest": f"{BASE_DIR}/terrain/tiles/grass_deep_forest.png",
        "category": "terrain",
        "id": "tile_grass_forest"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_04.png",
        "dest": f"{BASE_DIR}/terrain/tiles/dirt_path_straight.png",
        "category": "terrain",
        "id": "tile_dirt_straight"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_05.png",
        "dest": f"{BASE_DIR}/terrain/tiles/dirt_path_corner.png",
        "category": "terrain",
        "id": "tile_dirt_corner"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_06.png",
        "dest": f"{BASE_DIR}/terrain/tiles/dirt_path_intersection.png",
        "category": "terrain",
        "id": "tile_dirt_cross"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_17.png",
        "dest": f"{BASE_DIR}/terrain/tiles/cobblestone_path.png",
        "category": "terrain",
        "id": "tile_stone_path"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_21.png",
        "dest": f"{BASE_DIR}/terrain/tiles/river_water_deep.png",
        "category": "terrain",
        "id": "tile_water_deep"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Tile/medievalTile_22.png",
        "dest": f"{BASE_DIR}/terrain/tiles/riverbank_stone_transition.png",
        "category": "terrain",
        "id": "tile_riverbank"
    },

    # 5. Fantasy Structures (Towers, Castles, Shrines)
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Structure/medievalStructure_01.png",
        "dest": f"{BASE_DIR}/structures/watchtower_stone.png",
        "category": "structure",
        "id": "struct_watchtower"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Structure/medievalStructure_02.png",
        "dest": f"{BASE_DIR}/structures/fantasy_shrine_temple.png",
        "category": "structure",
        "id": "struct_shrine"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Structure/medievalStructure_03.png",
        "dest": f"{BASE_DIR}/structures/archery_range.png",
        "category": "structure",
        "id": "struct_archery"
    },
    {
        "url": f"{KENNEY_BASE}/RTS%20Medieval/Retina/Structure/medievalStructure_10.png",
        "dest": f"{BASE_DIR}/structures/royal_keep_castle.png",
        "category": "structure",
        "id": "struct_castle"
    },

    # 6. Atlas Bundles (Wildlife, Nature & Autotile Terrain)
    {
        "url": f"{GJMCN_BASE}/outside.png",
        "dest": f"{BASE_DIR}/atlases/outside_atlas.png",
        "category": "atlas",
        "id": "outside_atlas_png"
    },
    {
        "url": f"{GJMCN_BASE}/outside.json",
        "dest": f"{BASE_DIR}/atlases/outside_atlas.json",
        "category": "atlas_meta",
        "id": "outside_atlas_json"
    },
    {
        "url": f"{GJMCN_BASE}/terrain.png",
        "dest": f"{BASE_DIR}/atlases/terrain_atlas.png",
        "category": "atlas",
        "id": "terrain_atlas_png"
    },
    {
        "url": f"{GJMCN_BASE}/terrain.json",
        "dest": f"{BASE_DIR}/atlases/terrain_atlas.json",
        "category": "atlas_meta",
        "id": "terrain_atlas_json"
    }
]

catalog = []
print("Starting download of hand-painted fantasy game assets...")
for item in assets_to_download:
    try:
        req = urllib.request.Request(item["url"], headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = response.read()
            with open(item["dest"], "wb") as f:
                f.write(data)
            
            size_bytes = len(data)
            width, height = 0, 0
            if item["dest"].endswith(".png") and len(data) >= 24:
                width, height = struct.unpack(">II", data[16:24])
            
            record = {
                "id": item["id"],
                "category": item["category"],
                "path": item["dest"].replace("/public", ""),
                "fullPath": item["dest"],
                "sizeBytes": size_bytes,
                "width": width,
                "height": height
            }
            catalog.append(record)
            print(f"✓ [{record['category']}] {record['id']}: {width}x{height} ({size_bytes:,} bytes)")
    except Exception as e:
        print(f"✗ Failed to download {item['id']} from {item['url']}: {e}")

# Save full manifest catalog
with open(f"{BASE_DIR}/asset_manifest.json", "w") as f:
    json.dump(catalog, f, indent=2)

print(f"\nDone! Downloaded {len(catalog)} real game assets. Saved to {BASE_DIR}/asset_manifest.json")

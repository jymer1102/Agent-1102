// ============================================================
//  Minecraft build viewer.
//
//  The AI writes a ```build block holding ONE JSON object:
//    {
//      "title": "Cozy Cottage",
//      "palette": { "S": "minecraft:cobblestone", "P": "oak_planks", "G": "glass_pane" },
//      "layers": [            // bottom layer first
//        ["SSSSS", "S...S", "SSSSS"],   // one layer = rows (front to back), one letter per block (left to right)
//        ["PPPPP", "P...P", "PPPPP"]
//      ]
//    }
//  "." or a space is air. Short rows/layers are padded with air.
//
//  Controls: one finger / left mouse = look around, two fingers / right mouse = move,
//  pinch / wheel = zoom. Buttons: Outside (whole build), Inside, Layers.
//  Three.js is loaded on first use (not on every page load).
// ============================================================
(function () {
  "use strict";

  const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js";
  const MAX_SIDE = 64;          // longest allowed side
  const MAX_BLOCKS = 60000;     // total cells (w*h*d)

  /* ------------------------- block colours ------------------------- */
  const COLORS = {
    stone: "#7d7d7d", cobblestone: "#7a7a7a", mossy_cobblestone: "#6a7d5e", stone_bricks: "#797979",
    mossy_stone_bricks: "#6b7a5f", cracked_stone_bricks: "#757575", chiseled_stone_bricks: "#7b7b7b",
    smooth_stone: "#9e9e9e", andesite: "#888888", polished_andesite: "#8e8e8e", diorite: "#c9c9c9",
    polished_diorite: "#d0d0d0", granite: "#9a6b5a", polished_granite: "#a5705f", deepslate: "#4c4c50",
    cobbled_deepslate: "#4a4a4e", polished_deepslate: "#50505a", deepslate_bricks: "#464649",
    deepslate_tiles: "#3e3e42", blackstone: "#2a2429", polished_blackstone: "#353036",
    polished_blackstone_bricks: "#2f2a31", basalt: "#4b4b50", smooth_basalt: "#48484d",
    bricks: "#97594a", brick: "#97594a", nether_bricks: "#2d1519", red_nether_bricks: "#451a1c",
    sandstone: "#dbcf9e", smooth_sandstone: "#dfd3a3", cut_sandstone: "#dcd0a0", chiseled_sandstone: "#d8cc9b",
    red_sandstone: "#b5602b", smooth_red_sandstone: "#b9642f", cut_red_sandstone: "#b7622d",
    sand: "#dbd3a0", red_sand: "#be6921", gravel: "#837f7e", dirt: "#866043", coarse_dirt: "#79553a",
    podzol: "#5a4326", mud: "#3c3837", mud_bricks: "#89674f", clay: "#a0a6b3", grass_block: "#5f9b3a",
    grass: "#5f9b3a", moss_block: "#596d2d", mycelium: "#6f6265", snow: "#f8fdfd", snow_block: "#f8fdfd",
    ice: "#91b8fe", packed_ice: "#8cb4f1", blue_ice: "#74a8fd", water: "#3a5fd9", lava: "#e0640d",
    obsidian: "#14111d", crying_obsidian: "#2b0b57", bedrock: "#555555", netherrack: "#6f3535",
    soul_sand: "#51403a", soul_soil: "#4b3b34", glowstone: "#ffd66a", shroomlight: "#f19b4a",
    sea_lantern: "#cde8e2", prismarine: "#63a393", prismarine_bricks: "#63ab9a", dark_prismarine: "#345c4e",
    quartz_block: "#ece6df", smooth_quartz: "#ede8e0", quartz_bricks: "#eae5de", quartz_pillar: "#ebe6dd",
    purpur_block: "#a77ba7", purpur_pillar: "#aa7eaa", end_stone: "#dfe0a6", end_stone_bricks: "#dbe0a2",
    iron_block: "#dcdcdc", gold_block: "#f6d03c", diamond_block: "#62ede4", emerald_block: "#2acb58",
    lapis_block: "#1f438c", redstone_block: "#aa1708", coal_block: "#101010", copper_block: "#c06a4d",
    exposed_copper: "#a07a62", weathered_copper: "#6a9a7c", oxidized_copper: "#52a385", cut_copper: "#bf6b50",
    netherite_block: "#403b3c", amethyst_block: "#8561c2", calcite: "#e0e0da", tuff: "#6c6d62",
    dripstone_block: "#866b5b", terracotta: "#985e43", white_terracotta: "#d1b2a1", orange_terracotta: "#a25426",
    magenta_terracotta: "#95586c", light_blue_terracotta: "#716c89", yellow_terracotta: "#ba8523",
    lime_terracotta: "#677635", pink_terracotta: "#a24e4f", gray_terracotta: "#3a2a24",
    light_gray_terracotta: "#876b62", cyan_terracotta: "#575b5b", purple_terracotta: "#764656",
    blue_terracotta: "#4a3b5b", brown_terracotta: "#4d3323", green_terracotta: "#4c532a",
    red_terracotta: "#8f3d2e", black_terracotta: "#251610",
    oak_planks: "#b8945f", spruce_planks: "#7a5a37", birch_planks: "#c8b77a", jungle_planks: "#b88764",
    acacia_planks: "#a95a32", dark_oak_planks: "#432b14", mangrove_planks: "#765031", cherry_planks: "#e3b3ad",
    bamboo_planks: "#c9b258", crimson_planks: "#6a344b", warped_planks: "#2b6963",
    oak_log: "#6b5230", spruce_log: "#3a2815", birch_log: "#d5cda6", jungle_log: "#554419",
    acacia_log: "#676157", dark_oak_log: "#2f2111", mangrove_log: "#5c3b2e", cherry_log: "#3b2330",
    stripped_oak_log: "#b29056", stripped_spruce_log: "#7a5a37", stripped_birch_log: "#c4b077",
    stripped_dark_oak_log: "#4a3319", stripped_acacia_log: "#ad5d3a", stripped_jungle_log: "#ab8554",
    oak_leaves: "#3f7a1f", spruce_leaves: "#3c5c3c", birch_leaves: "#6b9a45", jungle_leaves: "#2f8a1c",
    acacia_leaves: "#4e8a2a", dark_oak_leaves: "#2f5f17", azalea_leaves: "#4f7f2a", cherry_leaves: "#f0b5d0",
    mangrove_leaves: "#3d7a2c", flowering_azalea_leaves: "#6a8a3a",
    glass: "#bfe3ee", glass_pane: "#bfe3ee", tinted_glass: "#3a3340",
    white_stained_glass: "#f0f0f0", orange_stained_glass: "#d89038", magenta_stained_glass: "#b24cd8",
    light_blue_stained_glass: "#6699d8", yellow_stained_glass: "#e5e533", lime_stained_glass: "#7fcc19",
    pink_stained_glass: "#f27fa5", gray_stained_glass: "#4c4c4c", light_gray_stained_glass: "#999999",
    cyan_stained_glass: "#4c7f99", purple_stained_glass: "#7f3fb2", blue_stained_glass: "#334cb2",
    brown_stained_glass: "#664c33", green_stained_glass: "#667f33", red_stained_glass: "#993333",
    black_stained_glass: "#191919",
    torch: "#ffb347", wall_torch: "#ffb347", lantern: "#e6a24a", soul_lantern: "#4fb9c9", campfire: "#c9602a",
    bookshelf: "#6f5430", crafting_table: "#8b5a2b", furnace: "#7a7a7a", chest: "#9a6a2a", barrel: "#7d5a30",
    ladder: "#8b6a3a", door: "#9a7440", iron_door: "#cfcfcf", trapdoor: "#8b6a3a", fence: "#a07a46",
    fence_gate: "#a07a46", oak_door: "#9a7440", oak_fence: "#a07a46", oak_trapdoor: "#8b6a3a",
    spruce_door: "#6a4a2b", spruce_fence: "#7a5a37", birch_door: "#c8b77a", dark_oak_door: "#432b14",
    bed: "#c0392b", red_bed: "#c0392b", white_bed: "#e6e6e6", carpet: "#c0392b", cobweb: "#e8e8e8",
    hay_block: "#c9a313", pumpkin: "#c2791a", carved_pumpkin: "#c2791a", jack_o_lantern: "#e8a21c",
    melon: "#6f8f1f", cake: "#f2e9d0", tnt: "#c0392b", bone_block: "#e5e1cf", sponge: "#c9c34a",
    farmland: "#6d4a2c", dirt_path: "#947a40", rooted_dirt: "#90674a", wheat: "#d8c35a", flower_pot: "#8e4b38",
    vine: "#3f7a1f", lily_pad: "#2f7a2f", cactus: "#2f7a2f", sugar_cane: "#86b04a",
    poppy: "#d33", dandelion: "#f2d21b", rose_bush: "#c0392b", sunflower: "#e0b90f", tall_grass: "#5f9b3a",
    fern: "#4f8a3a", azalea: "#5a8a30", flowering_azalea: "#7a8a40", bamboo: "#6f9a2a",
    anvil: "#3c3c3c", cauldron: "#3a3a3a", bell: "#e6c13d", beacon: "#8cf0e8", enchanting_table: "#7a2a3a",
    lectern: "#a07a46", smoker: "#6a6a6a", blast_furnace: "#6a6a6a", loom: "#a07a46", composter: "#7a5a37",
    redstone_lamp: "#a0702a", note_block: "#7a4a30", jukebox: "#6a4a30", target: "#e0c0b0",
    stone_slab: "#7d7d7d", cobblestone_slab: "#7a7a7a", brick_slab: "#97594a", sandstone_slab: "#dbcf9e",
    stone_stairs: "#7d7d7d", cobblestone_stairs: "#7a7a7a", brick_stairs: "#97594a", wall: "#7a7a7a",
    cobblestone_wall: "#7a7a7a", stone_brick_wall: "#797979", brick_wall: "#97594a",
    iron_bars: "#8a8a8a", chain: "#3a3a46", rail: "#8a7a5a", powered_rail: "#c9a313", sign: "#b8945f",
    oak_sign: "#b8945f", oak_slab: "#b8945f", oak_stairs: "#b8945f", spruce_slab: "#7a5a37",
    spruce_stairs: "#7a5a37", birch_slab: "#c8b77a", birch_stairs: "#c8b77a", dark_oak_slab: "#432b14",
    dark_oak_stairs: "#432b14", air: null, cave_air: null, void_air: null, barrier: null, light: null
  };
  const WOOL = {
    white: "#e9ecec", orange: "#f07613", magenta: "#bd44b3", light_blue: "#3aafd9", yellow: "#f8c527",
    lime: "#70b919", pink: "#ed8dac", gray: "#3e4447", light_gray: "#8e8e86", cyan: "#158991",
    purple: "#792aac", blue: "#35399d", brown: "#724728", green: "#546d1b", red: "#a12722", black: "#141519"
  };
  const COLOR_WORDS = Object.keys(WOOL).sort((a, b) => b.length - a.length);

  // Words in a block name that mean "this is see-through"
  const GLASSY = /glass|ice\b|water|leaves|vine|cobweb|bars|pane|tinted|slime|honey|portal/;

  function cleanName(n) {
    return String(n == null ? "" : n).trim().toLowerCase().replace(/^minecraft:/, "").replace(/\[.*$/, "").replace(/\s+/g, "_");
  }
  function prettyName(n) {
    return cleanName(n).split("_").filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(" ") || "Block";
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Returns a "#rrggbb" colour for a block name, or null for air.
  function colorFor(name) {
    const n = cleanName(name);
    if (!n || n === "air" || n === "cave_air" || n === "void_air" || n === "barrier" || n === "light") return null;
    if (Object.prototype.hasOwnProperty.call(COLORS, n)) return COLORS[n];
    // coloured families: white_wool, red_concrete, blue_stained_glass_pane, ...
    for (const c of COLOR_WORDS) {
      if (n === c || n.indexOf(c + "_") === 0) {
        if (/terracotta/.test(n)) return COLORS[c + "_terracotta"] || WOOL[c];
        return WOOL[c];
      }
    }
    // variants (stairs, slabs, walls, fences, doors...) take the colour of their material
    const base = n.replace(/_(stairs|slab|wall|fence|fence_gate|door|trapdoor|button|pressure_plate|sign|hanging_sign|pane)$/, "");
    if (base !== n && Object.prototype.hasOwnProperty.call(COLORS, base)) return COLORS[base];
    if (base !== n && Object.prototype.hasOwnProperty.call(COLORS, base + "s")) return COLORS[base + "s"];
    if (base !== n && Object.prototype.hasOwnProperty.call(COLORS, base + "_planks")) return COLORS[base + "_planks"];
    const guesses = [["planks", "#b8945f"], ["log", "#6b5230"], ["wood", "#6b5230"], ["leaves", "#3f7a1f"], ["glass", "#bfe3ee"],
      ["brick", "#97594a"], ["stone", "#7d7d7d"], ["slate", "#4c4c50"], ["sand", "#dbd3a0"], ["dirt", "#866043"],
      ["grass", "#5f9b3a"], ["ore", "#7d7d7d"], ["lamp", "#e8c070"], ["lantern", "#e6a24a"], ["torch", "#ffb347"],
      ["copper", "#c06a4d"], ["iron", "#dcdcdc"], ["gold", "#f6d03c"], ["diamond", "#62ede4"], ["water", "#3a5fd9"], ["lava", "#e0640d"]];
    for (const g of guesses) if (n.indexOf(g[0]) !== -1) return g[1];
    // unknown block: a stable, pleasant colour from its name
    const h = hash(n);
    const hue = h % 360, sat = 35 + (h >> 9) % 25, lit = 45 + (h >> 17) % 15;
    return hsl(hue, sat, lit);
  }
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const to = x => Math.round(255 * x).toString(16).padStart(2, "0");
    return "#" + to(f(0)) + to(f(8)) + to(f(4));
  }
  function opacityFor(name) {
    const n = cleanName(name);
    if (/glass|pane|ice\b/.test(n)) return 0.38;
    if (/water/.test(n)) return 0.55;
    return 1;
  }


  /* ------------------------ block textures ------------------------- */
  // The real Minecraft block textures are NOT stored in this project. They are loaded in the
  // visitor's browser, when a build is shown, from a public GitHub mirror of the game's assets.
  // If a texture can't be loaded (offline, blocked, mirror gone) the viewer falls back to plain colours.
  const TEX_BASES = [
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/textures/block/",
    "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/textures/block/"
  ];
  // names of the block textures that exist in that mirror (so we never request one that isn't there)
  const TEX_HAS = new Set("_list.json acacia_door_bottom acacia_door_top acacia_leaves acacia_log acacia_log_top acacia_planks acacia_sapling acacia_trapdoor activator_rail activator_rail_on allium amethyst_block amethyst_cluster ancient_debris_side ancient_debris_top andesite anvil anvil_top attached_melon_stem attached_pumpkin_stem azalea_leaves azalea_plant azalea_side azalea_top azure_bluet bamboo_block bamboo_block_top bamboo_door_bottom bamboo_door_top bamboo_fence bamboo_fence_gate bamboo_fence_gate_particle bamboo_fence_particle bamboo_large_leaves bamboo_mosaic bamboo_planks bamboo_singleleaf bamboo_small_leaves bamboo_stage0 bamboo_stalk bamboo_trapdoor barrel_bottom barrel_side barrel_top barrel_top_open basalt_side basalt_top beacon bedrock bee_nest_bottom bee_nest_front bee_nest_front_honey bee_nest_side bee_nest_top beehive_end beehive_front beehive_front_honey beehive_side beetroots_stage0 beetroots_stage1 beetroots_stage2 beetroots_stage3 bell_bottom bell_side bell_top big_dripleaf_side big_dripleaf_stem big_dripleaf_tip big_dripleaf_top birch_door_bottom birch_door_top birch_leaves birch_log birch_log_top birch_planks birch_sapling birch_trapdoor black_candle black_candle_lit black_concrete black_concrete_powder black_glazed_terracotta black_shulker_box black_stained_glass black_stained_glass_pane_top black_terracotta black_wool blackstone blackstone_top blast_furnace_front blast_furnace_front_on blast_furnace_side blast_furnace_top blue_candle blue_candle_lit blue_concrete blue_concrete_powder blue_glazed_terracotta blue_ice blue_orchid blue_shulker_box blue_stained_glass blue_stained_glass_pane_top blue_terracotta blue_wool bone_block_side bone_block_top bookshelf brain_coral brain_coral_block brain_coral_fan brewing_stand brewing_stand_base bricks brown_candle brown_candle_lit brown_concrete brown_concrete_powder brown_glazed_terracotta brown_mushroom brown_mushroom_block brown_shulker_box brown_stained_glass brown_stained_glass_pane_top brown_terracotta brown_wool bubble_coral bubble_coral_block bubble_coral_fan budding_amethyst cactus_bottom cactus_side cactus_top cake_bottom cake_inner cake_side cake_top calcite calibrated_sculk_sensor_amethyst calibrated_sculk_sensor_input_side calibrated_sculk_sensor_top campfire_fire campfire_log campfire_log_lit candle candle_lit carrots_stage0 carrots_stage1 carrots_stage2 carrots_stage3 cartography_table_side1 cartography_table_side2 cartography_table_side3 cartography_table_top carved_pumpkin cauldron_bottom cauldron_inner cauldron_side cauldron_top cave_vines cave_vines_lit cave_vines_plant cave_vines_plant_lit chain chain_command_block_back chain_command_block_conditional chain_command_block_front chain_command_block_side cherry_door_bottom cherry_door_top cherry_leaves cherry_log cherry_log_top cherry_planks cherry_sapling cherry_trapdoor chipped_anvil_top chiseled_bookshelf_empty chiseled_bookshelf_occupied chiseled_bookshelf_side chiseled_bookshelf_top chiseled_copper chiseled_deepslate chiseled_nether_bricks chiseled_polished_blackstone chiseled_quartz_block chiseled_quartz_block_top chiseled_red_sandstone chiseled_sandstone chiseled_stone_bricks chiseled_tuff chiseled_tuff_bricks chiseled_tuff_bricks_top chiseled_tuff_top chorus_flower chorus_flower_dead chorus_plant clay coal_block coal_ore coarse_dirt cobbled_deepslate cobblestone cobweb cocoa_stage0 cocoa_stage1 cocoa_stage2 command_block_back command_block_conditional command_block_front command_block_side comparator comparator_on composter_bottom composter_compost composter_ready composter_side composter_top conduit copper_block copper_bulb copper_bulb_lit copper_bulb_lit_powered copper_bulb_powered copper_door_bottom copper_door_top copper_grate copper_ore copper_trapdoor cornflower cracked_deepslate_bricks cracked_deepslate_tiles cracked_nether_bricks cracked_polished_blackstone_bricks cracked_stone_bricks crafter_bottom crafter_east crafter_east_crafting crafter_east_triggered crafter_north crafter_north_crafting crafter_south crafter_south_triggered crafter_top crafter_top_crafting crafter_top_triggered crafter_west crafter_west_crafting crafter_west_triggered crafting_table_front crafting_table_side crafting_table_top crimson_door_bottom crimson_door_top crimson_fungus crimson_nylium crimson_nylium_side crimson_planks crimson_roots crimson_roots_pot crimson_stem crimson_stem_top crimson_trapdoor crying_obsidian cut_copper cut_red_sandstone cut_sandstone cyan_candle cyan_candle_lit cyan_concrete cyan_concrete_powder cyan_glazed_terracotta cyan_shulker_box cyan_stained_glass cyan_stained_glass_pane_top cyan_terracotta cyan_wool damaged_anvil_top dandelion dark_oak_door_bottom dark_oak_door_top dark_oak_leaves dark_oak_log dark_oak_log_top dark_oak_planks dark_oak_sapling dark_oak_trapdoor dark_prismarine daylight_detector_inverted_top daylight_detector_side daylight_detector_top dead_brain_coral dead_brain_coral_block dead_brain_coral_fan dead_bubble_coral dead_bubble_coral_block dead_bubble_coral_fan dead_bush dead_fire_coral dead_fire_coral_block dead_fire_coral_fan dead_horn_coral dead_horn_coral_block dead_horn_coral_fan dead_tube_coral dead_tube_coral_block dead_tube_coral_fan debug debug2 deepslate deepslate_bricks deepslate_coal_ore deepslate_copper_ore deepslate_diamond_ore deepslate_emerald_ore deepslate_gold_ore deepslate_iron_ore deepslate_lapis_ore deepslate_redstone_ore deepslate_tiles deepslate_top destroy_stage_0 destroy_stage_1 destroy_stage_2 destroy_stage_3 destroy_stage_4 destroy_stage_5 destroy_stage_6 destroy_stage_7 destroy_stage_8 destroy_stage_9 detector_rail detector_rail_on diamond_block diamond_ore diorite dirt dirt_path_side dirt_path_top dispenser_front dispenser_front_vertical dragon_egg dried_kelp_bottom dried_kelp_side dried_kelp_top dripstone_block dropper_front dropper_front_vertical emerald_block emerald_ore enchanting_table_bottom enchanting_table_side enchanting_table_top end_portal_frame_eye end_portal_frame_side end_portal_frame_top end_rod end_stone end_stone_bricks exposed_chiseled_copper exposed_copper exposed_copper_bulb exposed_copper_bulb_lit exposed_copper_bulb_lit_powered exposed_copper_bulb_powered exposed_copper_door_bottom exposed_copper_door_top exposed_copper_grate exposed_copper_trapdoor exposed_cut_copper farmland farmland_moist fern fire_0 fire_1 fire_coral fire_coral_block fire_coral_fan fletching_table_front fletching_table_side fletching_table_top flower_pot flowering_azalea_leaves flowering_azalea_side flowering_azalea_top frogspawn frosted_ice_0 frosted_ice_1 frosted_ice_2 frosted_ice_3 furnace_front furnace_front_on furnace_side furnace_top gilded_blackstone glass glass_pane_top glow_item_frame glow_lichen glowstone gold_block gold_ore granite grass_block_side grass_block_side_overlay grass_block_snow grass_block_top gravel gray_candle gray_candle_lit gray_concrete gray_concrete_powder gray_glazed_terracotta gray_shulker_box gray_stained_glass gray_stained_glass_pane_top gray_terracotta gray_wool green_candle green_candle_lit green_concrete green_concrete_powder green_glazed_terracotta green_shulker_box green_stained_glass green_stained_glass_pane_top green_terracotta green_wool grindstone_pivot grindstone_round grindstone_side hanging_roots hay_block_side hay_block_top heavy_core honey_block_bottom honey_block_side honey_block_top honeycomb_block hopper_inside hopper_outside hopper_top horn_coral horn_coral_block horn_coral_fan ice iron_bars iron_block iron_door_bottom iron_door_top iron_ore iron_trapdoor item_frame jack_o_lantern jigsaw_bottom jigsaw_lock jigsaw_side jigsaw_top jukebox_side jukebox_top jungle_door_bottom jungle_door_top jungle_leaves jungle_log jungle_log_top jungle_planks jungle_sapling jungle_trapdoor kelp kelp_plant ladder lantern lapis_block lapis_ore large_amethyst_bud large_fern_bottom large_fern_top lava_flow lava_still lectern_base lectern_front lectern_sides lectern_top lever light_blue_candle light_blue_candle_lit light_blue_concrete light_blue_concrete_powder light_blue_glazed_terracotta light_blue_shulker_box light_blue_stained_glass light_blue_stained_glass_pane_top light_blue_terracotta light_blue_wool light_gray_candle light_gray_candle_lit light_gray_concrete light_gray_concrete_powder light_gray_glazed_terracotta light_gray_shulker_box light_gray_stained_glass light_gray_stained_glass_pane_top light_gray_terracotta light_gray_wool lightning_rod lightning_rod_on lilac_bottom lilac_top lily_of_the_valley lily_pad lime_candle lime_candle_lit lime_concrete lime_concrete_powder lime_glazed_terracotta lime_shulker_box lime_stained_glass lime_stained_glass_pane_top lime_terracotta lime_wool lodestone_side lodestone_top loom_bottom loom_front loom_side loom_top magenta_candle magenta_candle_lit magenta_concrete magenta_concrete_powder magenta_glazed_terracotta magenta_shulker_box magenta_stained_glass magenta_stained_glass_pane_top magenta_terracotta magenta_wool magma mangrove_door_bottom mangrove_door_top mangrove_leaves mangrove_log mangrove_log_top mangrove_planks mangrove_propagule mangrove_propagule_hanging mangrove_roots_side mangrove_roots_top mangrove_trapdoor medium_amethyst_bud melon_side melon_stem melon_top moss_block mossy_cobblestone mossy_stone_bricks mud mud_bricks muddy_mangrove_roots_side muddy_mangrove_roots_top mushroom_block_inside mushroom_stem mycelium_side mycelium_top nether_bricks nether_gold_ore nether_portal nether_quartz_ore nether_sprouts nether_wart_block nether_wart_stage0 nether_wart_stage1 nether_wart_stage2 netherite_block netherrack note_block oak_door_bottom oak_door_top oak_leaves oak_log oak_log_top oak_planks oak_sapling oak_trapdoor observer_back observer_back_on observer_front observer_side observer_top obsidian ochre_froglight_side ochre_froglight_top orange_candle orange_candle_lit orange_concrete orange_concrete_powder orange_glazed_terracotta orange_shulker_box orange_stained_glass orange_stained_glass_pane_top orange_terracotta orange_tulip orange_wool oxeye_daisy oxidized_chiseled_copper oxidized_copper oxidized_copper_bulb oxidized_copper_bulb_lit oxidized_copper_bulb_lit_powered oxidized_copper_bulb_powered oxidized_copper_door_bottom oxidized_copper_door_top oxidized_copper_grate oxidized_copper_trapdoor oxidized_cut_copper packed_ice packed_mud pearlescent_froglight_side pearlescent_froglight_top peony_bottom peony_top pink_candle pink_candle_lit pink_concrete pink_concrete_powder pink_glazed_terracotta pink_petals pink_petals_stem pink_shulker_box pink_stained_glass pink_stained_glass_pane_top pink_terracotta pink_tulip pink_wool piston_bottom piston_inner piston_side piston_top piston_top_sticky pitcher_crop_bottom pitcher_crop_bottom_stage_1 pitcher_crop_bottom_stage_2 pitcher_crop_bottom_stage_3 pitcher_crop_bottom_stage_4 pitcher_crop_side pitcher_crop_top pitcher_crop_top_stage_3 pitcher_crop_top_stage_4 podzol_side podzol_top pointed_dripstone_down_base pointed_dripstone_down_frustum pointed_dripstone_down_middle pointed_dripstone_down_tip pointed_dripstone_down_tip_merge pointed_dripstone_up_base pointed_dripstone_up_frustum pointed_dripstone_up_middle pointed_dripstone_up_tip pointed_dripstone_up_tip_merge polished_andesite polished_basalt_side polished_basalt_top polished_blackstone polished_blackstone_bricks polished_deepslate polished_diorite polished_granite polished_tuff poppy potatoes_stage0 potatoes_stage1 potatoes_stage2 potatoes_stage3 potted_azalea_bush_plant potted_azalea_bush_side potted_azalea_bush_top potted_flowering_azalea_bush_plant potted_flowering_azalea_bush_side potted_flowering_azalea_bush_top powder_snow powered_rail powered_rail_on prismarine prismarine_bricks pumpkin_side pumpkin_stem pumpkin_top purple_candle purple_candle_lit purple_concrete purple_concrete_powder purple_glazed_terracotta purple_shulker_box purple_stained_glass purple_stained_glass_pane_top purple_terracotta purple_wool purpur_block purpur_pillar purpur_pillar_top quartz_block_bottom quartz_block_side quartz_block_top quartz_bricks quartz_pillar quartz_pillar_top rail rail_corner raw_copper_block raw_gold_block raw_iron_block red_candle red_candle_lit red_concrete red_concrete_powder red_glazed_terracotta red_mushroom red_mushroom_block red_nether_bricks red_sand red_sandstone red_sandstone_bottom red_sandstone_top red_shulker_box red_stained_glass red_stained_glass_pane_top red_terracotta red_tulip red_wool redstone_block redstone_dust_dot redstone_dust_line0 redstone_dust_line1 redstone_dust_overlay redstone_lamp redstone_lamp_on redstone_ore redstone_torch redstone_torch_off reinforced_deepslate_bottom reinforced_deepslate_side reinforced_deepslate_top repeater repeater_on repeating_command_block_back repeating_command_block_conditional repeating_command_block_front repeating_command_block_side respawn_anchor_bottom respawn_anchor_side0 respawn_anchor_side1 respawn_anchor_side2 respawn_anchor_side3 respawn_anchor_side4 respawn_anchor_top respawn_anchor_top_off rooted_dirt rose_bush_bottom rose_bush_top sand sandstone sandstone_bottom sandstone_top scaffolding_bottom scaffolding_side scaffolding_top sculk sculk_catalyst_bottom sculk_catalyst_side sculk_catalyst_side_bloom sculk_catalyst_top sculk_catalyst_top_bloom sculk_sensor_bottom sculk_sensor_side sculk_sensor_tendril_active sculk_sensor_tendril_inactive sculk_sensor_top sculk_shrieker_bottom sculk_shrieker_can_summon_inner_top sculk_shrieker_inner_top sculk_shrieker_side sculk_shrieker_top sculk_vein sea_lantern sea_pickle seagrass short_grass shroomlight shulker_box slime_block small_amethyst_bud small_dripleaf_side small_dripleaf_stem_bottom small_dripleaf_stem_top small_dripleaf_top smithing_table_bottom smithing_table_front smithing_table_side smithing_table_top smoker_bottom smoker_front smoker_front_on smoker_side smoker_top smooth_basalt smooth_stone smooth_stone_slab_side sniffer_egg_not_cracked_bottom sniffer_egg_not_cracked_east sniffer_egg_not_cracked_north sniffer_egg_not_cracked_south sniffer_egg_not_cracked_top sniffer_egg_not_cracked_west sniffer_egg_slightly_cracked_bottom sniffer_egg_slightly_cracked_east sniffer_egg_slightly_cracked_north sniffer_egg_slightly_cracked_south sniffer_egg_slightly_cracked_top sniffer_egg_slightly_cracked_west sniffer_egg_very_cracked_bottom sniffer_egg_very_cracked_east sniffer_egg_very_cracked_north sniffer_egg_very_cracked_south sniffer_egg_very_cracked_top sniffer_egg_very_cracked_west snow soul_campfire_fire soul_campfire_log_lit soul_fire_0 soul_fire_1 soul_lantern soul_sand soul_soil soul_torch spawner sponge spore_blossom spore_blossom_base spruce_door_bottom spruce_door_top spruce_leaves spruce_log spruce_log_top spruce_planks spruce_sapling spruce_trapdoor stone stone_bricks stonecutter_bottom stonecutter_saw stonecutter_side stonecutter_top stripped_acacia_log stripped_acacia_log_top stripped_bamboo_block stripped_bamboo_block_top stripped_birch_log stripped_birch_log_top stripped_cherry_log stripped_cherry_log_top stripped_crimson_stem stripped_crimson_stem_top stripped_dark_oak_log stripped_dark_oak_log_top stripped_jungle_log stripped_jungle_log_top stripped_mangrove_log stripped_mangrove_log_top stripped_oak_log stripped_oak_log_top stripped_spruce_log stripped_spruce_log_top stripped_warped_stem stripped_warped_stem_top structure_block structure_block_corner structure_block_data structure_block_load structure_block_save sugar_cane sunflower_back sunflower_bottom sunflower_front sunflower_top suspicious_gravel_0 suspicious_gravel_1 suspicious_gravel_2 suspicious_gravel_3 suspicious_sand_0 suspicious_sand_1 suspicious_sand_2 suspicious_sand_3 sweet_berry_bush_stage0 sweet_berry_bush_stage1 sweet_berry_bush_stage2 sweet_berry_bush_stage3 tall_grass_bottom tall_grass_top tall_seagrass_bottom tall_seagrass_top target_side target_top terracotta tinted_glass tnt_bottom tnt_side tnt_top torch torchflower torchflower_crop_stage0 torchflower_crop_stage1 trial_spawner_bottom trial_spawner_side_active trial_spawner_side_active_ominous trial_spawner_side_inactive trial_spawner_side_inactive_ominous trial_spawner_top_active trial_spawner_top_active_ominous trial_spawner_top_ejecting_reward trial_spawner_top_ejecting_reward_ominous trial_spawner_top_inactive trial_spawner_top_inactive_ominous tripwire tripwire_hook tube_coral tube_coral_block tube_coral_fan tuff tuff_bricks turtle_egg turtle_egg_slightly_cracked turtle_egg_very_cracked twisting_vines twisting_vines_plant vault_bottom vault_bottom_ominous vault_front_ejecting vault_front_ejecting_ominous vault_front_off vault_front_off_ominous vault_front_on vault_front_on_ominous vault_side_off vault_side_off_ominous vault_side_on vault_side_on_ominous vault_top vault_top_ejecting vault_top_ejecting_ominous vault_top_ominous verdant_froglight_side verdant_froglight_top vine warped_door_bottom warped_door_top warped_fungus warped_nylium warped_nylium_side warped_planks warped_roots warped_roots_pot warped_stem warped_stem_top warped_trapdoor warped_wart_block water_flow water_overlay water_still weathered_chiseled_copper weathered_copper weathered_copper_bulb weathered_copper_bulb_lit weathered_copper_bulb_lit_powered weathered_copper_bulb_powered weathered_copper_door_bottom weathered_copper_door_top weathered_copper_grate weathered_copper_trapdoor weathered_cut_copper weeping_vines weeping_vines_plant wet_sponge wheat_stage0 wheat_stage1 wheat_stage2 wheat_stage3 wheat_stage4 wheat_stage5 wheat_stage6 wheat_stage7 white_candle white_candle_lit white_concrete white_concrete_powder white_glazed_terracotta white_shulker_box white_stained_glass white_stained_glass_pane_top white_terracotta white_tulip white_wool wither_rose yellow_candle yellow_candle_lit yellow_concrete yellow_concrete_powder yellow_glazed_terracotta yellow_shulker_box yellow_stained_glass yellow_stained_glass_pane_top yellow_terracotta yellow_wool".split(" "));

  const WOODS = ["oak", "spruce", "birch", "jungle", "acacia", "dark_oak", "mangrove", "cherry", "bamboo", "crimson", "warped"];
  const TINT = { grass: "#91bd59", foliage: "#77ab2f", birch: "#80a755", spruce: "#619961", water: "#3f76e4", lily: "#208030" };
  const SHAPE_SUFFIX = /_(stairs|slab|wall|fence_gate|fence|button|pressure_plate|hanging_sign|wall_sign|wall_hanging_sign|sign|trapdoor|door)$/;

  function firstTex() {
    for (let i = 0; i < arguments.length; i++) if (arguments[i] && TEX_HAS.has(arguments[i])) return arguments[i];
    return null;
  }

  // Which texture goes on which face of a block. Returns null when nothing sensible exists.
  // { top, bottom, side, front (optional, the -z face), tintTop, tintSide, tintAll, overlay, glass }
  function faceSpec(rawName) {
    let n = cleanName(rawName).replace(/^waxed_/, "");
    if (!n) return null;
    const has = TEX_HAS.has.bind(TEX_HAS);
    const all = t => (t ? { top: t, bottom: t, side: t } : null);

    // --- blocks whose faces differ ---
    if (n === "grass_block") return { top: "grass_block_top", bottom: "dirt", side: "grass_block_side", overlay: "grass_block_side_overlay", tintTop: TINT.grass, tintOverlay: TINT.grass };
    if (n === "podzol" || n === "mycelium") return { top: n + "_top", bottom: "dirt", side: n + "_side" };
    if (n === "dirt_path") return { top: "dirt_path_top", bottom: "dirt", side: "dirt_path_side" };
    if (n === "farmland") return { top: "farmland", bottom: "dirt", side: "dirt" };
    if (n === "grass" || n === "tall_grass" || n === "short_grass") return { top: "short_grass" in {} ? null : firstTex("short_grass", "grass_block_top"), bottom: "dirt", side: "dirt", tintAll: TINT.grass, _plant: true };
    if (n === "crafting_table") return { top: "crafting_table_top", bottom: "oak_planks", side: "crafting_table_side", front: "crafting_table_front" };
    if (n === "bookshelf") return { top: "oak_planks", bottom: "oak_planks", side: "bookshelf" };
    if (n === "furnace" || n === "blast_furnace" || n === "smoker") {
      const top = firstTex(n + "_top", "furnace_top");
      return { top, bottom: top, side: firstTex(n + "_side", "furnace_side"), front: firstTex(n + "_front", "furnace_front") };
    }
    if (n === "tnt") return { top: "tnt_top", bottom: "tnt_bottom", side: "tnt_side" };
    if (n === "pumpkin") return { top: "pumpkin_top", bottom: "pumpkin_top", side: "pumpkin_side" };
    if (n === "carved_pumpkin" || n === "jack_o_lantern") return { top: "pumpkin_top", bottom: "pumpkin_top", side: "pumpkin_side", front: n };
    if (n === "melon") return { top: "melon_top", bottom: "melon_top", side: "melon_side" };
    if (n === "hay_block") return { top: "hay_block_top", bottom: "hay_block_top", side: "hay_block_side" };
    if (n === "cactus") return { top: "cactus_top", bottom: "cactus_bottom", side: "cactus_side" };
    if (n === "snow" || n === "snow_block") return all("snow");
    if (n === "water") return { top: "water_still", bottom: "water_still", side: "water_still", tintAll: TINT.water, glass: true };
    if (n === "lava") return all("lava_still");
    if (n === "bedrock") return all("bedrock");
    if (n === "barrel") return { top: "barrel_top", bottom: "barrel_bottom", side: "barrel_side" };
    if (n === "chest" || n === "trapped_chest" || n === "ender_chest") return all(firstTex("oak_planks"));
    if (n === "lectern") return { top: "lectern_top", bottom: "oak_planks", side: "lectern_sides" };
    if (n === "composter") return { top: "composter_top", bottom: "composter_bottom", side: "composter_side" };
    if (n === "tuff" || n === "calcite" || n === "dripstone_block") return all(n);
    if (n === "torch" || n === "wall_torch") return all("torch");
    if (n === "soul_torch") return all("soul_torch");
    if (n === "lantern" || n === "soul_lantern") return { top: n, bottom: n, side: n };
    if (n === "ladder") return all("ladder");
    if (n === "iron_bars") return all("iron_bars");
    if (n === "chain") return all("chain");
    if (n === "cobweb") return all("cobweb");
    if (n === "glass_pane" || n === "glass") return Object.assign(all("glass"), { glass: true });
    if (n === "tinted_glass") return Object.assign(all("tinted_glass"), { glass: true });
    if (n === "ice" || n === "frosted_ice") return Object.assign(all("ice"), { glass: true });
    if (n === "redstone_lamp") return all("redstone_lamp");
    if (n === "sea_lantern") return all("sea_lantern");
    if (n === "glowstone") return all("glowstone");
    if (n === "shroomlight") return all("shroomlight");
    if (n === "bee_nest") return { top: "bee_nest_top", bottom: "bee_nest_bottom", side: "bee_nest_side", front: "bee_nest_front" };

    // stained glass and panes
    let m = /^([a-z_]+)_stained_glass(_pane)?$/.exec(n);
    if (m && has(m[1] + "_stained_glass")) return Object.assign(all(m[1] + "_stained_glass"), { glass: true });

    // sandstone / quartz families have separate top, bottom and side art
    m = /^(red_)?sandstone$/.exec(n);
    if (m) { const p = (m[1] || "") + "sandstone"; return { top: p + "_top", bottom: p + "_bottom", side: p }; }
    m = /^(?:smooth_)(red_)?sandstone$/.exec(n);
    if (m) return all((m[1] || "") + "sandstone_top");
    m = /^(?:cut_)(red_)?sandstone$/.exec(n);
    if (m) { const p = (m[1] || "") + "sandstone"; return { top: p + "_top", bottom: p + "_top", side: "cut_" + p }; }
    m = /^(?:chiseled_)(red_)?sandstone$/.exec(n);
    if (m) { const p = (m[1] || "") + "sandstone"; return { top: p + "_top", bottom: p + "_top", side: "chiseled_" + p }; }
    if (n === "quartz_block") return { top: "quartz_block_top", bottom: "quartz_block_bottom", side: "quartz_block_side" };
    if (n === "smooth_quartz") return all("quartz_block_bottom");
    if (n === "quartz_pillar") return { top: "quartz_pillar_top", bottom: "quartz_pillar_top", side: "quartz_pillar" };
    if (n === "chiseled_quartz_block") return { top: "chiseled_quartz_block_top", bottom: "chiseled_quartz_block_top", side: "chiseled_quartz_block" };
    if (n === "purpur_pillar") return { top: "purpur_pillar_top", bottom: "purpur_pillar_top", side: "purpur_pillar" };
    if (n === "deepslate") return { top: "deepslate_top", bottom: "deepslate_top", side: "deepslate" };
    if (n === "basalt" || n === "polished_basalt") return { top: n + "_top", bottom: n + "_top", side: n + "_side" };
    if (n === "smooth_basalt") return all("smooth_basalt");
    if (n === "smooth_stone" || n === "smooth_stone_slab") return all("smooth_stone");
    if (n === "stone_slab") return all("stone");
    if (n === "bone_block") return { top: "bone_block_top", bottom: "bone_block_top", side: "bone_block_side" };
    if (n === "target") return { top: "target_top", bottom: "target_top", side: "target_side" };
    if (n === "end_stone_bricks" || n === "end_stone") return all(n);

    // logs, wood, stems
    m = /^(stripped_)?(.+)_(log|wood|stem|hyphae)$/.exec(n);
    if (m) {
      const st = m[1] || "", kind = m[3], wood = m[2];
      const isStem = kind === "stem" || kind === "hyphae";
      const base = st + wood + (isStem ? "_stem" : "_log");
      if (has(base)) {
        const top = (kind === "wood" || kind === "hyphae") ? base : firstTex(base + "_top", base);
        return { top, bottom: top, side: base };
      }
    }
    if (n === "bamboo_block" || n === "stripped_bamboo_block") return { top: n + "_top", bottom: n + "_top", side: n };

    // leaves (grey in the files; the game tints them by biome)
    m = /^(.+)_leaves$/.exec(n);
    if (m && has(n)) {
      let tint = TINT.foliage;
      if (m[1] === "birch") tint = TINT.birch; else if (m[1] === "spruce") tint = TINT.spruce;
      else if (m[1] === "azalea" || m[1] === "flowering_azalea" || m[1] === "cherry") tint = null;
      return Object.assign(all(n), tint ? { tintAll: tint } : {});
    }
    if (n === "vine" || n === "lily_pad") return Object.assign(all(n), { tintAll: n === "vine" ? TINT.foliage : TINT.lily });

    // chiselled / polished / coloured families: the name is usually the file name
    if (has(n)) return all(n);

    // stairs, slabs, walls, fences, doors... are drawn as full blocks of their material
    if (SHAPE_SUFFIX.test(n)) {
      const base = n.replace(SHAPE_SUFFIX, "");
      if (/(door|trapdoor)$/.test(n)) {
        const t = firstTex(n + "_bottom", n, base + "_door_bottom");
        if (t) return all(t);
      }
      if (/sign$/.test(n) || /fence/.test(n) || /_button$|_pressure_plate$/.test(n)) {
        if (WOODS.indexOf(base) !== -1) return all(firstTex(base + "_planks"));
      }
      if (WOODS.indexOf(base) !== -1) return all(firstTex(base + "_planks"));
      const alias = { brick: "bricks", stone_brick: "stone_bricks", nether_brick: "nether_bricks", red_nether_brick: "red_nether_bricks",
        mud_brick: "mud_bricks", end_stone_brick: "end_stone_bricks", prismarine_brick: "prismarine_bricks", deepslate_brick: "deepslate_bricks",
        deepslate_tile: "deepslate_tiles", polished_blackstone_brick: "polished_blackstone_bricks", quartz: "quartz_block", purpur: "purpur_block",
        cobbled_deepslate: "cobbled_deepslate", stone: "stone", sandstone: "sandstone", red_sandstone: "red_sandstone" };
      const baseSpec = alias[base] ? faceSpec(alias[base]) : faceSpec(base);
      if (baseSpec) return baseSpec;
      const t = firstTex(base, base + "s", base + "_block", base + "_planks", base + "_bricks");
      if (t) return all(t);
    }
    if (/^potted_/.test(n)) return all("flower_pot");
    return null;
  }

  /* ---- texture images: loaded once, first frame only (water/lava/etc. are animation strips) ---- */
  const texCache = new Map();
  function loadImage(url) {
    return new Promise(resolve => {
      try {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = url;
      } catch (e) { resolve(null); }
    });
  }
  function loadTexCanvas(name) {
    if (!texCache.has(name)) {
      texCache.set(name, (async () => {
        for (const base of TEX_BASES) {
          const img = await loadImage(base + name + ".png");
          if (img && img.width) {
            const size = img.width;                                  // frames are stacked: the first one is size x size
            const c = document.createElement("canvas");
            c.width = size; c.height = size;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, size, size, 0, 0, size, size);
            return c;
          }
        }
        return null;
      })().then(c => { if (!c) texCache.delete(name); return c; }));    // a failed load can be retried next time
    }
    return texCache.get(name);
  }
  function hasAlpha(canvas) {
    try {
      const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    } catch (e) { /* tainted canvas: assume opaque */ }
    return false;
  }
  // grass sides = dirt-with-green-edge + a grey overlay that has to be tinted green
  function compositeOverlay(baseC, overlayC, tint) {
    const c = document.createElement("canvas");
    c.width = baseC.width; c.height = baseC.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(baseC, 0, 0);
    const t = document.createElement("canvas");
    t.width = c.width; t.height = c.height;
    const tc = t.getContext("2d");
    tc.drawImage(overlayC, 0, 0, t.width, t.height);
    tc.globalCompositeOperation = "multiply";
    tc.fillStyle = tint; tc.fillRect(0, 0, t.width, t.height);
    tc.globalCompositeOperation = "destination-in";
    tc.drawImage(overlayC, 0, 0, t.width, t.height);
    ctx.drawImage(t, 0, 0);
    return c;
  }

  /* --------------------------- parsing ---------------------------- */
  function parseJsonLoose(text) {
    let t = String(text || "").trim().replace(/^```[a-z]*\s*/i, "").replace(/```$/, "").trim();
    try { return JSON.parse(t); } catch (e) { /* try to repair */ }
    t = t.replace(/,\s*([}\]])/g, "$1");                         // trailing commas
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a !== -1 && b > a) t = t.slice(a, b + 1);
    return JSON.parse(t);
  }

  // Returns { title, w, h, d, cells: Int16Array (index into names, -1 = air), names: [], notes: [] }
  function parseBuild(text) {
    const raw = typeof text === "string" ? parseJsonLoose(text) : text;
    if (!raw || typeof raw !== "object") throw new Error("the build data isn't an object.");
    const palRaw = raw.palette || raw.blocks || raw.key || raw.legend;
    if (!palRaw || typeof palRaw !== "object" || Array.isArray(palRaw)) throw new Error("the build needs a \"palette\" mapping letters to block names.");
    const layersRaw = raw.layers || raw.levels || raw.slices;
    if (!Array.isArray(layersRaw) || !layersRaw.length) throw new Error("the build needs a \"layers\" list.");

    const notes = [];
    const keyToIdx = {}, names = [];
    Object.keys(palRaw).forEach(k => {
      if (k.length < 1) return;
      const nm = cleanName(palRaw[k]);
      if (!nm || nm === "air" || nm === "cave_air" || nm === "void_air") { keyToIdx[k] = -1; return; }
      let idx = names.indexOf(nm);
      if (idx === -1) { names.push(nm); idx = names.length - 1; }
      keyToIdx[k] = idx;
    });
    const AIR_KEYS = { ".": 1, " ": 1, "_": 1 };

    // Each layer is an array of row strings (a single multi-line string is also accepted).
    const layers = layersRaw.map(L => {
      if (typeof L === "string") return L.split(/\r?\n/);
      if (L && Array.isArray(L.rows)) return L.rows.map(String);
      if (L && Array.isArray(L.grid)) return L.grid.map(String);
      if (Array.isArray(L)) return L.map(r => Array.isArray(r) ? r.join("") : String(r));
      throw new Error("a layer isn't a list of rows.");
    });

    const h = layers.length;
    let d = 0, w = 0;
    layers.forEach(rows => { d = Math.max(d, rows.length); rows.forEach(r => { w = Math.max(w, [...r].length); }); });
    if (w < 1 || d < 1) throw new Error("the build is empty.");
    if (w > MAX_SIDE || d > MAX_SIDE || h > MAX_SIDE || w * h * d > MAX_BLOCKS) throw new Error(`the build is too big (${w}×${h}×${d}). Keep it under ${MAX_SIDE} blocks per side.`);

    const cells = new Int16Array(w * h * d).fill(-1);
    const unknown = {};
    let nonAir = 0;
    layers.forEach((rows, y) => {
      rows.forEach((row, z) => {
        [...row].forEach((ch, x) => {
          let idx = -1;
          if (Object.prototype.hasOwnProperty.call(keyToIdx, ch)) idx = keyToIdx[ch];
          else if (AIR_KEYS[ch]) idx = -1;
          else { unknown[ch] = (unknown[ch] || 0) + 1; idx = -1; }
          cells[x + w * (z + d * y)] = idx;
          if (idx !== -1) nonAir++;
        });
      });
    });
    const uk = Object.keys(unknown);
    if (uk.length) notes.push(`Skipped letters that aren't in the palette: ${uk.slice(0, 8).join(" ")}`);
    if (!nonAir) throw new Error("the build has no blocks in it.");

    // Y is up. The first row of a layer is the FRONT of the build.
    return { title: String(raw.title || raw.name || "Minecraft build").slice(0, 80), w, h, d, cells, names, notes };
  }

  function looksLikeBuild(text) {
    const t = String(text || "");
    return t.length > 20 && /"palette"/.test(t) && /"layers"/.test(t);
  }

  /* ------------------------ three.js loader ------------------------ */
  let threeLoading = null;
  function ensureThree() {
    if (window.THREE) return Promise.resolve(window.THREE);
    if (!threeLoading) {
      threeLoading = new Promise((resolve, reject) => {
        const sc = document.createElement("script");
        sc.src = THREE_URL;
        sc.onload = () => (window.THREE ? resolve(window.THREE) : reject(new Error("3D library ran but didn't start")));
        sc.onerror = () => reject(new Error("the 3D library couldn't be loaded. Check your connection."));
        document.head.appendChild(sc);
      });
      threeLoading.catch(() => { threeLoading = null; });
    }
    return threeLoading;
  }

  /* --------------------------- DOM helpers ------------------------- */
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function iconBtn(icon, label, title) {
    const b = el("button", "bv-btn");
    b.type = "button"; if (title) b.title = title;
    b.innerHTML = `<i class="fa-solid ${icon}"></i><span></span>`;
    b.lastChild.textContent = label;
    return b;
  }

  /* ----------------------------- viewer ---------------------------- */
  function buildViewer(spec, THREE) {
    const { w, h, d, cells, names } = spec;
    const state = {
      mode: "outside",          // outside | inside | layers
      layer: 0,                 // selected layer (layers mode)
      below: true,              // layers mode: also show layers under the selected one (dimmed)
      yaw: 0.8, pitch: 0.5, dist: 20,
      target: new THREE.Vector3(w / 2, h / 2, d / 2),
      eye: new THREE.Vector3(w / 2, 1.6, d / 2),
      textures: false,
      dirty: true, disposed: false
    };

    // ---- layout ----
    const root = el("div", "build-block chart-block");
    const head = el("div", "chart-toolbar");
    const titleEl = el("span", "chart-kind");
    titleEl.innerHTML = '<i class="fa-solid fa-cube"></i> ';
    titleEl.appendChild(document.createTextNode(`${spec.title} · ${w}×${h}×${d}`));
    head.appendChild(titleEl);

    const modes = el("div", "bv-modes");
    const bOut = iconBtn("fa-cubes", "Outside", "See the whole build from outside");
    const bIn = iconBtn("fa-door-open", "Inside", "Look around from inside the build");
    const bLay = iconBtn("fa-layer-group", "Layers", "View one layer at a time");
    const bTex = iconBtn("fa-image", "Textures", "Show the real block textures");
    bTex.classList.add("bv-tex"); bTex.disabled = true;
    modes.append(bOut, bIn, bLay, bTex);

    const stage = el("div", "bv-stage");
    const canvas = el("canvas", "bv-canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "3D view of " + spec.title);
    const tip = el("div", "bv-tip");
    const hint = el("div", "bv-hint");
    stage.append(canvas, tip, hint);

    const layerBar = el("div", "bv-layers");
    const lPrev = iconBtn("fa-chevron-down", "", "Layer below");
    const lNext = iconBtn("fa-chevron-up", "", "Layer above");
    const slider = el("input", "bv-slider");
    slider.type = "range"; slider.min = 0; slider.max = h - 1; slider.step = 1; slider.value = 0;
    const lLabel = el("span", "bv-layer-label");
    const lBelow = iconBtn("fa-clone", "Show below", "Also show the layers underneath (faded)");
    layerBar.append(lPrev, slider, lNext, lLabel, lBelow);

    const mats = el("details", "bv-mats");
    const matsSum = el("summary");
    const matsList = el("div", "bv-mats-list");
    mats.append(matsSum, matsList);

    root.append(head, modes, stage, layerBar, mats);
    if (spec.notes.length) root.appendChild(el("div", "bv-note", spec.notes.join(" · ")));

    // ---- three.js scene ----
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 600);
    scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    const sun = new THREE.DirectionalLight(0xffffff, 0.75);
    sun.position.set(0.6, 1, 0.4); scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.25);
    fill.position.set(-0.7, 0.3, -0.5); scene.add(fill);

    const geo = new THREE.BoxGeometry(1, 1, 1);
    const idx3 = (x, y, z) => x + w * (z + d * y);
    const at = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= w || y >= h || z >= d) ? -1 : cells[idx3(x, y, z)];
    const clear = n => n === -1 || opacityFor(names[n]) < 1;      // air or see-through blocks don't hide neighbours

    // Every block that has at least one visible face (interior blocks are skipped).
    const blocks = [];       // { x, y, z, n }
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const n = cells[idx3(x, y, z)];
      if (n === -1) continue;
      const exposed = clear(at(x + 1, y, z)) || clear(at(x - 1, y, z)) || clear(at(x, y + 1, z)) ||
                      clear(at(x, y - 1, z)) || clear(at(x, y, z + 1)) || clear(at(x, y, z - 1));
      if (exposed) blocks.push({ x, y, z, n });
    }
    const byLayer = [];      // every non-air block of each layer (layer view must not skip "buried" blocks)
    for (let y = 0; y < h; y++) byLayer.push([]);
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const n = cells[idx3(x, y, z)];
      if (n !== -1) byLayer[y].push({ x, y, z, n });
    }
    const colorCache = names.map(nm => colorFor(nm) || "#ff00ff");

    // ---------- materials ----------
    const dimMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
    const flatSolid = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const flatGlass = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false });
    const SHADE = [0.6, 0.6, 1.0, 0.5, 0.8, 0.8];                 // +x -x +y -y +z -z, like the game's face lighting
    const tex = { status: "loading", per: new Map(), swatch: new Map(), used: [], all: [] };   // per: block index -> 6 materials
    const matCache = new Map();
    let meshes = [];                  // current InstancedMeshes
    let pickable = [];                // [{ mesh, items }]

    function clearMeshes() {
      meshes.forEach(m => { scene.remove(m); m.dispose && m.dispose(); });
      meshes = []; pickable = [];
    }

    function faceMaterial(canvas, tint, shade, glass, alpha) {
      const key = canvas.__id + "|" + tint + "|" + shade + "|" + glass + "|" + alpha;
      if (matCache.has(key)) return matCache.get(key);
      if (!canvas.__tex) {
        const t = new THREE.CanvasTexture(canvas);
        t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
        t.needsUpdate = true; canvas.__tex = t; tex.all.push(t);
      }
      const c = new THREE.Color(tint || "#ffffff"); c.multiplyScalar(shade);
      const m = new THREE.MeshBasicMaterial({ map: canvas.__tex, color: c, transparent: !!glass, depthWrite: !glass, alphaTest: (!glass && alpha) ? 0.5 : 0 });
      matCache.set(key, m); tex.all.push(m);
      return m;
    }

    // Load the real textures for the blocks in this build, then redraw with them.
    let canvasId = 0;
    async function loadTextures() {
      const specs = names.map(nm => faceSpec(nm));
      const want = new Set();
      specs.forEach(sp => { if (sp) ["top", "bottom", "side", "front", "overlay"].forEach(k => sp[k] && want.add(sp[k])); });
      const loaded = {};
      await Promise.all([...want].map(async t => { const c = await loadTexCanvas(t); if (c) { if (c.__id == null) c.__id = ++canvasId; loaded[t] = c; } }));
      if (state.disposed) return;
      let okBlocks = 0;
      names.forEach((nm, i) => {
        const sp = specs[i]; if (!sp) return;
        const get = t => (t && loaded[t]) || null;
        let side = get(sp.side), top = get(sp.top) || side, bottom = get(sp.bottom) || top || side, front = get(sp.front) || side;
        if (!side && !top) return;
        side = side || top;
        if (sp.overlay && get(sp.overlay) && side) {                       // grass block: tint the green edge
          const key = sp.side + "+" + sp.overlay;
          const comp = loaded[key] || (loaded[key] = compositeOverlay(side, get(sp.overlay), sp.tintOverlay));
          if (comp.__id == null) comp.__id = ++canvasId;
          side = comp; front = comp;
        }
        const glass = !!sp.glass, alphaOf = c => c && (c.__alpha == null ? (c.__alpha = hasAlpha(c)) : c.__alpha);
        const faceTint = k => sp.tintAll || (k === "top" ? sp.tintTop : null) || null;
        const mat = (c, k, shade) => faceMaterial(c, faceTint(k), shade, glass || (alphaOf(c) && /glass|ice|water/.test(cleanName(nm))), alphaOf(c));
        const six = [mat(side, "side", SHADE[0]), mat(side, "side", SHADE[1]), mat(top, "top", SHADE[2]), mat(bottom, "bottom", SHADE[3]), mat(side, "side", SHADE[4]), mat(front, "front", SHADE[5])];
        six.transparentType = glass || /glass|ice\b|water/.test(cleanName(nm));
        tex.per.set(i, six);
        try { tex.swatch.set(i, (side || top).toDataURL()); } catch (e) { /* ignore */ }
        okBlocks++;
      });
      tex.status = okBlocks ? "ready" : "failed";
      if (tex.status === "ready") { state.textures = true; bTex.disabled = false; bTex.classList.add("active"); }
      else { bTex.disabled = true; bTex.title = "Couldn't load block textures (offline?). Showing plain colours."; bTex.lastChild.textContent = "No textures"; }
      rebuild(); updateMaterials(); state.dirty = true;
    }

    function rebuild() {
      clearMeshes();
      const useTex = state.textures && tex.status === "ready";
      const groups = new Map();              // key -> { items, mats, order }
      const put = (key, b, mats, order) => { let g = groups.get(key); if (!g) { g = { items: [], mats, order }; groups.set(key, g); } g.items.push(b); };
      const add = (b, dim) => {
        if (dim) return put("dim", b, dimMat, 4);
        const six = useTex ? tex.per.get(b.n) : null;
        if (six) return put("t" + b.n, b, six, six.transparentType ? 3 : 1);
        return opacityFor(names[b.n]) < 1 ? put("glass", b, flatGlass, 2) : put("solid", b, flatSolid, 1);
      };
      if (state.mode === "layers") {
        byLayer[state.layer].forEach(b => add(b, false));
        if (state.below) blocks.forEach(b => { if (b.y < state.layer) add(b, true); });
      } else {
        blocks.forEach(b => add(b, false));
      }
      const m4 = new THREE.Matrix4(), col = new THREE.Color();
      groups.forEach((g, key) => {
        const mesh = new THREE.InstancedMesh(geo, g.mats, g.items.length);
        const flat = key === "dim" || key === "solid" || key === "glass";
        g.items.forEach((b, i) => {
          m4.makeTranslation(b.x + 0.5, b.y + 0.5, b.z + 0.5);
          mesh.setMatrixAt(i, m4);
          if (flat) {                                   // plain-colour mode: small shade variation so single blocks read
            col.set(colorCache[b.n]);
            col.offsetHSL(0, 0, ((hash(b.x + "," + b.y + "," + b.z) % 1000) / 1000 - 0.5) * 0.05);
            mesh.setColorAt(i, col);
          }
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.renderOrder = g.order;
        scene.add(mesh); meshes.push(mesh);
        if (key !== "dim") pickable.push({ mesh, items: g.items });
      });
      state.dirty = true;
    }

    // ---- ground grid + outline ----
    const grid = new THREE.GridHelper(Math.max(w, d) + 6, Math.max(w, d) + 6, 0x4f8cff, 0x555555);
    grid.position.set(w / 2, -0.01, d / 2);
    grid.material.transparent = true; grid.material.opacity = 0.35;
    scene.add(grid);

    // ---- camera ----
    const radius = Math.sqrt(w * w + h * h + d * d);
    function frameOutside() {
      state.target.set(w / 2, h / 2, d / 2);
      state.dist = radius * 1.15;
      state.yaw = 0.8; state.pitch = 0.45;
    }
    function frameInside() {
      // stand near the middle of the floor, eye height about 1.6 blocks, facing the front
      let ex = w / 2, ez = d * 0.28, ey = 1.6;
      // find a floor spot with 2 blocks of headroom, closest to the middle
      let best = null, bestD = 1e9;
      for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
        for (let y = 0; y < Math.min(h - 2, 6); y++) {
          if (at(x, y, z) !== -1 && at(x, y + 1, z) === -1 && at(x, y + 2, z) === -1) {
            const dd = (x + 0.5 - w / 2) ** 2 + (z + 0.5 - d * 0.28) ** 2;
            if (dd < bestD) { bestD = dd; best = { x, y, z }; }
            break;
          }
        }
      }
      if (best) { ex = best.x + 0.5; ez = best.z + 0.5; ey = best.y + 1 + 1.6; }
      state.eye.set(ex, ey, ez);
      state.yaw = 0; state.pitch = 0;
    }
    function frameLayer() {
      state.target.set(w / 2, state.layer + 0.5, d / 2);
      state.dist = Math.max(w, d) * 1.25 + 4;
      state.yaw = 0.5; state.pitch = 1.0;
    }
    function dirFromAngles() {
      // yaw 0 looks toward +z (the back of the build); pitch>0 looks down
      return new THREE.Vector3(Math.sin(state.yaw) * Math.cos(state.pitch), -Math.sin(state.pitch), Math.cos(state.yaw) * Math.cos(state.pitch)).normalize();
    }
    function applyCamera() {
      if (state.mode === "inside") {
        // first person: the eye stays put, yaw/pitch is where you look
        camera.position.copy(state.eye);
        camera.lookAt(state.eye.clone().add(dirFromAngles()));
        camera.near = 0.05; camera.fov = 78;
      } else {
        const dir = dirFromAngles();                       // from camera toward target
        camera.position.copy(state.target).addScaledVector(dir, -state.dist);
        camera.lookAt(state.target);
        camera.near = Math.max(0.05, state.dist / 200); camera.fov = 55;
      }
      camera.updateProjectionMatrix();
    }

    // ---- controls: one finger / left = look, two fingers / right = move, pinch / wheel = zoom ----
    const pointers = new Map();
    let dragMoved = 0, lastPinch = 0, lastMid = null, downAt = null, dragKind = "look";
    const orbitSpeed = 0.0065;

    function panBy(dx, dy) {
      // move sideways / up-down in the screen plane
      const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
      const right = new THREE.Vector3().crossVectors(fwd, camera.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
      const scale = state.mode === "inside" ? 0.02 : state.dist * 0.0016;
      const move = right.multiplyScalar(-dx * scale).add(up.multiplyScalar(dy * scale));
      if (state.mode === "inside") state.eye.add(move); else state.target.add(move);
    }
    function zoomBy(factor) {
      if (state.mode === "inside") {
        // walk forward / back
        const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
        state.eye.addScaledVector(fwd, (1 - factor) * 6);
      } else {
        state.dist = Math.min(radius * 4, Math.max(1.2, state.dist * factor));
      }
    }

    canvas.addEventListener("contextmenu", e => e.preventDefault());
    canvas.addEventListener("pointerdown", e => {
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        dragMoved = 0; downAt = { x: e.clientX, y: e.clientY };
        dragKind = (e.button === 2 || e.button === 1 || e.shiftKey) ? "move" : "look";
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        lastPinch = Math.hypot(a.x - b.x, a.y - b.y);
        lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        dragMoved = 99;
      }
      e.preventDefault();
    });
    canvas.addEventListener("pointermove", e => {
      const p = pointers.get(e.pointerId);
      if (!p) { hoverPick(e); return; }
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size === 1) {
        dragMoved += Math.abs(dx) + Math.abs(dy);
        if (dragKind === "move") panBy(dx, dy);
        else if (state.mode === "inside") {            // like turning your head: drag right = turn left, drag down = look up
          state.yaw += dx * orbitSpeed;
          state.pitch = Math.max(-1.45, Math.min(1.45, state.pitch - dy * orbitSpeed));
        } else {                                        // orbit around the build
          state.yaw -= dx * orbitSpeed;
          state.pitch = Math.max(-1.45, Math.min(1.45, state.pitch + dy * orbitSpeed));
        }
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (lastPinch > 0 && dist > 0) zoomBy(lastPinch / dist);
        if (lastMid) panBy(mid.x - lastMid.x, mid.y - lastMid.y);
        lastPinch = dist; lastMid = mid;
      }
      state.dirty = true;
      e.preventDefault();
    });
    function endPointer(e) {
      const had = pointers.has(e.pointerId);
      pointers.delete(e.pointerId);
      if (pointers.size < 2) { lastPinch = 0; lastMid = null; }
      if (had && pointers.size === 0 && dragMoved < 6 && downAt) clickPick(e);   // a tap/click, not a drag
      if (pointers.size === 1) dragMoved = 99;     // lifted one of two fingers: not a tap
    }
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);
    canvas.addEventListener("wheel", e => {
      e.preventDefault();
      zoomBy(Math.exp(e.deltaY * 0.0012));
      state.dirty = true;
    }, { passive: false });

    // ---- picking: tap/hover a block to see its name ----
    const ray = new THREE.Raycaster();
    function pick(e) {
      const r = canvas.getBoundingClientRect();
      const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1));
      ray.setFromCamera(ndc, camera);
      let best = null;
      pickable.forEach(g => {
        const hit = ray.intersectObject(g.mesh, false)[0];
        if (hit && hit.instanceId != null && (!best || hit.distance < best.distance)) best = { distance: hit.distance, b: g.items[hit.instanceId] };
      });
      return best && best.b;
    }
    function showTip(b, e) {
      if (!b) { tip.classList.remove("on"); return; }
      const r = stage.getBoundingClientRect();
      tip.textContent = `${prettyName(names[b.n])}  ·  x${b.x + 1} y${b.y + 1} z${b.z + 1}`;
      tip.style.left = Math.min(r.width - 10, Math.max(10, e.clientX - r.left)) + "px";
      tip.style.top = Math.max(8, e.clientY - r.top - 34) + "px";
      tip.classList.add("on");
    }
    let hoverRaf = 0;
    function hoverPick(e) {
      if (e.pointerType === "touch" || hoverRaf) return;
      hoverRaf = requestAnimationFrame(() => { hoverRaf = 0; showTip(pick(e), e); });
    }
    function clickPick(e) { showTip(pick(e), e); if (e.pointerType === "touch") setTimeout(() => tip.classList.remove("on"), 2500); }
    canvas.addEventListener("pointerleave", () => tip.classList.remove("on"));

    // ---- materials list ----
    function updateMaterials() {
      const counts = new Array(names.length).fill(0);
      let total = 0;
      for (let y = 0; y < h; y++) {
        if (state.mode === "layers" && y !== state.layer) continue;
        for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) { const n = cells[idx3(x, y, z)]; if (n !== -1) { counts[n]++; total++; } }
      }
      matsSum.textContent = (state.mode === "layers" ? `Blocks in layer ${state.layer + 1}` : "Materials") + ` (${total} blocks)`;
      matsList.textContent = "";
      names.map((nm, i) => ({ nm, i, c: counts[i] })).filter(r => r.c > 0).sort((a, b) => b.c - a.c).forEach(r => {
        const row = el("div", "bv-mat");
        const sw = el("span", "bv-swatch"); sw.style.background = colorCache[r.i];
        if (state.textures && tex.swatch.get(r.i)) { sw.style.backgroundImage = `url(${tex.swatch.get(r.i)})`; sw.style.backgroundSize = "cover"; sw.style.imageRendering = "pixelated"; }
        const label = el("span", "bv-mat-name", prettyName(nm(r.i)));
        const cnt = el("span", "bv-mat-count", `${r.c}` + (r.c >= 64 ? ` (${Math.floor(r.c / 64)} st + ${r.c % 64})` : ""));
        row.append(sw, label, cnt); matsList.appendChild(row);
      });
      function nm(i) { return names[i]; }
    }

    // ---- UI wiring ----
    function setLayerLabel() { lLabel.textContent = `Layer ${state.layer + 1} / ${h}`; slider.value = state.layer; }
    function setMode(m) {
      state.mode = m;
      [[bOut, "outside"], [bIn, "inside"], [bLay, "layers"]].forEach(([b, k]) => b.classList.toggle("active", k === m));
      layerBar.style.display = m === "layers" ? "flex" : "none";
      if (m === "outside") { frameOutside(); hint.textContent = "Drag to rotate · right-drag or two fingers to move · scroll or pinch to zoom"; }
      if (m === "inside") { frameInside(); hint.textContent = "Drag to look around · right-drag or two fingers to move · scroll or pinch to walk"; }
      if (m === "layers") { frameLayer(); hint.textContent = "Use the slider to step through layers · drag to rotate"; }
      setLayerLabel(); rebuild(); updateMaterials(); state.dirty = true;
    }
    bOut.addEventListener("click", () => setMode("outside"));
    bIn.addEventListener("click", () => setMode("inside"));
    bLay.addEventListener("click", () => setMode("layers"));
    function setLayer(n) {
      state.layer = Math.max(0, Math.min(h - 1, n));
      state.target.y = state.layer + 0.5;
      setLayerLabel(); rebuild(); updateMaterials(); state.dirty = true;
    }
    lPrev.addEventListener("click", () => setLayer(state.layer - 1));
    lNext.addEventListener("click", () => setLayer(state.layer + 1));
    slider.addEventListener("input", () => setLayer(parseInt(slider.value, 10) || 0));
    lBelow.classList.add("active");
    lBelow.addEventListener("click", () => { state.below = !state.below; lBelow.classList.toggle("active", state.below); rebuild(); });
    root.tabIndex = 0;
    root.addEventListener("keydown", e => {
      if (state.mode !== "layers") return;
      if (e.key === "ArrowUp" || e.key === "PageUp") { setLayer(state.layer + 1); e.preventDefault(); }
      if (e.key === "ArrowDown" || e.key === "PageDown") { setLayer(state.layer - 1); e.preventDefault(); }
    });

    // ---- render loop (draws only when something changed) ----
    function resize() {
      const r = stage.getBoundingClientRect();
      const cw = Math.max(200, Math.floor(r.width)), ch = Math.max(200, Math.floor(r.height));
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch; camera.updateProjectionMatrix();
      state.dirty = true;
    }
    function frame() {
      if (state.disposed) return;
      if (!root.isConnected) {            // removed from the page (chat cleared): free the GPU
        if (root.__seen) dispose();
        else requestAnimationFrame(frame);   // not attached yet
        return;
      }
      root.__seen = true;
      if (state.dirty) { applyCamera(); renderer.render(scene, camera); state.dirty = false; }
      requestAnimationFrame(frame);
    }
    function dispose() {
      state.disposed = true;
      clearMeshes(); geo.dispose(); flatSolid.dispose(); flatGlass.dispose(); dimMat.dispose(); tex.all.forEach(t => t.dispose && t.dispose());
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) { /* ignore */ }
      if (ro) ro.disconnect();
      mo.disconnect();
    }
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(resize); ro.observe(stage); }
    else window.addEventListener("resize", resize);
    // theme change (light/dark): keep the canvas background see-through; grid colour adapts
    const mo = new MutationObserver(() => { grid.material.color && grid.material.color.set(document.body.classList.contains("light") ? 0x888888 : 0x555555); state.dirty = true; })
      .observe(document.body, { attributes: true, attributeFilter: ["class"] });

    bTex.addEventListener("click", () => {
      if (tex.status !== "ready") return;
      state.textures = !state.textures;
      bTex.classList.toggle("active", state.textures);
      rebuild(); updateMaterials();
    });
    setMode("outside");
    resize();
    loadTextures().catch(() => { tex.status = "failed"; bTex.disabled = true; bTex.lastChild.textContent = "No textures"; });
    requestAnimationFrame(frame);
    return root;
  }

  /* ------------------------- public entry ------------------------- */
  function errorBox(message) {
    const box = el("div", "chart-error");
    box.innerHTML = '<div class="chart-error-msg"><i class="fa-solid fa-triangle-exclamation"></i> <span></span></div>';
    box.querySelector("span").textContent = "Couldn't draw this build: " + message;
    return box;
  }

  function build(text) {
    let spec;
    try { spec = parseBuild(text); } catch (e) { return errorBox(e instanceof SyntaxError ? "the build data wasn't valid JSON." : e.message); }
    const holder = el("div", "chart-block build-block");
    holder.textContent = "Loading 3D viewer...";
    ensureThree().then(THREE => {
      try {
        holder.replaceWith(buildViewer(spec, THREE));
        const chat = document.getElementById("chat");
        if (chat) chat.scrollTop = chat.scrollHeight;
      } catch (e) { holder.replaceWith(errorBox(/webgl/i.test(e.message) ? "this device doesn't support 3D graphics (WebGL)." : e.message)); }
    }).catch(err => holder.replaceWith(errorBox(err.message)));
    return holder;
  }

  // plain-text version for copy / download / read-aloud
  function toText(text) {
    try {
      const s = parseBuild(text);
      const counts = {};
      s.cells.forEach(n => { if (n !== -1) counts[s.names[n]] = (counts[s.names[n]] || 0) + 1; });
      const lines = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map(k => `- ${prettyName(k)}: ${counts[k]}`);
      return `**${s.title}** (${s.w}×${s.h}×${s.d} blocks)\n\nMaterials:\n${lines.join("\n")}`;
    } catch (e) { return "[Minecraft build]"; }
  }

  window.Agent1102Build = { build, toText, looksLikeBuild, _parse: parseBuild, _colorFor: colorFor };
})();

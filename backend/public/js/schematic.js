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


  /* ===================== real Minecraft block models =====================
     Exact shapes and textures come from the game's own model files: for every block the viewer reads its
     "blockstate" (which model, rotated how, for these properties) and the model (boxes + which texture on
     which face), then builds the geometry itself. Nothing from the game is stored in this project: the files are
     downloaded in the visitor's browser from a public GitHub mirror when a build is shown. If that fails
     (offline / blocked) the viewer falls back to plain coloured cubes. */
  const ASSET_ROOTS = [
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.21/assets/minecraft/",
    "https://cdn.jsdelivr.net/gh/InventivetalentDev/minecraft-assets@1.21/assets/minecraft/"
  ];
  let assetReached = false;                 // becomes true once ANY file has been downloaded

  const jsonCache = new Map();
  function fetchAsset(path) {               // -> parsed JSON, or null if it doesn't exist / can't be loaded
    if (!jsonCache.has(path)) {
      jsonCache.set(path, (async () => {
        let sawNetworkError = false;
        for (const root of ASSET_ROOTS) {
          try {
            const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
            const timer = ctl ? setTimeout(() => ctl.abort(), 20000) : 0;
            const r = await fetch(root + path, ctl ? { signal: ctl.signal } : undefined);
            clearTimeout(timer);
            if (r.ok) { assetReached = true; return await r.json(); }
            if (r.status === 404) { assetReached = true; return null; }
          } catch (e) { sawNetworkError = true; }
        }
        if (sawNetworkError) throw new Error("network");
        return null;
      })().catch(() => { jsonCache.delete(path); return null; }));
    }
    return jsonCache.get(path);
  }

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
  // path like "block/stone". Animated textures are tall strips: only the first (square) frame is used.
  function loadTexCanvas(path) {
    if (!texCache.has(path)) {
      texCache.set(path, (async () => {
        for (const root of ASSET_ROOTS) {
          const img = await loadImage(root + "textures/" + path + ".png");
          if (img && img.width) {
            assetReached = true;
            const size = img.width;
            const c = document.createElement("canvas");
            c.width = size; c.height = size;
            const ctx = c.getContext("2d", { willReadFrequently: true });
            ctx.drawImage(img, 0, 0, size, size, 0, 0, size, size);
            return c;
          }
        }
        return null;
      })().then(c => { if (!c) texCache.delete(path); return c; }));
    }
    return texCache.get(path);
  }

  /* ---- models: load a model and everything it inherits from ---- */
  const modelCache = new Map();
  function loadModel(rawName) {
    const name = String(rawName).replace(/^minecraft:/, "");
    if (!modelCache.has(name)) {
      modelCache.set(name, (async () => {
        if (name.indexOf("builtin/") === 0) return { builtin: name, textures: {}, elements: null };
        const json = await fetchAsset("models/" + name + ".json");
        if (!json) return null;
        const parent = json.parent ? await loadModel(json.parent) : null;
        return {
          textures: Object.assign({}, parent ? parent.textures : {}, json.textures || {}),
          elements: json.elements || (parent ? parent.elements : null),
          builtin: (!json.elements && parent && parent.builtin) || null
        };
      })());
    }
    return modelCache.get(name);
  }
  // "#side" -> "minecraft:block/x" -> "block/x"
  function resolveTexRef(ref, textures) {
    let r = ref, guard = 0;
    while (typeof r === "string" && r.charAt(0) === "#" && guard++ < 12) r = textures[r.slice(1)];
    if (typeof r !== "string" || r.charAt(0) === "#") return null;
    return r.replace(/^minecraft:/, "");
  }

  /* ---- block states ---- */
  const PROP_PREF = { half: ["bottom", "lower"], facing: ["north"], shape: ["straight"], type: ["bottom", "single"], axis: ["y"],
    hinge: ["left"], part: ["foot"], face: ["wall", "floor"], attachment: ["floor"], orientation: ["north_up"], tilt: ["none"] };
  function defaultProp(k, values) {
    const pref = PROP_PREF[k];
    if (pref) for (const p of pref) if (values.has(p)) return p;
    for (const p of ["false", "0", "none"]) if (values.has(p)) return p;
    return values.size ? [...values][0] : "false";
  }
  function walkWhen(w, fn) {
    if (!w) return;
    if (w.OR || w.AND) { (w.OR || w.AND).forEach(x => walkWhen(x, fn)); return; }
    Object.keys(w).forEach(k => fn(k, String(w[k])));
  }
  function stateValues(bs) {
    if (bs.__vals) return bs.__vals;
    const vals = {};
    const note = (k, v) => { (vals[k] = vals[k] || new Set()).add(v); };
    if (bs.variants) Object.keys(bs.variants).forEach(key => { if (key && key !== "normal") key.split(",").forEach(p => { const i = p.indexOf("="); if (i > 0) note(p.slice(0, i), p.slice(i + 1)); }); });
    if (bs.multipart) bs.multipart.forEach(part => walkWhen(part.when, (k, v) => v.split("|").forEach(x => note(k, x))));
    Object.defineProperty(bs, "__vals", { value: vals, enumerable: false });
    return vals;
  }
  function whenOK(w, eff) {
    if (w.OR) return w.OR.some(x => whenOK(x, eff));
    if (w.AND) return w.AND.every(x => whenOK(x, eff));
    return Object.keys(w).every(k => String(w[k]).split("|").indexOf(eff(k)) !== -1);
  }
  // -> list of { model, x, y, uvlock } to draw for this block state
  function selectApplies(bs, props, rnd) {
    const vals = stateValues(bs);
    const eff = k => (props[k] !== undefined ? String(props[k]) : defaultProp(k, vals[k] || new Set()));
    const pickOne = a => (Array.isArray(a) ? a[rnd % a.length] : a);
    const out = [];
    if (bs.variants) {
      const keys = Object.keys(bs.variants);
      let hit = null;
      for (const key of keys) {
        if (key === "" || key === "normal" || key.split(",").every(p => { const i = p.indexOf("="); return eff(p.slice(0, i)) === p.slice(i + 1); })) { hit = bs.variants[key]; break; }
      }
      if (!hit && keys.length) hit = bs.variants[keys[0]];
      if (hit) out.push(pickOne(hit));
    }
    if (bs.multipart) bs.multipart.forEach(part => { if (!part.when || whenOK(part.when, eff)) out.push(pickOne(part.apply)); });
    return out.filter(Boolean);
  }

  /* ---- properties the game works out from the neighbours (fences, walls, panes, stair corners) ---- */
  const NOT_FULL = /(stairs|slab|fence|wall|pane|bars|door|torch|lantern|ladder|carpet|sign|button|plate|banner|bed$|chest|cake|candle|chain|lever|rail|flower|tulip|poppy|dandelion|orchid|allium|bluet|daisy|cornflower|lily|rose_bush|peony|lilac|sapling|grass|fern|bush|vine|leaves|glass|ice|water|lava|cobweb|slime|honey|fire|snow$|head|skull|pot$|cauldron|hopper|anvil|bell|brewing|lectern|enchanting|end_rod|lightning|scaffolding|campfire|repeater|comparator|redstone_wire|tripwire|farmland|dirt_path|soul_sand|cactus|dripleaf|pickle|egg|coral|kelp|seagrass|azalea|mushroom$|air)/;
  const isSolidBlock = id => !!id && !NOT_FULL.test(id);
  const isFence = id => /_fence$/.test(id) && !/fence_gate$/.test(id);
  const isPane = id => id === "iron_bars" || /(^|_)glass_pane$/.test(id);
  const isWall = id => /_wall$/.test(id) && !/wall_(torch|sign|banner|head|skull|hanging_sign)/.test(id);
  const isStairs = id => /_stairs$/.test(id);
  const HDIRS = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };
  const CCW = { north: "west", west: "south", south: "east", east: "north" };
  const OPP = { north: "south", south: "north", east: "west", west: "east" };

  // info(x,y,z) -> { id, props } | null.  Fills in only what the author did not state.
  function deriveProps(id, props, x, y, z, info) {
    const p = Object.assign({}, props);
    const nb = (dx, dy, dz) => info(x + dx, y + dy, z + dz);
    if (isFence(id)) {
      const cat = id === "nether_brick_fence" ? "n" : "w";
      Object.keys(HDIRS).forEach(dir => {
        if (p[dir] !== undefined) return;
        const o = nb(HDIRS[dir][0], 0, HDIRS[dir][1]);
        let c = false;
        if (o) {
          if (isFence(o.id)) c = (o.id === "nether_brick_fence" ? "n" : "w") === cat;
          else if (/fence_gate$/.test(o.id)) { const f = o.props.facing || "north"; c = (dir === "north" || dir === "south") ? (f === "east" || f === "west") : (f === "north" || f === "south"); }
          else c = isSolidBlock(o.id);
        }
        p[dir] = c ? "true" : "false";
      });
    } else if (isPane(id)) {
      Object.keys(HDIRS).forEach(dir => {
        if (p[dir] !== undefined) return;
        const o = nb(HDIRS[dir][0], 0, HDIRS[dir][1]);
        p[dir] = (o && (isPane(o.id) || isWall(o.id) || isSolidBlock(o.id) || /(^|_)glass$/.test(o.id))) ? "true" : "false";
      });
    } else if (isWall(id)) {
      const above = nb(0, 1, 0);
      const aboveSolid = !!above && (isWall(above.id) || isSolidBlock(above.id));
      const conn = {};
      Object.keys(HDIRS).forEach(dir => {
        const o = nb(HDIRS[dir][0], 0, HDIRS[dir][1]);
        conn[dir] = !!o && (isWall(o.id) || /fence_gate$/.test(o.id) || isSolidBlock(o.id));
        if (p[dir] === undefined) p[dir] = conn[dir] ? (aboveSolid ? "tall" : "low") : "none";
      });
      if (p.up === undefined) {
        const n = Object.keys(HDIRS).filter(d => p[d] !== "none");
        const straight = n.length === 2 && OPP[n[0]] === n[1];
        p.up = (!straight || aboveSolid) ? "true" : "false";
      }
    } else if (isStairs(id)) {
      const facing = p.facing || "north", half = p.half || "bottom";
      if (p.shape === undefined) {
        const stair = (dir) => { const o = nb(HDIRS[dir][0], 0, HDIRS[dir][1]); return o && isStairs(o.id) && (o.props.half || "bottom") === half ? o : null; };
        const axisOf = d => (d === "north" || d === "south" ? "z" : "x");
        const canTake = (dir) => { const o = nb(HDIRS[dir][0], 0, HDIRS[dir][1]); return !(o && isStairs(o.id)) || (o.props.facing || "north") !== facing || (o.props.half || "bottom") !== half; };
        let shape = "straight";
        const front = stair(facing);
        if (front) {
          const d2 = front.props.facing || "north";
          if (axisOf(d2) !== axisOf(facing) && canTake(OPP[d2])) shape = d2 === CCW[facing] ? "outer_left" : "outer_right";
        }
        if (shape === "straight") {
          const back = stair(OPP[facing]);
          if (back) {
            const d3 = back.props.facing || "north";
            if (axisOf(d3) !== axisOf(facing) && canTake(d3)) shape = d3 === CCW[facing] ? "inner_left" : "inner_right";
          }
        }
        p.shape = shape;
      }
    }
    return p;
  }

  /* ---- tints (grass, leaves, water ...: the files are grey, the game colours them by biome) ---- */
  function tintFor(id, tintindex) {
    if (tintindex === undefined || tintindex === null) return null;
    if (id === "water") return "#3f76e4";
    if (/leaves$/.test(id)) {
      if (/^(azalea|flowering_azalea|cherry)/.test(id)) return null;
      if (/^birch/.test(id)) return "#80a755";
      if (/^spruce/.test(id)) return "#619961";
      return "#77ab2f";
    }
    if (id === "vine") return "#77ab2f";
    if (id === "lily_pad") return "#208030";
    if (id === "redstone_wire") return "#4b0000";
    if (/^(grass_block|short_grass|tall_grass|fern|large_fern|sugar_cane|potted_fern)$/.test(id)) return "#91bd59";
    return null;
  }

  /* ---- shapes for blocks the game draws with special code (chests, beds, signs...) and for unknown blocks ---- */
  function boxModel(boxes) {               // boxes: [{ from, to, tex }] -> a model with the same texture on every face
    const textures = {}, elements = [];
    boxes.forEach((b, i) => {
      textures["t" + i] = b.tex;
      const faces = {};
      ["down", "up", "north", "south", "west", "east"].forEach(f => { faces[f] = { texture: "#t" + i, cullface: (b.cull ? f : undefined), tintindex: b.tint }; });
      elements.push({ from: b.from, to: b.to, faces });
    });
    return { textures, elements, builtin: null, synthetic: true };
  }
  function colorWord(id) { for (const c of COLOR_WORDS) if (id === c || id.indexOf(c + "_") === 0 || id.indexOf("_" + c + "_") !== -1 || id.slice(-c.length - 1) === "_" + c) return c; return null; }
  function specialModel(id) {
    const wood = (WOODS_RE.exec(id) || [])[1] || "oak";
    if (id === "water") return boxModel([{ from: [0, 0, 0], to: [16, 16, 16], tex: "block/water_still", tint: 0, cull: true }]);
    if (id === "lava") return boxModel([{ from: [0, 0, 0], to: [16, 16, 16], tex: "block/lava_still", cull: true }]);
    if (/(^|_)chest$/.test(id)) return boxModel([{ from: [1, 0, 1], to: [15, 14, 15], tex: id === "ender_chest" ? "block/obsidian" : "block/oak_planks" }]);
    if (/_bed$/.test(id)) return boxModel([{ from: [0, 3, 0], to: [16, 9, 16], tex: "block/" + (colorWord(id) || "red") + "_wool" }, { from: [0, 0, 0], to: [3, 3, 3], tex: "block/oak_planks" }, { from: [13, 0, 13], to: [16, 3, 16], tex: "block/oak_planks" }]);
    if (/(^|_)(wall_)?(hanging_)?sign$/.test(id)) return boxModel([{ from: [1, 8, 7], to: [15, 16, 9], tex: "block/" + wood + "_planks" }, { from: [7, 0, 7.5], to: [9, 8, 8.5], tex: "block/" + wood + "_planks" }]);
    if (/_banner$/.test(id)) return boxModel([{ from: [2, 0, 7], to: [14, 16, 9], tex: "block/" + (colorWord(id) || "white") + "_wool" }]);
    if (/shulker_box$/.test(id)) return boxModel([{ from: [0, 0, 0], to: [16, 16, 16], tex: "block/" + (colorWord(id) || "purple") + "_concrete", cull: true }]);
    return null;
  }
  const WOODS_RE = /^(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped)/;
  const HIDDEN_IDS = /^(air|cave_air|void_air|barrier|light|structure_void|moving_piston)$/;

  /* ---- geometry helpers ---- */
  const FACES = ["down", "up", "north", "south", "west", "east"];
  const DIRV = { down: [0, -1, 0], up: [0, 1, 0], north: [0, 0, -1], south: [0, 0, 1], west: [-1, 0, 0], east: [1, 0, 0] };
  // corners in the order top-left, top-right, bottom-right, bottom-left AS SEEN FROM OUTSIDE (the game's convention)
  function faceCorners(f, a, b) {
    const [x1, y1, z1] = a, [x2, y2, z2] = b;
    switch (f) {
      case "north": return [[x2, y2, z1], [x1, y2, z1], [x1, y1, z1], [x2, y1, z1]];
      case "south": return [[x1, y2, z2], [x2, y2, z2], [x2, y1, z2], [x1, y1, z2]];
      case "west": return [[x1, y2, z1], [x1, y2, z2], [x1, y1, z2], [x1, y1, z1]];
      case "east": return [[x2, y2, z2], [x2, y2, z1], [x2, y1, z1], [x2, y1, z2]];
      case "up": return [[x1, y2, z1], [x2, y2, z1], [x2, y2, z2], [x1, y2, z2]];
      default: return [[x1, y1, z2], [x2, y1, z2], [x2, y1, z1], [x1, y1, z1]];   // down
    }
  }
  function defaultUV(f, a, b) {
    const [x1, y1, z1] = a, [x2, y2, z2] = b;
    switch (f) {
      case "down": return [x1, 16 - z2, x2, 16 - z1];
      case "up": return [x1, z1, x2, z2];
      case "north": return [16 - x2, 16 - y2, 16 - x1, 16 - y1];
      case "south": return [x1, 16 - y2, x2, 16 - y1];
      case "west": return [z1, 16 - y2, z2, 16 - y1];
      default: return [16 - z2, 16 - y2, 16 - z1, 16 - y1];   // east
    }
  }
  const rad = d => d * Math.PI / 180;
  // standard right-handed rotation about an axis (used by element "rotation")
  function rotAxis(v, axis, deg) {
    const c = Math.cos(rad(deg)), s = Math.sin(rad(deg));
    if (axis === "x") return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
    if (axis === "y") return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
  }
  // block-state rotations: "x" tips the model, "y" turns it clockwise seen from above (both about the block centre)
  function rotVariantX(v, deg) { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [v[0], v[1] * c + v[2] * s, -v[1] * s + v[2] * c]; }
  function rotVariantY(v, deg) { const c = Math.cos(rad(deg)), s = Math.sin(rad(deg)); return [v[0] * c - v[2] * s, v[1], v[0] * s + v[2] * c]; }
  function dirName(v) {
    const ax = Math.abs(v[0]), ay = Math.abs(v[1]), az = Math.abs(v[2]);
    if (ay >= ax && ay >= az) return v[1] > 0 ? "up" : "down";
    if (az >= ax) return v[2] > 0 ? "south" : "north";
    return v[0] > 0 ? "east" : "west";
  }

  /* ---- atlas: every texture the build needs, 16x16 each, in one image ---- */
  function buildAtlas(THREE, images) {      // images: Map path -> canvas | null
    const paths = ["$white", "$missing"].concat([...images.keys()]);
    const cols = Math.ceil(Math.sqrt(paths.length)), rows = Math.ceil(paths.length / cols);
    const canvas = document.createElement("canvas");
    canvas.width = cols * 16; canvas.height = rows * 16;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = false;
    const info = new Map();
    paths.forEach((p, i) => {
      const cx = (i % cols) * 16, cy = Math.floor(i / cols) * 16;
      info.set(p, { cx, cy, cls: "opaque" });
      const img = images.get(p);
      if (p === "$white") { ctx.fillStyle = "#fff"; ctx.fillRect(cx, cy, 16, 16); }
      else if (!img) {                       // missing texture: the game's purple/black checker
        for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) { ctx.fillStyle = (xx + yy) % 2 ? "#000" : "#f800f8"; ctx.fillRect(cx + xx * 8, cy + yy * 8, 8, 8); }
      } else ctx.drawImage(img, 0, 0, img.width, img.height, cx, cy, 16, 16);
    });
    try {                                    // opaque / cut-out (leaves, glass) / translucent (stained glass, water, ice)
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      info.forEach(v => {
        let cut = 0, semi = 0;
        for (let yy = 0; yy < 16; yy++) for (let xx = 0; xx < 16; xx++) {
          const a = data[((v.cy + yy) * canvas.width + v.cx + xx) * 4 + 3];
          if (a === 0) cut++; else if (a < 250) semi++;
        }
        v.cls = semi > 4 ? "translucent" : (cut > 0 || semi > 0 ? "cutout" : "opaque");
      });
    } catch (e) { /* tainted canvas: treat everything as opaque */ }
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return { canvas, tex, info, W: canvas.width, H: canvas.height };
  }

  /* ---- bake one model (+ rotation) into quads that can be copied into any cell ---- */
  const SHADE_UP = 1.0, SHADE_DOWN = 0.5, SHADE_NS = 0.8, SHADE_EW = 0.6;
  function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function bakeDesc(desc, atlas) {
    const mdl = desc.mdl, quads = [];
    const tintRgb = desc.flat ? hexToRgb(desc.flat) : null;
    (mdl.elements || []).forEach(el => {
      const from = el.from, to = el.to;
      Object.keys(el.faces || {}).forEach(fname => {
        if (FACES.indexOf(fname) === -1) return;
        const f = el.faces[fname];
        let tpath = desc.flat ? "$white" : resolveTexRef(f.texture, mdl.textures);
        if (!tpath) return;
        const ti = atlas.info.get(tpath) || atlas.info.get("$missing");
        let corners = faceCorners(fname, from, to);
        // texture coordinates (in 0..16 texture pixels), rotated if the face says so
        const uv = f.uv || defaultUV(fname, from, to);
        const base = [[uv[0], uv[1]], [uv[2], uv[1]], [uv[2], uv[3]], [uv[0], uv[3]]];
        let rotTex = (f.rotation || 0);
        // normal of this face after every rotation (decides shading and which neighbour culls it)
        let nrm = DIRV[fname].slice();
        if (el.rotation) nrm = rotAxis(nrm, el.rotation.axis, el.rotation.angle);
        corners = corners.map(c => {
          let p = c.slice();
          if (el.rotation) {
            const o = el.rotation.origin || [8, 8, 8];
            p = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
            p = rotAxis(p, el.rotation.axis, el.rotation.angle);
            if (el.rotation.rescale) {
              const k = 1 / Math.cos(rad(Math.abs(el.rotation.angle)));
              if (el.rotation.axis !== "x") p[0] *= k;
              if (el.rotation.axis !== "y") p[1] *= k;
              if (el.rotation.axis !== "z") p[2] *= k;
            }
            p = [p[0] + o[0], p[1] + o[1], p[2] + o[2]];
          }
          p = [p[0] - 8, p[1] - 8, p[2] - 8];
          if (desc.rx) p = rotVariantX(p, desc.rx);
          if (desc.ry) p = rotVariantY(p, desc.ry);
          return [p[0] + 8, p[1] + 8, p[2] + 8];
        });
        if (desc.rx) nrm = rotVariantX(nrm, desc.rx);
        if (desc.ry) nrm = rotVariantY(nrm, desc.ry);
        const nd = dirName(nrm);
        if (desc.uvlock && (nd === "up" || nd === "down") && (desc.ry || 0)) rotTex = (rotTex + (desc.rx === 180 ? 1 : -1) * desc.ry + 720) % 360;
        const k = Math.round(rotTex / 90) % 4;
        const uvv = [0, 1, 2, 3].map(i => base[(i - k + 4) % 4]);
        const EPS = 0.02;
        const uvs = [];
        uvv.forEach(t => {
          const u = Math.min(16 - EPS, Math.max(EPS, t[0])), v = Math.min(16 - EPS, Math.max(EPS, t[1]));
          uvs.push((ti.cx + u) / atlas.W, 1 - (ti.cy + v) / atlas.H);
        });
        // shading like the game's face lighting
        let shade = 1;
        if (el.shade !== false) shade = nd === "up" ? SHADE_UP : nd === "down" ? SHADE_DOWN : (nd === "north" || nd === "south") ? SHADE_NS : SHADE_EW;
        const tint = desc.flat ? tintRgb : (f.tintindex !== undefined && desc.tintHex ? hexToRgb(desc.tintHex) : [1, 1, 1]);
        // which neighbour hides this face (cullface turns with the block)
        let cull = -1;
        if (f.cullface) {
          let cv = DIRV[f.cullface] || [0, 0, 0];
          if (desc.rx) cv = rotVariantX(cv, desc.rx);
          if (desc.ry) cv = rotVariantY(cv, desc.ry);
          cull = FACES.indexOf(dirName(cv));
        }
        quads.push({
          pos: corners.map(c => [c[0] / 16, c[1] / 16, c[2] / 16]),
          uv: uvs, col: [tint[0] * shade, tint[1] * shade, tint[2] * shade],
          cull, cls: ti.cls
        });
      });
    });
    return quads;
  }
  // a model that is exactly one full cube with all six faces present
  function isFullCube(desc) {
    const els = desc.mdl.elements;
    if (!els || els.length !== 1) return false;
    const e = els[0];
    if (e.rotation || e.from.join() !== "0,0,0" || e.to.join() !== "16,16,16") return false;
    return FACES.every(f => e.faces && e.faces[f]);
  }

  /* ---- put it all together for one build ---- */
  async function loadEngine(spec, THREE) {
    const { w, h, d, cells, names } = spec, props = spec.props || [];
    const idx3 = (x, y, z) => x + w * (z + d * y);
    const inB = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < w && y < h && z < d;
    const info = (x, y, z) => { if (!inB(x, y, z)) return null; const n = cells[idx3(x, y, z)]; return n === -1 ? null : { id: names[n], props: props[n] || {} }; };

    // 1. block-state files for every block the build uses
    const ids = [...new Set(names)].filter(id => !HIDDEN_IDS.test(id));
    const bsById = {};
    await Promise.all(ids.map(async id => { if (!specialModel(id) || id === "chest") bsById[id] = await fetchAsset("blockstates/" + id + ".json"); }));
    if (!assetReached) throw new Error("assets unreachable");

    // 2. which model(s) each cell uses (neighbour-dependent properties and random variants resolved here)
    const cellApplies = new Array(w * h * d).fill(null);
    const modelNames = new Set();
    for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
      const n = cells[idx3(x, y, z)];
      if (n === -1 || HIDDEN_IDS.test(names[n])) continue;
      const id = names[n], bs = bsById[id];
      if (!bs) { cellApplies[idx3(x, y, z)] = { n, applies: null }; continue; }
      const p = deriveProps(id, props[n] || {}, x, y, z, info);
      const applies = selectApplies(bs, p, hash(x + "," + y + "," + z));
      applies.forEach(a => { if (a.model) modelNames.add(a.model.replace(/^minecraft:/, "")); });
      cellApplies[idx3(x, y, z)] = { n, applies, p };
    }
    await Promise.all([...modelNames].map(m => loadModel(m)));

    // 3. a "part" = model + rotation (shared between cells that look the same)
    const modelResolved = new Map();
    for (const m of modelNames) modelResolved.set(m, await loadModel(m));
    const partCache = new Map();
    function partsFor(entry) {
      const id = names[entry.n];
      const key = entry.n + "|" + JSON.stringify(entry.applies || "x") + "|" + JSON.stringify(entry.p || {});
      if (partCache.has(key)) return partCache.get(key);
      let parts = [];
      const fallback = () => {
        const sp = specialModel(id);
        if (sp) return [{ mdl: sp, rx: 0, ry: 0, id }];
        const col = colorFor(id) || "#ff00ff";
        return [{ mdl: boxModel([{ from: [0, 0, 0], to: [16, 16, 16], tex: "$white", cull: true }]), rx: 0, ry: 0, flat: col, id }];
      };
      if (!entry.applies || !entry.applies.length) parts = fallback();
      else {
        parts = [];
        let usedFallback = false;
        entry.applies.forEach(a => {
          const m = modelResolved.get(String(a.model).replace(/^minecraft:/, ""));
          if (m && m.elements) parts.push({ mdl: m, rx: a.x || 0, ry: a.y || 0, uvlock: !!a.uvlock, id, tintHex: null });
          else if (!usedFallback) { usedFallback = true; fallback().forEach(fp => parts.push(fp)); }
        });
      }
      parts.forEach(pt => { pt.tintHex = pt.tintHex || tintFor(pt.id, 0); });
      partCache.set(key, parts);
      return parts;
    }

    // 4. gather every texture used, load them, build the atlas
    const cellParts = new Array(w * h * d).fill(null);
    const texPaths = new Set();
    cellApplies.forEach((e, i) => {
      if (!e) return;
      const parts = partsFor(e);
      cellParts[i] = parts;
      parts.forEach(pt => { if (pt.flat) return; (pt.mdl.elements || []).forEach(el => Object.keys(el.faces || {}).forEach(f => { const t = resolveTexRef(el.faces[f].texture, pt.mdl.textures); if (t) texPaths.add(t); })); });
    });
    const images = new Map();
    await Promise.all([...texPaths].map(async t => { images.set(t, await loadTexCanvas(t)); }));
    const atlas = buildAtlas(THREE, images);

    // 5. bake parts, work out which blocks hide their neighbours
    const bakedSeen = new Set();
    const occ = new Uint8Array(w * h * d);     // 1 = full opaque cube, 2 = full see-through cube (glass), 0 = otherwise
    cellParts.forEach((parts, i) => {
      if (!parts) return;
      parts.forEach(pt => { if (!pt.quads) pt.quads = bakeDesc(pt, atlas); });
      if (parts.length === 1) {
        const pt = parts[0];
        if (pt.full === undefined) pt.full = isFullCube(pt) ? (pt.quads.every(q => q.cls === "opaque") ? 1 : (pt.quads.some(q => q.cls === "translucent") ? 2 : 0)) : 0;
        occ[i] = pt.full;
      }
    });

    /* geometry for the layers yMin..yMax. Faces against blocks outside that range are kept (like looking at one slice). */
    function geometry(yMin, yMax) {
      const groups = { opaque: [], cutout: [], translucent: [] };
      const buf = {};
      ["opaque", "cutout", "translucent"].forEach(k => { buf[k] = { pos: [], uv: [], col: [], idx: [], n: 0 }; });
      for (let y = yMin; y <= yMax; y++) for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
        const i = idx3(x, y, z), parts = cellParts[i];
        if (!parts) continue;
        const n = cells[i];
        parts.forEach(pt => pt.quads.forEach(q => {
          if (q.cull >= 0) {
            const dv = DIRV[FACES[q.cull]], nx = x + dv[0], ny = y + dv[1], nz = z + dv[2];
            if (inB(nx, ny, nz) && ny >= yMin && ny <= yMax) {
              const j = idx3(nx, ny, nz), o = occ[j];
              if (o === 1) return;
              if (o === 2 && q.cls === "translucent" && cells[j] === n) return;
            }
          }
          const b = buf[q.cls], base = b.n;
          for (let v = 0; v < 4; v++) {
            b.pos.push(q.pos[v][0] + x, q.pos[v][1] + y, q.pos[v][2] + z);
            b.uv.push(q.uv[v * 2], q.uv[v * 2 + 1]);
            b.col.push(q.col[0], q.col[1], q.col[2]);
          }
          b.idx.push(base, base + 3, base + 2, base, base + 2, base + 1);
          b.n += 4;
        }));
      }
      const out = {};
      Object.keys(buf).forEach(k => {
        const b = buf[k];
        if (!b.n) { out[k] = null; return; }
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(b.pos), 3));
        g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(b.uv), 2));
        g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(b.col), 3));
        g.setIndex(new THREE.BufferAttribute(b.n > 65535 ? new Uint32Array(b.idx) : new Uint16Array(b.idx), 1));
        g.computeBoundingSphere();
        out[k] = g;
      });
      return out;
    }

    // small picture of a block for the materials list
    const swatchCache = new Map();
    function swatch(id) {
      if (swatchCache.has(id)) return swatchCache.get(id);
      let url = null;
      for (let i = 0; i < cellParts.length && !url; i++) {
        const parts = cellParts[i];
        if (!parts || names[cells[i]] !== id) continue;
        const pt = parts[0];
        if (pt.flat) { url = null; break; }
        const m = pt.mdl;
        const path = resolveTexRef("#particle", m.textures) || (m.elements && m.elements[0] && Object.keys(m.elements[0].faces).map(f => resolveTexRef(m.elements[0].faces[f].texture, m.textures)).find(Boolean));
        const ti = path && atlas.info.get(path);
        if (ti) {
          try {
            const c = document.createElement("canvas"); c.width = 16; c.height = 16;
            c.getContext("2d").drawImage(atlas.canvas, ti.cx, ti.cy, 16, 16, 0, 0, 16, 16);
            url = c.toDataURL();
          } catch (e) { /* ignore */ }
        }
        break;
      }
      swatchCache.set(id, url);
      return url;
    }

    return { atlas, geometry, swatch, dispose() { atlas.tex.dispose(); } };
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

  // "minecraft:oak_stairs[facing=east,half=top]" or { name, properties } -> { id, props }
  function parseBlockSpec(v) {
    const props = {};
    if (v && typeof v === "object") {
      const pr = v.properties || v.state || v.props || v.Properties || {};
      Object.keys(pr).forEach(k => { props[k.toLowerCase()] = String(pr[k]).toLowerCase(); });
      return { id: cleanName(v.name || v.id || v.block || v.Name || ""), props };
    }
    const str = String(v == null ? "" : v).trim();
    const m = /\[(.*)\]\s*$/.exec(str);
    if (m) m[1].split(",").forEach(pair => { const i = pair.indexOf("="); if (i > 0) props[pair.slice(0, i).trim().toLowerCase()] = pair.slice(i + 1).trim().toLowerCase(); });
    return { id: cleanName(str), props };
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
    const keyToIdx = {}, names = [], props = [], seen = {};
    Object.keys(palRaw).forEach(k => {
      if (k.length < 1) return;
      const sp = parseBlockSpec(palRaw[k]);
      if (!sp.id || sp.id === "air" || sp.id === "cave_air" || sp.id === "void_air") { keyToIdx[k] = -1; return; }
      const sig = sp.id + "|" + Object.keys(sp.props).sort().map(x => x + "=" + sp.props[x]).join(",");
      if (seen[sig] === undefined) { names.push(sp.id); props.push(sp.props); seen[sig] = names.length - 1; }
      keyToIdx[k] = seen[sig];
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
    return { title: String(raw.title || raw.name || "Minecraft build").slice(0, 80), w, h, d, cells, names, props, notes };
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
    modes.append(bOut, bIn, bLay);

    const stage = el("div", "bv-stage");
    const canvas = el("canvas", "bv-canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "3D view of " + spec.title);
    const tip = el("div", "bv-tip");
    const hint = el("div", "bv-hint");
    const loading = el("div", "bv-loading", "Loading block models and textures...");
    stage.append(canvas, tip, hint, loading);

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

    // ---------- drawing ----------
    // "ready": exact block models + real textures.  Until then (or if the download fails): plain coloured cubes.
    const dimMat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false });
    const flatSolid = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const flatGlass = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.4, depthWrite: false });
    const eng = { status: "loading", api: null, mats: null, cache: new Map() };
    let meshes = [];                  // everything in the scene except grid and lights
    let pickMeshes = [];              // meshes a tap/hover can hit (not the faded layers)
    let flatPick = [];                // flat mode: [{ mesh, items }]

    function clearMeshes() {
      meshes.forEach(m => { scene.remove(m); if (m.isInstancedMesh) m.dispose(); });
      meshes = []; pickMeshes = []; flatPick = [];
    }

    function geomFor(y0, y1) {                   // geometry for layers y0..y1, built once and kept
      const k = y0 + "-" + y1;
      if (!eng.cache.has(k)) eng.cache.set(k, eng.api.geometry(y0, y1));
      return eng.cache.get(k);
    }
    function addSet(set, ghost) {
      [["opaque", 1], ["cutout", 2], ["translucent", 4]].forEach(([k, order]) => {
        const g = set[k]; if (!g) return;
        const mesh = new THREE.Mesh(g, ghost ? eng.mats.ghost[k] : eng.mats[k]);
        mesh.renderOrder = ghost ? 6 : order;
        scene.add(mesh); meshes.push(mesh);
        if (!ghost) pickMeshes.push(mesh);
      });
    }
    function rebuildModels() {
      if (state.mode === "layers") {
        if (state.below && state.layer > 0) addSet(geomFor(0, state.layer - 1), true);
        addSet(geomFor(state.layer, state.layer), false);
      } else addSet(geomFor(0, h - 1), false);
    }
    function rebuildFlat() {
      const groups = { solid: [], glass: [], dim: [] };
      const add = (b, dim) => {
        if (dim) groups.dim.push(b);
        else if (opacityFor(names[b.n]) < 1) groups.glass.push(b);
        else groups.solid.push(b);
      };
      if (state.mode === "layers") {
        byLayer[state.layer].forEach(b => add(b, false));
        if (state.below) blocks.forEach(b => { if (b.y < state.layer) add(b, true); });
      } else blocks.forEach(b => add(b, false));
      const m4 = new THREE.Matrix4(), col = new THREE.Color();
      [["solid", flatSolid, 1], ["glass", flatGlass, 2], ["dim", dimMat, 3]].forEach(([key, mat, order]) => {
        const items = groups[key];
        if (!items.length) return;
        const mesh = new THREE.InstancedMesh(geo, mat, items.length);
        items.forEach((b, i) => {
          m4.makeTranslation(b.x + 0.5, b.y + 0.5, b.z + 0.5);
          mesh.setMatrixAt(i, m4);
          col.set(colorCache[b.n]);
          col.offsetHSL(0, 0, ((hash(b.x + "," + b.y + "," + b.z) % 1000) / 1000 - 0.5) * 0.05);
          mesh.setColorAt(i, col);
        });
        mesh.instanceMatrix.needsUpdate = true;
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        mesh.renderOrder = order;
        scene.add(mesh); meshes.push(mesh);
        if (key !== "dim") flatPick.push({ mesh, items });
      });
    }
    function rebuild() {
      clearMeshes();
      if (eng.status === "ready") rebuildModels(); else rebuildFlat();
      state.dirty = true;
    }

    async function startEngine() {
      try {
        const api = await loadEngine(spec, THREE);
        if (state.disposed) { api.dispose(); return; }
        const map = api.atlas.tex;
        const mk = o => new THREE.MeshBasicMaterial(Object.assign({ map, vertexColors: true }, o));
        eng.api = api;
        eng.mats = {
          opaque: mk({}),
          cutout: mk({ alphaTest: 0.5 }),
          translucent: mk({ transparent: true, depthWrite: false }),
          ghost: { opaque: mk({ transparent: true, opacity: 0.2, depthWrite: false }), cutout: mk({ transparent: true, opacity: 0.2, depthWrite: false, alphaTest: 0.1 }), translucent: mk({ transparent: true, opacity: 0.12, depthWrite: false }) }
        };
        eng.status = "ready";
      } catch (e) {
        eng.status = "failed";
        root.appendChild(el("div", "bv-note", "Couldn't download the Minecraft block models, so this is a simple colour preview. Check your connection and ask again."));
      }
      loading.remove();
      rebuild(); updateMaterials(); state.dirty = true;
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
      if (eng.status === "ready") {
        const hit = ray.intersectObjects(pickMeshes, false)[0];
        if (!hit) return null;
        const nm = hit.face.normal;
        for (const sgn of [-1, 1]) {                       // the block just behind the face we hit
          const x = Math.floor(hit.point.x + sgn * nm.x * 0.01), y = Math.floor(hit.point.y + sgn * nm.y * 0.01), z = Math.floor(hit.point.z + sgn * nm.z * 0.01);
          const n = at(x, y, z);
          if (n !== -1) return { x, y, z, n };
        }
        return null;
      }
      let best = null;
      flatPick.forEach(g => {
        const hit = ray.intersectObject(g.mesh, false)[0];
        if (hit && hit.instanceId != null && (!best || hit.distance < best.distance)) best = { distance: hit.distance, b: g.items[hit.instanceId] };
      });
      return best && best.b;
    }
    function showTip(b, e) {
      if (!b) { tip.classList.remove("on"); return; }
      const r = stage.getBoundingClientRect();
      const st = spec.props[b.n] || {}, stText = Object.keys(st).map(k => k + "=" + st[k]).join(", ");
      tip.textContent = `${prettyName(names[b.n])}${stText ? " (" + stText + ")" : ""}  ·  x${b.x + 1} y${b.y + 1} z${b.z + 1}`;
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
      const counts = new Map();
      let total = 0;
      for (let y = 0; y < h; y++) {
        if (state.mode === "layers" && y !== state.layer) continue;
        for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
          const n = cells[idx3(x, y, z)];
          if (n !== -1) { counts.set(names[n], (counts.get(names[n]) || 0) + 1); total++; }
        }
      }
      matsSum.textContent = (state.mode === "layers" ? `Blocks in layer ${state.layer + 1}` : "Materials") + ` (${total} blocks)`;
      matsList.textContent = "";
      [...counts.entries()].sort((a, b) => b[1] - a[1]).forEach(([id, c]) => {
        const row = el("div", "bv-mat");
        const sw = el("span", "bv-swatch"); sw.style.background = colorFor(id) || "#888";
        const img = eng.status === "ready" ? eng.api.swatch(id) : null;
        if (img) { sw.style.backgroundImage = `url(${img})`; sw.style.backgroundSize = "cover"; sw.style.imageRendering = "pixelated"; }
        const label = el("span", "bv-mat-name", prettyName(id));
        const cnt = el("span", "bv-mat-count", `${c}` + (c >= 64 ? ` (${Math.floor(c / 64)} st + ${c % 64})` : ""));
        row.append(sw, label, cnt); matsList.appendChild(row);
      });
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
      clearMeshes(); geo.dispose(); flatSolid.dispose(); flatGlass.dispose(); dimMat.dispose();
      eng.cache.forEach(set => Object.keys(set).forEach(k => set[k] && set[k].dispose()));
      if (eng.mats) { ["opaque", "cutout", "translucent"].forEach(k => eng.mats[k].dispose()); Object.keys(eng.mats.ghost).forEach(k => eng.mats.ghost[k].dispose()); }
      if (eng.api) eng.api.dispose();
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

    setMode("outside");
    resize();
    startEngine();
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
      s.cells.forEach(n => { if (n !== -1) counts[s.names[n]] = (counts[s.names[n]] || 0) + 1; });   // grouped by block id
      const lines = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).map(k => `- ${prettyName(k)}: ${counts[k]}`);
      return `**${s.title}** (${s.w}×${s.h}×${s.d} blocks)\n\nMaterials:\n${lines.join("\n")}`;
    } catch (e) { return "[Minecraft build]"; }
  }

  window.Agent1102Build = { build, toText, looksLikeBuild, _parse: parseBuild, _colorFor: colorFor };
})();

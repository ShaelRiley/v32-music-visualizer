// Palette port from ShaelRiley/ansi-tube, pinned in assets/provenance.json.
// Definitions, grading, farthest-point selection and 5-bit lookup are unchanged.
  const ANSI_16 = [
    [0, 0, 0], [170, 0, 0], [0, 170, 0], [170, 85, 0],
    [0, 0, 170], [170, 0, 170], [0, 170, 170], [170, 170, 170],
    [85, 85, 85], [255, 85, 85], [85, 255, 85], [255, 255, 85],
    [85, 85, 255], [255, 85, 255], [85, 255, 255], [255, 255, 255]
  ];

  const ANSI_32 = [
    ...ANSI_16,
    [24, 24, 24], [68, 68, 68], [118, 118, 118], [218, 218, 218],
    [128, 32, 32], [220, 64, 64], [128, 96, 24], [238, 164, 48],
    [32, 112, 56], [40, 210, 92], [24, 96, 128], [44, 190, 224],
    [44, 56, 150], [84, 106, 235], [116, 38, 142], [224, 74, 210]
  ];

  const EGA_64 = [];
  for (const r of [0, 85, 170, 255]) {
    for (const g of [0, 85, 170, 255]) {
      for (const b of [0, 85, 170, 255]) EGA_64.push([r, g, b]);
    }
  }

  function paletteFromHex(values) {
    return values.map((hex) => {
      const value = Number.parseInt(hex.replace("#", ""), 16);
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    });
  }

  const FIXED_PALETTES = {
    nes: paletteFromHex(["#000000", "#fcfcfc", "#f8b800", "#f87800", "#d82800", "#a80020", "#a81000", "#503000", "#007800", "#00a800", "#00b800", "#00a8a8", "#008088", "#0058f8", "#3cbcfc", "#6844fc", "#9878f8", "#d800cc", "#f878f8", "#f8a4c0", "#b8b8b8", "#7c7c7c"]),
    sms: paletteFromHex(["#000000", "#555555", "#aaaaaa", "#ffffff", "#aa0000", "#ff5555", "#ffaa00", "#ffff55", "#00aa00", "#55ff55", "#00aaaa", "#55ffff", "#0000aa", "#5555ff", "#aa00aa", "#ff55ff"]),
    genesis: paletteFromHex(["#000000", "#202020", "#404040", "#6c6c6c", "#909090", "#b4b4b4", "#d8d8d8", "#ffffff", "#fc0000", "#fc9000", "#fcdc00", "#00d800", "#00fc90", "#00d8fc", "#006cfc", "#9000fc", "#fc00d8", "#fc90b4", "#6c4824", "#b46c24", "#246c24", "#24486c"]),
    c64: paletteFromHex(["#000000", "#ffffff", "#813338", "#75cec8", "#8e3c97", "#56ac4d", "#2e2c9b", "#edf171", "#8e5029", "#553800", "#c46c71", "#4a4a4a", "#7b7b7b", "#a9ff9f", "#706deb", "#b2b2b2"]),
    apple2e: paletteFromHex(["#000000", "#ffffff", "#722640", "#e04f60", "#40337f", "#e434fe", "#1b6d85", "#73fdff", "#805d28", "#f2b233", "#5cba3c", "#d5f59e", "#236dce", "#72a7ff", "#c8c8c8", "#7d7d7d"]),
    virtualb: paletteFromHex(["#000000", "#360000", "#8c0000", "#ff0018"]),
    gbdmg: paletteFromHex(["#0f380f", "#306230", "#8bac0f", "#9bbc0f"]),
    apple2green: paletteFromHex(["#000000", "#003b12", "#00a83a", "#62ff88", "#d6ffe0"]),
    snes: paletteFromHex(["#000000", "#ffffff", "#f8d878", "#f08070", "#d05078", "#7050a0", "#3840a8", "#4888d8", "#60c0d0", "#58b070", "#80c858", "#d0d850", "#e89848", "#a85838", "#704038", "#b8a090", "#786878", "#484050"]),
    vexitrexi: paletteFromHex(["#000000", "#193019", "#4f7f4f", "#9fd49f", "#e6ffe6"]),
    zedexspectral: paletteFromHex(["#000000", "#0000d7", "#d70000", "#d700d7", "#00d700", "#00d7d7", "#d7d700", "#d7d7d7", "#0000ff", "#ff0000", "#ff00ff", "#00ff00", "#00ffff", "#ffff00", "#ffffff"]),
    atari2600: paletteFromHex(["#000000", "#404040", "#6c6c6c", "#909090", "#b0b0b0", "#ececec", "#444400", "#646410", "#848424", "#a0a034", "#b8b840", "#d0d050", "#702800", "#844414", "#985c28", "#ac783c", "#bc8c4c", "#cca05c", "#841800", "#983418", "#ac5030", "#c06848", "#d0805c", "#e09470", "#78005c", "#8c2074", "#a03c88", "#b0589c", "#c070b0", "#d084c0", "#002c70", "#164484", "#2c5c98", "#4074ac", "#5488bc", "#689cc8", "#005c5c", "#147474", "#288c8c", "#3ca0a0", "#50b4b4", "#64c8c8", "#006414", "#187c2c", "#309444", "#48ac5c", "#60c474", "#74dc88"]),
    atari5200: paletteFromHex(["#000000", "#f0f0f0", "#7c7c7c", "#f04444", "#c02020", "#f08030", "#e0c040", "#90c040", "#30a050", "#20b0a0", "#3090d0", "#4050d0", "#8030c0", "#c030a0", "#804020", "#d0a070"]),
    trash80: paletteFromHex(["#000000", "#173817", "#42a342", "#8cff8c", "#d8ffd8"]),
    oldtv: paletteFromHex(["#050805", "#263026", "#536253", "#8d9a88", "#c8cfbd", "#f2ead0"]),
    eighties: paletteFromHex(["#080018", "#28105c", "#7b2cbf", "#ff2aa1", "#ff6b35", "#ffd166", "#00f5d4", "#00bbf9", "#f8f9fa"]),
    sunburst: paletteFromHex(["#090000", "#4a0000", "#9f1800", "#e54b00", "#ff8c00", "#ffd000", "#fff3a0", "#ffffff"]),
    moonburst: paletteFromHex(["#03050d", "#0b1638", "#25246a", "#554d9c", "#9296c9", "#d7d8e8", "#fff4cf", "#ffffff"]),
    mooburst: paletteFromHex(["#050505", "#1b1712", "#3b261c", "#6b4127", "#34723e", "#b9802f", "#e5a75b", "#f0aebc", "#f5e8cf", "#ffffff"]),
    ruby: paletteFromHex(["#080005", "#320014", "#670022", "#a50735", "#db2348", "#ff5a70", "#ffadb6", "#fff4f3"]),
    enchantedforest: paletteFromHex(["#020806", "#082619", "#0d4b2b", "#147345", "#239a64", "#57c98b", "#a9edbd", "#efffe8"]),
    nightburst: paletteFromHex(["#01020b", "#050b28", "#0d1d55", "#183d82", "#2769ad", "#559bd2", "#a7cce9", "#edf7ff"]),
    snowburst: paletteFromHex(["#071018", "#163247", "#2d5f78", "#5a91a8", "#91bfd0", "#c6e1e9", "#edf8fb", "#ffffff"]),
    cyberburst: paletteFromHex(["#08000f", "#260046", "#620078", "#b00083", "#ef167f", "#ff5964", "#00e5d2", "#eaffff"]),
    grapeburst: paletteFromHex(["#09000f", "#27003d", "#520069", "#7e168e", "#a941ad", "#d176cc", "#edb8e7", "#fff1ff"]),
    candyburst: paletteFromHex(["#160713", "#4f1742", "#8f326b", "#d15188", "#ff7da0", "#ffa9bd", "#ffd2dc", "#fff7f4"]),
    chromaburst: paletteFromHex(["#050008", "#230071", "#7a008f", "#d00073", "#f43b37", "#ff9b18", "#d9ef32", "#b9ffff"]),
    soulburst: paletteFromHex(["#07030c", "#25123b", "#50245e", "#81396f", "#bd566f", "#e88968", "#f4c982", "#fff8dc"]),
    space: paletteFromHex(["#000006", "#080020", "#13004c", "#281080", "#4c2aa8", "#1b4fd8", "#138fc9", "#a75ee8", "#f0d8ff", "#ffffff"]),
    psychedelic: paletteFromHex(["#120018", "#ff007f", "#ff3d00", "#ffe600", "#40ff00", "#00ffd5", "#006eff", "#8a00ff", "#ffffff"]),
    caveman: paletteFromHex(["#080604", "#2b2117", "#513820", "#76512d", "#9a6a3a", "#b88a58", "#6a5d34", "#394324", "#b54e2b", "#d2b48c"]),
    oceania: paletteFromHex(["#001018", "#002f4b", "#005b73", "#008c95", "#00b9a8", "#42d6bd", "#2b8bc6", "#70c8e8", "#d2fff4"]),
    metallics: paletteFromHex(["#08090b", "#292c31", "#51565e", "#7f8790", "#b0b7be", "#e2e5e8", "#5c3b28", "#a46c42", "#d4a76a", "#8d939d"]),
    silvergold: paletteFromHex(["#080808", "#34363a", "#777d84", "#c5c9cf", "#f4f5f6", "#3b2a08", "#7d5711", "#bd8f27", "#e1bd57", "#fff0a3"]),
    supercomic: paletteFromHex(["#000000", "#ffffff", "#f5222d", "#ff8b00", "#ffe600", "#24c55a", "#00a7e8", "#2455ff", "#8b2cff", "#ff32a6"]),
    hyperreal: paletteFromHex(["#000000", "#ffffff", "#ff1f2d", "#ff7a00", "#ffe100", "#17d45b", "#00d6d9", "#1677ff", "#7a2cff", "#ff21a8", "#7b4b2a", "#f0c8a0"])
  };

  const PALETTE_DEPTHS = [2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 256];
  const paletteCache = new Map();

  function clamp(value, low, high) {
    return Math.max(low, Math.min(high, value));
  }

  function closestPaletteIndex(r, g, b, palette) {
    let bestIndex = 0;
    let bestDistance = Infinity;
    for (let i = 0; i < palette.length; i += 1) {
      const color = palette[i];
      const dr = r - color[0];
      const dg = g - color[1];
      const db = b - color[2];
      const distance = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function styledColor(style, r, g, b) {
    const luminance = clamp(Math.round(r * 0.299 + g * 0.587 + b * 0.114), 0, 255);
    const monochrome = {
      blackwhite: [255, 255, 255],
      cyan: [0, 255, 255],
      yellow: [255, 230, 0],
      green: [42, 255, 72],
      red: [255, 74, 48],
      purple: [214, 54, 255],
      blue: [45, 110, 255],
      pink: [255, 75, 174],
      orange: [255, 130, 25],
      amber: [255, 188, 45],
      ice: [150, 220, 255],
      toxic: [190, 255, 0],
      sepia: [218, 164, 104],
      vexitrexi: [205, 255, 205],
      trash80: [110, 255, 110]
    }[style];

    if (monochrome) {
      const scale = luminance / 255;
      return (
        Math.round(monochrome[0] * scale) << 16 |
        Math.round(monochrome[1] * scale) << 8 |
        Math.round(monochrome[2] * scale)
      );
    }

    if (style === "nativeglyph") return Math.round(r) << 16 | Math.round(g) << 8 | Math.round(b);

    if ([
      "sunburst", "moonburst", "mooburst", "ruby", "enchantedforest", "nightburst", "snowburst",
      "cyberburst", "grapeburst", "candyburst", "chromaburst", "soulburst",
      "space", "caveman", "oceania", "metallics", "silvergold", "oldtv",
      "virtualb", "gbdmg", "apple2green"
    ].includes(style)) {
      const palette = FIXED_PALETTES[style];
      const position = luminance / 255 * (palette.length - 1);
      const low = palette[Math.floor(position)];
      const high = palette[Math.ceil(position)];
      const mix = position - Math.floor(position);
      r = low[0] + (high[0] - low[0]) * mix;
      g = low[1] + (high[1] - low[1]) * mix;
      b = low[2] + (high[2] - low[2]) * mix;
    }

    if (style === "psychedelic") {
      const rotated = [g, b, r];
      r = rotated[0]; g = rotated[1]; b = rotated[2];
    }

    const grade = {
      cga: [1.65, 1.16],
      ega: [1.42, 1.10],
      vga: [1.18, 1.05],
      svga: [1.08, 1.03],
      nes: [1.38, 1.08],
      sms: [1.62, 1.12],
      genesis: [1.42, 1.08],
      c64: [1.18, 0.98],
      apple2e: [1.55, 1.10],
      virtualb: [2.10, 0.92],
      gbdmg: [0.55, 0.94],
      apple2green: [1.25, 1.08],
      snes: [1.28, 1.04],
      zedexspectral: [1.82, 1.15],
      atari2600: [1.36, 1.02],
      atari5200: [1.32, 1.04],
      eighties: [1.78, 1.13],
      psychedelic: [2.05, 1.17],
      supercomic: [1.95, 1.19],
      hyperreal: [1.60, 1.12]
    }[style];
    if (grade) {
      r = clamp((luminance + (r - luminance) * grade[0] - 128) * grade[1] + 128, 0, 255);
      g = clamp((luminance + (g - luminance) * grade[0] - 128) * grade[1] + 128, 0, 255);
      b = clamp((luminance + (b - luminance) * grade[0] - 128) * grade[1] + 128, 0, 255);
    }
    return Math.round(r) << 16 | Math.round(g) << 8 | Math.round(b);
  }

  function uniformCube(levelCount, style) {
    const colors = [];
    for (let ri = 0; ri < levelCount; ri += 1) {
      for (let gi = 0; gi < levelCount; gi += 1) {
        for (let bi = 0; bi < levelCount; bi += 1) {
          const r = Math.round(ri * 255 / (levelCount - 1));
          const g = Math.round(gi * 255 / (levelCount - 1));
          const b = Math.round(bi * 255 / (levelCount - 1));
          const packed = styledColor(style, r, g, b);
          colors.push([(packed >> 16) & 255, (packed >> 8) & 255, packed & 255]);
        }
      }
    }
    return colors;
  }

  function uniqueColors(colors) {
    const seen = new Set();
    return colors.filter((color) => {
      const key = color[0] << 16 | color[1] << 8 | color[2];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function ensureColorCount(colors, count) {
    const result = uniqueColors(colors);
    const seen = new Set(result.map((color) => color[0] << 16 | color[1] << 8 | color[2]));
    for (let value = 0; result.length < count && value < 256; value += 1) {
      for (let offset = 0; result.length < count && offset < 8; offset += 1) {
        const color = [value, clamp(value + offset, 0, 255), clamp(value + offset * 2, 0, 255)];
        const key = color[0] << 16 | color[1] << 8 | color[2];
        if (!seen.has(key)) {
          seen.add(key);
          result.push(color);
        }
      }
    }
    return result;
  }

  function farthestPalette(candidates, count) {
    if (candidates.length <= count) return candidates.slice(0, count);
    const selected = [];
    const selectedKeys = new Set();
    const minimumDistances = new Float64Array(candidates.length);
    minimumDistances.fill(Infinity);

    function add(index) {
      const color = candidates[index];
      selected.push(color);
      selectedKeys.add(color[0] << 16 | color[1] << 8 | color[2]);
      for (let i = 0; i < candidates.length; i += 1) {
        const candidate = candidates[i];
        const dr = candidate[0] - color[0];
        const dg = candidate[1] - color[1];
        const db = candidate[2] - color[2];
        const distance = dr * dr * 0.30 + dg * dg * 0.59 + db * db * 0.11;
        if (distance < minimumDistances[i]) minimumDistances[i] = distance;
      }
    }

    add(closestPaletteIndex(0, 0, 0, candidates));
    if (count > 1) add(closestPaletteIndex(255, 255, 255, candidates));
    while (selected.length < count) {
      let next = 0;
      let farthest = -1;
      for (let i = 0; i < candidates.length; i += 1) {
        const color = candidates[i];
        const key = color[0] << 16 | color[1] << 8 | color[2];
        if (!selectedKeys.has(key) && minimumDistances[i] > farthest) {
          farthest = minimumDistances[i];
          next = i;
        }
      }
      add(next);
    }
    return selected;
  }

  function buildPalette(style, depth) {
    const count = clamp(Number(depth) || 32, 2, 256);
    if (["blackwhite", "cyan", "yellow", "green", "red", "purple", "blue", "pink", "orange", "amber", "ice", "toxic", "sepia", "vexitrexi", "trash80"].includes(style)) {
      const colors = [];
      const peak = styledColor(style, 255, 255, 255);
      const target = [(peak >> 16) & 255, (peak >> 8) & 255, peak & 255];
      for (let i = 0; i < count; i += 1) {
        const position = i / (count - 1);
        colors.push(target.map((channel) => Math.round(channel * position)));
      }
      return ensureColorCount(colors, count).slice(0, count);
    }

    let candidates;
    if (style === "cga") candidates = [...ANSI_16, ...uniformCube(8, style)];
    else if (style === "ega") candidates = [...EGA_64, ...uniformCube(8, style)];
    else if (style === "vga") candidates = [...uniformCube(6, style), ...uniformCube(8, style)];
    else if (FIXED_PALETTES[style]) candidates = [...FIXED_PALETTES[style], ...uniformCube(8, style)];
    else candidates = uniformCube(8, style);
    return farthestPalette(ensureColorCount(candidates, count), count);
  }

  function getPaletteBundle(style = "standard", depth = 32) {
    if (depth === "truecolor" || style === "nativeglyph") return null;
    const normalizedDepth = PALETTE_DEPTHS.includes(Number(depth)) ? Number(depth) : 32;
    const key = `${style}:${normalizedDepth}`;
    if (paletteCache.has(key)) return paletteCache.get(key);
    const palette = buildPalette(style, normalizedDepth);
    const lookup = new Uint16Array(32 * 32 * 32);
    for (let r = 0; r < 32; r += 1) {
      for (let g = 0; g < 32; g += 1) {
        for (let b = 0; b < 32; b += 1) {
          const index = r << 10 | g << 5 | b;
          lookup[index] = closestPaletteIndex(r * 8 + 4, g * 8 + 4, b * 8 + 4, palette);
        }
      }
    }
    const bundle = { palette, lookup };
    if (paletteCache.size >= 8) paletteCache.delete(paletteCache.keys().next().value);
    paletteCache.set(key, bundle);
    return bundle;
  }

  function quantizeColor(style = "standard", depth = 32, r = 0, g = 0, b = 0, settings = {}) {
    const saturationBoost = Number(settings.saturationBoost ?? 0);
    const brightnessBoost = Number(settings.brightnessBoost ?? 0);
    let colorR = clamp(Number(r) || 0, 0, 255);
    let colorG = clamp(Number(g) || 0, 0, 255);
    let colorB = clamp(Number(b) || 0, 0, 255);
    const peak = Math.max(colorR, colorG, colorB);
    const trough = Math.min(colorR, colorG, colorB);
    const saturation = peak === 0 ? 0 : (peak - trough) / peak;
    if (saturation >= 0.02) {
      const targetSaturation = clamp(saturation * (1 + saturationBoost) + 0.06, 0, 1);
      const chromaScale = targetSaturation / saturation;
      colorR = clamp(peak - (peak - colorR) * chromaScale, 0, 255);
      colorG = clamp(peak - (peak - colorG) * chromaScale, 0, 255);
      colorB = clamp(peak - (peak - colorB) * chromaScale, 0, 255);
    }
    const valueScale = peak === 0 ? 0 : Math.min(255, peak * (1 + brightnessBoost)) / peak;
    colorR = Math.round(colorR * valueScale);
    colorG = Math.round(colorG * valueScale);
    colorB = Math.round(colorB * valueScale);
    const styled = styledColor(style, colorR, colorG, colorB);
    colorR = (styled >> 16) & 255;
    colorG = (styled >> 8) & 255;
    colorB = styled & 255;
    const paletteBundle = getPaletteBundle(style, depth);
    if (paletteBundle) {
      const lookupIndex = colorR >> 3 << 10 | colorG >> 3 << 5 | colorB >> 3;
      const matched = paletteBundle.palette[paletteBundle.lookup[lookupIndex]];
      return [matched[0], matched[1], matched[2]];
    }
    return [colorR, colorG, colorB];
  }


export { PALETTE_DEPTHS, FIXED_PALETTES, buildPalette, getPaletteBundle, quantizeColor, styledColor };

// Exact source treatment tables, shared with the GPU color stage.
export const MONOCHROME_TINTS = {
      blackwhite: [255, 255, 255],
      cyan: [0, 255, 255],
      yellow: [255, 230, 0],
      green: [42, 255, 72],
      red: [255, 74, 48],
      purple: [214, 54, 255],
      blue: [45, 110, 255],
      pink: [255, 75, 174],
      orange: [255, 130, 25],
      amber: [255, 188, 45],
      ice: [150, 220, 255],
      toxic: [190, 255, 0],
      sepia: [218, 164, 104],
      vexitrexi: [205, 255, 205],
      trash80: [110, 255, 110]
    };
export const COLOR_GRADES = {
      cga: [1.65, 1.16],
      ega: [1.42, 1.10],
      vga: [1.18, 1.05],
      svga: [1.08, 1.03],
      nes: [1.38, 1.08],
      sms: [1.62, 1.12],
      genesis: [1.42, 1.08],
      c64: [1.18, 0.98],
      apple2e: [1.55, 1.10],
      virtualb: [2.10, 0.92],
      gbdmg: [0.55, 0.94],
      apple2green: [1.25, 1.08],
      snes: [1.28, 1.04],
      zedexspectral: [1.82, 1.15],
      atari2600: [1.36, 1.02],
      atari5200: [1.32, 1.04],
      eighties: [1.78, 1.13],
      psychedelic: [2.05, 1.17],
      supercomic: [1.95, 1.19],
      hyperreal: [1.60, 1.12]
    };
export const TONE_STYLES = [
      "sunburst", "moonburst", "mooburst", "ruby", "enchantedforest", "nightburst", "snowburst",
      "cyberburst", "grapeburst", "candyburst", "chromaburst", "soulburst",
      "space", "caveman", "oceania", "metallics", "silvergold", "oldtv",
      "virtualb", "gbdmg", "apple2green"
    ];
export const PALETTES = [{"id": "standard", "name": "Standard", "group": "Core", "available": true}, {"id": "nativeglyph", "name": "Native Glyph", "group": "Core", "available": false}, {"id": "cga", "name": "CGA", "group": "Core", "available": true}, {"id": "ega", "name": "EGA", "group": "Core", "available": true}, {"id": "vga", "name": "VGA", "group": "Core", "available": true}, {"id": "svga", "name": "SVGA", "group": "Core", "available": true}, {"id": "sunburst", "name": "Sunburst", "group": "Burst Family", "available": true}, {"id": "moonburst", "name": "Moonburst", "group": "Burst Family", "available": true}, {"id": "mooburst", "name": "MooBurst🐄", "group": "Burst Family", "available": true}, {"id": "ruby", "name": "Ruby", "group": "Burst Family", "available": true}, {"id": "enchantedforest", "name": "Enchanted Forest", "group": "Burst Family", "available": true}, {"id": "nightburst", "name": "Nightburst", "group": "Burst Family", "available": true}, {"id": "snowburst", "name": "Snowburst", "group": "Burst Family", "available": true}, {"id": "cyberburst", "name": "Cyberburst", "group": "Burst Family", "available": true}, {"id": "grapeburst", "name": "Grapeburst", "group": "Burst Family", "available": true}, {"id": "candyburst", "name": "Candyburst", "group": "Burst Family", "available": true}, {"id": "chromaburst", "name": "Chromaburst", "group": "Burst Family", "available": true}, {"id": "soulburst", "name": "Soulburst", "group": "Burst Family", "available": true}, {"id": "blackwhite", "name": "Black & White", "group": "Monochrome", "available": true}, {"id": "cyan", "name": "Cyan", "group": "Monochrome", "available": true}, {"id": "yellow", "name": "Yellow", "group": "Monochrome", "available": true}, {"id": "green", "name": "Green", "group": "Monochrome", "available": true}, {"id": "red", "name": "Red", "group": "Monochrome", "available": true}, {"id": "purple", "name": "Purple", "group": "Monochrome", "available": true}, {"id": "blue", "name": "Blue", "group": "Monochrome", "available": true}, {"id": "pink", "name": "Pink", "group": "Monochrome", "available": true}, {"id": "orange", "name": "Orange", "group": "Monochrome", "available": true}, {"id": "amber", "name": "Amber", "group": "Monochrome", "available": true}, {"id": "ice", "name": "Ice", "group": "Monochrome", "available": true}, {"id": "toxic", "name": "Toxic", "group": "Monochrome", "available": true}, {"id": "sepia", "name": "Sepia", "group": "Monochrome", "available": true}, {"id": "nes", "name": "NES", "group": "Old Hardware", "available": true}, {"id": "sms", "name": "SMS", "group": "Old Hardware", "available": true}, {"id": "genesis", "name": "Genesis", "group": "Old Hardware", "available": true}, {"id": "c64", "name": "C64", "group": "Old Hardware", "available": true}, {"id": "apple2e", "name": "Apple IIe", "group": "Old Hardware", "available": true}, {"id": "apple2green", "name": "Apple II Mono Green", "group": "Old Hardware", "available": true}, {"id": "gbdmg", "name": "GB DMG", "group": "Old Hardware", "available": true}, {"id": "virtualb", "name": "Virtual B", "group": "Old Hardware", "available": true}, {"id": "snes", "name": "SNES", "group": "Old Hardware", "available": true}, {"id": "vexitrexi", "name": "Vexi Trexi", "group": "Old Hardware", "available": true}, {"id": "zedexspectral", "name": "S Zed Ex Spectral", "group": "Old Hardware", "available": true}, {"id": "atari2600", "name": "Atari 2600", "group": "Old Hardware", "available": true}, {"id": "atari5200", "name": "Atari 5200", "group": "Old Hardware", "available": true}, {"id": "trash80", "name": "Trash 80", "group": "Old Hardware", "available": true}, {"id": "oldtv", "name": "Old TV", "group": "Creative", "available": true}, {"id": "eighties", "name": "1980s", "group": "Creative", "available": true}, {"id": "space", "name": "Space", "group": "Creative", "available": true}, {"id": "psychedelic", "name": "Psychedelic", "group": "Creative", "available": true}, {"id": "caveman", "name": "Caveman", "group": "Creative", "available": true}, {"id": "oceania", "name": "Oceania", "group": "Creative", "available": true}, {"id": "metallics", "name": "Metallics", "group": "Creative", "available": true}, {"id": "silvergold", "name": "Silver and Gold", "group": "Creative", "available": true}, {"id": "supercomic", "name": "Super Comic", "group": "Creative", "available": true}, {"id": "hyperreal", "name": "Hyper Real", "group": "Creative", "available": true}];
  const HARDWARE_PRESETS = {
    nes: { saturationBoost: 0.35, brightnessBoost: 0.12, blackThreshold: 0.040 },
    sms: { saturationBoost: 0.55, brightnessBoost: 0.18, blackThreshold: 0.040 },
    genesis: { saturationBoost: 0.45, brightnessBoost: 0.12, blackThreshold: 0.035 },
    c64: { saturationBoost: 0.30, brightnessBoost: 0.10, blackThreshold: 0.045 },
    apple2e: { saturationBoost: 0.50, brightnessBoost: 0.16, blackThreshold: 0.050 },
    virtualb: { saturationBoost: 0.65, brightnessBoost: 0.03, blackThreshold: 0.085 },
    gbdmg: { saturationBoost: 0.05, brightnessBoost: 0.04, blackThreshold: 0.055 },
    apple2green: { saturationBoost: 0.12, brightnessBoost: 0.12, blackThreshold: 0.060 },
    snes: { saturationBoost: 0.38, brightnessBoost: 0.15, blackThreshold: 0.035 },
    vexitrexi: { saturationBoost: 0.05, brightnessBoost: 0.14, blackThreshold: 0.050 },
    zedexspectral: { saturationBoost: 0.70, brightnessBoost: 0.20, blackThreshold: 0.050 },
    atari2600: { saturationBoost: 0.55, brightnessBoost: 0.15, blackThreshold: 0.045 },
    atari5200: { saturationBoost: 0.45, brightnessBoost: 0.15, blackThreshold: 0.040 },
    trash80: { saturationBoost: 0.00, brightnessBoost: 0.12, blackThreshold: 0.060 }
  };


export { HARDWARE_PRESETS };

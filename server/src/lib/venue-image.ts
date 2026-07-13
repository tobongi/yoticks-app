const { PNG } = require('pngjs') as {
  PNG: any;
};

type VenueImageInput = {
  seed: string;
  title: string;
  city: string;
  category: string;
  accent?: string;
};

type Rgba = [number, number, number, number];

const WIDTH = 960;
const HEIGHT = 640;

const SKIN_TONES: Rgba[] = [
  [42, 23, 15, 255],
  [67, 38, 24, 255],
  [96, 58, 35, 255],
  [123, 77, 47, 255],
  [154, 98, 62, 255],
  [180, 118, 75, 255],
];

const CLOTHING_COLORS: Rgba[] = [
  [24, 76, 94, 255],
  [176, 52, 67, 255],
  [32, 115, 102, 255],
  [204, 141, 42, 255],
  [71, 79, 118, 255],
  [152, 66, 35, 255],
  [92, 48, 116, 255],
  [214, 108, 54, 255],
];

const ACCENT_PALETTES: Record<string, [Rgba, Rgba, Rgba]> = {
  concerts: [
    [249, 159, 34, 255],
    [217, 87, 54, 255],
    [247, 215, 130, 255],
  ],
  conferences: [
    [71, 122, 208, 255],
    [35, 58, 102, 255],
    [221, 235, 255, 255],
  ],
  soirées: [
    [198, 57, 143, 255],
    [88, 39, 130, 255],
    [247, 159, 185, 255],
  ],
  soirees: [
    [198, 57, 143, 255],
    [88, 39, 130, 255],
    [247, 159, 185, 255],
  ],
  sport: [
    [47, 140, 91, 255],
    [24, 89, 56, 255],
    [212, 241, 214, 255],
  ],
  festivals: [
    [214, 101, 52, 255],
    [107, 64, 189, 255],
    [252, 223, 112, 255],
  ],
  workshops: [
    [65, 126, 169, 255],
    [34, 75, 101, 255],
    [224, 238, 244, 255],
  ],
  meetups: [
    [214, 88, 66, 255],
    [42, 104, 116, 255],
    [243, 229, 203, 255],
  ],
  default: [
    [199, 121, 63, 255],
    [69, 94, 134, 255],
    [239, 213, 169, 255],
  ],
};

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function blendChannel(base: number, target: number, alpha: number) {
  return clamp(target * alpha + base * (1 - alpha));
}

function blendPixel(data: Buffer, index: number, color: Rgba) {
  const alpha = color[3] / 255;
  if (alpha <= 0) {
    return;
  }

  if (alpha >= 1) {
    data[index] = color[0];
    data[index + 1] = color[1];
    data[index + 2] = color[2];
    data[index + 3] = color[3];
    return;
  }

  data[index] = blendChannel(data[index], color[0], alpha);
  data[index + 1] = blendChannel(data[index + 1], color[1], alpha);
  data[index + 2] = blendChannel(data[index + 2], color[2], alpha);
  data[index + 3] = clamp(255 * (alpha + data[index + 3] / 255 * (1 - alpha)));
}

function hexToRgba(value?: string): Rgba | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return null;
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
    255,
  ];
}

function setPixel(data: Buffer, width: number, x: number, y: number, color: Rgba) {
  if (x < 0 || y < 0 || x >= width || y >= HEIGHT) {
    return;
  }

  const index = (Math.floor(y) * width + Math.floor(x)) * 4;
  blendPixel(data, index, color);
}

function fillRect(data: Buffer, width: number, x: number, y: number, w: number, h: number, color: Rgba) {
  const xStart = Math.max(0, Math.floor(x));
  const yStart = Math.max(0, Math.floor(y));
  const xEnd = Math.min(WIDTH, Math.ceil(x + w));
  const yEnd = Math.min(HEIGHT, Math.ceil(y + h));

  for (let row = yStart; row < yEnd; row += 1) {
    for (let col = xStart; col < xEnd; col += 1) {
      setPixel(data, width, col, row, color);
    }
  }
}

function fillCircle(data: Buffer, width: number, cx: number, cy: number, radius: number, color: Rgba) {
  const minX = Math.max(0, Math.floor(cx - radius));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + radius));
  const minY = Math.max(0, Math.floor(cy - radius));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + radius));
  const radiusSq = radius * radius;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= radiusSq) {
        setPixel(data, width, x, y, color);
      }
    }
  }
}

function fillEllipse(data: Buffer, width: number, cx: number, cy: number, rx: number, ry: number, color: Rgba) {
  const minX = Math.max(0, Math.floor(cx - rx));
  const maxX = Math.min(WIDTH - 1, Math.ceil(cx + rx));
  const minY = Math.max(0, Math.floor(cy - ry));
  const maxY = Math.min(HEIGHT - 1, Math.ceil(cy + ry));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setPixel(data, width, x, y, color);
      }
    }
  }
}

function drawLine(data: Buffer, width: number, x0: number, y0: number, x1: number, y1: number, color: Rgba, thickness = 1) {
  const dx = Math.abs(x1 - x0);
  const sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0);
  const sy = y0 < y1 ? 1 : -1;
  let error = dx + dy;

  while (true) {
    for (let offsetY = -thickness; offsetY <= thickness; offsetY += 1) {
      for (let offsetX = -thickness; offsetX <= thickness; offsetX += 1) {
        setPixel(data, width, x0 + offsetX, y0 + offsetY, color);
      }
    }

    if (x0 === x1 && y0 === y1) {
      break;
    }

    const doubleError = 2 * error;
    if (doubleError >= dy) {
      error += dy;
      x0 += sx;
    }
    if (doubleError <= dx) {
      error += dx;
      y0 += sy;
    }
  }
}

function drawBackground(data: Buffer, width: number, height: number, palette: [Rgba, Rgba, Rgba]) {
  for (let y = 0; y < height; y += 1) {
    const position = y / Math.max(1, height - 1);
    const channel = position < 0.55 ? position / 0.55 : (position - 0.55) / 0.45;
    const topBlend = position < 0.55 ? position / 0.55 : 1;
    const bottomBlend = position < 0.55 ? 0 : (position - 0.55) / 0.45;
    const left = palette[0];
    const middle = palette[1];
    const right = palette[2];

    const base: Rgba = [
      clamp(left[0] * (1 - channel) + middle[0] * channel),
      clamp(left[1] * (1 - channel) + middle[1] * channel),
      clamp(left[2] * (1 - channel) + middle[2] * channel),
      255,
    ];

    const accent = [
      clamp(base[0] * (1 - bottomBlend) + right[0] * bottomBlend),
      clamp(base[1] * (1 - bottomBlend) + right[1] * bottomBlend),
      clamp(base[2] * (1 - bottomBlend) + right[2] * bottomBlend),
      255,
    ] as Rgba;

    const glow = [
      clamp(accent[0] * (1 - topBlend) + right[0] * topBlend * 0.15),
      clamp(accent[1] * (1 - topBlend) + right[1] * topBlend * 0.15),
      clamp(accent[2] * (1 - topBlend) + right[2] * topBlend * 0.15),
      255,
    ] as Rgba;

    for (let x = 0; x < width; x += 1) {
      data[(y * width + x) * 4] = glow[0];
      data[(y * width + x) * 4 + 1] = glow[1];
      data[(y * width + x) * 4 + 2] = glow[2];
      data[(y * width + x) * 4 + 3] = glow[3];
    }
  }
}

function normalizeCategory(category: string) {
  const normalized = category.trim().toLowerCase();
  if (normalized === 'soirées') {
    return 'soirees';
  }
  if (normalized === 'conference' || normalized === 'conférences') {
    return 'conferences';
  }
  return normalized;
}

function getPalette(category: string, seed: number): [Rgba, Rgba, Rgba] {
  const normalized = normalizeCategory(category);
  const fallback = ACCENT_PALETTES.default;
  const palette = ACCENT_PALETTES[normalized] ?? fallback;
  const offset = seed % palette.length;
  return [palette[offset], palette[(offset + 1) % palette.length], palette[(offset + 2) % palette.length]];
}

function drawGlows(data: Buffer, width: number, rng: () => number, palette: [Rgba, Rgba, Rgba]) {
  const glows = [
    [WIDTH * 0.18 + rng() * 120, HEIGHT * 0.18 + rng() * 70, 90 + rng() * 50, palette[0]],
    [WIDTH * 0.84 - rng() * 110, HEIGHT * 0.25 + rng() * 60, 80 + rng() * 45, palette[1]],
    [WIDTH * 0.5 + rng() * 80 - 40, HEIGHT * 0.11 + rng() * 35, 65 + rng() * 35, palette[2]],
  ] as Array<[number, number, number, Rgba]>;

  for (const [x, y, radius, color] of glows) {
    fillCircle(data, width, x, y, radius, [color[0], color[1], color[2], 36]);
  }
}

function drawSkyline(data: Buffer, width: number, rng: () => number, category: string, palette: [Rgba, Rgba, Rgba]) {
  const horizon = 205 + Math.floor(rng() * 24);
  const buildingBase = category === 'sport' ? 235 : 220;
  const buildingCount = category === 'conferences' || category === 'meetups' ? 8 : 10;
  let cursor = 40;

  for (let index = 0; index < buildingCount; index += 1) {
    const bw = 42 + Math.floor(rng() * 52);
    const bh = 66 + Math.floor(rng() * (category === 'sport' ? 86 : 108));
    const x = cursor + Math.floor(rng() * 20);
    const y = horizon - bh;
    const bodyColor = index % 2 === 0 ? [25, 31, 45, 255] : [38, 44, 61, 255];
    fillRect(data, width, x, y, bw, bh, bodyColor as Rgba);

    if (rng() > 0.4) {
      fillRect(data, width, x + 7, y - 10, bw - 14, 12, [bodyColor[0] + 20, bodyColor[1] + 20, bodyColor[2] + 12, 255] as Rgba);
    }

    const windows = 3 + Math.floor(rng() * 6);
    for (let w = 0; w < windows; w += 1) {
      const wx = x + 6 + Math.floor(rng() * Math.max(1, bw - 18));
      const wy = y + 8 + Math.floor(rng() * Math.max(1, bh - 24));
      fillRect(data, width, wx, wy, 6, 8, [palette[2][0], palette[2][1], palette[2][2], 150] as Rgba);
    }

    if (index % 3 === 0) {
      fillRect(data, width, x + bw / 2 - 3, y - 18, 6, 18, [26, 31, 43, 255]);
      fillCircle(data, width, x + bw / 2, y - 24, 8, [palette[0][0], palette[0][1], palette[0][2], 170] as Rgba);
    }

    cursor += bw * 0.72;
  }

  fillRect(data, width, 0, buildingBase, WIDTH, 20, [18, 18, 24, 255]);
}

function drawCategoryScene(data: Buffer, width: number, rng: () => number, category: string, palette: [Rgba, Rgba, Rgba]) {
  const normalized = normalizeCategory(category);

  if (normalized === 'conferences' || normalized === 'meetups' || normalized === 'workshops') {
    fillRect(data, width, 300, 195, 360, 150, [33, 41, 58, 255]);
    fillRect(data, width, 336, 227, 288, 88, [50, 63, 85, 255]);
    fillRect(data, width, 352, 212, 260, 10, [palette[0][0], palette[0][1], palette[0][2], 180] as Rgba);
    fillRect(data, width, 431, 250, 98, 118, [24, 28, 37, 255]);
    fillRect(data, width, 450, 214, 58, 126, [71, 82, 103, 255]);
    fillCircle(data, width, 480, 205, 24, [palette[1][0], palette[1][1], palette[1][2], 100] as Rgba);
    fillCircle(data, width, 442, 205, 24, [palette[2][0], palette[2][1], palette[2][2], 85] as Rgba);
    drawLine(data, width, 431, 252, 390, 226, [palette[0][0], palette[0][1], palette[0][2], 140] as Rgba, 2);
    drawLine(data, width, 529, 252, 570, 226, [palette[1][0], palette[1][1], palette[1][2], 140] as Rgba, 2);
    return;
  }

  if (normalized === 'sport') {
    fillRect(data, width, 120, 298, 720, 94, [33, 99, 63, 255]);
    fillRect(data, width, 120, 286, 720, 12, [230, 232, 227, 255]);
    fillRect(data, width, 200, 310, 560, 5, [248, 248, 248, 220] as Rgba);
    fillRect(data, width, 476, 288, 8, 104, [236, 237, 242, 255]);
    fillRect(data, width, 270, 220, 26, 120, [18, 23, 32, 255]);
    fillRect(data, width, 640, 220, 26, 120, [18, 23, 32, 255]);
    fillCircle(data, width, 283, 205, 24, [palette[0][0], palette[0][1], palette[0][2], 100] as Rgba);
    fillCircle(data, width, 653, 205, 24, [palette[1][0], palette[1][1], palette[1][2], 100] as Rgba);
    return;
  }

  if (normalized === 'soirees' || normalized === 'concerts' || normalized === 'festivals') {
    fillRect(data, width, 294, 208, 372, 142, [28, 22, 35, 255]);
    fillRect(data, width, 264, 228, 432, 14, [palette[0][0], palette[0][1], palette[0][2], 255] as Rgba);
    fillRect(data, width, 310, 242, 340, 82, [48, 39, 58, 255]);
    fillRect(data, width, 332, 262, 46, 82, [18, 18, 23, 255]);
    fillRect(data, width, 582, 262, 46, 82, [18, 18, 23, 255]);
    fillCircle(data, width, 390, 238, 18, [palette[2][0], palette[2][1], palette[2][2], 160] as Rgba);
    fillCircle(data, width, 570, 238, 18, [palette[1][0], palette[1][1], palette[1][2], 160] as Rgba);

    for (let i = 0; i < 8; i += 1) {
      const x = 292 + i * 56 + Math.floor(rng() * 14);
      drawLine(data, width, x, 210, x - 24, 138 + Math.floor(rng() * 30), [palette[i % 3][0], palette[i % 3][1], palette[i % 3][2], 110] as Rgba, 2);
    }
    return;
  }

  fillRect(data, width, 308, 208, 344, 118, [39, 45, 60, 255]);
  fillRect(data, width, 336, 232, 288, 74, [52, 60, 78, 255]);
  fillCircle(data, width, 470, 216, 28, [palette[0][0], palette[0][1], palette[0][2], 95] as Rgba);
}

function drawCrowd(data: Buffer, width: number, rng: () => number, palette: [Rgba, Rgba, Rgba]) {
  const crowdRows = [
    { y: 476, radius: 24, torsoHeight: 52 },
    { y: 520, radius: 22, torsoHeight: 48 },
    { y: 562, radius: 20, torsoHeight: 42 },
  ];
  const positions = [48, 108, 170, 234, 298, 362, 426, 490, 554, 618, 682, 746, 810, 874];

  for (let rowIndex = 0; rowIndex < crowdRows.length; rowIndex += 1) {
    const row = crowdRows[rowIndex];
    const offsetY = rowIndex * 12;
    const scale = 1 - rowIndex * 0.08;

    for (let index = 0; index < positions.length; index += 1) {
      const x = positions[index] + Math.floor((rng() - 0.5) * 24);
      const skin = SKIN_TONES[Math.floor((hashSeed(`${x}-${rowIndex}`) + index) % SKIN_TONES.length)];
      const clothing = CLOTHING_COLORS[Math.floor((hashSeed(`${rowIndex}-${x}`) + index * 3) % CLOTHING_COLORS.length)];
      const shoulderWidth = 38 * scale + (index % 3) * 4;
      const shoulderHeight = row.torsoHeight * scale;
      const neckColor: Rgba = [clamp(skin[0] * 0.95), clamp(skin[1] * 0.95), clamp(skin[2] * 0.95), 255];

      fillEllipse(data, width, x, row.y + offsetY, row.radius * scale * 1.02, row.radius * scale * 1.08, skin);
      fillRect(data, width, x - shoulderWidth / 2, row.y + row.radius * scale * 0.35 + offsetY, shoulderWidth, shoulderHeight, clothing);
      fillRect(data, width, x - shoulderWidth / 3, row.y + row.radius * scale * 0.15 + offsetY, shoulderWidth / 1.5, shoulderHeight * 0.5, clothing);
      fillRect(data, width, x - 8 * scale, row.y - 2 + offsetY, 16 * scale, 10 * scale, neckColor);

      if ((index + rowIndex) % 4 === 0) {
        fillCircle(data, width, x - 8 * scale, row.y - 12 + offsetY, row.radius * 0.95, [44, 36, 28, 255]);
      } else if ((index + rowIndex) % 5 === 0) {
        fillCircle(data, width, x + 7 * scale, row.y - 10 + offsetY, row.radius * 1.05, [palette[0][0], palette[0][1], palette[0][2], 220] as Rgba);
      } else if ((index + rowIndex) % 6 === 0) {
        fillRect(data, width, x - 15 * scale, row.y - 22 + offsetY, 30 * scale, 12 * scale, [palette[2][0], palette[2][1], palette[2][2], 220] as Rgba);
      }
    }
  }
}

function drawForegroundEffects(data: Buffer, width: number, rng: () => number, palette: [Rgba, Rgba, Rgba], category: string) {
  const sparkCount = category === 'conferences' ? 30 : 50;
  for (let index = 0; index < sparkCount; index += 1) {
    const x = Math.floor(rng() * WIDTH);
    const y = Math.floor(rng() * 360);
    const color = palette[index % palette.length];
    fillCircle(data, width, x, y, 2 + (index % 3), [color[0], color[1], color[2], 140] as Rgba);
  }
}

function makeCategoryLabel(category: string) {
  const normalized = normalizeCategory(category);
  if (normalized in ACCENT_PALETTES) {
    return normalized;
  }
  return 'default';
}

function renderVenueImage(input: VenueImageInput) {
  const seed = hashSeed([input.seed, input.city, input.category, input.title].join('|'));
  const rng = mulberry32(seed);
  const png = new PNG({ width: WIDTH, height: HEIGHT });
  const categoryLabel = makeCategoryLabel(input.category);
  const palette = getPalette(categoryLabel, seed);
  const accentColor = hexToRgba(input.accent);
  if (accentColor) {
    palette[1] = accentColor;
  }

  drawBackground(png.data, WIDTH, HEIGHT, palette);
  drawGlows(png.data, WIDTH, rng, palette);
  drawSkyline(png.data, WIDTH, rng, categoryLabel, palette);
  drawCategoryScene(png.data, WIDTH, rng, categoryLabel, palette);
  drawCrowd(png.data, WIDTH, rng, palette);
  drawForegroundEffects(png.data, WIDTH, rng, palette, categoryLabel);

  return PNG.sync.write(png);
}

export function buildVenueImageUrl(input: VenueImageInput) {
  const image = renderVenueImage(input);
  return `data:image/png;base64,${image.toString('base64')}`;
}

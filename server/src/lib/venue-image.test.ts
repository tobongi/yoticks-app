import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import { buildVenueImageUrl } from './venue-image';

const { PNG } = createRequire(import.meta.url)('pngjs') as {
  PNG: any;
};

test('buildVenueImageUrl returns a deterministic PNG data uri', () => {
  const first = buildVenueImageUrl({
    seed: 'venue-01-boboto',
    city: 'Kinshasa',
    category: 'Concerts',
    title: 'Centre Culturel Boboto',
  });
  const second = buildVenueImageUrl({
    seed: 'venue-01-boboto',
    city: 'Kinshasa',
    category: 'Concerts',
    title: 'Centre Culturel Boboto',
  });
  const different = buildVenueImageUrl({
    seed: 'venue-02-palais',
    city: 'Kinshasa',
    category: 'Conférences',
    title: 'Palais du Peuple',
  });

  assert.equal(first, second);
  assert.notEqual(first, different);
  assert.ok(first.startsWith('data:image/png;base64,'));

  const png = PNG.sync.read(Buffer.from(first.split(',')[1] ?? '', 'base64'));
  assert.equal(png.width, 960);
  assert.equal(png.height, 640);

  let darkCrowdPixels = 0;
  for (let y = 430; y < 640; y += 8) {
    for (let x = 0; x < 960; x += 8) {
      const index = (y * png.width + x) * 4;
      const brightness = png.data[index] + png.data[index + 1] + png.data[index + 2];
      if (brightness < 520) {
        darkCrowdPixels += 1;
      }
    }
  }

  assert.ok(darkCrowdPixels > 20);
});


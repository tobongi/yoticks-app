import assert from 'node:assert/strict';
import test from 'node:test';
import { duration, layer, opacity, radius, size, space, stroke } from './tokens';

/**
 * The audit found 14 distinct paddings and 9 corner radii used
 * interchangeably across the app. These tests keep the replacement scales
 * honest: monotonic, gap-free, and anchored to the accessibility floors that
 * actually matter on a device held one-handed in a queue.
 */

function values<T extends Record<string, number>>(scale: T): number[] {
  return Object.values(scale);
}

function isAscending(list: number[]): boolean {
  return list.every((value, index) => index === 0 || value > list[index - 1]);
}

test('the spacing scale ascends with no duplicate steps', () => {
  const steps = values(space);
  assert.ok(isAscending(steps), `spacing is not strictly ascending: ${steps.join(', ')}`);
  assert.equal(new Set(steps).size, steps.length);
});

test('spacing steps stay on a 4pt grid above the hairline value', () => {
  for (const step of values(space)) {
    if (step <= 2) {
      continue;
    }
    assert.equal(step % 4, 0, `${step} is off the 4pt grid`);
  }
});

test('the radius scale ascends and reserves one value for fully-round shapes', () => {
  const { pill, ...stepped } = radius;
  assert.ok(isAscending(values(stepped)));
  assert.ok(pill > 100, 'pill must be large enough to fully round any control');
});

test('nesting a radius inside its parent keeps corners concentric', () => {
  // The documented rule: child radius = parent radius - the padding between
  // them. A card at `lg` padded by `md` should hold a control at `sm`.
  assert.equal(radius.lg - space.sm, radius.sm);
  assert.equal(radius.xl - space.sm - 2, radius.md);
});

test('every interactive height clears the WCAG 2.2 minimum target size', () => {
  const WCAG_MINIMUM_TARGET = 24;
  const COMFORTABLE_TARGET = 44;

  assert.equal(size.touchMin, 48, 'touchMin is the documented default target');
  assert.ok(size.touchMin >= WCAG_MINIMUM_TARGET);

  for (const control of [size.controlSm, size.controlMd, size.controlLg]) {
    assert.ok(
      control >= COMFORTABLE_TARGET,
      `${control}pt control is below the ${COMFORTABLE_TARGET}pt comfortable target`,
    );
  }

  assert.ok(size.controlSm < size.controlMd);
  assert.ok(size.controlMd < size.controlLg);
});

test('icon sizes ascend and stay smaller than the controls that contain them', () => {
  assert.ok(isAscending([size.iconSm, size.iconMd, size.iconLg, size.iconXl]));
  assert.ok(size.iconXl < size.controlMd, 'a tile pictogram must fit inside a control');
});

test('motion stays short enough to never make anyone wait', () => {
  const steps = values(duration);
  assert.ok(isAscending(steps));
  assert.ok(
    duration.slow <= 320,
    'this app is used standing up; nothing should animate longer than 320ms',
  );
  assert.ok(duration.instant < 100, 'press feedback must feel immediate');
});

test('stacking order leaves no ambiguity between overlay types', () => {
  const steps = values(layer);
  assert.ok(isAscending(steps));
  assert.ok(layer.modal > layer.overlay, 'a modal sits above its own scrim');
  assert.ok(layer.toast > layer.modal, 'a toast must be reachable above a modal');
});

test('state opacities are distinguishable and never fully hide content', () => {
  assert.ok(opacity.disabled < opacity.pressed, 'disabled must read as weaker than pressed');
  assert.ok(opacity.disabled >= 0.38, 'disabled content must remain perceivable');
  assert.ok(opacity.pressed < 1);
});

test('the focus ring is thicker than a border so it cannot be mistaken for one', () => {
  assert.ok(stroke.focus > stroke.hairline);
  assert.ok(stroke.focus >= 2, 'WCAG 2.2 focus appearance needs a perceivable ring');
});

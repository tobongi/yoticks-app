import assert from 'node:assert/strict';
import test from 'node:test';
import { BREAKPOINTS, getBreakpoint, getLayout, getPhoneLayout } from './responsive-core';

test('getLayout collapses grids on tight screens', () => {
  const layout = getLayout(320);

  assert.equal(layout.isTight, true);
  assert.equal(layout.twoUpWidth, '100%');
  assert.equal(layout.tileWidth, '100%');
  assert.equal(layout.authTopPadding, 28);
});

test('getLayout preserves denser rows on wider phones', () => {
  const layout = getLayout(412);

  assert.equal(layout.isCompact, true);
  assert.equal(layout.twoUpWidth, '100%');
  assert.equal(layout.tileWidth, '48.5%');
  assert.equal(layout.featuredPosterWidth >= 168, true);
});

test('getLayout allows three-up utility tiles on roomy screens', () => {
  const layout = getLayout(480);

  assert.equal(layout.isCompact, false);
  assert.equal(layout.twoUpWidth, '48.5%');
  assert.equal(layout.tileWidth, '31.5%');
});

test('breakpoints are classified by size class, not by device name', () => {
  assert.equal(getBreakpoint(375), 'compact');
  assert.equal(getBreakpoint(BREAKPOINTS.medium - 1), 'compact');
  assert.equal(getBreakpoint(BREAKPOINTS.medium), 'medium');
  assert.equal(getBreakpoint(BREAKPOINTS.expanded - 1), 'medium');
  assert.equal(getBreakpoint(BREAKPOINTS.expanded), 'expanded');
  assert.equal(getBreakpoint(2560), 'expanded');
});

/**
 * Regression test for the worst defect the design audit found.
 *
 * The layout module used to model phone widths only, so on a 1440px browser
 * — which is how yoticks.vercel.app is most often opened on a laptop — the
 * primary call-to-action rendered 1440px wide, anchored at x=0. Content must
 * now be bounded no matter how wide the viewport gets.
 */
test('content never stretches edge to edge on a desktop browser', () => {
  for (const width of [1024, 1280, 1440, 1920, 2560, 3840]) {
    const layout = getLayout(width);
    assert.ok(
      layout.contentMaxWidth < width,
      `at ${width}px the content column (${layout.contentMaxWidth}px) must be narrower than the viewport`,
    );
    assert.ok(
      layout.contentMaxWidth <= 700,
      `at ${width}px the reading column grew to ${layout.contentMaxWidth}px, past a comfortable measure`,
    );
  }
});

test('the content column is capped but never narrower than a phone viewport', () => {
  // On a phone the column must not introduce phantom horizontal padding.
  const phone = getLayout(375);
  assert.ok(phone.contentMaxWidth >= phone.width);

  const desktop = getLayout(1440);
  assert.equal(desktop.contentMaxWidth, phone.contentMaxWidth, 'the column is one fixed measure');
  assert.ok(desktop.wideMaxWidth > desktop.contentMaxWidth, 'organiser tables get a wider column');
  assert.ok(desktop.wideMaxWidth < 1440);
});

test('layout sizing derives from the column, not the viewport', () => {
  // Otherwise a 2560px monitor produces a 2400px "poster" and a QR code
  // taller than the screen. Once the viewport is past the column width,
  // every derived size must stop growing.
  const atColumn = getLayout(620);

  for (const width of [1024, 1440, 2560, 3840]) {
    const wide = getLayout(width);
    assert.equal(
      wide.featuredPosterWidth,
      atColumn.featuredPosterWidth,
      `poster width still tracking the viewport at ${width}px`,
    );
    assert.equal(wide.qrSizeLarge, atColumn.qrSizeLarge, `QR size still tracking the viewport at ${width}px`);
    assert.ok(wide.featuredPosterWidth <= 240);
    assert.ok(wide.qrSizeLarge <= 280);
  }
});

test('modals stay readable on a phone and bounded on a desktop', () => {
  assert.equal(getLayout(320).modalCardWidth, 288);
  assert.equal(getLayout(1440).modalCardWidth, 420);
});

test('body sizing scales up rather than down as the viewport grows', () => {
  const tight = getLayout(320);
  const roomy = getLayout(768);

  assert.ok(roomy.screenPadding > tight.screenPadding);
  assert.ok(roomy.sectionGap > tight.sectionGap);
  assert.ok(roomy.qrSizeSmall > tight.qrSizeSmall);
});

test('narrow viewports are clamped so nothing computes a negative width', () => {
  const sliver = getLayout(120);
  assert.equal(sliver.width, 320);
  assert.ok(sliver.modalCardWidth > 0);
  assert.ok(sliver.featuredPosterWidth > 0);
});

test('getPhoneLayout stays available as an alias for existing call sites', () => {
  assert.deepEqual(getPhoneLayout(390), getLayout(390));
});

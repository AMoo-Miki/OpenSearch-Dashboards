/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import numeral from '@osd/numeral';
import './numeral_locales';

/* If `numeral` ever changes the names of the packaged locales, this suite will fail as intended.
 * The goal is to make sure the list of names in numeral_locales.ts is up-to-date with numerals.
 */
describe('Numeral locales', () => {
  test('all locales have a displayName', () => {
    Object.keys(numeral.locales).forEach((locale) => {
      expect(numeral.locales[locale].displayName).not.toBe(locale);
    });
  });
});

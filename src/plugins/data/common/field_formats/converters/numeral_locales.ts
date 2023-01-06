/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import numeral from '@osd/numeral';

// Add `displayName` to `NumeralJSLocale` declared by @types/numeral
declare module 'numeral' {
  interface NumeralJSLocale {
    displayName: string;
    delimiters: {
      thousands: string;
      decimal: string;
    };
    abbreviations: {
      thousand: string;
      million: string;
      billion: string;
      trillion: string;
    };
    ordinal(num: number): string;
    currency: {
      symbol: string;
    };
  }
}

/* Numeral package contains definitions for several locales but there are 3 problems with them:
 *    1. these definitions have no names for each of the locales,
 *    2. some of the definitions don't match those of `Intl`, and
 *    3. a mix of `short` and `long` compact notations are employed.
 *
 * This file attempts to solve only the problem of locales missing names. The V8 JavaScript engine introduced
 * `languageDisplay` in v9.5 (https://v8.dev/blog/v8-release-95) and when OSD consumes NodeJS 18+, the definitions
 * in this file should be generated using
 *    new Intl.DisplayNames([i18n.getLocale()], { type: 'language', languageDisplay: 'standard' }).of(locale)
 *
 * ToDo: Don't rely on now-outdated information provided by numerals; use `Intl` to produce them at initialization.
 * ToDo: Replace `chs` with `zh-HANS` for "Chinese (Simplified)" in the next major release.
 */
import 'numeral/locales.js';

// Locale names based on numeral@2.0.6
const localeNames: { [key: string]: string } = {
  bg: 'Bulgarian',
  chs: 'Chinese (Simplified)',
  cs: 'Czech',
  'da-dk': 'Danish (Denmark)',
  de: 'German',
  'de-ch': 'German (Switzerland)',
  en: 'English',
  'en-au': 'English (Australia)',
  'en-gb': 'English (United Kingdom)',
  'en-za': 'English (South Africa)',
  es: 'Spanish',
  'es-es': 'Spanish (Spain)',
  et: 'Estonian',
  fi: 'Finnish',
  fr: 'French',
  'fr-ca': 'French (Canada)',
  'fr-ch': 'French (Switzerland)',
  hu: 'Hungarian',
  it: 'Italian',
  ja: 'Japanese',
  lv: 'Latvian',
  'nl-be': 'Dutch (Belgium)',
  'nl-nl': 'Dutch (Netherlands)',
  no: 'Norwegian',
  pl: 'Polish',
  'pt-br': 'Portuguese (Brazil)',
  'pt-pt': 'Portuguese (Portugal)',
  ru: 'Russian',
  'ru-ua': 'Russian (Ukraine)',
  sk: 'Slovak',
  sl: 'Slovenian',
  th: 'Thai',
  tr: 'Turkish',
  'uk-ua': 'Ukrainian (Ukraine)',
  vi: 'Vietnamese',
};

// Add `displayName` using `localeNames` and fall-back to `locale` when not found
Object.keys(numeral.locales).forEach((locale) => {
  numeral.locales[locale].displayName = localeNames[locale] || locale;
});

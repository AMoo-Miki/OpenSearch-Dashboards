/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import numeral from '@osd/numeral';
import './numeral_locales';

import { OSD_FIELD_TYPES } from '../../osd_field_types/types';
import { FieldFormat } from '../field_format';
import { TextContextTypeConvert } from '../types';
import { UI_SETTINGS } from '../../constants';

export abstract class NumeralFormat extends FieldFormat {
  static fieldType = OSD_FIELD_TYPES.NUMBER;

  abstract id: string;
  abstract title: string;

  getParamDefaults = () => ({
    pattern: this.getConfig!(`format:${this.id}:defaultPattern`),
  });

  protected getConvertedValue(val: any): string {
    if (val === -Infinity) return '-∞';
    if (val === +Infinity) return '+∞';

    if (typeof val !== 'number' && isNaN(parseFloat(val))) return '';

    const previousLocale = numeral.locale();
    const defaultLocale = this.getConfig?.(UI_SETTINGS.FORMAT_NUMBER_DEFAULT_LOCALE) || 'en';
    numeral.locale(defaultLocale);

    const formatted = numeral(val).format(this.param('pattern'));

    numeral.locale(previousLocale);

    return formatted;
  }

  textConvert: TextContextTypeConvert = (val) => {
    return this.getConvertedValue(val);
  };
}

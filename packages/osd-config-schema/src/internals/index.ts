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

import Joi from 'joi';
import {
  AnySchema,
  JoiRoot,
  Reference,
  ExtensionRule,
  CustomHelpers,
  SchemaLike,
  ValidationErrorItem,
} from 'joi';
import { isPlainObject } from 'lodash';
import { isDuration } from 'moment';
import { Stream } from 'stream';
import { ByteSizeValue, ensureByteSizeValue } from '../byte_size_value';
import { ensureDuration } from '../duration';

export { AnySchema, Reference, SchemaLike, ValidationErrorItem };

function isMap<K, V>(o: any): o is Map<K, V> {
  return o instanceof Map;
}

const anyCustomRule: ExtensionRule = {
  args: [
    {
      name: 'validator',
      ref: true,
      assert: Joi.func().maxArity(1).required(),
    }
  ],
  validate(value, helpers, args, options) {
    let validationResultMessage;
    try {
      validationResultMessage = args.validator(value);
    } catch (e) {
      validationResultMessage = e.message || e;
    }

    if (typeof validationResultMessage === 'string') {
      return helpers.error(
        'any.custom',
        { value, message: validationResultMessage },
        args,
        options
      );
    }

    return value;
  },
};

/**
 * @internal
 */
export const internals = Joi.extend(
  {
    type: 'any',

    rules: { custom: anyCustomRule },
  },
  {
    type: 'boolean',

    base: Joi.boolean(),
    coerce(value: any, helpers: CustomHelpers) {
      // If value isn't defined, let Joi handle default value if it's defined.
      if (value === undefined) {
        return value;
      }

      // Allow strings 'true' and 'false' to be coerced to booleans (case-insensitive).

      // From Joi docs on `Joi.boolean`:
      // > Generates a schema object that matches a boolean data type. Can also
      // >  be called via bool(). If the validation convert option is on
      // > (enabled by default), a string (either "true" or "false") will be
      // converted to a boolean if specified.
      if (typeof value === 'string') {
        const normalized = value.toLowerCase();
        value = normalized === 'true' ? true : normalized === 'false' ? false : value;
      }

      if (typeof value !== 'boolean') {
        return helpers.error('boolean.base', { value });
      }

      return value;
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'binary',

    base: Joi.binary(),
    coerce(value: any, helpers: CustomHelpers) {
      // If value isn't defined, let Joi handle default value if it's defined.
      if (value !== undefined && !(typeof value === 'object' && Buffer.isBuffer(value))) {
        return helpers.error('binary.base', { value });
      }

      return value;
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'stream',

    prepare(value: any, helpers: CustomHelpers) {
      // If value isn't defined, let Joi handle default value if it's defined.
      if (value instanceof Stream) {
        return value as any;
      }

      return helpers.error('stream.base', { value });
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'string',

    base: Joi.string(),
    rules: { custom: anyCustomRule },
  },
  {
    type: 'bytes',

    coerce(value: any, helpers: CustomHelpers) {
      try {
        if (typeof value === 'string') {
          return ByteSizeValue.parse(value);
        }

        if (typeof value === 'number') {
          return new ByteSizeValue(value);
        }
      } catch (e) {
        return helpers.error('bytes.parse', { value, message: e.message });
      }

      return value;
    },
    prepare(value: any, helpers: CustomHelpers) {
      // If value isn't defined, let Joi handle default value if it's defined.
      if (value instanceof ByteSizeValue) {
        return value as any;
      }

      return helpers.error('bytes.base', { value });
    },
    rules: {
      custom: anyCustomRule,
      min: {
        args: [
          {
            name: 'limit',
            ref: true,
            assert: Joi.alternatives([Joi.number(), Joi.string()]).required(),
          }
        ],
        validate(value, helpers, args) {
          const limit = ensureByteSizeValue(args.limit)!;
          if (value.isLessThan(limit)) {
            return helpers.error('bytes.min', { value, limit });
          }

          return value;
        },
      },
      max: {
        args: [
          {
            name: 'limit',
            ref: true,
            assert: Joi.alternatives([Joi.number(), Joi.string()]).required(),
          }
        ],
        validate(value, helpers, args) {
          const limit = ensureByteSizeValue(args.limit)!;
          if (value.isGreaterThan(limit)) {
            return helpers.error('bytes.max', { value, limit });
          }

          return value;
        },
      },
    },
  },
  {
    type: 'duration',

    coerce(value: any, helpers: CustomHelpers) {
      try {
        if (typeof value === 'string' || typeof value === 'number') {
          return ensureDuration(value);
        }
      } catch (e) {
        return helpers.error('duration.parse', { value, message: e.message });
      }

      return value;
    },
    prepare(value: any, helpers: CustomHelpers) {
      if (!isDuration(value)) {
        return helpers.error('duration.base', { value });
      }

      return value;
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'number',

    base: Joi.number(),
    coerce(value: any, helpers: CustomHelpers) {
      // If value isn't defined, let Joi handle default value if it's defined.
      if (value === undefined) {
        return value;
      }

      // Do we want to allow strings that can be converted, e.g. "2"? (Joi does)
      // (this can for example be nice in http endpoints with query params)
      //
      // From Joi docs on `Joi.number`:
      // > Generates a schema object that matches a number data type (as well as
      // > strings that can be converted to numbers)
      const coercedValue: any = typeof value === 'string' ? Number(value) : value;
      if (typeof coercedValue !== 'number' || isNaN(coercedValue)) {
        return helpers.error('number.base', { value });
      }

      return value;
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'object',

    base: Joi.object(),
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined || isPlainObject(value)) {
        return value;
      }

      if (helpers.schema.$_property('convert') && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return parsed;
          }
          return helpers.error('object.base', { value: parsed });
        } catch (e) {
          return helpers.error('object.parse', { value });
        }
      }

      return helpers.error('object.base', { value });
    },
    rules: { custom: anyCustomRule },
  },
  {
    type: 'map',

    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined) {
        return value;
      }
      if (isPlainObject(value)) {
        return new Map(Object.entries(value));
      }
      if (helpers.schema.$_property('convert') && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return new Map(Object.entries(parsed));
          }
          return helpers.error('map.base', { value: parsed });
        } catch (e) {
          return helpers.error('map.parse', { value });
        }
      }

      return value;
    },
    prepare(value: any, helpers: CustomHelpers) {
      if (!isMap(value)) {
        return helpers.error('map.base', { value });
      }

      return value as any;
    },
    rules: {
      custom: anyCustomRule,
      entries: {
        args: [
          {
            name: 'key',
            ref: true,
            assert: Joi.object().schema(),
          },
          {
            name: 'value',
            ref: true,
            assert: Joi.object().schema(),
          }
        ],
        validate(value, helpers, args) {
          const result = new Map();
          for (const [entryKey, entryValue] of value) {
            const { value: validatedEntryKey, error: keyError } = helpers.validate(
              entryKey,
              args.key,
              { presence: 'required' }
            );

            if (keyError) {
              return helpers.error('map.key', { entryKey, reason: keyError });
            }

            const { value: validatedEntryValue, error: valueError } = helpers.validate(
              entryValue,
              args.value,
              { presence: 'required' }
            );

            if (valueError) {
              return helpers.error(
                'map.value',
                { entryKey, reason: valueError },
              );
            }

            result.set(validatedEntryKey, validatedEntryValue);
          }

          return result as any;
        },
      },
    },
  },
  {
    type: 'record',
    prepare(value: any, helpers: CustomHelpers) {
      if (value === undefined || isPlainObject(value)) {
        return value;
      }

      if (helpers.schema.$_property('convert') && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (isPlainObject(parsed)) {
            return parsed;
          }
          return helpers.error('record.base', { value: parsed });
        } catch (e) {
          return helpers.error('record.parse', { value });
        }
      }

      return helpers.error('record.base', { value });
    },
    rules: {
      custom: anyCustomRule,
      entries: {
        args: [
          {
            name: 'key',
            ref: true,
            assert: Joi.object().schema(),
          },
          {
            name: 'value',
            ref: true,
            assert: Joi.object().schema(),
          }
        ],
        validate(value, helpers, args) {
          const result = {} as Record<string, any>;
          for (const [entryKey, entryValue] of Object.entries(value)) {
            const { value: validatedEntryKey, error: keyError } = helpers.validate(
              entryKey,
              args.key,
              { presence: 'required' }
            );

            if (keyError) {
              return helpers.error('record.key', { entryKey, reason: keyError });
            }

            const { value: validatedEntryValue, error: valueError } = helpers.validate(
              entryValue,
              args.value,
              { presence: 'required' }
            );

            if (valueError) {
              return helpers.error(
                'record.value',
                { entryKey, reason: valueError }
              );
            }

            result[validatedEntryKey] = validatedEntryValue;
          }

          return result as any;
        },
      },
    },
  },
  {
    type: 'array',

    base: Joi.array(),
    coerce(value: any, helpers: CustomHelpers) {
      if (value === undefined || Array.isArray(value)) {
        return value;
      }

      if (helpers.schema.$_property('convert') && typeof value === 'string') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          return helpers.error('array.base', { value: parsed });
        } catch (e) {
          return helpers.error('array.parse', { value });
        }
      }

      return helpers.error('array.base', { value });
    },
    rules: { custom: anyCustomRule },
  },
) as JoiRoot;

/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { ServerExtType } from 'hapi';
import Podium from 'podium';
import { cleanControlSequences } from '@osd/std';
// @ts-expect-error: implicit any for JS file
import { Config } from '../../../../legacy/server/config';
// @ts-expect-error: implicit any for JS file
import { setupLogging } from '../../../../legacy/server/logging';
import { LogLevel, LogRecord } from '../../logging';
import { LegacyVars } from '../../types';

export const metadataSymbol = Symbol('log message with metadata');
export function attachMetaData(message: string, metadata: LegacyVars = {}) {
  return {
    [metadataSymbol]: {
      message,
      metadata,
    },
  };
}
const isEmptyObject = (obj: object) => Object.keys(obj).length === 0;

function getDataToLog(error: Error | undefined, metadata: object, message: string) {
  if (error) return error;
  if (!isEmptyObject(metadata)) return attachMetaData(message, metadata);
  return message;
}

interface PluginRegisterParams {
  plugin: {
    register: (
      server: LegacyLoggingServer,
      options: PluginRegisterParams['options']
    ) => Promise<void>;
  };
  options: LegacyVars;
}

/**
 * Converts core log level to a one that's known to the legacy platform.
 * @param level Log level from the core.
 */
function getLegacyLogLevel(level: LogLevel) {
  const logLevel = level.id.toLowerCase();
  if (logLevel === 'warn') {
    return 'warning';
  }

  if (logLevel === 'trace') {
    return 'debug';
  }

  return logLevel;
}

/**
 *  The "legacy" OpenSearch Dashboards uses Hapi server + even-better plugin to log, so we should
 *  use the same approach here to make log records generated by the core to look the
 *  same as the rest of the records generated by the "legacy" OpenSearch Dashboards. But to reduce
 *  overhead of having full blown Hapi server instance we create our own "light" version.
 *  @internal
 */
export class LegacyLoggingServer {
  public connections = [];
  // Emulates Hapi's usage of the podium event bus.
  public events: Podium = new Podium(['log', 'request', 'response']);

  private onPostStopCallback?: () => void;

  constructor(legacyLoggingConfig: Readonly<LegacyVars>) {
    // We set `ops.interval` to max allowed number and `ops` filter to value
    // that doesn't exist to avoid logging of ops at all, if turned on it will be
    // logged by the "legacy" OpenSearch Dashboards.
    const config = {
      logging: {
        ...legacyLoggingConfig,
        events: {
          ...legacyLoggingConfig.events,
          ops: '__no-ops__',
        },
      },
      ops: { interval: 2147483647 },
    };

    setupLogging(this, Config.withDefaultSchema(config));
  }

  public register({ plugin: { register }, options }: PluginRegisterParams): Promise<void> {
    return register(this, options);
  }

  public log({ level, context, message, error, timestamp, meta = {} }: LogRecord) {
    const { tags = [], ...metadata } = meta;

    this.events.emit('log', {
      data: getDataToLog(error, metadata, cleanControlSequences(message)),
      tags: [getLegacyLogLevel(level), ...context.split('.'), ...tags],
      timestamp: timestamp.getTime(),
    });
  }

  public stop() {
    // Tell the plugin we're stopping.
    if (this.onPostStopCallback !== undefined) {
      this.onPostStopCallback();
    }
  }

  public ext(eventName: ServerExtType, callback: () => void) {
    // method is called by plugin that's being registered.
    if (eventName === 'onPostStop') {
      this.onPostStopCallback = callback;
    }
    // We don't care about any others the plugin registers
  }

  public expose() {
    // method is called by plugin that's being registered.
  }
}

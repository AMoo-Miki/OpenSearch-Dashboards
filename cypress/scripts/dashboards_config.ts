/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable no-console */

import { setTimeout } from 'timers/promises';
import fetch from 'node-fetch';

const CONNECTION_TIMEOUT = 15000;
const CONNECTION_TIMEOUT_TOTAL = 60000;
const CONNECTION_RETRY_INTERVAL = 15000;

export const read = async (config: Cypress.PluginConfigOptions) => {
  const startTime = Date.now();
  do {
    const resp = await fetch(config.baseUrl, { timeout: CONNECTION_TIMEOUT });

    if (resp.status === 200) {
      console.log('OpenSearch Dashboards is configured without security.');
      config.env!.SECURITY_ENABLED = false;

      console.log('Test isolation is turned on.');
      config.testIsolation = true;

      break;
    }

    if (resp.status === 401) {
      console.log('OpenSearch Dashboards is configured with security.');
      config.env!.SECURITY_ENABLED = true;

      console.log('Test isolation is turned off.');
      config.testIsolation = false;

      break;
    }

    console.log('Waiting for OpenSearch Dashboards to be ready...');
    await setTimeout(CONNECTION_RETRY_INTERVAL);
  } while (Date.now() - startTime < CONNECTION_TIMEOUT_TOTAL);
};

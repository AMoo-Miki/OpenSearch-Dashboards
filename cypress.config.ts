/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { setTimeout } from 'timers/promises';
import { defineConfig } from 'cypress';
import codeCoverageTask from '@cypress/code-coverage/task';
import webpackPreprocessor from '@cypress/webpack-preprocessor';
import fetch from 'node-fetch';

module.exports = defineConfig({
  defaultCommandTimeout: 60000,
  requestTimeout: 60000,
  responseTimeout: 60000,
  viewportWidth: 2000,
  viewportHeight: 1320,
  env: {
    ENGINE: {
      name: 'default',
      url: 'http://localhost:9200',
    },
    SECONDARY_ENGINE: {
      name: 'test_cluster',
      url: 'http://localhost:9200',
    },
    openSearchUrl: 'http://localhost:9200',
    AGGREGATION_VIEW: false,
    username: 'admin',
    password: 'myStrongPassword123!',
    ENDPOINT_WITH_PROXY: false,
    MANAGED_SERVICE_ENDPOINT: false,
    VISBUILDER_ENABLED: true,
    DATASOURCE_MANAGEMENT_ENABLED: false,
    ML_COMMONS_DASHBOARDS_ENABLED: true,
    WAIT_FOR_LOADER_BUFFER_MS: 0,

    // This value is automatically determined at runtime
    SECURITY_ENABLED: false,
    codeCoverage: {
      url: 'http://localhost:5601/__coverage__',
    },
  },
  e2e: {
    baseUrl: 'http://localhost:5601',
    specPattern: 'cypress/integration/**/*.spec.{js,jsx,ts,tsx}',
    setupNodeEvents,
  },
});

function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Cypress.PluginConfigOptions {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('@cypress/code-coverage/task')(on, config);
   */
  codeCoverageTask(on, config);

  const { webpackOptions } = webpackPreprocessor.defaultOptions;

  /**
   * By default, cypress' internal webpack preprocessor doesn't allow imports without file extensions.
   * This makes our life a bit hard since if any file in our testing dependency graph has an import without
   * the .js extension our cypress build will fail.
   *
   * This extra rule relaxes this a bit by allowing imports without file extension
   *     ex. import module from './module'
   */
  webpackOptions!.module!.rules.unshift({
    test: /\.m?js/,
    resolve: {
      enforceExtension: false,
    },
  });

  on(
    'file:preprocessor',
    webpackPreprocessor({
      webpackOptions,
    })
  );

  on('before:run', async (details) => {
    const startTime = Date.now();
    do {
      const resp = await fetch('https://miki.osd.aws.barahmand.com/api/status');

      if (resp.status === 200) {
        console.log('OpenSearch Dashboards is configured without security');
        Cypress.env('SECURITY_ENABLED', false);
        Cypress.config('testIsolation', true);
        break;
      }

      if (resp.status === 401) {
        console.log('OpenSearch Dashboards is configured with security');
        Cypress.env('SECURITY_ENABLED', true);
        break;
      }

      console.log('Waiting for OpenSearch Dashboards to be ready...');
      await setTimeout(15000);
    } while (Date.now() - startTime < 60000);
  });

  return config;
}

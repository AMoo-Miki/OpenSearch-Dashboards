/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint no-restricted-syntax: 0 */
const https = require('https');
const { version } = require('../../package.json');
const osdMajorVersion = version.split('.')[0];

if (isNaN(osdMajorVersion))
  throw new Error(`Unable to parse version from package.json: ${version}`);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const URL =
  'https://raw.githubusercontent.com/opensearch-project/documentation-website/main/version-history.md';

/**
 * Fetch the version-history document published to the documentation website
 * @returns {Promise<string>}
 */
const getVersionHistory = () => {
  return new Promise((resolve, reject) => {
    const req = https.get(URL, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed: ${res.statusCode}`));
      }

      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => resolve(Buffer.concat(chunks).toString()));
    });

    req.on('error', reject);
    req.end();
  });
};

/**
 * Fetch the version-history document published to the documentation website and retry if it fails
 * @param [retries=3]
 * @returns {Promise<string>}
 */
const getVersionHistoryWithRetries = async (retries = 3) => {
  let attempt = 0;
  do {
    try {
      return await getVersionHistory();
    } catch (ex) {
      if (attempt++ > retries) throw ex;
      await sleep(1000);
    }
  } while (true);
};

/**
 * Returns all versions of OpenSearch that have the same major version as the current OpenSearch Dashboards
 *  Note: All previous and future releases of OpenSearch, within the same major, should be compatible.
 * @returns {Promise<any[string]>}
 */
const getCompatibleVersions = async () => {
  const versionHistory = await getVersionHistoryWithRetries();
  const versionMatcher = new RegExp(`\\[(${osdMajorVersion}\\.\\d+\\.\\d+)]`, 'g');

  const versions = new Set();
  let match;
  while ((match = versionMatcher.exec(versionHistory)) !== null) {
    versions.add(match[1]);
  }

  return Array.from(versions);
};

const run = async () => {
  const versions = await getCompatibleVersions();
  console.log(JSON.stringify(versions));
};

run().catch(console.error);

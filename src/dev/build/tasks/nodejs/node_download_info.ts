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

import { basename } from 'path';
import fetch from 'node-fetch';
import semver from 'semver';

import { Config, Platform } from '../../lib';

let NODE_VERSION: string;

export async function getNodeDownloadInfo(config: Config, platform: Platform) {
  const version = NODE_VERSION || (await getLatestNodeVersion(config.getNodeRange()));
  const arch = platform.getNodeArch();

  const downloadName = platform.isWindows()
    ? `node-v${version}-win-x64.zip`
    : `node-v${version}-${arch}.tar.gz`;

  const url = `https://nodejs.org/dist/v${version}/${downloadName}`;
  const downloadPath = config.resolveFromRepo('.node_binaries', version, basename(downloadName));
  const extractDir = config.resolveFromRepo('.node_binaries', version, arch);

  return {
    url,
    downloadName,
    downloadPath,
    extractDir,
    version,
  };
}

async function getLatestNodeVersion(range: string) {
  const releaseDoc = await fetch('https://nodejs.org/dist/index.json');
  const releaseList: [{ version: string }] = await releaseDoc.json();
  const releases = releaseList.map(({ version }) => version.replace(/^v/, ''));
  const maxVersion = semver.maxSatisfying(releases, range);

  if (!maxVersion) {
    throw new Error(`Cannot find a version of Node.js that satisfies ${range}.`);
  }

  NODE_VERSION = maxVersion;

  return maxVersion;
}

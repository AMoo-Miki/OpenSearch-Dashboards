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

import {
  PluginInitializerContext,
  CoreSetup,
  CoreStart,
  Plugin,
} from 'opensearch-dashboards/public';

import { DataPublicPluginSetup, DataPublicPluginStart } from 'src/plugins/data/public';
import { Plugin as ExpressionsPublicPlugin } from '../../expressions/public';
import { VisualizationsSetup, VisualizationsStart } from '../../visualizations/public';
import { createDashLinksVisFn } from './dashlinks_fn';
import { createDashLinksVisTypeDefinition } from './dashlinks_vis_type';
import { setApplication } from './editor_utils';

type DashLinksVisCoreSetup = CoreSetup<DashLinksVisPluginStartDependencies, void>;

export interface DashLinksSettings {
  autocompleteTimeout: number;
  autocompleteTerminateAfter: number;
}

export interface DashLinksVisDependencies {
  core: DashLinksVisCoreSetup;
  data: DataPublicPluginSetup;
  getSettings: () => Promise<DashLinksSettings>;
}

/** @internal */
export interface DashLinksVisPluginSetupDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['setup']>;
  visualizations: VisualizationsSetup;
  data: DataPublicPluginSetup;
}

/** @internal */
export interface DashLinksVisPluginStartDependencies {
  expressions: ReturnType<ExpressionsPublicPlugin['start']>;
  visualizations: VisualizationsStart;
  data: DataPublicPluginStart;
}

/** @internal */
export class DashLinksVisPlugin implements Plugin<void, void> {
  private cachedSettings: DashLinksSettings | undefined = undefined;

  constructor(public initializerContext: PluginInitializerContext) {}

  public setup(
    core: DashLinksVisCoreSetup,
    { expressions, visualizations, data }: DashLinksVisPluginSetupDependencies
  ) {
    const visualizationDependencies: Readonly<DashLinksVisDependencies> = {
      core,
      data,
      getSettings: async () => {
        if (!this.cachedSettings) {
          this.cachedSettings = await core.http.get<DashLinksSettings>(
            '/api/dashlinks_vis/settings'
          );
        }

        return this.cachedSettings;
      },
    };

    expressions.registerFunction(createDashLinksVisFn);
    visualizations.createBaseVisualization(
      createDashLinksVisTypeDefinition(visualizationDependencies)
    );
  }

  public start(core: CoreStart, deps: DashLinksVisPluginStartDependencies) {
    setApplication(core.application);
  }
}

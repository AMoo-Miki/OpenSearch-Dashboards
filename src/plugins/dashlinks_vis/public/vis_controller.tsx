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

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { EuiFlexGroup, EuiButtonEmpty, EuiFlexItem } from '@elastic/eui';

import { DashLinksVisDependencies } from './plugin';
import { ExprVis, VisParams, VisualizationController } from '../../visualizations/public';
import { DashLinkParams, DashLinksLayout, DashLinkType, getApplication } from './editor_utils';

export const createDashLinksVisController = (deps: DashLinksVisDependencies) => {
  return class DashLinksVisController implements VisualizationController {
    visParams?: VisParams;

    constructor(public el: HTMLElement, public vis: ExprVis) {}

    async render(visData: any, visParams: VisParams) {
      const menuContent = visParams.dashLinks?.map?.((dashLink: DashLinkParams) => {
        switch (dashLink.type) {
          case DashLinkType.DASHBOARD:
            return (
              <EuiFlexItem grow={false}>
                <div>
                  <EuiButtonEmpty
                    size="xs"
                    key={dashLink.id}
                    onClick={() =>
                      getApplication().navigateToApp('dashboards', {
                        path: `#/view/${dashLink.options.dashboardId}`,
                      })
                    }
                  >
                    {dashLink.label}
                  </EuiButtonEmpty>
                </div>
              </EuiFlexItem>
            );

          case DashLinkType.DISCOVER:
            return (
              <EuiFlexItem grow={false}>
                <div>
                  <EuiButtonEmpty
                    size="xs"
                    key={dashLink.id}
                    onClick={() =>
                      getApplication().navigateToApp('discover', {
                        path: `#/view/${dashLink.options.indexPatternId}`,
                      })
                    }
                  >
                    {dashLink.label}
                  </EuiButtonEmpty>
                </div>
              </EuiFlexItem>
            );
        }
      });

      render(
        <div className="dlpContainer">
          <EuiFlexGroup
            direction={visParams.layout === DashLinksLayout.HOSRIZONTAL ? 'row' : 'column'}
            wrap={visParams.wrapLinks}
            className="dlpWrapper"
          >
            {menuContent}
          </EuiFlexGroup>
        </div>,
        this.el
      );
    }

    destroy() {
      unmountComponentAtNode(this.el);
    }
  };
};

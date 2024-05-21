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

import { ApplicationStart } from 'opensearch-dashboards/public';
import { createGetterSetter } from '../../opensearch_dashboards_utils/common';

export enum DashLinkType {
  DISCOVER = 'discover',
  DASHBOARD = 'dashboard',
}

export enum DashLinksLayout {
  HOSRIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
}

export interface DashLinkParamsOptions {
  indexPatternId?: string;
  dashboardId?: string;
}

export interface DashLinkParams {
  id: string;
  type: DashLinkType;
  label: string;
  options: DashLinkParamsOptions;
}

export const setDashLink = (
  dashLinks: DashLinkParams[],
  dashLinkIndex: number,
  dashLink: DashLinkParams
): DashLinkParams[] => [
  ...dashLinks.slice(0, dashLinkIndex),
  dashLink,
  ...dashLinks.slice(dashLinkIndex + 1),
];

export const addDashLink = (
  dashLinks: DashLinkParams[],
  dashLink: DashLinkParams
): DashLinkParams[] => [...dashLinks, dashLink];

export const moveDashLink = (
  dashLinks: DashLinkParams[],
  dashLinkIndex: number,
  direction: number
): DashLinkParams[] => {
  let newIndex;
  if (direction >= 0) {
    newIndex = dashLinkIndex + 1;
  } else {
    newIndex = dashLinkIndex - 1;
  }

  if (newIndex < 0) {
    // Move first item to last
    return [...dashLinks.slice(1), dashLinks[0]];
  } else if (newIndex >= dashLinks.length) {
    const lastItemIndex = dashLinks.length - 1;
    // Move last item to first
    return [dashLinks[lastItemIndex], ...dashLinks.slice(0, lastItemIndex)];
  } else {
    const swapped = dashLinks.slice();
    const temp = swapped[newIndex];
    swapped[newIndex] = swapped[dashLinkIndex];
    swapped[dashLinkIndex] = temp;
    return swapped;
  }
};

export const removeDashLink = (
  dashLinks: DashLinkParams[],
  dashLinkIndex: number
): DashLinkParams[] => [
  ...dashLinks.slice(0, dashLinkIndex),
  ...dashLinks.slice(dashLinkIndex + 1),
];

export const getDefaultOptions = (type: DashLinkType): DashLinkParamsOptions => {
  const defaultOptions: DashLinkParamsOptions = {};
  switch (type) {
    case DashLinkType.DISCOVER:
      break;
    case DashLinkType.DASHBOARD:
      break;
  }
  return defaultOptions;
};

export const newDashLink = (type: DashLinkType): DashLinkParams => ({
  id: new Date().getTime().toString(),
  label: '',
  type,
  options: getDefaultOptions(type),
});

export const getTitle = (dashLinkParams: DashLinkParams, dashLinkIndex: number): string => {
  const label = dashLinkParams.label?.trim();
  return label ? `${dashLinkParams.label}` : `${dashLinkParams.type}: ${dashLinkIndex}`;
};

export const [getApplication, setApplication] = createGetterSetter<ApplicationStart>('Application');

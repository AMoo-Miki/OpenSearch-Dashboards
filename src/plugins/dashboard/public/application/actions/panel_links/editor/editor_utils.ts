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
import { createGetterSetter } from '../../../../../../opensearch_dashboards_utils/common';
import { PanelLink, PanelLinkOptions, PanelLinkType } from '../../../../../../embeddable/public';

export const setDashboardPanelLink = (
  links: PanelLink[],
  linkIndex: number,
  link: PanelLink
): PanelLink[] => [...links.slice(0, linkIndex), link, ...links.slice(linkIndex + 1)];

export const addDashboardPanelLink = (links: PanelLink[], link: PanelLink): PanelLink[] => [
  ...links,
  link,
];

export const moveDashboardPanelLink = (
  links: PanelLink[],
  linkIndex: number,
  direction: number
): PanelLink[] => {
  let newIndex;
  if (direction >= 0) {
    newIndex = linkIndex + 1;
  } else {
    newIndex = linkIndex - 1;
  }

  if (newIndex < 0) {
    // Move first item to last
    return [...links.slice(1), links[0]];
  } else if (newIndex >= links.length) {
    const lastItemIndex = links.length - 1;
    // Move last item to first
    return [links[lastItemIndex], ...links.slice(0, lastItemIndex)];
  } else {
    const swapped = links.slice();
    const temp = swapped[newIndex];
    swapped[newIndex] = swapped[linkIndex];
    swapped[linkIndex] = temp;
    return swapped;
  }
};

export const removeDashboardPanelLink = (links: PanelLink[], linkIndex: number): PanelLink[] => [
  ...links.slice(0, linkIndex),
  ...links.slice(linkIndex + 1),
];

export const getDefaultOptions = (type: PanelLinkType): PanelLinkOptions => {
  const defaultOptions: PanelLinkOptions = {};
  switch (type) {
    case PanelLinkType.DISCOVER:
      break;
    case PanelLinkType.DASHBOARD:
      break;
  }
  return defaultOptions;
};

export const newDashboardPanelLink = (type: PanelLinkType): PanelLink => ({
  id: new Date().getTime().toString(),
  label: '',
  type,
  options: getDefaultOptions(type),
});

export const getTitle = (linkParams: PanelLink, linkIndex: number): string => {
  const label = linkParams.label?.trim();
  return label ? `${linkParams.label}` : `${linkParams.type}: ${linkIndex}`;
};

export const [getApplication, setApplication] = createGetterSetter<ApplicationStart>('Application');

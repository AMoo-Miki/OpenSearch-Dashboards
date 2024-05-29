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

import { CoreStart } from 'src/core/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { EmbeddableStart, IEmbeddable, PanelLinkType, ViewMode } from '../../../../public';
import { openPanelLinkFlyout } from './open_panel_link_flyout';
import { Action, IncompatibleActionError } from '../../../../../ui_actions/public';
import { PanelLink } from '../../../../common';
import {
  DataPublicPluginStart,
  Filter,
  opensearchFilters,
  Query,
  QueryState,
} from '../../../../../data/public';
import { setStateToOsdUrl } from '../../../../../opensearch_dashboards_utils/public';

export const ACTION_PANEL_LINK = 'panelLinks';

// const STATE_STORAGE_KEY = '_a';
const GLOBAL_STATE_STORAGE_KEY = '_g';

function isDashboard(embeddable: IEmbeddable): boolean {
  return embeddable.type === 'dashboard';
}

export interface PanelLinkActionContext {
  embeddable: IEmbeddable;
}

export class PanelLinksAction implements Action<PanelLinkActionContext> {
  public readonly type = ACTION_PANEL_LINK;
  public id = ACTION_PANEL_LINK;
  public order = 35;

  constructor(
    private application: CoreStart['application'],
    private getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'],
    private getEmbeddablePanel: EmbeddableStart['getEmbeddablePanel'],
    private dataQuery: DataPublicPluginStart['query'],
    private overlays: CoreStart['overlays'],
    private link: PanelLink,
    private idx: number = 0
  ) {
    this.id = `${this.type}#${this.link.id}`;
    this.order -= this.idx / 100;
  }

  public getDisplayName({ embeddable }: PanelLinkActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return this.link.label;
  }

  public getIconType({ embeddable }: PanelLinkActionContext): EuiIconType {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return 'symlink';
  }

  public async isCompatible({ embeddable }: PanelLinkActionContext) {
    if (embeddable.getInput().viewMode !== ViewMode.VIEW) {
      return false;
    }

    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }

  public async execute({ embeddable }: PanelLinkActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }

    switch (this.link.type) {
      case PanelLinkType.DASHBOARD:
        openPanelLinkFlyout({
          overlays: this.overlays,
          link: this.link,
          getEmbeddableFactory: this.getEmbeddableFactory,
          getEmbeddablePanel: this.getEmbeddablePanel,
          dataQuery: this.dataQuery,
        });
        break;

      case PanelLinkType.DISCOVER:
        const appState: {
          query?: Query;
          filters?: Filter[];
        } = {};
        const queryState: QueryState = {};

        const query = this.dataQuery.queryString.getQuery();
        if (query) appState.query = query;

        const filters = this.dataQuery.filterManager.getFilters();
        if (filters?.length) {
          appState.filters = filters?.filter((f) => !opensearchFilters.isFilterPinned(f));
          queryState.filters = filters?.filter((f) => opensearchFilters.isFilterPinned(f));
        }

        const timeRange = this.dataQuery.timefilter.timefilter.getTime();
        if (timeRange) queryState.time = timeRange;

        let url = this.application.getUrlForApp('discover', {
          path: `#/view/${this.link.options.indexPatternId}`,
        });
        url = setStateToOsdUrl<QueryState>(
          GLOBAL_STATE_STORAGE_KEY,
          queryState,
          { useHash: false },
          url
        );
        // url = setStateToOsdUrl(STATE_STORAGE_KEY, appState, { useHash: false }, url);

        window.open(url, '_blank');

        break;
    }
  }
}

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

import { i18n } from '@osd/i18n';
import { CoreStart } from 'src/core/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { IEmbeddable, ViewMode } from '../../../../../embeddable/public';
import { DASHBOARD_CONTAINER_TYPE, DashboardContainer } from '../../embeddable';
import { ActionByType, IncompatibleActionError } from '../../../../../ui_actions/public';
import { openEditPanelLinksFlyout } from './open_edit_panel_links_flyout';
import { DataPublicPluginStart } from '../../../../../data/public';

export const ACTION_EDIT_PANEL_LINKS = 'editPanelLinks';

function isDashboard(embeddable: IEmbeddable): embeddable is DashboardContainer {
  return embeddable.type === DASHBOARD_CONTAINER_TYPE;
}

export interface EditPanelLinksActionContext {
  embeddable: IEmbeddable;
}

export class EditPanelLinksAction implements ActionByType<typeof ACTION_EDIT_PANEL_LINKS> {
  public readonly type = ACTION_EDIT_PANEL_LINKS;
  public readonly id = ACTION_EDIT_PANEL_LINKS;
  public order = 35;

  constructor(
    private core: CoreStart,
    private dataUI: DataPublicPluginStart['ui'],
    private notifications: CoreStart['notifications']
  ) {}

  public getDisplayName({ embeddable }: EditPanelLinksActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return i18n.translate('dashboard.panel.editPanelLinks.menuLabel', {
      defaultMessage: 'Edit panel links',
    });
  }

  public getIconType({ embeddable }: EditPanelLinksActionContext): EuiIconType {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }
    return 'symlink';
  }

  public async isCompatible({ embeddable }: EditPanelLinksActionContext) {
    if (embeddable.getInput().viewMode) {
      if (embeddable.getInput().viewMode === ViewMode.VIEW) {
        return false;
      }
    }

    return Boolean(embeddable.parent && isDashboard(embeddable.parent));
  }

  public async execute({ embeddable }: EditPanelLinksActionContext) {
    if (!embeddable.parent || !isDashboard(embeddable.parent)) {
      throw new IncompatibleActionError();
    }

    const view = embeddable;
    const dash = embeddable.parent;
    openEditPanelLinksFlyout({
      embeddable: dash,
      core: this.core,
      dataUI: this.dataUI,
      notifications: this.notifications,
      panelToEdit: view,
    });
  }
}

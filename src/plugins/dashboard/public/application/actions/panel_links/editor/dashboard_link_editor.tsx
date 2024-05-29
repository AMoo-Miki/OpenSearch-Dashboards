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

import React, { PureComponent, ComponentType } from 'react';

import { DashboardSelectFormRow } from './dashboard_select_form_row';
import { DashboardSelectProps, DataPublicPluginStart } from '../../../../../../data/public';
import { PanelLink, PanelLinkOptions } from '../../../../../../embeddable/common';

interface DashboardPanelLinkEditorProps {
  dashLinkIndex: number;
  dashLinkParams: PanelLink;
  handleDashboardChange: (indexPatternId: string) => void;
  handleOptionsChange: <T extends keyof PanelLinkOptions>(
    dashLinkIndex: number,
    optionName: T,
    value: PanelLinkOptions[T]
  ) => void;
  dataUI: DataPublicPluginStart['ui'];
}

interface DashboardPanelLinkEditorState {
  DashboardSelect: ComponentType<DashboardSelectProps> | null;
}

export class DashboardPanelLinkEditor extends PureComponent<
  DashboardPanelLinkEditorProps,
  DashboardPanelLinkEditorState
> {
  state: DashboardPanelLinkEditorState = {
    DashboardSelect: null,
  };

  componentDidMount() {
    this.getDashboardSelect();
  }

  async getDashboardSelect() {
    this.setState({
      DashboardSelect: this.props.dataUI.DashboardSelect,
    });
  }

  render() {
    if (this.state.DashboardSelect === null) {
      return null;
    }

    return (
      <DashboardSelectFormRow
        dashboardId={this.props.dashLinkParams.options.dashboardId || ''}
        onChange={this.props.handleDashboardChange}
        dashLinkIndex={this.props.dashLinkIndex}
        DashboardSelect={this.state.DashboardSelect}
      />
    );
  }
}

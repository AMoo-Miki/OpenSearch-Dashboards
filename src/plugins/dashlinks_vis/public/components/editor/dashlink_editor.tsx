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

import React, { PureComponent, ChangeEvent } from 'react';
import { injectI18n, FormattedMessage, InjectedIntlProps } from '@osd/i18n/react';

import {
  EuiAccordion,
  EuiButtonIcon,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiPanel,
  EuiSpacer,
} from '@elastic/eui';

import { DashboardDashLinkEditor } from './dashboard_dashlink_editor';
import { DiscoverDashLinkEditor } from './discover_dashlink_editor';
import { getTitle, DashLinkParams, DashLinkType, DashLinkParamsOptions } from '../../editor_utils';
import { DashLinksVisDependencies } from '../../plugin';

interface DashLinkEditorUiProps {
  dashLinkIndex: number;
  dashLinkParams: DashLinkParams;
  handleLabelChange: (dashLinkIndex: number, value: string) => void;
  moveDashLink: (dashLinkIndex: number, direction: number) => void;
  handleRemoveDashLink: (dashLinkIndex: number) => void;
  handleOptionsChange: <T extends keyof DashLinkParamsOptions>(
    dashLinkIndex: number,
    optionName: T,
    value: DashLinkParamsOptions[T]
  ) => void;
  deps: DashLinksVisDependencies;
}

class DashLinkEditorUi extends PureComponent<DashLinkEditorUiProps & InjectedIntlProps> {
  changeLabel = (event: ChangeEvent<HTMLInputElement>) => {
    this.props.handleLabelChange(this.props.dashLinkIndex, event.target.value);
  };

  removeDashLink = () => {
    this.props.handleRemoveDashLink(this.props.dashLinkIndex);
  };

  moveUpDashLink = () => {
    this.props.moveDashLink(this.props.dashLinkIndex, -1);
  };

  moveDownDashLink = () => {
    this.props.moveDashLink(this.props.dashLinkIndex, 1);
  };

  changeIndexPattern = (indexPatternId: string) => {
    this.props.handleOptionsChange(this.props.dashLinkIndex, 'indexPatternId', indexPatternId);
  };

  changeDashboard = (dashboardId: string) => {
    this.props.handleOptionsChange(this.props.dashLinkIndex, 'dashboardId', dashboardId);
  };

  renderEditor() {
    let dashLinkEditor = null;
    switch (this.props.dashLinkParams.type) {
      case DashLinkType.DISCOVER:
        dashLinkEditor = (
          <DiscoverDashLinkEditor
            dashLinkIndex={this.props.dashLinkIndex}
            dashLinkParams={this.props.dashLinkParams}
            handleIndexPatternChange={this.changeIndexPattern}
            handleOptionsChange={this.props.handleOptionsChange}
            deps={this.props.deps}
          />
        );
        break;

      case DashLinkType.DASHBOARD:
        dashLinkEditor = (
          <DashboardDashLinkEditor
            dashLinkIndex={this.props.dashLinkIndex}
            dashLinkParams={this.props.dashLinkParams}
            handleDashboardChange={this.changeDashboard}
            handleOptionsChange={this.props.handleOptionsChange}
            deps={this.props.deps}
          />
        );
        break;

      default:
        throw new Error(`Unhandled dashlink editor type ${this.props.dashLinkParams.type}`);
    }

    const labelId = `linkLabel${this.props.dashLinkIndex}`;
    return (
      <EuiForm>
        <EuiFormRow
          id={labelId}
          label={
            <FormattedMessage
              id="dashLinks.editor.dashLinkEditor.linkLabel"
              defaultMessage="Link label"
            />
          }
        >
          <EuiFieldText value={this.props.dashLinkParams.label} onChange={this.changeLabel} />
        </EuiFormRow>

        {dashLinkEditor}
      </EuiForm>
    );
  }

  renderEditorButtons() {
    return (
      <div>
        <EuiButtonIcon
          aria-label={this.props.intl.formatMessage({
            id: 'dashLinks.editor.dashLinkEditor.moveDashLinkUpAriaLabel',
            defaultMessage: 'Move link up',
          })}
          color="primary"
          onClick={this.moveUpDashLink}
          iconType="sortUp"
          data-test-subj={`dashLinksEditorMoveUpDashLink${this.props.dashLinkIndex}`}
        />
        <EuiButtonIcon
          aria-label={this.props.intl.formatMessage({
            id: 'dashLinks.editor.dashLinkEditor.moveDashLinkDownAriaLabel',
            defaultMessage: 'Move link down',
          })}
          color="primary"
          onClick={this.moveDownDashLink}
          iconType="sortDown"
          data-test-subj={`dashLinksEditorMoveDownDashLink${this.props.dashLinkIndex}`}
        />
        <EuiButtonIcon
          aria-label={this.props.intl.formatMessage({
            id: 'dashLinks.editor.dashLinkEditor.removeDashLinkAriaLabel',
            defaultMessage: 'Remove link',
          })}
          color="danger"
          onClick={this.removeDashLink}
          iconType="cross"
          data-test-subj={`dashLinksEditorRemoveDashLink${this.props.dashLinkIndex}`}
        />
      </div>
    );
  }

  render() {
    return (
      <EuiPanel grow={false} className="dlpDashLinkEditor__panel">
        <EuiAccordion
          id="dashLinkEditorAccordion"
          buttonContent={getTitle(this.props.dashLinkParams, this.props.dashLinkIndex)}
          extraAction={this.renderEditorButtons()}
          initialIsOpen={true}
        >
          <EuiSpacer size="s" />
          {this.renderEditor()}
        </EuiAccordion>
      </EuiPanel>
    );
  }
}

export const DashLinkEditor = injectI18n(DashLinkEditorUi);

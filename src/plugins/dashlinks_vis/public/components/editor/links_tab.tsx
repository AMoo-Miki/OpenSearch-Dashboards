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

import React, { PureComponent } from 'react';
import { injectI18n, FormattedMessage, InjectedIntlProps } from '@osd/i18n/react';

import {
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPanel,
  EuiComboBox,
} from '@elastic/eui';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { DashLinkEditor } from './dashlink_editor';
import {
  addDashLink,
  moveDashLink,
  newDashLink,
  removeDashLink,
  setDashLink,
  DashLinkParams,
  DashLinkType,
  DashLinkParamsOptions,
} from '../../editor_utils';
import { DashLinksVisDependencies } from '../../plugin';

interface LinksTabUiState {
  type?: DashLinkType;
}

interface LinksTabUiParams {
  dashLinks: DashLinkParams[];
}
type LinksTabUiInjectedProps = InjectedIntlProps &
  Pick<VisOptionsProps<LinksTabUiParams>, 'vis' | 'stateParams' | 'setValue'> & {
    deps: DashLinksVisDependencies;
  };

export type LinksTabUiProps = LinksTabUiInjectedProps;

class LinksTabUi extends PureComponent<LinksTabUiProps, LinksTabUiState> {
  state = {
    type: undefined,
  };

  onChange = (value: DashLinkParams[]) => this.props.setValue('dashLinks', value);

  handleLabelChange = (dashLinkIndex: number, label: string) => {
    const updateDashLink = {
      ...this.props.stateParams.dashLinks[dashLinkIndex],
      label,
    };
    this.onChange(setDashLink(this.props.stateParams.dashLinks, dashLinkIndex, updateDashLink));
  };

  handleIndexPatternChange = (dashLinkIndex: number, indexPattern: string) => {
    const updateDashLink = {
      ...this.props.stateParams.dashLinks[dashLinkIndex],
      indexPattern,
    };
    this.onChange(setDashLink(this.props.stateParams.dashLinks, dashLinkIndex, updateDashLink));
  };

  handleOptionsChange = <T extends keyof DashLinkParamsOptions>(
    dashLinkIndex: number,
    optionName: T,
    value: DashLinkParamsOptions[T]
  ) => {
    const dashLink = this.props.stateParams.dashLinks[dashLinkIndex];
    const updateDashLink = {
      ...dashLink,
      options: {
        ...dashLink.options,
        [optionName]: value,
      },
    };
    this.onChange(setDashLink(this.props.stateParams.dashLinks, dashLinkIndex, updateDashLink));
  };

  handleRemoveDashLink = (dashLinkIndex: number) => {
    this.onChange(removeDashLink(this.props.stateParams.dashLinks, dashLinkIndex));
  };

  moveDashLink = (dashLinkIndex: number, direction: number) => {
    this.onChange(moveDashLink(this.props.stateParams.dashLinks, dashLinkIndex, direction));
  };

  handleAddDashLink = () => {
    if (this.state.type) {
      this.onChange(addDashLink(this.props.stateParams.dashLinks, newDashLink(this.state.type)));
    }
  };

  renderDashLinks() {
    return this.props.stateParams.dashLinks.map((dashLinkParams, dashLinkIndex) => (
      <DashLinkEditor
        key={dashLinkParams.id}
        dashLinkIndex={dashLinkIndex}
        dashLinkParams={dashLinkParams}
        handleLabelChange={this.handleLabelChange}
        moveDashLink={this.moveDashLink}
        handleRemoveDashLink={this.handleRemoveDashLink}
        handleOptionsChange={this.handleOptionsChange}
        deps={this.props.deps}
      />
    ));
  }

  render() {
    const { intl } = this.props;

    const options = [
      {
        value: DashLinkType.DASHBOARD,
        label: intl.formatMessage({
          id: 'dashLinks.editor.LinksTab.select.dashboardDropDownOptionLabel',
          defaultMessage: 'Dashboard',
        }),
      },
      {
        value: DashLinkType.DISCOVER,
        label: intl.formatMessage({
          id: 'dashLinks.editor.LinksTab.select.discoverDropDownOptionLabel',
          defaultMessage: 'Discover',
        }),
      },
    ];

    const selectedOption = options.find(({ value }) => value === this.state.type);

    return (
      <div>
        {this.renderDashLinks()}

        <EuiPanel grow={false}>
          <EuiFormRow
            id="selectDashLinkType"
            label={intl.formatMessage({
              id: 'dashLinks.editor.LinksTab.select.linkTypeAriaLabel',
              defaultMessage: 'Link type',
            })}
            fullWidth={true}
          >
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiComboBox
                  data-test-subj="selectDashLinkType"
                  options={options}
                  isClearable={false}
                  singleSelection={{ asPlainText: true }}
                  selectedOptions={selectedOption ? [selectedOption] : []}
                  onChange={([{ value }]) =>
                    this.setState({ type: (value as unknown) as DashLinkType })
                  }
                  placeholder={intl.formatMessage({
                    id: 'dashLinks.editor.LinksTab.select.linkTypeAriaLabel',
                    defaultMessage: 'Select link type...',
                  })}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFormRow id="addDashLink">
                  <EuiButton
                    fill
                    onClick={this.handleAddDashLink}
                    iconType="plusInCircle"
                    data-test-subj="dashLinksEditorAddBtn"
                    aria-label={intl.formatMessage({
                      id: 'dashLinks.editor.LinksTab.select.addDashLinkAriaLabel',
                      defaultMessage: 'Add link',
                    })}
                  >
                    <FormattedMessage
                      id="dashLinks.editor.LinksTab.addButtonLabel"
                      defaultMessage="Add"
                    />
                  </EuiButton>
                </EuiFormRow>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFormRow>
        </EuiPanel>
      </div>
    );
  }
}

export const LinksTab = injectI18n(LinksTabUi);

export const getLinksTab = (deps: DashLinksVisDependencies) => (
  props: Omit<LinksTabUiProps, 'core'>
) => <LinksTab {...props} deps={deps} />;

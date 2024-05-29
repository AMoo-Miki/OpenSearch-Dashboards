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

import './_edit_panel_links_flyout.scss';

import { i18n } from '@osd/i18n';
import { injectI18n, FormattedMessage, InjectedIntlProps } from '@osd/i18n/react';
import React, { PureComponent } from 'react';
import {
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiComboBox,
  EuiFormRow,
  EuiButton,
  EuiFlyoutFooter,
  EuiButtonEmpty,
} from '@elastic/eui';
import { NotificationsStart, Toast } from 'src/core/public';
import { DashboardPanelState } from '../..';
import {
  EmbeddableInput,
  EmbeddableOutput,
  IContainer,
  IEmbeddable,
} from '../../../../../embeddable/public';
import { DataPublicPluginStart } from '../../../../../data/public';
import {
  addDashboardPanelLink,
  newDashboardPanelLink,
  removeDashboardPanelLink,
  moveDashboardPanelLink,
  setDashboardPanelLink,
} from './editor/editor_utils';
import { PanelLinkEditor } from './editor/panel_link_editor';
import { PanelLink, PanelLinkOptions, PanelLinkType } from '../../../../../embeddable/public';

interface EditPanelLinksFlyoutUiProps {
  container: IContainer;
  dataUI: DataPublicPluginStart['ui'];
  onClose: () => void;
  notifications: NotificationsStart;
  panelToEdit: IEmbeddable<EmbeddableInput, EmbeddableOutput>;
}

interface EditPanelLinksFlyoutUiState {
  type?: PanelLinkType;
  links: PanelLink[];
  isDirty: boolean;
  isInvalid: boolean;
}

class EditPanelLinksFlyoutUi extends PureComponent<
  EditPanelLinksFlyoutUiProps & InjectedIntlProps,
  EditPanelLinksFlyoutUiState
> {
  state = {
    type: undefined,
    links: [] as PanelLink[],
    isDirty: false,
    isInvalid: false,
  };

  private lastToast: Toast = {
    id: 'panelEditLinksToast',
  };

  componentDidMount() {
    this.resetLinks();
  }

  resetLinks() {
    const { panelToEdit, container } = this.props;
    const { links } = container.getInput().panels[panelToEdit.id] as DashboardPanelState;

    this.setState({ links: Array.isArray(links) ? links : [], isDirty: false });
  }

  public showToast = (name: string) => {
    // To avoid the clutter of having toast messages cover flyout
    // close previous toast message before creating a new one
    if (this.lastToast) {
      this.props.notifications.toasts.remove(this.lastToast);
    }

    this.lastToast = this.props.notifications.toasts.addSuccess({
      title: i18n.translate('dashboard.panel.editPanelLinks.updateSuccessMessageTitle', {
        defaultMessage: '{panelName} was updated',
        values: {
          panelName: name,
        },
      }),
      'data-test-subj': 'dashboardEditPanelSuccess',
    });
  };

  onChange = (links: PanelLink[]) => {
    const isInvalid = !links.every(({ label, type, options }) => {
      if (!label.trim()) return false;
      switch (type) {
        case PanelLinkType.DASHBOARD:
          return options.dashboardId;

        case PanelLinkType.DISCOVER:
          return options.indexPatternId;

        default:
          return false;
      }
    });
    this.setState({ links, isDirty: true, isInvalid });
  };
  onClickDiscard = () => this.props.onClose();
  onClickUpdate = () => {
    const { panelToEdit, container } = this.props;
    const { [panelToEdit.id]: panelToUpdate, ...panels } = container.getInput().panels;

    container.updateInput({
      panels: {
        ...panels,
        [panelToEdit.id]: {
          ...panelToUpdate,
          links: this.state.links,
        },
      },
    });
    container.reload();

    this.showToast(panelToEdit.getTitle()!);
    this.props.onClose();
  };

  handleLabelChange = (dashLinkIndex: number, label: string) => {
    const updateDashboardPanelLink = {
      ...this.state.links[dashLinkIndex],
      label,
    };
    this.onChange(setDashboardPanelLink(this.state.links, dashLinkIndex, updateDashboardPanelLink));
  };

  handleIndexPatternChange = (dashLinkIndex: number, indexPattern: string) => {
    const updateDashboardPanelLink = {
      ...this.state.links[dashLinkIndex],
      indexPattern,
    };
    this.onChange(setDashboardPanelLink(this.state.links, dashLinkIndex, updateDashboardPanelLink));
  };

  handleOptionsChange = <T extends keyof PanelLinkOptions>(
    dashLinkIndex: number,
    optionName: T,
    value: PanelLinkOptions[T]
  ) => {
    const dashLink = this.state.links[dashLinkIndex];
    const updateDashboardPanelLink = {
      ...dashLink,
      options: {
        ...dashLink.options,
        [optionName]: value,
      },
    };
    this.onChange(setDashboardPanelLink(this.state.links, dashLinkIndex, updateDashboardPanelLink));
  };

  handleRemoveDashboardPanelLink = (dashLinkIndex: number) => {
    this.onChange(removeDashboardPanelLink(this.state.links, dashLinkIndex));
  };

  moveDashboardPanelLink = (dashLinkIndex: number, direction: number) => {
    this.onChange(moveDashboardPanelLink(this.state.links, dashLinkIndex, direction));
  };

  handleAddDashboardPanelLink = () => {
    if (this.state.type) {
      this.onChange(
        addDashboardPanelLink(this.state.links, newDashboardPanelLink(this.state.type))
      );
    }
  };

  renderDashboardPanelLinks() {
    return this.state.links.map((dashLinkParams, dashLinkIndex) => (
      <PanelLinkEditor
        key={dashLinkParams.id}
        dashLinkIndex={dashLinkIndex}
        dashLinkParams={dashLinkParams}
        handleLabelChange={this.handleLabelChange}
        moveDashboardPanelLink={this.moveDashboardPanelLink}
        handleRemoveDashboardPanelLink={this.handleRemoveDashboardPanelLink}
        handleOptionsChange={this.handleOptionsChange}
        dataUI={this.props.dataUI}
      />
    ));
  }

  public render() {
    const { intl } = this.props;

    const options = [
      {
        value: PanelLinkType.DASHBOARD,
        label: intl.formatMessage({
          id: 'dashboard.panel.editPanelLinks.select.dashboardDropDownOptionLabel',
          defaultMessage: 'Dashboard',
        }),
      },
      {
        value: PanelLinkType.DISCOVER,
        label: intl.formatMessage({
          id: 'dashboard.panel.editPanelLinks.select.discoverDropDownOptionLabel',
          defaultMessage: 'Discover',
        }),
      },
    ];

    const selectedOption = options.find(({ value }) => value === this.state.type);

    return (
      <>
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2>
              <FormattedMessage
                id="dashboard.panel.editPanelLinks.editorTitle"
                defaultMessage="Edit panel links"
              />
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody className="dpLinkEditor_flyoutBody">
          {this.renderDashboardPanelLinks()}
          <EuiPanel grow={false} color="subdued">
            <EuiFormRow
              id="selectDashboardPanelLinkType"
              label={intl.formatMessage({
                id: 'dashLinks.editor.LinksTab.select.linkTypeAriaLabel',
                defaultMessage: 'Link type',
              })}
              fullWidth={true}
            >
              <EuiFlexGroup>
                <EuiFlexItem>
                  <EuiComboBox
                    data-test-subj="selectDashboardPanelLinkType"
                    options={options}
                    isClearable={false}
                    singleSelection={{ asPlainText: true }}
                    selectedOptions={selectedOption ? [selectedOption] : []}
                    onChange={([{ value }]) =>
                      this.setState({ type: (value as unknown) as PanelLinkType })
                    }
                    placeholder={intl.formatMessage({
                      id: 'dashLinks.editor.LinksTab.select.linkTypeAriaLabel',
                      defaultMessage: 'Select link type...',
                    })}
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFormRow id="addDashboardPanelLink">
                    <EuiButton
                      onClick={this.handleAddDashboardPanelLink}
                      iconType="plusInCircle"
                      disabled={!selectedOption}
                      data-test-subj="dashLinksEditorAddBtn"
                      aria-label={intl.formatMessage({
                        id: 'dashLinks.editor.LinksTab.select.addDashboardPanelLinkAriaLabel',
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
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                data-test-subj="dashboardEditPanelLinksDiscardButton"
                disabled={!this.state.isDirty || this.state.isInvalid}
                iconType="cross"
                onClick={this.onClickDiscard}
                size="s"
              >
                <FormattedMessage
                  id="dashboard.panel.editPanelLinks.discardChangesButtonLabel"
                  defaultMessage="Discard"
                />
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                data-test-subj="visualizeEditorRenderButton"
                disabled={!this.state.isDirty || this.state.isInvalid}
                fill
                iconType="play"
                onClick={this.onClickUpdate}
                size="s"
              >
                <FormattedMessage
                  id="visDefaultEditor.sidebar.updateChartButtonLabel"
                  defaultMessage="Update"
                />
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </>
    );
  }
}

export const EditPanelLinksFlyout = injectI18n(EditPanelLinksFlyoutUi);

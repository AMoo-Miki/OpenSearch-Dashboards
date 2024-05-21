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

import {
  EuiForm,
  EuiFormRow,
  EuiSwitch,
  EuiSelect,
  EuiPanel,
  EuiTitle,
  EuiSpacer,
} from '@elastic/eui';
import { FormattedMessage, InjectedIntlProps, injectI18n } from '@osd/i18n/react';
import { EuiSwitchEvent } from '@elastic/eui';

import { VisOptionsProps } from 'src/plugins/vis_default_editor/public';
import { DashLinksLayout } from '../../editor_utils';

interface OptionsTabParams {
  wrapLinksOnChange: boolean;
  wrapLinks: boolean;
  layoutOnChange: boolean;
  layout?: DashLinksLayout;
}
type OptionsTabInjectedProps = Pick<
  VisOptionsProps<OptionsTabParams>,
  'vis' | 'setValue' | 'stateParams'
>;

export type OptionsTabUiProps = InjectedIntlProps & OptionsTabInjectedProps;

class OptionsTabUi extends PureComponent<OptionsTabUiProps> {
  handleWrapLinksChange = (event: EuiSwitchEvent) => {
    this.props.setValue('wrapLinks', event.target.checked);
  };

  handleLayoutChange = (event: React.ChangeEvent) => {
    this.props.setValue('layout', (event.target as HTMLSelectElement).value as DashLinksLayout);
  };

  render() {
    const { intl } = this.props;

    return (
      <EuiPanel>
        <EuiTitle size="xs">
          <h3>
            <FormattedMessage
              id="dashLinks.editor.optionsTab.layoutSettings"
              defaultMessage="Layout settings"
            />
          </h3>
        </EuiTitle>
        <EuiSpacer size="m" />
        <EuiForm>
          <EuiFormRow
            id="layoutStyle"
            label={intl.formatMessage({
              id: 'dashLinks.editor.optionsTab.layoutStyle',
              defaultMessage: 'Layout style',
            })}
          >
            <EuiSelect
              options={[
                {
                  value: DashLinksLayout.HOSRIZONTAL,
                  text: intl.formatMessage({
                    id: 'dashLinks.editor.optionsTab.layoutHorizontal',
                    defaultMessage: 'Horizontal',
                  }),
                },
                {
                  value: DashLinksLayout.VERTICAL,
                  text: intl.formatMessage({
                    id: 'dashLinks.editor.optionsTab.layoutVertical',
                    defaultMessage: 'Vertical',
                  }),
                },
              ]}
              value={this.props.stateParams.layout}
              onChange={this.handleLayoutChange}
              data-test-subj="dashLinksLayoutLinksCheckbox"
            />
          </EuiFormRow>
          <EuiFormRow id="wrapLinks">
            <EuiSwitch
              label={
                <FormattedMessage
                  id="dashLinks.editor.optionsTab.wrapLinks"
                  defaultMessage="Wrap links"
                />
              }
              checked={this.props.stateParams.wrapLinks || false}
              onChange={this.handleWrapLinksChange}
              data-test-subj="dashLinksEditorWrapLinksCheckbox"
            />
          </EuiFormRow>
        </EuiForm>
      </EuiPanel>
    );
  }
}

export const OptionsTab = injectI18n(OptionsTabUi);

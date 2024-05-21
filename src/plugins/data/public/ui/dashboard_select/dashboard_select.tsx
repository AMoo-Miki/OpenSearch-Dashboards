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

import _ from 'lodash';
import React, { Component } from 'react';

import { Required } from '@osd/utility-types';
import { EuiComboBox, EuiComboBoxProps } from '@elastic/eui';

import { SavedObjectsClientContract, SimpleSavedObject } from 'src/core/public';
import {
  getDataSourceReference,
  concatDataSourceWithIndexPattern,
  getIndexPatternTitle,
} from '../../../common/index_patterns/utils';
import { DataSourceAttributes } from '../../../../data_source/common/data_sources';

export type DashboardSelectProps = Required<
  Omit<EuiComboBoxProps<any>, 'isLoading' | 'onSearchChange' | 'options' | 'selectedOptions'>,
  'onChange' | 'placeholder'
> & {
  dashboardId: string;
  fieldTypes?: string[];
  onNoDashboards?: () => void;
  savedObjectsClient: SavedObjectsClientContract;
};

interface DashboardSelectState {
  isLoading: boolean;
  options: [];
  selectedDashboard: { value: string; label: string } | undefined;
  searchValue: string | undefined;
  dataSourceIdToTitle: Map<string, string>;
}

const getDashboards = async (
  client: SavedObjectsClientContract,
  search: string,
  fields: string[]
) => {
  const resp = await client.find({
    type: 'dashboard',
    fields,
    search: `${search}*`,
    searchFields: ['title'],
    perPage: 100,
  });
  return resp.savedObjects;
};

const getTitle = async (
  client: SavedObjectsClientContract,
  dashboardId: string,
  dataSourceIdToTitle: Map<string, string>
): Promise<string> => {
  const savedObject = (await client.get('dashboard', dashboardId)) as SimpleSavedObject<any>;

  if (savedObject.error) {
    throw new Error(`Unable to get index-pattern title: ${savedObject.error.message}`);
  }

  const dataSourceReference = getDataSourceReference(savedObject.references);

  if (dataSourceReference) {
    const dataSourceId = dataSourceReference.id;
    if (dataSourceIdToTitle.has(dataSourceId)) {
      return concatDataSourceWithIndexPattern(
        dataSourceIdToTitle.get(dataSourceId)!,
        savedObject.attributes.title
      );
    }
  }

  const getDataSource = async (id: string) =>
    await client.get<DataSourceAttributes>('data-source', id);

  return getIndexPatternTitle(savedObject.attributes.title, savedObject.references, getDataSource);
};

// Needed for React.lazy
// eslint-disable-next-line import/no-default-export
export default class DashboardSelect extends Component<DashboardSelectProps> {
  private isMounted: boolean = false;
  state: DashboardSelectState;

  constructor(props: DashboardSelectProps) {
    super(props);

    this.state = {
      isLoading: false,
      dataSourceIdToTitle: new Map(),
      options: [],
      selectedDashboard: undefined,
      searchValue: undefined,
    };
  }

  componentWillUnmount() {
    this.isMounted = false;
    this.debouncedFetch.cancel();
  }

  componentDidMount() {
    this.isMounted = true;
    this.fetchOptions();
    this.fetchSelectedDashboard(this.props.dashboardId);
  }

  UNSAFE_componentWillReceiveProps(nextProps: DashboardSelectProps) {
    if (nextProps.dashboardId !== this.props.dashboardId) {
      this.fetchSelectedDashboard(nextProps.dashboardId);
    }
  }

  fetchSelectedDashboard = async (dashboardId: string) => {
    if (!dashboardId) {
      this.setState({
        selectedDashboard: undefined,
      });
      return;
    }

    let dashboardTitle;
    try {
      dashboardTitle = await getTitle(
        this.props.savedObjectsClient,
        dashboardId,
        this.state.dataSourceIdToTitle
      );
    } catch (err) {
      // dashboard no longer exists
      return;
    }

    if (!this.isMounted) {
      return;
    }

    this.setState({
      selectedDashboard: {
        value: dashboardId,
        label: dashboardTitle,
      },
    });
  };

  debouncedFetch = _.debounce(async (searchValue: string) => {
    const { fieldTypes, onNoDashboards, savedObjectsClient } = this.props;

    const savedObjectFields = ['title'];
    if (fieldTypes) {
      savedObjectFields.push('fields');
    }
    let savedObjects = await getDashboards(savedObjectsClient, searchValue, savedObjectFields);

    if (fieldTypes) {
      savedObjects = savedObjects.filter((savedObject: SimpleSavedObject<any>) => {
        try {
          const dashboardFields = JSON.parse(savedObject.attributes.fields as any);
          return dashboardFields.some((field: any) => {
            return fieldTypes?.includes(field.type);
          });
        } catch (err) {
          // Unable to parse fields JSON, invalid dashboard
          return false;
        }
      });
    }

    if (!this.isMounted) {
      return;
    }

    // We need this check to handle the case where search results come back in a different
    // order than they were sent out. Only load results for the most recent search.
    if (searchValue === this.state.searchValue) {
      const dataSourcesToFetch: Array<{ type: string; id: string }> = [];
      const dataSourceIdSet = new Set();
      savedObjects.map((dashboardSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(dashboardSavedObject.references);
        if (
          dataSourceReference &&
          !this.state.dataSourceIdToTitle.has(dataSourceReference.id) &&
          !dataSourceIdSet.has(dataSourceReference.id)
        ) {
          dataSourceIdSet.add(dataSourceReference.id);
          dataSourcesToFetch.push({ type: 'data-source', id: dataSourceReference.id });
        }
      });

      const dataSourceIdToTitleToUpdate = new Map();

      if (dataSourcesToFetch.length > 0) {
        const resp = await savedObjectsClient.bulkGet(dataSourcesToFetch);
        resp.savedObjects.map((dataSourceSavedObject: SimpleSavedObject<any>) => {
          dataSourceIdToTitleToUpdate.set(
            dataSourceSavedObject.id,
            dataSourceSavedObject.attributes.title
          );
        });
      }

      const options = savedObjects.map((dashboardSavedObject: SimpleSavedObject<any>) => {
        const dataSourceReference = getDataSourceReference(dashboardSavedObject.references);
        if (dataSourceReference) {
          const dataSourceTitle =
            this.state.dataSourceIdToTitle.get(dataSourceReference.id) ||
            dataSourceIdToTitleToUpdate.get(dataSourceReference.id) ||
            dataSourceReference.id;
          return {
            label: `${concatDataSourceWithIndexPattern(
              dataSourceTitle,
              dashboardSavedObject.attributes.title
            )}`,
            value: dashboardSavedObject.id,
          };
        }
        return {
          label: dashboardSavedObject.attributes.title,
          value: dashboardSavedObject.id,
        };
      });

      if (dataSourceIdToTitleToUpdate.size > 0) {
        const mergedDataSourceIdToTitle = new Map();
        this.state.dataSourceIdToTitle.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        dataSourceIdToTitleToUpdate.forEach((k, v) => {
          mergedDataSourceIdToTitle.set(k, v);
        });
        this.setState({
          dataSourceIdToTitle: mergedDataSourceIdToTitle,
          isLoading: false,
          options,
        });
      } else {
        this.setState({
          isLoading: false,
          options,
        });
      }

      if (onNoDashboards && searchValue === '' && options.length === 0) {
        onNoDashboards();
      }
    }
  }, 300);

  fetchOptions = (searchValue = '') => {
    this.setState(
      {
        isLoading: true,
        searchValue,
      },
      this.debouncedFetch.bind(null, searchValue)
    );
  };

  onChange = (selectedOptions: any) => {
    this.props.onChange(_.get(selectedOptions, '0.value'));
  };

  render() {
    const {
      fieldTypes,
      onChange,
      dashboardId,
      placeholder,
      onNoDashboards,
      savedObjectsClient,
      ...rest
    } = this.props;

    return (
      <EuiComboBox
        {...rest}
        placeholder={placeholder}
        singleSelection={true}
        isLoading={this.state.isLoading}
        onSearchChange={this.fetchOptions}
        options={this.state.options}
        selectedOptions={this.state.selectedDashboard ? [this.state.selectedDashboard] : []}
        onChange={this.onChange}
      />
    );
  }
}

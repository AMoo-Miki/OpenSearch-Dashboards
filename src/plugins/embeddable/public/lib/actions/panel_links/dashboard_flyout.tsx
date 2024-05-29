/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import './_panel_link_flyout.scss';

import React, { useEffect, useState } from 'react';
import {
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { DashboardContainer, DashboardContainerInput } from '../../../../../dashboard/public';
import { EmbeddableStart } from '../../../plugin';
import { DataPublicPluginStart } from '../../../../../data/public';
import { ViewMode } from '../../../../common/types';

interface Props {
  onClose: () => void;
  dashboardId: string;
  getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'];
  getEmbeddablePanel: EmbeddableStart['getEmbeddablePanel'];
  dataQuery: DataPublicPluginStart['query'];
}

export function DashboardFlyout(props: Props) {
  const PanelComponent = props.getEmbeddablePanel();

  const [dashboardEmbeddable, setDashboardEmbeddable] = useState<DashboardContainer | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    updateDashboardEmbeddable(
      props.getEmbeddableFactory,
      props.dataQuery,
      props.dashboardId,
      setDashboardEmbeddable
    );
  }, [props.getEmbeddableFactory, props.dataQuery, props.dashboardId]);

  useEffect(() => {
    if (dashboardEmbeddable !== undefined) {
      setIsLoading(false);
    }
  }, [dashboardEmbeddable]);

  return (
    <>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h1>{dashboardEmbeddable?.getTitle() || ''}</h1>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody className="embLinkFlyout__body">
        {isLoading ? (
          <EuiFlexGroup justifyContent="spaceAround">
            <EuiFlexItem grow={false}>
              <EuiLoadingSpinner size="xl" data-test-subj="loadingSpinner" />
            </EuiFlexItem>
          </EuiFlexGroup>
        ) : (
          <PanelComponent
            embeddable={dashboardEmbeddable as DashboardContainer}
            hideHeader={true}
            hasBorder={false}
            hasShadow={false}
            className="embLinkFlyout__panel"
          />
        )}
      </EuiFlyoutBody>
    </>
  );
}

async function updateDashboardEmbeddable(
  getEmbeddableFactory: EmbeddableStart['getEmbeddableFactory'],
  dataQuery: DataPublicPluginStart['query'],
  dashboardId: string,
  setDashboardEmbeddable: Function
) {
  const factory = getEmbeddableFactory('dashboard');
  const contextInput = {
    filters: dataQuery.filterManager.getFilters(),
    query: dataQuery.queryString.getQuery(),
    timeRange: dataQuery.timefilter.timefilter.getTime(),
  };
  const embeddable = await factory?.createFromSavedObject(dashboardId, {
    viewMode: ViewMode.VIEW,
    ...contextInput,
  } as DashboardContainerInput);

  setDashboardEmbeddable(embeddable);
}

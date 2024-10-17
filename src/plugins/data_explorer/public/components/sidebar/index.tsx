/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { ReactChild, FC, useCallback, useEffect, useState } from 'react';
import {
  EuiPageSideBar,
  EuiSplitPanel,
  useEuiTour,
  EuiTourStep,
  EuiSpacer,
  EuiSmallButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import {
  DataSource,
  DataSourceGroup,
  DataSourceSelectable,
  UI_SETTINGS,
} from '../../../../data/public';
import { DataSourceOption, DatasetSelector } from '../../../../data/public/';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { DataExplorerServices } from '../../types';
import { setIndexPattern, useTypedDispatch, useTypedSelector } from '../../utils/state_management';
import './index.scss';

interface Props {
  guidedTour?: ReturnType<typeof useEuiTour>;
  children?: ReactChild;
}

export const Sidebar: FC<Props> = ({ children, guidedTour }) => {
  const { indexPattern: indexPatternId } = useTypedSelector((state) => state.metadata);
  const dispatch = useTypedDispatch();
  const [selectedSources, setSelectedSources] = useState<DataSourceOption[]>([]);
  const [dataSourceOptionList, setDataSourceOptionList] = useState<DataSourceGroup[]>([]);
  const [activeDataSources, setActiveDataSources] = useState<DataSource[]>([]);

  const {
    services: {
      data: { indexPatterns, dataSources },
      notifications: { toasts },
      application,
      uiSettings,
    },
  } = useOpenSearchDashboards<DataExplorerServices>();

  const handleDatasetSubmit = useCallback(
    (query: any) => {
      // Update the index pattern
      if (query.dataset) {
        dispatch(setIndexPattern(query.dataset.id));
      }
    },
    [dispatch]
  );

  const [isEnhancementEnabled, setIsEnhancementEnabled] = useState<boolean>(false);

  useEffect(() => {
    setIsEnhancementEnabled(uiSettings.get(UI_SETTINGS.QUERY_ENHANCEMENTS_ENABLED));
  }, [uiSettings]);

  useEffect(() => {
    let isMounted = true;
    const subscription = dataSources.dataSourceService
      .getDataSources$()
      .subscribe((currentDataSources) => {
        if (isMounted) {
          setActiveDataSources(Object.values(currentDataSources));
        }
      });

    return () => {
      subscription.unsubscribe();
      isMounted = false;
    };
  }, [indexPatterns, dataSources]);

  const getMatchedOption = (dataSourceList: DataSourceGroup[], ipId: string) => {
    for (const dsGroup of dataSourceList) {
      const matchedOption = dsGroup.options.find((item) => item.value === ipId);
      if (matchedOption !== undefined) return matchedOption;
    }
    return undefined;
  };

  useEffect(() => {
    if (indexPatternId) {
      const option = getMatchedOption(dataSourceOptionList, indexPatternId);
      setSelectedSources(option ? [option] : []);
    }
  }, [indexPatternId, activeDataSources, dataSourceOptionList]);

  const redirectToLogExplorer = useCallback(
    (dsName: string, dsType: string) => {
      return application.navigateToUrl(
        `../observability-logs#/explorer?datasourceName=${dsName}&datasourceType=${dsType}`
      );
    },
    [application]
  );

  const handleSourceSelection = useCallback(
    (selectedDataSources: DataSourceOption[]) => {
      if (selectedDataSources.length === 0) {
        setSelectedSources(selectedDataSources);
        return;
      }
      // Temporary redirection solution for 2.11, where clicking non-index-pattern data sources
      // will prompt users with modal explaining they are being redirected to Observability log explorer
      if (selectedDataSources[0]?.ds?.getType() !== 'DEFAULT_INDEX_PATTERNS') {
        redirectToLogExplorer(selectedDataSources[0].label, selectedDataSources[0].type);
        return;
      }
      setSelectedSources(selectedDataSources);
      dispatch(setIndexPattern(selectedDataSources[0].value));
    },
    [dispatch, redirectToLogExplorer, setSelectedSources]
  );

  const handleGetDataSetError = useCallback(
    () => (error: Error) => {
      toasts.addError(error, {
        title:
          i18n.translate('dataExplorer.sidebar.failedToGetDataSetErrorDescription', {
            defaultMessage: 'Failed to get data set: ',
          }) + (error.message || error.name),
      });
    },
    [toasts]
  );

  const memorizedReload = useCallback(() => {
    dataSources.dataSourceService.reload();
  }, [dataSources.dataSourceService]);

  // Step 2
  const [[, guidedTourStepProps], guidedTourAction] = guidedTour || [[]];

  const sourceSelector = isEnhancementEnabled ? (
    <DatasetSelector onSubmit={handleDatasetSubmit} />
  ) : (
    <DataSourceSelectable
      dataSources={activeDataSources}
      dataSourceOptionList={dataSourceOptionList}
      setDataSourceOptionList={setDataSourceOptionList}
      onDataSourceSelect={handleSourceSelection}
      selectedSources={selectedSources}
      onGetDataSetError={handleGetDataSetError}
      onRefresh={memorizedReload}
      fullWidth
    />
  );

  const sideBarSourceSelector =
    guidedTourStepProps && guidedTourAction ? (
      <EuiTourStep
        {...guidedTourStepProps}
        minWidth={false}
        title={'Data selector'}
        display="block"
        content={
          <div>
            <EuiText grow={false}>
              You can select data from readily available sources in your workspace and choose the
              enhanced data selector for more options.
            </EuiText>
            <EuiSpacer />
            <EuiFlexGroup justifyContent="flexStart" responsive={false} gutterSize="s">
              <EuiFlexItem grow={false}>
                <EuiSmallButton iconType="arrowLeft" onClick={guidedTourAction.decrementStep}>
                  Previous
                </EuiSmallButton>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButton
                  iconType="arrowRight"
                  color="primary"
                  fill
                  onClick={guidedTourAction.incrementStep}
                >
                  Next
                </EuiSmallButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </div>
        }
      >
        {sourceSelector}
      </EuiTourStep>
    ) : (
      sourceSelector
    );

  return (
    <EuiPageSideBar className="deSidebar" sticky>
      <EuiSplitPanel.Outer
        className="eui-yScroll deSidebar_panel"
        hasBorder={true}
        borderRadius="none"
        color="transparent"
      >
        <EuiSplitPanel.Inner
          paddingSize="s"
          grow={false}
          color="transparent"
          className="deSidebar_dataSource"
        >
          {sideBarSourceSelector}
        </EuiSplitPanel.Inner>
        <EuiSplitPanel.Inner paddingSize="none" color="transparent" className="eui-yScroll">
          {children}
        </EuiSplitPanel.Inner>
      </EuiSplitPanel.Outer>
    </EuiPageSideBar>
  );
};

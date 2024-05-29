/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export enum PanelLinkType {
  DISCOVER = 'discover',
  DASHBOARD = 'dashboard',
}

export interface PanelLinkOptions {
  indexPatternId?: string;
  dashboardId?: string;
}

export interface PanelLink {
  id: string;
  type: PanelLinkType;
  label: string;
  options: PanelLinkOptions;
}

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { LanguageConfig } from '../types';
import { ISearchInterceptor } from '../../../../search';

export const getLuceneLanguageConfig = (
  search: ISearchInterceptor,
  defaultEditor: any
): LanguageConfig => {
  return {
    id: 'lucene',
    title: 'Lucene',
    search,
    getQueryString(_) {
      return '';
    },
    editor: defaultEditor,
    fields: {
      filterable: true,
      visualizable: true,
    },
    showDocLinks: true,
    editorSupportedAppNames: ['discover'],
    supportedAppNames: ['discover', 'dashboards', 'visualize', 'data-explorer'],
    sampleQueries: [
      {
        title: 'The title field contains the word wind.',
        query: 'title: wind',
      },
      {
        title: 'The title field contains the word wind or the word windy.',
        query: 'title: (wind OR windy)',
      },
      {
        title: 'The title field contains the phrase wind rises.',
        query: 'title: "wind rises"',
      },
      {
        title: 'The title.keyword field exactly matches The wind rises.',
        query: 'title.keyword: The wind rises',
      },
      {
        title:
          'Any field that starts with title (for example, title and title.keyword) contains the word wind',
        query: 'title*: wind',
      },
      {
        title:
          'The field that starts with article and ends with title contains the word wind. Matches the field article title.',
        query: 'article*title: wind',
      },
      {
        title: 'Documents in which the field description exists.',
        query: 'description:*',
      },
    ],
  };
};

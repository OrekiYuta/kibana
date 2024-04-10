/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import { TechnicalRuleDataFieldName, ValidFeatureId } from '@kbn/rule-data-utils';
import { IEsSearchRequest, IEsSearchResponse } from '@kbn/data-plugin/common';
import type {
  MappingRuntimeFields,
  QueryDslFieldAndFormat,
  QueryDslQueryContainer,
  SortCombinations,
} from '@elastic/elasticsearch/lib/api/typesWithBodyKey';

interface RuleRegistrySearchRequestTemp extends IEsSearchRequest {
  fields?: QueryDslFieldAndFormat[];
  query?: Pick<QueryDslQueryContainer, 'bool' | 'ids'>;
  sort?: SortCombinations[];
  pagination?: RuleRegistrySearchRequestPagination;
  runtimeMappings?: MappingRuntimeFields;
}

export type RuleRegistrySearchRequest = RuleRegistrySearchRequestTemp &
  (
    | {
        // @deprecated should use ruleTypeIds
        featureIds: ValidFeatureId[];
        ruleTypeIds?: never;
      }
    | {
        featureIds?: never;
        ruleTypeIds: string[];
      }
  );

export interface RuleRegistrySearchRequestPagination {
  pageIndex: number;
  pageSize: number;
}

export interface BasicFields {
  _id: string;
  _index: string;
}
export type EcsFieldsResponse = BasicFields & {
  [Property in TechnicalRuleDataFieldName]?: string[];
} & {
  [x: string]: unknown[];
};

export interface RuleRegistryInspect {
  dsl: string[];
}

export interface RuleRegistrySearchResponse extends IEsSearchResponse<EcsFieldsResponse> {
  inspect?: RuleRegistryInspect;
}

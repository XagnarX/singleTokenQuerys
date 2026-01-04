import axios from 'axios'
import { baseURL } from '@/constants/baseURL.ts'

const request = axios.create({
  baseURL: baseURL,
  timeout: 60000,
  withCredentials: true,
})

request.interceptors.request.use((config) => config, (error) => Promise.reject(error))
request.interceptors.response.use((response) => response.data, async (error) => {
  console.error('API Error:', error)
  return Promise.reject(error)
})

export default request

export const getTokenFilterAnalysisAggregate = async (params: {
  contractAddress: string;
  decimals: number;
  limit?: number;
  startBlock?: number;
  endBlock?: number;
  minAmount?: string;
  maxAmount?: string;
  buyAddressGroups?: Array<{ from: string; to: string }>;
  sellAddressGroups?: Array<{ from: string; to: string }>;
}, options?: any) => {
  // Convert camelCase to snake_case and encode address groups
  const queryParams: any = {
    contract_address: params.contractAddress.toLowerCase(),
    decimals: params.decimals,
  };

  if (params.limit !== undefined) queryParams.limit = params.limit;
  if (params.startBlock !== undefined) queryParams.start_block = params.startBlock;
  if (params.endBlock !== undefined) queryParams.end_block = params.endBlock;
  if (params.minAmount !== undefined) queryParams.min_amount = params.minAmount;
  if (params.maxAmount !== undefined) queryParams.max_amount = params.maxAmount;

  // Encode address groups as JSON strings
  if (params.buyAddressGroups && params.buyAddressGroups.length > 0) {
    const filtered = params.buyAddressGroups.filter(g => g.from || g.to);
    if (filtered.length > 0) {
      queryParams.buy_address_groups = encodeURIComponent(JSON.stringify(
        filtered.map(g => ({ from: g.from.toLowerCase(), to: g.to.toLowerCase() }))
      ));
    }
  }

  if (params.sellAddressGroups && params.sellAddressGroups.length > 0) {
    const filtered = params.sellAddressGroups.filter(g => g.from || g.to);
    if (filtered.length > 0) {
      queryParams.sell_address_groups = encodeURIComponent(JSON.stringify(
        filtered.map(g => ({ from: g.from.toLowerCase(), to: g.to.toLowerCase() }))
      ));
    }
  }

  return request('/api/token-filter-analysis/aggregate', { method: 'GET', params: queryParams, ...(options || {}) })
}

export const getAddressTags = async (params?: any, options?: any) => {
  return request('/api/address-tags', { method: 'GET', params: { ...params }, ...(options || {}) })
}

export const addAddressTag = async (body: any, options?: any) => {
  return request('/api/address-tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) })
}

export const updateAddressTag = async (body: any, options?: any) => {
  return request('/api/address-tags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) })
}

export const deleteAddressTag = async (body: any, options?: any) => {
  return request('/api/address-tags', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, data: body, ...(options || {}) })
}

export const getUniqueAddressTags = async (options?: any) => {
  return request('/api/address-tags/unique', { method: 'GET', ...(options || {}) })
}

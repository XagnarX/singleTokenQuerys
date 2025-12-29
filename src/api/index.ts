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

export const getTokenFilterAnalysisAggregate = async (params: any, options?: any) => {
  return request('/api/token-filter-analysis/aggregate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, data: params, ...(options || {}) })
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

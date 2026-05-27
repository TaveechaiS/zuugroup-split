// src/lib/api/services.ts
'use client'

import { api } from './client'

export const customersApi = {
  list: () => api.get('/customers').then((r) => r.data),
  get: (id: string) => api.get(`/customers/${id}`).then((r) => r.data),
  prices: (id: string) => api.get(`/customers/${id}/prices`).then((r) => r.data),
  create: (body: any) => api.post('/customers', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/customers/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/customers/${id}`),
}

export const customerRequestsApi = {
  list: () => api.get('/customer-requests').then((r) => r.data),
  get: (id: string) => api.get(`/customer-requests/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/customer-requests', body).then((r) => r.data),
  approve: (id: string) => api.post(`/customer-requests/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/customer-requests/${id}/reject`, { reason }),
}

export const productsApi = {
  list: () => api.get('/products').then((r) => r.data),
  categories: () => api.get('/products/categories').then((r) => r.data),
  get: (id: string) => api.get(`/products/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/products', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/products/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`),
}

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/users', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/users/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`),
}

export const teamsApi = {
  list: () => api.get('/teams').then((r) => r.data),
  my: () => api.get('/teams/my').then((r) => r.data),
  create: (body: any) => api.post('/teams', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/teams/${id}`, body).then((r) => r.data),
  remove: (id: string) => api.delete(`/teams/${id}`),
}

export const quotationsApi = {
  list: (params?: { scope?: string; status?: string }) =>
    api.get('/quotations', params).then((r) => r.data),
  get: (id: string) => api.get(`/quotations/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/quotations', body).then((r) => r.data),
  update: (id: string, body: any) => api.patch(`/quotations/${id}`, body).then((r) => r.data),
  approve: (id: string) => api.post(`/quotations/${id}/approve`).then((r) => r),
  reject: (id: string, reason: string) => api.post(`/quotations/${id}/reject`, { reason }),
}

export const ordersApi = {
  list: (params?: { scope?: string; status?: string }) =>
    api.get('/orders', params).then((r) => r.data),
  get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (body: any) => api.post('/orders', body).then((r) => r.data),
  reviewPass: (id: string) => api.post(`/orders/${id}/review-pass`),
  reviewReject: (id: string, reason: string) => api.post(`/orders/${id}/review-reject`, { reason }),
  confirm: (id: string) => api.post(`/orders/${id}/confirm`),
  cancel: (id: string, reason: string) => api.post(`/orders/${id}/cancel`, { reason }),
}

export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/mark-all-read'),
}

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin').then((r) => r.data),
  manager: () => api.get('/dashboard/manager').then((r) => r.data),
  cfo: () => api.get('/dashboard/cfo').then((r) => r.data),
}

export const reportsApi = {
  admin: () => api.get('/reports/admin').then((r) => r.data),
  manager: () => api.get('/reports/manager').then((r) => r.data),
}

export const activityLogsApi = {
  list: () => api.get('/activity-logs').then((r) => r.data),
}

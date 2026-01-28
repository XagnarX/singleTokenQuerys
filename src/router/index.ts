import { createRouter, createWebHistory } from 'vue-router'
import TokenFilterAnalysis from '@/views/TokenFilterAnalysis.vue'
import Dashboard from '@/views/Dashboard.vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard
  },
  {
    path: '/analysis/:sessionId',
    name: 'TokenFilterAnalysis',
    component: TokenFilterAnalysis,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

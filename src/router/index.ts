import { createRouter, createWebHistory } from 'vue-router'
import TokenFilterAnalysis from '@/views/TokenFilterAnalysis.vue'

const routes = [
  {
    path: '/token-filter-analysis',
    name: 'TokenFilterAnalysis',
    component: TokenFilterAnalysis
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

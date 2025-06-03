import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('../views/FilesView.vue')
    },
    {
      path: '/permissions',
      name: 'permissions',
      component: () => import('../views/PermissionsView.vue')
    }
  ]
})

export default router

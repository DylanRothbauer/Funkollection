import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Layout from '@/components/Layout.vue'
import AboutView from '../views/AboutView.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/',
      name: 'layout',
      component: Layout,
      children: [
        {
          path: '/about',
          component: AboutView,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

/// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const auth = getAuth()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

  onAuthStateChanged(auth, (user) => {
    if (requiresAuth && !user) {
      next('/') // Not signed in, redirect to home
    } else if (!requiresAuth && user && to.path === '/') {
      next('/dashboard') // Signed in, redirect to dashboard if trying to access home
    } else {
      next() // Allow navigation
    }
  })
})

export default router

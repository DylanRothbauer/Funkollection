import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Layout from '@/components/Layout.vue'
import AboutView from '../views/AboutView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CollectionView from '@/views/CollectionView.vue'
import AddPop from '@/views/AddPop.vue'
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
      component: Layout,
      children: [
        {
          path: 'about',
          name: 'about',
          component: AboutView,
          meta: { requiresAuth: true },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { requiresAuth: true },
        },
        {
          path: 'collection',
          name: 'collection',
          component: CollectionView,
          meta: { requiresAuth: true },
        },
        {
          path: 'add-pop',
          name: 'add-pop',
          component: AddPop,
          meta: { requiresAuth: true },
        },
      ],
    },
  ],
})

const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const removeListener = onAuthStateChanged(
      getAuth(),
      (user) => {
        removeListener()
        resolve(user)
      },
      reject,
    )
  })
}

// /// Navigation guard for auth
router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (await getCurrentUser()) {
      next()
    } else {
      alert('You do not have acces!')
      next('/')
    }
  } else {
    next()
  }
})

export default router

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import Layout from '@/components/Layout.vue'
import AboutView from '../views/AboutView.vue'
import DashboardView from '@/views/DashboardView.vue'
import CollectionView from '@/views/CollectionView.vue'
import FavoritesView from '@/views/FavoritesView.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import Account from '@/views/Account.vue'
import PrivacyPolicy from '@/views/PrivacyPolicy.vue'
import TermsOfService from '@/views/TermsOfService.vue'
import AboutUs from '@/views/AboutUs.vue'
import FunkoChat from '@/views/FunkoChat.vue'
import FriendsView from '@/views/FriendsView.vue'
import FriendsCollectionView from '@/views/FriendsCollectionView.vue'
import BadgesView from '@/views/BadgesView.vue'
import { Badge } from 'primevue'

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
        // {
        //   path: 'about',
        //   name: 'about',
        //   component: AboutView,
        //   meta: { requiresAuth: true },
        // },
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
          path: 'favorites',
          name: 'favorites',
          component: FavoritesView,
          meta: { requiresAuth: true },
        },
        {
          path: 'account',
          name: 'account',
          component: Account,
          meta: { requiresAuth: true },
        },
        {
          path: 'funkochat',
          name: 'funkochat',
          component: FunkoChat,
          meta: { requiresAuth: true }
        },
        {
          path: 'friends',
          name: 'friends',
          component: FriendsView,
          meta: { requiresAuth: true }
        },
        {
          path: 'friends/:friendId',
          name: 'friendCollection',
          component: FriendsCollectionView,
          meta: { requiresAuth: true }
        },
        {
          path: 'badges',
          name: 'badges',
          component: BadgesView,
          meta: {requiresAuth: true}
        },
      ],
    },
    {
      path: '/privacypolicy',
      name: 'PrivacyPolicy',
      component: PrivacyPolicy,
      meta: { requiresAuth: false },
    },
    {
      path: '/termsofservice',
        name: 'TermsOfService',
        component: TermsOfService,
        meta: { requiresAuth: false },
    },
    {
      path: '/aboutus',
      name: 'AboutUs',
      component: AboutUs,
      meta: { requiresAuth: false },
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

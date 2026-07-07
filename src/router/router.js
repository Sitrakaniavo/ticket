import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '../components/DashboardPage.vue'
import HomePage from '../components/HomePage.vue'
import LoginPage from '../components/LoginPage.vue'
import NotFoundPage from '../components/NotFoundPage.vue'
import RegisterPage from '../components/RegisterPage.vue'
import ProfilePage from '../components/ProfilePage.vue'

const routeNames = {
  dashboard: 'Dashboard',
  home: 'Home',
  login: 'Login',
  signup: 'Signup',
  panier: 'Panier', // Ajouté
  notFound: 'NotFound',
}

function getStoredSession() {
  const session = localStorage.getItem('rail_user_session')
  if (!session) return null
  try {
    return JSON.parse(session)
  } catch {
    localStorage.removeItem('rail_user_session')
    return null
  }
}

const routes = [
  {
    path: '/',
    name: routeNames.home,
    component: HomePage,
  },
  {
  path: '/profile',
  name: 'Profile',
  component: ProfilePage,
  meta: { requiresAuth: true }
},
  {
    path: '/login',
    name: routeNames.login,
    component: LoginPage,
    meta: { publicOnly: true },
  },
  {
    path: '/register',
    name: routeNames.signup,
    component: RegisterPage,
    meta: { publicOnly: true },
  },
  {
    path: '/dashboard',
    name: routeNames.dashboard,
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: routeNames.notFound,
    component: NotFoundPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Navigation Guard
router.beforeEach((to) => {
  const userSession = getStoredSession()

  // Si la route nécessite une auth et qu'il n'y a pas de session
  if (to.meta.requiresAuth && !userSession) {
    return { name: routeNames.login }
  }

  // Si la route est publique (login/signup) et qu'il y a une session
  if (to.meta.publicOnly && userSession) {
    return { name: routeNames.dashboard }
  }

  return true
})

export default router
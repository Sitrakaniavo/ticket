import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import LoginPage from '../pages/LoginPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import RegisterPage from '../pages/RegisterPage.vue'
import ProfilePage from '../pages/ProfilePage.vue'
import BookingPage from '../pages/BookingPage.vue'
import TicketPage from '../pages/TicketPage.vue'
import ContactPage from '../pages/ContactPage.vue'

const routeNames = {
  home: 'Home',
  login: 'Login',
  signup: 'Signup',
  booking: 'Booking',
  tickets: 'Tickets',
  profile: 'Profile',
  contact: 'Contact',
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
    name: routeNames.profile,
    component: ProfilePage,
    meta: { requiresAuth: true },
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
    path: '/booking',
    name: routeNames.booking,
    component: BookingPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/tickets',
    name: routeNames.tickets,
    component: TicketPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/contact',
    name: routeNames.contact,
    component: ContactPage,
  },
  {
    path: '/dashboard',
    redirect: { name: routeNames.booking },
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
    return { name: routeNames.booking }
  }

  return true
})

export default router
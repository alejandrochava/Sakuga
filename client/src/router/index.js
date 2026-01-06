import { createRouter, createWebHistory } from 'vue-router';
import GenerateView from '../views/GenerateView.vue';
import { useSetup } from '../composables/useSetup';

// Lazy load secondary views for code splitting
const HistoryView = () => import('../views/HistoryView.vue');
const QueueView = () => import('../views/QueueView.vue');
const StatsView = () => import('../views/StatsView.vue');
const HelpView = () => import('../views/HelpView.vue');
const SettingsView = () => import('../views/SettingsView.vue');
const CollectionsView = () => import('../views/CollectionsView.vue');
const SetupWizardView = () => import('../views/SetupWizardView.vue');

const routes = [
  {
    path: '/setup',
    name: 'setup',
    component: SetupWizardView,
    meta: { skipSetupCheck: true }
  },
  {
    path: '/',
    name: 'generate',
    component: GenerateView
  },
  {
    path: '/history',
    name: 'history',
    component: HistoryView
  },
  {
    path: '/queue',
    name: 'queue',
    component: QueueView
  },
  {
    path: '/stats',
    name: 'stats',
    component: StatsView
  },
  {
    path: '/help',
    name: 'help',
    component: HelpView
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsView
  },
  {
    path: '/collections',
    name: 'collections',
    component: CollectionsView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard to redirect to setup if not configured
let setupChecked = false;

router.beforeEach(async (to, from, next) => {
  // Skip check for setup page itself
  if (to.meta.skipSetupCheck) {
    return next();
  }

  // Only check once per session
  if (!setupChecked) {
    const { checkSetupStatus, isSetupComplete } = useSetup();
    await checkSetupStatus();
    setupChecked = true;

    if (!isSetupComplete()) {
      return next({ name: 'setup' });
    }
  }

  next();
});

export default router;

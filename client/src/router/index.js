import { createRouter, createWebHistory } from 'vue-router';
import GenerateView from '../views/GenerateView.vue';

// Lazy load secondary views for code splitting
const HistoryView = () => import('../views/HistoryView.vue');
const QueueView = () => import('../views/QueueView.vue');
const StatsView = () => import('../views/StatsView.vue');
const HelpView = () => import('../views/HelpView.vue');
const SettingsView = () => import('../views/SettingsView.vue');

const routes = [
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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

import { createRouter, createWebHistory } from 'vue-router';
import GenerateView from '../views/GenerateView.vue';
import HistoryView from '../views/HistoryView.vue';
import QueueView from '../views/QueueView.vue';
import StatsView from '../views/StatsView.vue';

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
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;

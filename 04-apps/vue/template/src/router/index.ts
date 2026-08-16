<!-- PURPOSE OF THIS FILE: Vue Router konfigürasyonu — lazy loading route'lar ve navigation guard -->
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/{{model_names}}',
      name: '{{model_names}}',
      component: () => import('@/views/{{ModelName}}ListView.vue'),
    },
    {
      path: '/{{model_names}}/:id',
      name: '{{model_name}}-detail',
      component: () => import('@/views/{{ModelName}}DetailView.vue'),
      props: true,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

export default router;

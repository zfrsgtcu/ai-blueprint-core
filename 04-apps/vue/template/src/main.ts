<!-- PURPOSE OF THIS FILE: Vue uygulama başlatma — createApp + Pinia + Vue Router + global CSS import -->
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');

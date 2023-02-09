import { createWebHistory, createRouter } from 'vue-router'
import Home from '../views/Home.vue';


const routes = [
  {
    path: '/vuejs-nodejs-google-image-crawling/',
    name: 'Home',
    component: Home,
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router;

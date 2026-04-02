import './assets/main.css'
import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { createPinia } from 'pinia'
import App from './App.vue'
import TiebaToolsPage from './pages/TiebaToolsPage.vue'

const routes = [
  { path: '/', redirect: '/tieba' },
  { path: '/tieba', name: 'tieba', component: TiebaToolsPage }
]

const pinia = createPinia()

const router = createRouter({
  history: createWebHistory(),
  routes
})

createApp(App).use(pinia).use(router).mount('#app')

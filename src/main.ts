import './assets/main.scss'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import { createApp } from 'vue'

import App from './App.vue'
import router from './router'

document.body.setAttribute('arco-theme', 'dark')

const app = createApp(App)
app.use(ArcoVue)
app.use(router)
app.mount('#app')

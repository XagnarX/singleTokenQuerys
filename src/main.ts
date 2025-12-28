import './assets/main.scss'
import ArcoVue from '@arco-design/web-vue'
import '@arco-design/web-vue/dist/arco.css'
import { createApp } from 'vue'

import App from './App.vue'

document.body.setAttribute('arco-theme', 'dark')

const app = createApp(App)
app.use(ArcoVue)
app.mount('#app')

import Vue from 'vue'
import App from './App.vue'
import 'lib-flexible/flexible'
require('./assets/base.css')
import router from './router/router'

// import ElementUI from 'element-ui';
// import 'element-ui/lib/theme-chalk/index.css';
// Vue.use(ElementUI);

// import store from './store/index'
// import Base from './utils/base' //通用方法库
// import Vconsole from 'vconsole';

// new Vconsole();
Vue.config.productionTip = false


new Vue({
  // store,
  router,
  render: h => h(App),
}).$mount('#app')

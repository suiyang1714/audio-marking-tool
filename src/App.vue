<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script>

export default {
  name: 'App',
}
</script>

<style>
  html,body,#app{
    width: 100%;
    height: 100%;
    min-height: 100%;
  }
  #app>.main{
    height: 100%;
    overflow-y: auto;
    background: #f4f4f4;
    -webkit-overflow-scrolling: touch;
  }
</style>

<script setup lang="ts">
import SideNav from './SideNav.vue'
import AppHeader from './AppHeader.vue'
import TabBar from './TabBar.vue'
import ContentArea from './ContentArea.vue'
</script>

<template>
  <div class="main-frame">
    <SideNav />
    <div class="main-frame__body">
      <AppHeader />
      <TabBar />
      <ContentArea />
    </div>
  </div>
</template>

<style scoped>
.main-frame {
  display: flex;
  height: 100%;
  overflow: hidden;
}
.main-frame__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}
</style>

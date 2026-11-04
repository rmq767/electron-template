<script setup lang="ts">
import AppTitlebar from './app-titlebar.vue'
import SideNav from './side-nav.vue'
import TabBar from './tab-bar.vue'
import ContentArea from './content-area.vue'
</script>

<template>
  <div class="main-frame">
    <app-titlebar />
    <div class="main-frame__body">
      <side-nav />
      <section class="main-frame__workspace">
        <tab-bar />
        <content-area />
      </section>
    </div>
  </div>
</template>

<style scoped lang="scss">
.main-frame {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: var(--app-canvas);
}

.main-frame__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.main-frame__workspace {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}
</style>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { APP_NAME, APP_TAGLINE } from '@shared/constants/app'
import { env } from '@renderer/env'
import BrandMark from '@renderer/components/chrome/brand-mark.vue'
import WindowBrandBar from '@renderer/components/chrome/window-brand-bar.vue'

defineOptions({ name: 'splash' })

const version = ref('')

onMounted(async () => {
  try {
    const info = await window.api?.app?.getInfo()
    version.value = info?.version ?? ''
  } catch {
    /* 拿不到宿主信息时只是不显示版本号 */
  }
})
</script>

<template>
  <div class="auth-window">
    <window-brand-bar :minimize="false" />

    <main class="splash-body">
      <section class="splash-content">
        <brand-mark :size="62" class="splash-mark" />
        <h1>{{ APP_NAME }}</h1>
        <p v-if="APP_TAGLINE">{{ APP_TAGLINE }}</p>

        <div class="splash-status">
          <span class="splash-status__pulse" />
          <span>正在准备工作台</span>
          <span class="splash-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </div>

        <div class="splash-progress" aria-hidden="true">
          <span />
        </div>
      </section>

      <footer class="splash-footer">
        <span class="status-dot" />
        <span>{{ env.isDev ? '开发环境' : '正在启动' }}</span>
        <span v-if="version" class="mono">v{{ version }}</span>
      </footer>
    </main>
  </div>
</template>

<style scoped>
.splash-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 0 34px 18px;
}

.splash-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  animation: splash-in 0.32s ease-out both;
}

.splash-mark {
  margin-bottom: 18px;
  filter: drop-shadow(0 12px 24px rgba(15, 118, 110, 0.24));
}

.splash-content h1 {
  margin: 0;
  color: var(--app-ink);
  font-size: 23px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.splash-content p {
  margin: 7px 0 0;
  color: var(--app-muted);
  font-size: 12.5px;
  letter-spacing: 0.01em;
}

.splash-status {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 38px;
  color: var(--app-muted);
  font-size: 12px;
}

.splash-status__pulse {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--app-accent);
  animation: splash-pulse 1.4s ease-in-out infinite;
}

.splash-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding-top: 2px;
}

.splash-dots i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--app-muted);
  animation: splash-bounce 1.2s ease-in-out infinite;
}

.splash-dots i:nth-child(2) {
  animation-delay: 0.15s;
}

.splash-dots i:nth-child(3) {
  animation-delay: 0.3s;
}

.splash-progress {
  width: 180px;
  height: 3px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--app-border);
}

.splash-progress span {
  display: block;
  width: 42%;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--app-accent), transparent);
  animation: splash-slide 1.25s ease-in-out infinite;
}

.splash-footer {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding-top: 14px;
  color: var(--app-muted);
  font-size: 10.5px;
  letter-spacing: 0.02em;
}

@keyframes splash-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes splash-pulse {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0 var(--app-accent-soft);
  }
  50% {
    opacity: 0.65;
    box-shadow: 0 0 0 4px transparent;
  }
}

@keyframes splash-bounce {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-2px);
  }
}

@keyframes splash-slide {
  0% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(320%);
  }
}
</style>

<template>
  <a-config-provider :locale="zhCN"
                     :theme="{
                      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
                    }">
    <a-app class="ant-app">
      <div class="app-container">
        <router-view></router-view>
      </div>
    </a-app>
  </a-config-provider>
</template>

<script setup>
import { I18nInjectionKey } from 'vue-i18n'
import { provide } from 'vue'
import i18n from './i18n'

import { useDark, useToggle } from '@vueuse/core'
import { theme } from 'ant-design-vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

dayjs.locale('zh-cn');

provide(I18nInjectionKey, i18n)

const isDark = useDark({
  selector: 'body',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light'
})

const toggleDark = useToggle(isDark)

const appTheme = '$$TinyEngine{meta.config.theme}END$'

toggleDark(appTheme === 'dark')

</script>

<style>
#app {
  width: 100%;
  height: 100%;
}

.ant-app {
  width: 100%;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100%;
}
</style>

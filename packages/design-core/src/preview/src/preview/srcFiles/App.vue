<template>
  <a-config-provider
    :theme="{
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm
    }"
  >
    <a-app class="ant-app">
      <Main />
    </a-app>
  </a-config-provider>
</template>

<script setup>
import { provide, watch } from 'vue'
import { I18nInjectionKey, createI18n } from 'vue-i18n'
import { createPinia } from 'pinia'
import { useBroadcastChannel } from '@vueuse/core'
import { BROADCAST_CHANNEL, I18N_KEY_MAPS } from './constant.js'
import './injectGlobal.js'
import './app.js'
import lowcode from './lowcode.js'
import messages from './locales.js'
import Main from './Main.vue'
import locale from '@opentiny/vue-locale'

import { theme, ConfigProvider as AConfigProvider, App as AApp } from 'ant-design-vue'
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark({
  selector: 'html',
  attribute: 'color-scheme',
  valueDark: 'dark',
  valueLight: 'light'
})

const toggleDark = useToggle(isDark)

const appTheme = '$$TinyEngine{theme}END$'

toggleDark(appTheme === 'dark')

const customCreateI18n = ({ locale, messages }) => {
  const newMessages = {}
  Object.keys(messages).forEach((key) => {
    const lang = I18N_KEY_MAPS[key] || key
    newMessages[lang] = messages[key]
  })

  return createI18n({
    locale,
    messages: newMessages,
    legacy: false
  })
}

const i18n = locale.initI18n({
  i18n: { locale: 'zh_CN' },
  createI18n: customCreateI18n,
  messages: {
    zhCN: {
      change_lang: '切换语言'
    },
    enUS: {
      change_lang: 'change lang'
    }
  }
})

if (messages && typeof messages === 'object') {
  Object.entries(messages).forEach(([locale, message]) => {
    i18n.global.mergeLocaleMessage(locale, message)
  })
}

i18n.lowcode = lowcode

window.__app__.use(i18n)
provide(I18nInjectionKey, i18n)

const { data } = useBroadcastChannel({ name: BROADCAST_CHANNEL.PreviewLang })

watch(data, () => {
  i18n.global.locale.value = data.value
})

window.__app__.use(createPinia())
</script>

<style>
body {
  margin: 0;
}

html[color-scheme='dark'] {
  background-color: rgb(0, 0, 0);
  color: rgba(255, 255, 255, 0.85);
}

html[color-scheme='light'] {
  background-color: rgb(255, 255, 255);
  color: rgba(0, 0, 0, 0.85);
}
</style>

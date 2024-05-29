// 这里 package.json 格式设置为 js，避免被识别成一个 package
export default (schema) => {
  const packageName = schema?.meta?.name || '@opentiny/tiny-engine-preview-vue'

  const res = {
    name: packageName,
    version: '1.0.0',
    "description": "An Electron application with Vue",
    "author": "example.com",
    "homepage": "https://electron-vite.org",
    scripts: {
      "format": "prettier --write .",
      "lint": "eslint . --ext .js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix",
      "start": "electron-vite preview",
      "dev": "electron-vite dev",
      "build": "electron-vite build",
      "postinstall": "electron-builder install-app-deps",
      "build:unpack": "npm run build && electron-builder --dir",
      "build:win": "npm run build && electron-builder --win",
      "build:mac": "npm run build && electron-builder --mac",
      "build:linux": "npm run build && electron-builder --linux"
    },
    "main": "./out/main/index.js",
    dependencies: {
      "@electron-toolkit/preload": "^3.0.0",
      "@electron-toolkit/utils": "^3.0.0",
      "electron-updater": "^6.1.7"
    },
    devDependencies: {
      // devDependencies
      "less": "^4.2.0",
      "unplugin-vue-components": "^0.26.0",
      '@vitejs/plugin-vue': '^4.5.1',
      '@vitejs/plugin-vue-jsx': '^3.1.0',
      // vite: '^4.3.7',
      // dependencies
      "@ant-design/icons-vue": "^7.0.1",
      "ant-design-vue": "^4.1.2",
      '@opentiny/tiny-engine-i18n-host': '^1.0.0',
      '@opentiny/vue': '^3.10.0',
      '@opentiny/vue-icon': '^3.10.0',
      axios: '^0.21.1',
      'axios-mock-adapter': '^1.19.0',
      "dayjs": "^1.11.11",
      "@vueuse/core": "^10.9.0",
      // vue: '^3.3.9',
      'vue-i18n': '^9.2.0-beta.3',
      'vue-router': '^4.2.5',
      pinia: '^2.1.7',
      // electron devDependencies
      "@electron-toolkit/eslint-config": "^1.0.1",
      "@rushstack/eslint-patch": "^1.6.1",
      "@vitejs/plugin-vue": "^5.0.3",
      "@vue/eslint-config-prettier": "^9.0.0",
      "electron": "^28.2.0",
      "electron-builder": "^24.9.1",
      "electron-vite": "^2.0.0",
      "eslint": "^8.56.0",
      "eslint-plugin-vue": "^9.20.1",
      "prettier": "^3.2.4",
      "vite": "^5.0.12",
      "vue": "^3.4.15"
    }
  }

  return JSON.stringify(res)
}

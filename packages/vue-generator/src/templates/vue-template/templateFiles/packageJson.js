// 这里 package.json 格式设置为 js，避免被识别成一个 package
export default (schema) => {
  const packageName = schema?.meta?.name || '@opentiny/tiny-engine-preview-vue'

  const res = {
    name: packageName,
    version: '1.0.0',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview'
    },
    main: 'dist/index.js',
    module: 'dist/index.js',
    dependencies: {
      '@ant-design/icons-vue': '^7.0.1',
      'ant-design-vue': '^4.1.2',
      '@opentiny/tiny-engine-i18n-host': '^1.0.0',
      '@opentiny/vue': '^3.14.0',
      '@opentiny/vue-icon': '^3.14.0',
      axios: '^0.21.1',
      'axios-mock-adapter': '^1.19.0',
      dayjs: '^1.11.11',
      '@vueuse/core': '^10.9.0',
      vue: '^3.3.9',
      'vue-i18n': '^9.2.0-beta.3',
      'vue-router': '^4.2.5',
      pinia: '^2.1.7'
    },
    devDependencies: {
      less: '^4.2.0',
      'unplugin-vue-components': '^0.26.0',
      '@vitejs/plugin-vue': '^4.5.1',
      '@vitejs/plugin-vue-jsx': '^3.1.0',
      vite: '^4.3.7'
    }
  }

  return JSON.stringify(res)
}

export default () => {
  // 避免在构建的时候，被 process. env 替换
  const processStr = ['process', 'env']

  const res = `
  import { resolve } from 'path'
  import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
  import vue from '@vitejs/plugin-vue'

  import vueJsx from '@vitejs/plugin-vue-jsx'
  import Components from 'unplugin-vue-components/vite'
  import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

  export default defineConfig({
    main: {
      plugins: [externalizeDepsPlugin()]
    },
    preload: {
      plugins: [externalizeDepsPlugin()]
    },
    renderer: {
      resolve: {
        alias: {
          '@': resolve('src/renderer/src'),
        }
      },
      plugins: [
        vue(),
        vueJsx(),
        Components({
          resolvers: [
            AntDesignVueResolver({
              importStyle: false // css in js
            })
          ]
        })
      ],
      define: {
        '${processStr.join('.')}': { ...${processStr.join('.')} }
      },
      build: {
        minify: true,
        commonjsOptions: {
          transformMixedEsModules: true
        },
        cssCodeSplit: false
      }
    }
  })`

  return res
}

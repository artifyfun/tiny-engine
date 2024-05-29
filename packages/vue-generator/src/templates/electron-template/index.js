import readmeFile from './templateFiles/README.md?raw'
import genViteConfig from './templateFiles/genViteConfig'
import getPackageJson from './templateFiles/packageJson'
import gitIgnoreFile from './templateFiles/.gitignore?raw'
import entryHTMLFile from './templateFiles/src/renderer/index.html?raw'
import mainJSFile from './templateFiles/src/renderer/src/main.js?raw'
import appVueFile from './templateFiles/src/renderer/src/App.vue?raw'
import bridgeFile from './templateFiles/src/renderer/src/lowcodeConfig/bridge.js?raw'
import dataSourceFile from './templateFiles/src/renderer/src/lowcodeConfig/dataSource.js?raw'
import lowcodeJSFile from './templateFiles/src/renderer/src/lowcodeConfig/lowcode.js?raw'
import lowcodeStoreFile from './templateFiles/src/renderer/src/lowcodeConfig/store.js?raw'
import axiosFile from './templateFiles/src/renderer/src/http/axios.js?raw'
import axiosConfigFile from './templateFiles/src/renderer/src/http/config.js?raw'
import axiosLoadingFile from './templateFiles/src/renderer/src/http/loading.js?raw'
import httpEntryFile from './templateFiles/src/renderer/src/http/index.js?raw'
import mainCssFile from './templateFiles/src/renderer/src/assets/main.css?raw'
import normalizeCssFile from './templateFiles/src/renderer/src/assets/normalize.css?raw'
import loadingVueFile from './templateFiles/src/renderer/src/components/Loading/index.vue?raw'
import loadingHooksFile from './templateFiles/src/renderer/src/hooks/useLoading.js?raw'

/**
 * 模板写入动态内容
 * @param {*} context
 * @param {*} str
 * @returns
 */
const getTemplate = (schema, str) => {
  return str.replace(/(\$\$TinyEngine{(.*)}END\$)/g, function (match, p1, p2) {
    if (!p2) {
      return ''
    }

    const keyArr = p2.split('.')
    const value = keyArr.reduce((preVal, key) => preVal?.[key] ?? '', schema)

    return value
  })
}

/**
 * get project template
 * @returns
 */
export function generateTemplate(schema) {
  return [
    {
      fileType: 'md',
      fileName: 'README.md',
      path: '.',
      fileContent: getTemplate(schema, readmeFile)
    },
    {
      fileType: 'js',
      fileName: 'electron.vite.config.mjs',
      path: '.',
      fileContent: genViteConfig(schema)
    },
    {
      fileType: 'json',
      fileName: 'package.json',
      path: '.',
      fileContent: getPackageJson(schema)
    },
    {
      fileName: '.gitignore',
      path: '.',
      fileContent: getTemplate(schema, gitIgnoreFile)
    },
    {
      fileType: 'html',
      fileName: './src/renderer/index.html',
      path: '.',
      fileContent: getTemplate(schema, entryHTMLFile)
    },
    {
      fileType: 'js',
      fileName: 'main.js',
      path: './src/renderer/src',
      fileContent: getTemplate(schema, mainJSFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.vue',
      path: './src/renderer/src',
      fileContent: getTemplate(schema, appVueFile)
    },
    {
      fileType: 'js',
      fileName: 'bridge.js',
      path: './src/renderer/src/lowcodeConfig',
      fileContent: bridgeFile
    },
    {
      fileType: 'js',
      fileName: 'dataSource.js',
      path: './src/renderer/src/lowcodeConfig',
      fileContent: dataSourceFile
    },
    {
      fileType: 'js',
      fileName: 'lowcode.js',
      path: './src/renderer/src/lowcodeConfig',
      fileContent: lowcodeJSFile
    },
    {
      fileType: 'js',
      fileName: 'store.js',
      path: './src/renderer/src/lowcodeConfig',
      fileContent: lowcodeStoreFile
    },
    {
      fileType: 'js',
      fileName: 'axios.js',
      path: './src/renderer/src/http',
      fileContent: axiosFile
    },
    {
      fileType: 'js',
      fileName: 'config.js',
      path: './src/renderer/src/http',
      fileContent: axiosConfigFile
    },
    {
      fileType: 'js',
      fileName: 'loading.js',
      path: './src/renderer/src/http',
      fileContent: axiosLoadingFile
    },
    {
      fileType: 'js',
      fileName: 'index.js',
      path: './src/renderer/src/http',
      fileContent: httpEntryFile
    },
    {
      fileType: 'css',
      fileName: 'main.css',
      path: './src/renderer/src/assets',
      fileContent: mainCssFile
    },
    {
      fileType: 'css',
      fileName: 'normalize.css',
      path: './src/renderer/src/assets',
      fileContent: normalizeCssFile
    },
    {
      fileType: 'vue',
      fileName: 'index.vue',
      path: './src/renderer/src/components/Loading',
      fileContent: loadingVueFile
    },
    {
      fileType: 'js',
      fileName: 'useLoading.js',
      path: './src/renderer/src/hooks',
      fileContent: loadingHooksFile
    }
  ]
}

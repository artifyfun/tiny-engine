import readmeFile from './templateFiles/README.md?raw'
import genViteConfig from './templateFiles/genViteConfig'
import getPackageJson from './templateFiles/packageJson'
import gitIgnoreFile from './templateFiles/.gitignore?raw'
import entryHTMLFile from './templateFiles/index.html?raw'
import mainJSFile from './templateFiles/src/main.js?raw'
import appVueFile from './templateFiles/src/App.vue?raw'

const importFiles = import.meta.glob('./templateFiles/**/*', { eager: true, as: 'raw' })

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
  const modifyFiles = [
    {
      fileType: 'md',
      fileName: 'README.md',
      path: '.',
      fileContent: getTemplate(schema, readmeFile)
    },
    {
      fileType: 'js',
      fileName: 'vite.config.js',
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
      fileName: 'index.html',
      path: '.',
      fileContent: getTemplate(schema, entryHTMLFile)
    },
    {
      fileType: 'js',
      fileName: 'main.js',
      path: './src',
      fileContent: getTemplate(schema, mainJSFile)
    },
    {
      fileType: 'vue',
      fileName: 'App.vue',
      path: './src',
      fileContent: getTemplate(schema, appVueFile)
    }
  ]

  const ignoreFiles = ['packageJson.js', 'genViteConfig.js']

  const staticFiles = Object.keys(importFiles)
    .map((key) => {
      const path = key.split('/').slice(2, -1).join('/')
      return {
        fileType: key.split('.').pop(),
        fileName: key.split('/').pop(),
        path: path ? `./${path}` : '.',
        fileContent: importFiles[key]
      }
    })
    .filter((file) => {
      return (
        !ignoreFiles.includes(file.fileName) &&
        !modifyFiles.some((modifyFile) => modifyFile.fileName === file.fileName && modifyFile.path === file.path)
      )
    })

  return [...modifyFiles, ...staticFiles]
}

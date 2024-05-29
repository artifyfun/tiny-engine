<template>
  <div class="generate-code">
    <span class="menu-icon-wrapper icon" @click.stop="handleShowMenu">
      <svg-icon :name="icon"></svg-icon>
      <div v-if="state.showMenu" class="main-menu">
        <ul>
          <li v-for="(item, index) in menus" :key="index" @click="handleClick(item)">
            <span class="menu-item">{{ item.name }}</span>
          </li>
        </ul>
      </div>
    </span>
    <generate-file-selector
      :visible="state.showDialogbox"
      :data="state.saveFilesInfo"
      @confirm="confirm"
      @cancel="cancel"
    ></generate-file-selector>
  </div>
</template>

<script>
import { reactive, onUnmounted } from 'vue'
import {
  getGlobalConfig,
  useBlock,
  useCanvas,
  useNotify,
  useLayout,
  useEditorInfo
} from '@opentiny/tiny-engine-controller'
import { fs } from '@opentiny/tiny-engine-utils'
import { useHttp } from '@opentiny/tiny-engine-http'
import { generateApp, parseRequiredBlocks } from '@opentiny/tiny-engine-dsl-vue'
import { fetchMetaData, fetchPageList, fetchBlockSchema } from './http'
import FileSelector from './FileSelector.vue'

export default {
  components: {
    GenerateFileSelector: FileSelector
  },
  props: {
    icon: {
      type: String,
      default: 'generate-code'
    }
  },
  setup() {
    const { isBlock, getCurrentPage } = useCanvas()
    const { getCurrentBlock } = useBlock()

    const state = reactive({
      showMenu: false,
      dirHandle: null,
      generating: false,
      showDialogbox: false,
      saveFilesInfo: []
    })

    const getParams = () => {
      const { getSchema } = useCanvas().canvasApi.value
      const params = {
        framework: getGlobalConfig()?.dslMode,
        platform: getGlobalConfig()?.platformId,
        pageInfo: {
          schema: getSchema()
        }
      }
      const paramsMap = new URLSearchParams(location.search)
      params.app = paramsMap.get('id')
      params.tenant = paramsMap.get('tenant')

      if (isBlock()) {
        const block = getCurrentBlock()
        params.id = block?.id
        params.pageInfo.name = block?.label
        params.type = 'Block'
      } else {
        const page = getCurrentPage()
        params.id = page?.id
        params.pageInfo.name = page?.name
        params.type = 'Page'
      }

      return params
    }

    const initDirHandle = (dirHandle) => {
      if (!state.dirHandle && dirHandle) {
        state.dirHandle = dirHandle
      }
    }

    const getBlocksSchema = async (pageSchema, blockSet = new Set()) => {
      let res = []

      const blockNames = parseRequiredBlocks(pageSchema)
      const promiseList = blockNames
        .filter((name) => {
          if (blockSet.has(name)) {
            return false
          }

          blockSet.add(name)

          return true
        })
        .map((name) => fetchBlockSchema(name))
      const schemaList = await Promise.allSettled(promiseList)
      const extraList = []

      schemaList.forEach((item) => {
        if (item.status === 'fulfilled' && item.value?.[0]?.content) {
          res.push(item.value[0].content)
          extraList.push(getBlocksSchema(item.value[0].content, blockSet))
        }
      })
      ;(await Promise.allSettled(extraList)).forEach((item) => {
        if (item.status === 'fulfilled' && item.value) {
          res.push(...item.value)
        }
      })

      return res
    }

    const templateMap = {
      electron: {
        pluginConfig: {
          block: {
            blockBasePath: './src/renderer/src/components'
          },
          page: {
            pageBasePath: './src/renderer/src/views'
          },
          dataSource: {
            path: './src/renderer/src/lowcodeConfig'
          },
          globalState: {
            path: './src/renderer/src/stores'
          },
          i18n: {
            path: './src/renderer/src/i18n'
          },
          router: {
            path: './src/renderer/src/router'
          },
          utils: {
            path: './src/renderer/src'
          }
        },
        customContext: {
          template: 'electron'
        }
      },
      default: {}
    }

    const getAllPageDetails = async (pageList) => {
      const detailPromise = pageList.map(({ id }) => useLayout().getPluginApi('AppManage').getPageById(id))
      const detailList = await Promise.allSettled(detailPromise)

      return detailList
        .map((item) => {
          if (item.status === 'fulfilled' && item.value) {
            return item.value
          }
        })
        .filter((item) => Boolean(item))
    }

    const getPreGenerateInfo = async (template) => {
      const instance = generateApp({
        ...templateMap[template]
      })

      const params = getParams()
      const { id } = useEditorInfo().useInfo()
      const promises = [
        useHttp().get(`/app-center/v1/api/apps/schema/${id}`),
        fetchMetaData(params),
        fetchPageList(params.app)
      ]

      if (!state.dirHandle) {
        promises.push(fs.getUserBaseDirHandle())
      }

      const [appData, metaData, pageList, dirHandle] = await Promise.all(promises)
      const pageDetailList = await getAllPageDetails(pageList)

      const blockSet = new Set()
      const list = pageDetailList.map((page) => getBlocksSchema(page.page_content, blockSet))
      const blocks = await Promise.allSettled(list)

      const blockSchema = []
      blocks.forEach((item) => {
        if (item.status === 'fulfilled' && Array.isArray(item.value)) {
          blockSchema.push(...item.value)
        }
      })

      const appSchema = {
        // metaData 包含dataSource、utils、i18n、globalState
        ...metaData,
        // 页面 schema
        pageSchema: pageDetailList.map((item) => {
          const { page_content, ...meta } = item

          return {
            ...page_content,
            meta: {
              ...meta,
              router: meta.route
            }
          }
        }),
        blockSchema,
        // 物料数据
        componentsMap: [...(appData.componentsMap || [])],

        meta: {
          ...(appData.meta || {})
        }
      }

      const res = await instance.generate(appSchema)

      const { genResult = [] } = res || {}
      const fileRes = genResult.map(({ fileContent, fileName, path, fileType }) => {
        const slash = path.endsWith('/') || path === '.' ? '' : '/'
        let filePath = `${path}${slash}`
        if (filePath.startsWith('./')) {
          filePath = filePath.slice(2)
        }
        if (filePath.startsWith('.')) {
          filePath = filePath.slice(1)
        }

        if (filePath.startsWith('/')) {
          filePath = filePath.slice(1)
        }

        return {
          fileContent,
          filePath: `${filePath}${fileName}`,
          fileType
        }
      })

      return [dirHandle, fileRes]
    }

    const saveCodeToLocal = async (filesInfo) => {
      if (filesInfo.length && state.dirHandle) {
        await fs.writeFiles(state.dirHandle, filesInfo)
      }
    }

    const generate = async (template) => {
      const { isEmptyPage } = useLayout()

      if (isEmptyPage()) {
        useNotify({ type: 'warning', message: '请先创建页面' })

        return
      }

      if (state.generating) {
        useNotify({ type: 'info', title: '代码生成中, 请稍后...' })
        return
      } else {
        useNotify({ type: 'info', title: '代码生成中...' })
        state.generating = true
      }

      try {
        // 保存代码前置任务：调用接口生成代码并获取用户本地文件夹授权
        const [dirHandle, fileRes] = await getPreGenerateInfo(template)

        // 暂存待生成代码文件信息
        state.saveFilesInfo = fileRes

        // 保存用户授权的文件夹句柄
        initDirHandle(dirHandle)

        // 打开弹窗选中待生成文件
        state.showDialogbox = true
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '代码生成失败', message: error?.message || error })
        state.generating = false
      }
    }

    const menus = [
      {
        name: '生成WEB应用代码',
        code: 'default'
      },
      // {
      //   name: '生成小程序代码',
      //   code: 'miniProgram'
      // },
      {
        name: '生成桌面应用代码',
        code: 'electron'
      }
    ]

    const actions = {
      default() {
        generate('default')
      },
      miniProgram() {
        generate('miniProgram')
      },
      electron() {
        generate('electron')
      }
    }

    const handleCloseMenu = () => {
      state.showMenu = false
      window.removeEventListener('click', handleCloseMenu)
    }

    const handleShowMenu = () => {
      state.showMenu = !state.showMenu

      if (state.showMenu) {
        window.addEventListener('click', handleCloseMenu)
      } else {
        window.removeEventListener('click', handleCloseMenu)
      }
    }

    const handleClick = ({ code }) => {
      actions[code]?.()
    }

    const confirm = async (saveData) => {
      useNotify({ type: 'info', title: '代码保存中...' })
      state.showDialogbox = false

      try {
        // 生成代码到本地
        await saveCodeToLocal(saveData)

        useNotify({ type: 'success', title: '代码文件保存成功', message: `已保存${saveData.length}个文件` })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
        useNotify({ type: 'error', title: '代码保存失败', message: error?.message || error })
      } finally {
        state.generating = false
      }
    }

    const cancel = () => {
      state.showDialogbox = false
      state.generating = false
      state.saveFilesInfo = []
    }

    onUnmounted(() => {
      window.removeEventListener('click', handleCloseMenu)
    })

    return {
      state,
      handleShowMenu,
      handleClick,
      menus,
      generate,
      confirm,
      cancel
    }
  }
}
</script>
<style lang="less">
.generate-code {
  .menu-icon-wrapper {
    position: relative;

    .main-menu {
      position: absolute;
      top: calc(var(--base-top-panel-height) - 8px);
      color: var(--ti-lowcode-toolbar-icon-color);
      ul {
        min-width: 130px;
        border: 1px solid transparent;
        border-radius: 6px;
        background-color: var(--ti-lowcode-main-menu-bg);
        box-shadow: 0 1px 15px 0 rgb(0 0 0 / 20%);
        padding: 8px 0;
        display: flex;
        flex-direction: column;
        li {
          font-size: 14px;
          color: var(--ti-lowcode-toolbar-title-color);
          cursor: pointer;
          height: 32px;
          width: 100%;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          white-space: nowrap;
          .tiny-svg {
            margin: 0 9px;
            font-size: 16px;
          }
          &:hover {
            background: var(--ti-lowcode-toolbar-hover-color);
          }

          &:first-child {
            border-radius: 2px 2px 0 0;
          }

          &:last-child {
            border-radius: 0 0 2px 2px;
          }
          .menu-item {
            margin: 0 16px;
            line-height: 20px;
          }
        }
      }
    }
  }
}
</style>

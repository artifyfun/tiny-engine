<template>
  <div class="workflow">
    <plugin-panel title="工作流" :isCloseLeft="false" class="plugin-panel-workflow">
      <template #header>
        <link-button :href="docsUrl"></link-button>
      </template>
      <template #content>
        <div class="btn-box">
          <tiny-file-upload
            ref="upload"
            size="small"
            :auto-upload="false"
            :show-file-list="false"
            action="/"
            @change="handleChange"
          >
            <template #trigger>
              <tiny-button>新增工作流</tiny-button>
            </template>
          </tiny-file-upload>
          <!-- <div class="download-btn" @click="downloadFile">
            <svg-icon name="generate-code"></svg-icon>
            <tiny-button type="text"> 下载导入模板 </tiny-button>
          </div> -->
        </div>
        <div class="plugin-table">
          <div class="search-box">
            <tiny-select v-model="currentSortType" :options="sortTypes"></tiny-select>
            <tiny-input v-model="searchKey" class="plugin-search" placeholder="请输入关键字" type="text" clearable>
              <template #prefix>
                <span class="icon">
                  <svg-icon name="basic-search"></svg-icon>
                </span>
              </template>
            </tiny-input>
          </div>
          <tiny-grid
            ref="workflowTable"
            :data="workflowList"
            auto-resize
            class="stripe-tiny-grid"
            @edit-closed="editClosed($event)"
            :edit-config="{ trigger: 'manual', mode: 'row', showStatus: false }"
            :tooltip-config="{ appendToBody: false, placement: 'right' }"
            @cell-click="showEditor"
          >
            <tiny-grid-column
              field="name"
              title="名称"
              show-overflow
              :show-icon="false"
              :editor="{ component: 'input', autoselect: true }"
            >
              <template #default="data">
                <div style="display: flex; align-items: center">
                  <ComfyuiIcon style="margin-right: 4px" v-if="['comfyui'].includes(data.row.workflowType)" />
                  <div>{{ data.row.name }}</div>
                </div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column width="60" field="paramsCount" title="参数" :show-icon="false">
              <template #default="data">
                <div>
                  {{ data.row.paramsNodes.length }}
                </div>
              </template>
            </tiny-grid-column>
            <tiny-grid-column
              width="100"
              field="description"
              show-overflow
              title="描述"
              :show-icon="false"
              :editor="{ component: 'input', autoselect: false }"
            ></tiny-grid-column>
            <tiny-grid-column width="80" field="operation" title="操作">
              <template v-slot="data">
                <div v-if="editingRow !== data.row" class="cell-opera">
                  <tiny-tooltip class="item" effect="dark" placement="bottom" content="编辑" :open-delay="500">
                    <span class="icon">
                      <svg-icon name="edit" @click.stop="openEditor($event, data.row)"></svg-icon>
                    </span>
                  </tiny-tooltip>
                  <tiny-tooltip class="item" effect="dark" placement="bottom" content="删除" :open-delay="500">
                    <span class="icon">
                      <svg-icon name="delete" @click.stop="openDeletePopover(data.row)"></svg-icon>
                    </span>
                  </tiny-tooltip>
                </div>
              </template>
            </tiny-grid-column>
            <template #empty>
              <div class="empty-wrap">
                <svg-icon class="empty-icon" name="empty"></svg-icon>
                <p class="empty-text">暂无数据</p>
              </div>
            </template>
          </tiny-grid>
        </div>
      </template>
    </plugin-panel>
    <tiny-modal
      v-model="isPanelShow"
      class="right-panel-modal"
      :show-header="false"
      :esc-closable="false"
      :lock-scroll="false"
    >
      <template #default>
        <div v-if="isPanelShow" class="right-panel">
          <div class="header">
            <span>{{ currentWorkflow.name }}</span>
            <span class="options-wrap">
              <tiny-button type="danger" :disabled="workflowState.loading || editorLoading" @click="editConfirm"
                >保存</tiny-button
              >
              <close-icon @close="editCancel"></close-icon>
            </span>
          </div>
          <ComfyuiWorkflowEditor ref="editor" :workflow="currentWorkflow" @onload="editorLoading = false" />
        </div>
      </template>
    </tiny-modal>
  </div>
</template>

<script lang="jsx">
import { computed, ref, watchEffect, onMounted, onActivated } from 'vue'
import { Grid, GridColumn, Input, Button, FileUpload, Tooltip, Select, Modal as TinyModal } from '@opentiny/vue'
import { PluginPanel, LinkButton, CloseIcon, ComfyuiIcon } from '@opentiny/tiny-engine-common'
import { useModal, useWorkflow } from '@opentiny/tiny-engine-controller'
import { utils } from '@opentiny/tiny-engine-utils'
import { BASE_URL } from '@opentiny/tiny-engine-controller/js/environments'

import ComfyuiWorkflowEditor from './components/ComfyuiWorkflowEditor/index.vue'

import { handleFile } from './utils/comfyui-utils/index.js'

export default {
  components: {
    TinyTooltip: Tooltip,
    TinyInput: Input,
    TinyButton: Button,
    TinyGrid: Grid,
    TinyGridColumn: GridColumn,
    PluginPanel,
    LinkButton,
    TinySelect: Select,
    TinyFileUpload: FileUpload,
    CloseIcon,
    ComfyuiWorkflowEditor,
    TinyModal,
    ComfyuiIcon
  },
  setup() {
    const { workflowState, getWorkflows, findWorkflows, createWorkflow, deleteWorkflow, updateWorkflow } = useWorkflow()

    const fullWorkflows = computed(() => {
      const workflows = getWorkflows()
      return JSON.parse(JSON.stringify(workflows))
    })
    const sortTypes = [
      {
        value: 'byTimeDesc',
        label: '按时间倒序'
      },
      {
        value: 'byTimeAsc',
        label: '按时间正序'
      }
    ]
    const docsUrl = ''
    const currentSortType = ref('')
    const searchKey = ref('')
    const activedRow = ref('')
    const workflowList = ref([])
    const editorLoading = ref(false)
    const upload = ref('upload')
    const workflowTable = ref(null)
    const editor = ref(null)
    const currentWorkflow = ref(null)
    const selectedRowLength = computed(() => {
      return workflowTable.value?.getSelectRecords().length
    })
    const notEmpty = computed(() => workflowList.value.length > 0)
    const editingRow = ref(null)
    const isPanelShow = ref(false)

    onMounted(() => {
      currentSortType.value = sortTypes[0].value
    })

    onActivated(() => {
      findWorkflows()
    })

    const sortTypeChanges = (event) => {
      switch (event) {
        case 'byTimeAsc':
          workflowList.value.reverse()
          break
        default:
      }
    }

    watchEffect(() => {
      workflowList.value = fullWorkflows.value.filter((item) => {
        const reg = new RegExp(searchKey.value, 'i')
        return reg.test(item?.name) || reg.test(item?.title)
      })
      sortTypeChanges(currentSortType.value)
    })

    const downloadFile = () => {
      window.open(`${BASE_URL}src/app/public/i18n-mock/i18n-template-for-batch-import.zip`)
    }

    const openDeletePopover = (row) => {
      const { confirm } = useModal()

      confirm({
        title: '删除工作流',
        message: `您确定删除工作流 ${row.name} 吗？`,
        exec: () => {
          deleteWorkflow(row.id).then(() => {
            workflowTable.value.clearSelection()
          })
        }
      })
    }

    const getActiveRow = () => {
      activedRow.value = workflowTable.value.getActiveRow()?.rowIndex ?? ''
    }
    const openEditor = (_event, row) => {
      editingRow.value = row
      workflowTable.value.setActiveRow(row).then(() => {
        getActiveRow()
      })
    }

    const confirm = (rowData) => {
      updateWorkflow(rowData).finally(() => {
        editingRow.value = null
      })
    }

    const editClosed = (event) => {
      workflowTable.value.validate(event.row, (valid) => {
        if (valid) {
          confirm(event.row)
        }
      })
    }

    const openPanel = (current) => {
      currentWorkflow.value = current
      isPanelShow.value = true
      editorLoading.value = true
    }

    const handleChange = async (file) => {
      let workflow
      try {
        const data = await handleFile(file.raw)
        if (data.nodes) {
          workflow = data
        }
      } catch (e) {
        // console.log(e)
      }
      if (!workflow) {
        const { message } = useModal()
        message({
          title: '工作流上传失败',
          message: `无法提取工作流信息`
        })
      } else {
        const newItem = {
          key: utils.guid(),
          name: file.name,
          workflow,
          paramsNodes: []
        }
        openPanel(newItem)
      }
    }

    const editConfirm = () => {
      editorLoading.value = true
      const { prompt = {}, paramsNodes = [] } = editor.value.editorState
      if (!currentWorkflow.value.id) {
        const newItem = {
          ...currentWorkflow.value,
          workflowType: 'comfyui',
          prompt,
          paramsNodes
        }
        createWorkflow(newItem)
          .then(() => {
            isPanelShow.value = false
            currentWorkflow.value = null
          })
          .finally(() => {
            editorLoading.value = false
          })
      } else {
        updateWorkflow({
          ...currentWorkflow.value,
          prompt,
          paramsNodes
        })
          .then(() => {
            isPanelShow.value = false
            currentWorkflow.value = null
          })
          .finally(() => {
            editorLoading.value = false
          })
      }
    }

    const editCancel = () => {
      isPanelShow.value = false
    }

    const showEditor = ({ row }) => {
      if (!editingRow.value) {
        openPanel(row)
      }
    }

    return {
      workflowState,
      sortTypeChanges,
      currentSortType,
      sortTypes,
      selectedRowLength,
      notEmpty,
      workflowList,
      searchKey,
      activedRow,
      editClosed,
      openEditor,
      openDeletePopover,
      handleChange,
      upload,
      confirm,
      workflowTable,
      downloadFile,
      editingRow,
      docsUrl,
      isPanelShow,
      editor,
      editorLoading,
      editConfirm,
      editCancel,
      currentWorkflow,
      showEditor
    }
  }
}
</script>

<style lang="less" scoped>
.workflow {
  width: 500px;
  height: 100%;
  border-right: 1px solid var(--ti-lowcode-plugin-panel-border-right-color);
}
.stripe-tiny-grid {
  word-wrap: break-word;
  :deep(.tiny-grid) {
    .tiny-grid__header-wrapper {
      .tiny-grid-header__column {
        height: 32px;
      }
      .tiny-grid-cell {
        padding: 0;
        .tiny-grid-required-icon {
          display: none;
        }
      }
      .tiny-grid__repair {
        border-color: var(--ti-lowcode-tabs-border-color);
      }

      .tiny-grid-resizable.is__line:before {
        background-color: var(--ti-lowcode-toolbar-border-color);
      }
    }

    .tiny-grid__body-wrapper {
      &::-webkit-scrollbar {
        height: 10px;
      }
      .tiny-grid-body__column {
        height: 36px;
        .tiny-grid-cell {
          padding: 8px 0;
        }
        .cell-opera svg {
          color: var(--ti-lowcode-i18n-operate-svg-color);
        }

        .copy-data {
          svg {
            margin-left: 5px;
          }
        }
      }

      .tiny-grid-body__row,
      .tiny-grid-body__row:not(.row__hover):nth-child(2n) {
        background-image: linear-gradient(
          -180deg,
          var(--ti-lowcode-tabs-border-color),
          var(--ti-lowcode-tabs-border-color)
        );
        background-repeat: no-repeat;
        background-size: 100% 1px;
        background-position: 100% 100%;
        &.row__current {
          background-color: var(--ti-lowcode-toolbar-view-hover-bg);
        }
      }

      .tiny-grid-body__row {
        &.row__selected {
          .tiny-grid-checkbox__icon {
            svg {
              color: var(--ti-lowcode-common-primary-color);
              width: 100%;
              height: 100%;
            }
          }
        }
      }
    }

    .tiny-grid__empty-text {
      color: var(--ti-lowcode-toolbar-breadcrumb-color);
    }
  }

  .cell-opera {
    display: flex;
    justify-content: space-between;
    :deep(.icon) {
      svg {
        font-size: 16px;
      }
      &:hover {
        svg {
          opacity: 0.75;
        }
      }
    }
  }
}
.btn-box {
  color: var(--ti-lowcode-toolbar-breadcrumb-color);
  font-size: 14px;
  padding-left: 10px;
  :deep(.tiny-file-upload) {
    display: inline-block;
    margin: 0 10px;
  }
  span {
    padding-left: 12px;
  }
}

.plugin-table {
  height: calc(100% - 48px);
  flex: 1;
  padding: 0 16px;
  overflow-y: scroll;

  .operation-column {
    display: flex;
    width: 100%;
    justify-content: space-around;

    svg {
      font-size: 14px;
    }
  }
  .search-box {
    display: flex;
    .tiny-input {
      margin: 12px 0;
      margin-left: 8px;
      :deep(.tiny-input__prefix) {
        left: 8px;
      }
    }
    .tiny-select {
      margin: 12px 0;
      width: 240px;
    }
  }
}

.delete-popover-container {
  padding: 20px;
  svg {
    font-size: 20px;
    color: var(--ti-lowcode-warning-color);
  }
  .delete-tip {
    margin-left: 5px;
  }
  .i18n-item {
    display: flex;
    margin-bottom: 10px;
    align-items: center;

    label {
      width: 80px;
    }

    display: flex;
  }

  .i18n-btns {
    margin-top: 24px;
    text-align: center;
  }
}

.download-btn {
  cursor: pointer;
  display: inline-block;
  font-size: 12px;
  text-align: left;
  padding: 0;
  margin-left: 8px;
  color: var(--ti-lowcode-base-text-color);
  svg {
    font-size: 16px;
  }
  .tiny-button.tiny-button--text {
    color: var(--ti-lowcode-base-text-color);
  }
}
:deep(.help-box) {
  position: absolute;
  left: 86px;
  top: 3px;
}
</style>

<style lang="less">
.right-panel-modal {
  .tiny-modal__box {
    left: calc(500px + var(--base-nav-panel-width)) !important;
    top: var(--base-top-panel-height) !important;
    height: calc(100% - var(--base-top-panel-height));
    width: calc(100vw - 500px - var(--base-nav-panel-width));
    border-radius: 0;
    .right-panel {
      height: 100%;
      background: var(--ti-lowcode-common-component-bg);
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 45px;
        padding: 0 12px;
        color: var(--ti-lowcode-toolbar-icon-color);
        border-bottom: 1px solid var(--ti-lowcode-data-header-border-bottom-color);
        .options-wrap {
          display: flex;
          column-gap: 16px;
          align-items: center;
        }
      }
      .comfyui-workflow-editor {
        height: calc(100% - 45px);
      }
    }
  }
}
</style>

<template>
  <div class="params-manager">
    <tiny-grid
      ref="table"
      :data="paramsNodes"
      auto-resize
      class="stripe-tiny-grid"
      @edit-closed="editClosed($event)"
      :edit-config="{ trigger: 'manual', mode: 'row', showStatus: false }"
      :tooltip-config="{ appendToBody: false, placement: 'right' }"
      @cell-click="focusNode"
    >
      <tiny-grid-column field="name" title="參數名称" show-overflow :show-icon="false">
        <template #default="data">
          <div class="cell-name">
            <div class="color-block" :style="{ background: data.row.color }"></div>
            <tiny-tooltip class="item" effect="dark" :content="data.row.name" placement="top-start">
              <div>{{ data.row.name }}</div>
            </tiny-tooltip>
          </div>
        </template>
      </tiny-grid-column>
      <tiny-grid-column
        field="description"
        show-overflow
        title="描述"
        :show-icon="false"
        :editor="{ component: 'input', autoselect: true }"
      ></tiny-grid-column>
      <tiny-grid-column width="80" field="category" title="参数类型" :show-icon="false">
        <template #default="data">
          <div class="cell-name">
            <div>{{ data.row.category === 'input' ? '输入' : '输出' }}</div>
          </div>
        </template>
      </tiny-grid-column>
      <tiny-grid-column field="title" title="所属节点" :show-icon="false">
        <template #default="data">
          <div class="cell-title">
            <tiny-tooltip class="item" effect="dark" :content="data.row.title || data.row.type" placement="top-start">
              <div>{{ data.row.title || data.row.type }}</div>
            </tiny-tooltip>
          </div>
        </template>
      </tiny-grid-column>
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
                <svg-icon name="delete" @click.stop="removeParams(data.row)"></svg-icon>
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

<script setup>
import { ref, resolveComponent, defineEmits, defineProps } from 'vue'
import { Grid as TinyGrid, GridColumn as TinyGridColumn, Tooltip as TinyTooltip } from '@opentiny/vue'
const SvgIcon = resolveComponent('SvgIcon')

const props = defineProps(['paramsNodes'])

const emit = defineEmits(['postMessage'])

const table = ref(null)
const editingRow = ref(null)
const activedRow = ref(null)

const updateParamsNodes = (nodes) => {
  const message = JSON.stringify({
    eventType: 'updateParamsNodes',
    data: nodes
  })
  emit('postMessage', message)
}

const removeParams = (node) => {
  const nodes = props.paramsNodes.filter((item) => item !== node)
  updateParamsNodes(nodes)
}

const centerOnNode = (node) => {
  const message = JSON.stringify({
    eventType: 'centerOnNode',
    data: node
  })
  emit('postMessage', message)
}

const getActiveRow = () => {
  activedRow.value = table.value.getActiveRow()?.rowIndex ?? ''
}
const openEditor = (_event, row) => {
  editingRow.value = row
  table.value.setActiveRow(row).then(() => {
    getActiveRow()
  })
}

const confirm = () => {
  editingRow.value = null
}

const editClosed = (event) => {
  table.value.validate(event.row, (valid) => {
    if (valid) {
      confirm(event.row)
    }
  })
}

const focusNode = ({ row }) => {
  if (!editingRow.value) {
    centerOnNode(row)
  }
}
</script>

<style scoped lang="less">
.params-manager {
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

    .cell-name {
      display: flex;
      align-items: center;
      .color-block {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 10px;
      }
    }

    .cell-title {
      display: flex;
      align-items: center;
      &:hover {
        span {
          display: block;
        }
      }
      div {
        margin-right: 10px;
        white-space: nowrap;
      }
      span {
        display: none;
      }
      svg {
        color: var(--ti-lowcode-i18n-operate-svg-color);
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
}
</style>

<template>
  <div
    class="comfyui-workflow-editor"
    v-loading="editorState.loading"
    tiny-loading__text="正在加载工作流"
    tiny-loading__custom-class="tiny-loading-custom"
    tiny-loading__background="rgba(0,0,0,0.8)"
  >
    <ComfyuiPlayground
      ref="playground"
      @onload="onload"
      @graphToPrompt="graphToPrompt"
      @updateParamsNodes="updateParamsNodes"
    />

    <ParamsManager :paramsNodes="editorState.paramsNodes" @postMessage="postMessage" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineEmits, defineExpose, defineProps } from 'vue'
import { Loading } from '@opentiny/vue'

import ComfyuiPlayground from '../ComfyuiPlayground/index.vue'
import ParamsManager from '../ParamsManager/index.vue'

const vLoading = Loading.directive

const props = defineProps(['workflow'])
const emit = defineEmits(['onload'])

const editorState = reactive({
  loading: false,
  paramsNodes: props.workflow.paramsNodes,
  prompt: {}
})
const playground = ref(null)

const postMessage = (message) => {
  playground.value.postMessage(message)
}

const graphToPrompt = (prompt) => {
  editorState.prompt = prompt
}

const updateParamsNodes = (nodes) => {
  editorState.paramsNodes = nodes
}

const onload = () => {
  editorState.loading = false
  playground.value.updateParamsNodes(props.workflow.paramsNodes)
  playground.value.loadGraphData(props.workflow.workflow)
  playground.value.graphToPrompt()
  emit('onload', editorState)
}

onMounted(() => {
  editorState.loading = true
})

defineExpose({
  editorState
})
</script>

<style scoped lang="less">
.comfyui-workflow-editor {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .comfyui-playground {
    width: 100%;
    height: 100%;
    flex: 1;
  }

  .params-manager {
    width: 100%;
    height: 260px;
  }
}
</style>

<style lang="less">
.tiny-loading-custom {
  .tiny-loading__spinner .tiny-loading__text {
    color: #fff;
  }
  .tiny-loading__spinner .path {
    stroke: var(--ti-lowcode-component-svg-button-color);
  }
}
</style>

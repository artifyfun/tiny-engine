import { reactive } from 'vue'
import { WORKFLOW_STATE_KEY } from '../js/constants'

function toUpperCamelCase(str) {
  return str.replace(str[0], str[0].toUpperCase())
}

function queueSync(eventArgs, workflowKey) {
  this.state.workflowSpace[workflowKey].state.loading = true
  return fetch('/workflows/api/queue', {
    method: 'post',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      key: workflowKey.toString(),
      clientId: this.state.clientId,
      prompt: this.state.workflowSpace[workflowKey].prompt
    })
  })
    .then((response) => response.json())
    .then(({ data }) => {
      Object.assign(this.state.workflowSpace[workflowKey].outputs, data)
      this.state.workflowSpace[workflowKey].state.loading = false
    })
    .catch(() => {
      this.state.workflowSpace[workflowKey].state.loading = false
    })
}

function deleteQueue(eventArgs, workflowKey) {
  return fetch('/workflows/api/deleteQueue', {
    method: 'post',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      clientId: this.state.clientId,
      promptId: this.state.workflowSpace[workflowKey].promptId
    })
  })
    .then((response) => response.json())
    .then(() => {
      Object.assign(this.state.workflowSpace[workflowKey].state, {
        loading: false,
        executing: false,
        progress: 0
      })
    })
}

const methodsMap = {
  comfyui: [
    {
      key: `${WORKFLOW_STATE_KEY}${toUpperCamelCase(queueSync.name)}`,
      name: '同步执行',
      description: '同步执行工作流',
      content: queueSync.toString()
    },
    {
      key: `${WORKFLOW_STATE_KEY}${toUpperCamelCase(deleteQueue.name)}`,
      name: '中断',
      description: '中断执行本次任务',
      content: deleteQueue.toString()
    }
  ]
}

const initialState = {
  keyword: '',
  selectedWorkflow: null,
  methods: [],
  selectedMethod: null
}

const workflowMethodState = reactive(JSON.parse(JSON.stringify(initialState)))

const setWorkflow = (workflow) => {
  workflowMethodState.selectedWorkflow = workflow
  workflowMethodState.methods = methodsMap[workflow.workflowType] || []
}

const resetWorkflowMethodState = () => {
  Object.assign(workflowMethodState, JSON.parse(JSON.stringify(initialState)))
}

const setWorkflowMethod = (method) => {
  workflowMethodState.selectedMethod = method
}

export default () => {
  return {
    workflowMethodState,
    setWorkflow,
    setWorkflowMethod,
    resetWorkflowMethodState
  }
}

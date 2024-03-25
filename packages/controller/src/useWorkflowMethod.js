import { reactive } from 'vue'

function workflowSpaceQueueSync(eventArgs, workflowKey) {
  this.state.workflowSpace[workflowKey].state.loading = true
  return fetch('/app-center/api/workflows/queue', {
    method: 'post',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      key: workflowKey.toString(),
      sync: true,
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

const methodsMap = {
  comfyui: [
    {
      key: workflowSpaceQueueSync.name,
      name: '同步执行',
      description: '将执行指令推送到任务队列',
      content: workflowSpaceQueueSync.toString()
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

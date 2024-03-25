import { reactive } from 'vue'
import { useHttp } from '@opentiny/tiny-engine-http'
import { useApp } from './'

const workflowState = reactive({
  workflows: [],
  loading: false
})

const getWorkflows = () => workflowState.workflows

const setWorkflows = (workflows = []) => {
  workflowState.workflows = workflows
}

const workflowsApi = '/app-center/api/workflows'

const findWorkflows = (params) => {
  const appId = useApp().appInfoState.selectedId
  workflowState.loading = true
  return useHttp()
    .get(workflowsApi, {
      params: {
        app: appId,
        ...params
      }
    })
    .then((data) => {
      setWorkflows(data)
    })
    .finally(() => {
      workflowState.loading = false
    })
}

const updateWorkflow = (data) => {
  workflowState.loading = true
  return useHttp()
    .post(`${workflowsApi}/update/${data.id}`, data)
    .then((data) => {
      const workflows = getWorkflows()
      const current = workflows.find((item) => item.id === data.id)
      Object.assign(current, data)
      setWorkflows(workflows)
    })
    .finally(() => {
      workflowState.loading = false
    })
}

const createWorkflow = (data) => {
  const appId = useApp().appInfoState.selectedId
  const defaultData = {
    workflow: '{}',
    workflowType: 'comfyui',
    paramsNodes: '[]',
    key: '',
    prompt: '{}',
    description: '',
    name: '',
    imageUrl: '',
    app: appId
  }
  workflowState.loading = true
  return useHttp()
    .post(`${workflowsApi}/create`, {
      ...defaultData,
      ...data
    })
    .then((data) => {
      setWorkflows([data, ...getWorkflows()])
    })
    .finally(() => {
      workflowState.loading = false
    })
}

const deleteWorkflow = (id) => {
  workflowState.loading = true
  return useHttp()
    .get(`${workflowsApi}/delete/${id}`)
    .then(() => {
      const workflows = getWorkflows()
      setWorkflows(workflows.filter((item) => item.id !== id))
    })
    .finally(() => {
      workflowState.loading = false
    })
}

export default () => {
  return {
    workflowState,
    getWorkflows,
    setWorkflows,
    findWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow
  }
}

import { reactive } from 'vue'
import { WORKSPACE_KEY } from '../js/constants'

const category = [
  {
    name: '输入',
    key: 'input',
    variables: []
  },
  {
    name: '输出',
    key: 'output',
    variables: []
  },
  {
    name: '状态',
    key: 'state',
    variables: [
      {
        category: 'state',
        key: 'loading',
        name: '正在加载',
        description: '',
        value: false
      },
      {
        category: 'state',
        key: 'executing',
        name: '正在执行',
        description: '',
        value: false
      },
      {
        category: 'state',
        key: 'done',
        name: '任务完成',
        description: '',
        value: false
      },
      {
        category: 'state',
        key: 'progress',
        name: '任务进度',
        description: '',
        value: 0
      },
      {
        category: 'state',
        key: 'pending',
        name: '排队人数',
        description: '',
        value: 0
      }
    ]
  }
]

const initialState = {
  category,
  keyword: '',
  selectedWorkflow: null,
  variables: [],
  selectedCategory: category[0],
  selectedVariable: null
}

const workflowVariableState = reactive(JSON.parse(JSON.stringify(initialState)))

const setVariables = () => {
  const category = workflowVariableState.selectedCategory
  if (workflowVariableState.selectedWorkflow) {
    if (['state'].includes(category.key)) {
      workflowVariableState.variables = category.variables
    } else {
      workflowVariableState.variables = workflowVariableState.selectedWorkflow.paramsNodes.filter((node) =>
        [category.key].includes(node.category)
      )
    }
  }
}

const setWorkflowCategory = (category) => {
  workflowVariableState.selectedCategory = category
  workflowVariableState.variables = []
  workflowVariableState.selectedVariable = null
  setVariables()
}

const setWorkflow = (workflow) => {
  workflowVariableState.selectedWorkflow = workflow
  workflowVariableState.selectedCategory = workflowVariableState.category[0]
  setWorkflowCategory(workflowVariableState.selectedCategory)
}

/**
 * workflow 在state中的数据结构
 {
    __workflow__: {
      workflow1: {
        prompt: {
          id1: {
            inputs: {
              text: ''
            }
          },
        },
        outputs: {
          id2: null
        },
        state: {
          loading: false,
          pending: 0,
          executing: false,
          done: false,
          progress: 0
        }
      }
    }
  }
  */

const getWorkflowVariableContent = () => {
  const { selectedWidget, category, key, id } = workflowVariableState.selectedVariable
  const workflowKey = workflowVariableState.selectedWorkflow.key
  const valueKeyMap = {
    input: `['prompt']['${id}']['inputs']['${selectedWidget?.name}']`,
    output: `['outputs']['${id}']`,
    state: `['${category}']['${key}']`
  }
  const subPath = valueKeyMap[category]
  const variableContent = `this.state.${WORKSPACE_KEY}['${workflowKey}']` + subPath
  return variableContent
}

const setWorkflowVariableStateByBindKey = (bindKey, workflows) => {
  const [workflowKey, ...res] = bindKey.replace(WORKSPACE_KEY, '').replaceAll('[', '').replaceAll("'", '').split(']')

  const category = (() => {
    if (res[0] === 'prompt') {
      return 'input'
    }
    if (res[0] === 'outputs') {
      return 'output'
    }
    return res[0]
  })()

  const valueMap = {
    input: (() => {
      const [_, id, __, widgetName] = res
      return { id, widgetName }
    })(),
    output: (() => {
      const [_, id] = res
      return { id }
    })(),
    state: (() => {
      const [category, key] = res
      return { category, key }
    })()
  }

  const data = valueMap[category]

  const variableMap = {
    input: workflows
      .find((item) => item.key === workflowKey)
      ?.paramsNodes.find(
        (item) => item.id.toString() === data.id && item.selectedWidget['name']?.toString() === data.widgetName
      ),
    output: workflows
      .find((item) => item.key === workflowKey)
      ?.paramsNodes.find((item) => item.selectedWidget['id']?.toString() === data.id),
    state: workflowVariableState.category
      .find((item) => item.key === category)
      ?.variables.find((item) => item.key === data.key)
  }
  Object.assign(workflowVariableState, {
    selectedWorkflow: workflows.find((item) => item.key === workflowKey),
    selectedCategory: workflowVariableState.category.find((item) => item.key === category),
    selectedVariable: variableMap[category]
  })
  setVariables()
}

const resetWorkflowVariableState = () => {
  Object.assign(workflowVariableState, JSON.parse(JSON.stringify(initialState)))
}

const setWorkflowVariable = (variable) => {
  workflowVariableState.selectedVariable = variable
}

function workspaceInitWebSocket() {
  const WORKSPACE_KEY = 'workspace'
  const workspace = this.state[WORKSPACE_KEY]

  const options = {
    url: 'ws://127.0.0.1:7011/workflows',
    protocols: this.state.clientId
  }

  const socket = new this.utils.ReconnectWebSocket(options)

  socket.onmessage = (e) => {
    this.state.isConnecting = false
    const data = JSON.parse(e.data)
    switch (data.type) {
      case 'connect': {
        break
      }
      case 'state': {
        const { workflowKey, pending } = data.data
        const workflow = workspace[workflowKey]
        if (workflow) {
          workflow.state.pending = pending
          workflow.state.done = false
        }
        break
      }
      case 'progress': {
        const { workflowKey, promptId, value } = data.data
        const workflow = workspace[workflowKey]
        if (workflow) {
          workflow.promptId = promptId
          workflow.state.executing = true
          workflow.state.progress = value
          workflow.state.done = false
        }
        break
      }
      case 'done': {
        const { workflowKey, prompt, outputs } = data.data
        const workflow = workspace[workflowKey]
        if (workflow) {
          if (Object.keys(outputs).length) {
            workflow.prompt = prompt
            workflow.outputs = outputs
            workflow.state.progress = 100
          } else {
            workflow.state.progress = 0
          }
          workflow.state.executing = false
          workflow.state.loading = false
          workflow.state.done = true
        }
        break
      }
      case 'error': {
        const { workflowKey } = data.data
        const workflow = workspace[workflowKey]
        if (workflow) {
          workflow.state.executing = false
          workflow.state.loading = false
          workflow.state.progress = 0
          workflow.state.done = false
        }
        break
      }
      case 'history': {
        if (data.data) {
          Object.entries(data.data).forEach(([key, value]) => {
            const workflow = workspace[key]
            if (workflow) {
              workflow.prompt = value.prompt
              workflow.outputs = value.outputs
            }
          })
        }
        break
      }
    }
  }

  socket.onreconnect = () => {
    this.state.isConnecting = true
  }
}

function workspaceInitClientId() {
  const CLIENT_ID_KEY = 'workflow_clientId'
  this.state.clientId = sessionStorage.getItem(CLIENT_ID_KEY) || this.utils.uuidv4()
  sessionStorage.setItem(CLIENT_ID_KEY, this.state.clientId)
}

const getWorkflowLifecycle = () => {
  return {
    setup: {
      method: {
        name: workspaceInitClientId.name,
        body: `${workspaceInitClientId.toString()}\nworkspaceInitClientId.call(this)`
      },
      initialLifeCycleValue: `function setup({ props, state, watch, onMounted }) {}`,
      comments: {
        start: '初始化ClientId start',
        end: '初始化ClientId end'
      }
    },
    onMounted: {
      method: {
        name: workspaceInitWebSocket.name,
        body: `${workspaceInitWebSocket.toString()}\nworkspaceInitWebSocket.call(this)`
      },
      initialLifeCycleValue: `function onMounted() {}`,
      comments: {
        start: '初始化WebSocket连接 start',
        end: '初始化WebSocket连接 end'
      }
    }
  }
}

export default () => {
  return {
    workflowVariableState,
    setWorkflow,
    setWorkflowCategory,
    setWorkflowVariable,
    resetWorkflowVariableState,
    getWorkflowVariableContent,
    setWorkflowVariableStateByBindKey,
    getWorkflowLifecycle
  }
}

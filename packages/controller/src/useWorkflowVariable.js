import { reactive } from 'vue'
import { WORKSPACE_KEY } from '../js/constants'
import { useCanvas } from '@opentiny/tiny-engine-controller'

const category = [
  {
    name: '配置',
    key: 'config',
    variables: [
      {
        category: 'config',
        key: 'uploadApi',
        name: '上传接口',
        description: '',
        value: '/workflows/api/upload/image'
      }
    ]
  },
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
        name: 'Loading',
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
    if (['state', 'config'].includes(category.key)) {
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

const getWorkflowVariableContent = () => {
  const { selectedWidget, category, key, id } = workflowVariableState.selectedVariable
  const workflowKey = workflowVariableState.selectedWorkflow.key
  const valueKeyMap = {
    config: `['config']['${key}']`,
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
    })(),
    config: (() => {
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
      ?.variables.find((item) => item.key === data.key),
    config: workflowVariableState.category
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

// const workspaceInitWebSocket = () => {
//   const WORKSPACE_KEY = 'workspace'
//   const workspace = this.state[WORKSPACE_KEY]
//   const key = Object.keys(workspace)[0]

//   const { origin } = window.top.location

//   const options = {
//     url: `${origin.replace('http', 'ws')}/workflows?key=${key}`,
//     protocols: this.state.clientId
//   }

//   const socket = new this.utils.ReconnectWebSocket(options)

//   socket.onmessage = (e) => {
//     this.state.isConnecting = false
//     const data = JSON.parse(e.data)
//     switch (data.type) {
//       case 'connect': {
//         break
//       }
//       case 'state': {
//         const { workflowKey, pending } = data.data
//         const workflow = workspace[workflowKey]
//         if (workflow) {
//           workflow.state.pending = pending
//           workflow.state.done = false
//         }
//         break
//       }
//       case 'progress': {
//         const { workflowKey, promptId, value } = data.data
//         const workflow = workspace[workflowKey]
//         if (workflow) {
//           workflow.promptId = promptId
//           workflow.state.executing = true
//           workflow.state.progress = value
//           workflow.state.done = false
//         }
//         break
//       }
//       case 'done': {
//         const { workflowKey, prompt, outputs } = data.data
//         const workflow = workspace[workflowKey]
//         if (workflow) {
//           if (Object.keys(outputs).length) {
//             workflow.prompt = prompt
//             workflow.outputs = outputs
//             workflow.state.progress = 100
//           } else {
//             workflow.state.progress = 0
//           }
//           workflow.state.executing = false
//           workflow.state.loading = false
//           workflow.state.done = true
//         }
//         break
//       }
//       case 'error': {
//         const { workflowKey } = data.data
//         const workflow = workspace[workflowKey]
//         if (workflow) {
//           workflow.state.executing = false
//           workflow.state.loading = false
//           workflow.state.progress = 0
//           workflow.state.done = false
//         }
//         break
//       }
//       case 'history': {
//         if (data.data) {
//           Object.entries(data.data).forEach(([key, value]) => {
//             const workflow = workspace[key]
//             if (workflow) {
//               workflow.prompt = value.prompt
//               workflow.outputs = value.outputs
//             }
//           })
//         }
//         break
//       }
//     }
//   }

//   socket.onreconnect = () => {
//     this.state.isConnecting = true
//   }
// }

// const workspaceInitClientId = () => {
//   const CLIENT_ID_KEY = 'workflow_clientId'
//   this.state.clientId = sessionStorage.getItem(CLIENT_ID_KEY) || this.utils.uuidv4()
//   sessionStorage.setItem(CLIENT_ID_KEY, this.state.clientId)
// }

const getWorkflowLifecycle = () => {
  return {
    setup: {
      method: {
        name: 'workspaceInitClientId',
        body: `const workspaceInitClientId = () => {
  const CLIENT_ID_KEY = 'workflow_clientId'
  this.state.clientId = sessionStorage.getItem(CLIENT_ID_KEY) || this.utils.uuidv4()
  sessionStorage.setItem(CLIENT_ID_KEY, this.state.clientId)
}

workspaceInitClientId()`
      },
      initialLifeCycleValue: `function setup({ props, state, watch, onMounted }) {}`,
      comments: {
        start: '初始化ClientId start',
        end: '初始化ClientId end'
      }
    },
    onMounted: {
      method: {
        name: 'workspaceInitWebSocket',
        body: `const workspaceInitWebSocket = () => {
  const WORKSPACE_KEY = 'workspace'
  const workspace = this.state[WORKSPACE_KEY]
  const key = Object.keys(workspace)[0]

  const { origin } = window.top.location

  const options = {
    url: \`\${origin.replace('http', 'ws')}/workflows?key=\${key}\`,
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

workspaceInitWebSocket()`
      },
      initialLifeCycleValue: `function onMounted() {}`,
      comments: {
        start: '初始化WebSocket连接 start',
        end: '初始化WebSocket连接 end'
      }
    }
  }
}

const genWorkflowState = (workflows) => {
  /**
   * workflow 在state中的数据结构
   {
      __workflow__: {
        workflow1: {
          config: {
            uploadApi: '/workflows/api/upload/image?key=workflow1'
          },
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
  const { canvasApi } = useCanvas()
  const { getSchema, setState } = canvasApi.value
  const pageSchema = getSchema()
  const stateName = WORKSPACE_KEY
  const staticData = {}
  for (const index in workflows) {
    const workflow = workflows[index]
    staticData[workflow.key] = {}
    const extraVariables = workflowVariableState.category
      .map((item) => item.variables)
      .flat(1)
      .filter((item) => !['input', 'output'].includes(item.category))
    for (const index in extraVariables) {
      const { category, key, value } = extraVariables[index]
      if (!staticData[workflow.key][category]) {
        staticData[workflow.key][category] = {}
      }
      staticData[workflow.key][category][key] = value
      if (category === 'config') {
        if (key === 'uploadApi') {
          staticData[workflow.key][category][key] = `/workflows/api/upload/image?key=${workflow.key}`
        }
      }
    }
    for (const key in workflow.paramsNodes) {
      const { selectedWidget, category, id } = workflow.paramsNodes[key]

      if (!staticData[workflow.key]['prompt']) {
        staticData[workflow.key]['prompt'] = {}
      }
      if (!staticData[workflow.key]['prompt'][id]) {
        staticData[workflow.key]['prompt'][id] = { inputs: {} }
      }
      if (!staticData[workflow.key]['outputs']) {
        staticData[workflow.key]['outputs'] = {}
      }

      if (category === 'input') {
        staticData[workflow.key]['prompt'][id]['inputs'][selectedWidget.name] = selectedWidget.value
      }
      if (category === 'output') {
        staticData[workflow.key]['outputs'][selectedWidget.id] = null
      }
    }
  }
  const workflowState = {
    ...pageSchema.state[stateName],
    ...staticData
  }
  pageSchema.state[stateName] = workflowState

  // 设置画布上下文环境，让画布触发更新渲染
  setState({ [stateName]: workflowState })
}

const genMethodToLifeCycle = ({ pageSchema, lifeCycleKey, initialLifeCycleValue, method, comments }) => {
  const fn = pageSchema.lifeCycles?.[lifeCycleKey]?.value

  const fetchBody = `
  /** ${comments.start} */
  ${method.body};
  /** ${comments.end} */`

  if (!fn) {
    pageSchema.lifeCycles = pageSchema.lifeCycles || {}
    pageSchema.lifeCycles[lifeCycleKey] = {
      type: 'JSFunction',
      value: initialLifeCycleValue.replace(/\}$/, fetchBody + '}')
    }
  } else {
    if (!fn.includes(method.name)) {
      pageSchema.lifeCycles[lifeCycleKey].value = fn.trim().replace(/\}$/, fetchBody + '}')
    }
  }
}

const genWorkflowMethodToLifeCycle = () => {
  const { canvasApi } = useCanvas()
  const { getSchema } = canvasApi.value
  const pageSchema = getSchema()
  const workflowLifecycles = getWorkflowLifecycle()
  Object.keys(workflowLifecycles).forEach((key) => {
    const { method, initialLifeCycleValue, comments } = getWorkflowLifecycle()[key]
    genMethodToLifeCycle({
      pageSchema,
      lifeCycleKey: key,
      initialLifeCycleValue,
      method,
      comments
    })
  })
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
    getWorkflowLifecycle,
    genWorkflowState,
    genWorkflowMethodToLifeCycle
  }
}

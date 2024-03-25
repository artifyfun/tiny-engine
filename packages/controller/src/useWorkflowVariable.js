import { reactive } from 'vue'
import { WORKFLOW_STATE_KEY } from '../js/constants'

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
        name: '等待',
        description: '',
        value: false
      },
      {
        category: 'state',
        key: 'queue',
        name: '排队任务数',
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
          queue: 0
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
  const variableContent = `this.state.${WORKFLOW_STATE_KEY}['${workflowKey}']` + subPath
  return variableContent
}

const setWorkflowVariableStateByBindKey = (bindKey, workflows) => {
  const [workflowKey, ...res] = bindKey
    .replace(WORKFLOW_STATE_KEY, '')
    .replaceAll('[', '')
    .replaceAll("'", '')
    .split(']')

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

export default () => {
  return {
    workflowVariableState,
    setWorkflow,
    setWorkflowCategory,
    setWorkflowVariable,
    resetWorkflowVariableState,
    getWorkflowVariableContent,
    setWorkflowVariableStateByBindKey
  }
}

<template>
  <div class="comfyui-playground">
    <iframe ref="iframe" style="width: 100%; height: 100%" src="/comfyui/" frameborder="0"></iframe>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, defineEmits, defineExpose } from 'vue'

import { uuidv4, getRandomColor, stringify, loadCssCode } from '../../utils'

const emit = defineEmits(['onload', 'updateParamsNodes'])

const iframe = ref(null)

const postMessage = (message) => {
  iframe.value.contentWindow.postMessage(message, '*')
}

const loadGraphData = (graphData) => {
  const message = JSON.stringify({
    eventType: 'loadGraphData',
    data: graphData
  })
  postMessage(message)
}

const graphToPrompt = () => {
  const message = JSON.stringify({
    eventType: 'graphToPrompt'
  })
  postMessage(message)
}

const updateParamsNodes = (paramsNodes) => {
  const message = JSON.stringify({
    eventType: 'updateParamsNodes',
    data: paramsNodes
  })
  postMessage(message)
}

const handleMessage = (event) => {
  const { eventType, data } = JSON.parse(event.data)
  if (eventType === 'updateParamsNodes') {
    const paramsNodes = data.map((node) => {
      return {
        ...node,
        description: node.description || '',
        key: node.key || uuidv4()
      }
    })
    emit('updateParamsNodes', paramsNodes)
  }
  if (eventType === 'graphToPrompt') {
    emit('graphToPrompt', data)
  }
}

function handleComfyuiContext(window) {
  const eventBus = {
    callbacks: [],
    send: (message) => {
      window.parent.postMessage(message, '*')
    },
    on: (cb) => {
      eventBus.callbacks.push(cb)
    }
  }

  window.addEventListener('message', (event) => {
    for (const i in eventBus.callbacks) {
      eventBus.callbacks[i](event.data)
    }
  })

  const { app, LiteGraph } = window

  app.canvas.allow_dragnodes = false
  app.canvas.allow_reconnect_links = false
  app.canvas.allow_searchbox = false
  // app.canvas.read_only = true

  app.ui.menuContainer.remove()

  app.handleFile = () => {}

  let paramsNodes = []

  const origin_drawNodeShape = app.canvas.drawNodeShape
  app.canvas.drawNodeShape = function (node, ctx, size, fgcolor, bgcolor, selected, mouse_over) {
    const isSelected = paramsNodes.some((item) => item.id === node.id)
    const outputNode = paramsNodes.find((item) => item.id === node.id && ['output'].includes(item.category))
    fgcolor = outputNode ? outputNode.color : fgcolor
    selected = isSelected
    const res = origin_drawNodeShape.call(this, node, ctx, size, fgcolor, bgcolor, selected, mouse_over)
    return res
  }

  app.canvas.drawNodeWidgets = function (node, posY, ctx, active_widget) {
    if (!node.widgets || !node.widgets.length) {
      return 0
    }
    const width = node.size[0]
    const widgets = node.widgets
    posY += 2
    const H = LiteGraph.NODE_WIDGET_HEIGHT
    const show_text = this.ds.scale > 0.5
    ctx.save()
    ctx.globalAlpha = this.editor_alpha
    const outline_color = LiteGraph.WIDGET_OUTLINE_COLOR
    let background_color = LiteGraph.WIDGET_BGCOLOR
    const text_color = LiteGraph.WIDGET_TEXT_COLOR
    const secondary_text_color = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR
    const margin = 15

    for (let i = 0; i < widgets.length; ++i) {
      const w = widgets[i]
      const current = paramsNodes.find((item) => item.id === node.id && item.selectedWidget.name === w.name)
      if (current) {
        background_color = current.color
      } else {
        background_color = LiteGraph.WIDGET_BGCOLOR
      }
      let y = posY
      if (w.y) {
        y = w.y
      }
      w.last_y = y
      ctx.strokeStyle = outline_color
      ctx.fillStyle = '#222'
      ctx.textAlign = 'left'
      //ctx.lineWidth = 2;
      if (w.disabled) ctx.globalAlpha *= 0.5
      const widget_width = w.width || width

      switch (w.type) {
        case 'button':
          ctx.fillStyle = background_color
          if (w.clicked) {
            ctx.fillStyle = '#AAA'
            w.clicked = false
            this.dirty_canvas = true
          }
          ctx.fillRect(margin, y, widget_width - margin * 2, H)
          if (show_text && !w.disabled) ctx.strokeRect(margin, y, widget_width - margin * 2, H)
          if (show_text) {
            ctx.textAlign = 'center'
            ctx.fillStyle = text_color
            ctx.fillText(w.label || w.name, widget_width * 0.5, y + H * 0.7)
          }
          break
        case 'toggle':
          ctx.textAlign = 'left'
          ctx.strokeStyle = outline_color
          ctx.fillStyle = background_color
          ctx.beginPath()
          if (show_text) ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5])
          else ctx.rect(margin, y, widget_width - margin * 2, H)
          ctx.fill()
          if (show_text && !w.disabled) ctx.stroke()
          ctx.fillStyle = w.value ? '#89A' : '#333'
          ctx.beginPath()
          ctx.arc(widget_width - margin * 2, y + H * 0.5, H * 0.36, 0, Math.PI * 2)
          ctx.fill()
          if (show_text) {
            ctx.fillStyle = secondary_text_color
            const label = w.label || w.name
            if (label != null) {
              ctx.fillText(label, margin * 2, y + H * 0.7)
            }
            ctx.fillStyle = w.value ? text_color : secondary_text_color
            ctx.textAlign = 'right'
            ctx.fillText(w.value ? w.options.on || 'true' : w.options.off || 'false', widget_width - 40, y + H * 0.7)
          }
          break
        case 'slider': {
          ctx.fillStyle = background_color
          ctx.fillRect(margin, y, widget_width - margin * 2, H)
          const range = w.options.max - w.options.min
          let nvalue = (w.value - w.options.min) / range
          if (nvalue < 0.0) nvalue = 0.0
          if (nvalue > 1.0) nvalue = 1.0
          ctx.fillStyle = Object.prototype.hasOwnProperty.call(w.options, 'slider_color')
            ? w.options.slider_color
            : active_widget === w
            ? '#89A'
            : '#678'
          ctx.fillRect(margin, y, nvalue * (widget_width - margin * 2), H)
          if (show_text && !w.disabled) ctx.strokeRect(margin, y, widget_width - margin * 2, H)
          if (w.marker) {
            let marker_nvalue = (w.marker - w.options.min) / range
            if (marker_nvalue < 0.0) marker_nvalue = 0.0
            if (marker_nvalue > 1.0) marker_nvalue = 1.0
            ctx.fillStyle = Object.prototype.hasOwnProperty.call(w.options, 'marker_color')
              ? w.options.marker_color
              : '#AA9'
            ctx.fillRect(margin + marker_nvalue * (widget_width - margin * 2), y, 2, H)
          }
          if (show_text) {
            ctx.textAlign = 'center'
            ctx.fillStyle = text_color
            ctx.fillText(
              w.label || `${w.name}  ${Number(w.value).toFixed(w.options.precision != null ? w.options.precision : 3)}`,
              widget_width * 0.5,
              y + H * 0.7
            )
          }
          break
        }
        case 'number':
        case 'combo':
          ctx.textAlign = 'left'
          ctx.strokeStyle = outline_color
          ctx.fillStyle = background_color
          ctx.beginPath()
          if (show_text) ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5])
          else ctx.rect(margin, y, widget_width - margin * 2, H)
          ctx.fill()
          if (show_text) {
            if (!w.disabled) ctx.stroke()
            ctx.fillStyle = text_color
            if (!w.disabled) {
              ctx.beginPath()
              ctx.moveTo(margin + 16, y + 5)
              ctx.lineTo(margin + 6, y + H * 0.5)
              ctx.lineTo(margin + 16, y + H - 5)
              ctx.fill()
              ctx.beginPath()
              ctx.moveTo(widget_width - margin - 16, y + 5)
              ctx.lineTo(widget_width - margin - 6, y + H * 0.5)
              ctx.lineTo(widget_width - margin - 16, y + H - 5)
              ctx.fill()
            }
            ctx.fillStyle = secondary_text_color
            ctx.fillText(w.label || w.name, margin * 2 + 5, y + H * 0.7)
            ctx.fillStyle = text_color
            ctx.textAlign = 'right'
            if (w.type === 'number') {
              ctx.fillText(
                Number(w.value).toFixed(w.options.precision !== undefined ? w.options.precision : 3),
                widget_width - margin * 2 - 20,
                y + H * 0.7
              )
            } else {
              let v = w.value
              if (w.options.values) {
                let values = w.options.values
                if (values.constructor === Function) values = values()
                if (values && values.constructor !== Array) v = values[w.value]
              }
              ctx.fillText(v, widget_width - margin * 2 - 20, y + H * 0.7)
            }
          }
          break
        case 'customtext':
          w.element.style.background = background_color
          if (w.draw) {
            w.draw(ctx, node, widget_width, y, H)
          }
          break
        case 'string':
        case 'text':
          ctx.textAlign = 'left'
          ctx.strokeStyle = outline_color
          ctx.fillStyle = background_color
          ctx.beginPath()
          if (show_text) ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.5])
          else ctx.rect(margin, y, widget_width - margin * 2, H)
          ctx.fill()
          if (show_text) {
            if (!w.disabled) ctx.stroke()
            ctx.save()
            ctx.beginPath()
            ctx.rect(margin, y, widget_width - margin * 2, H)
            ctx.clip()

            //ctx.stroke();
            ctx.fillStyle = secondary_text_color
            const label = w.label || w.name
            if (label != null) {
              ctx.fillText(label, margin * 2, y + H * 0.7)
            }
            ctx.fillStyle = text_color
            ctx.textAlign = 'right'
            ctx.fillText(String(w.value).substr(0, 30), widget_width - margin * 2, y + H * 0.7) //30 chars max
            ctx.restore()
          }
          break
        default:
          if (w.draw) {
            w.draw(ctx, node, widget_width, y, H)
          }
          break
      }
      posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4
      ctx.globalAlpha = this.editor_alpha
    }
    ctx.restore()
    ctx.textAlign = 'left'
  }

  const origin_getNodeMenuOptions = app.canvas.getNodeMenuOptions
  app.canvas.getNodeMenuOptions = function (...res) {
    const node = res[0]
    const options = origin_getNodeMenuOptions.call(this, ...res)
    options.splice(0, options.length)

    if (node.widgets) {
      const selectedWidgets = node.widgets.filter((widget) => {
        const isSelected = paramsNodes.some((item) => item.id === node.id && item.selectedWidget.name === widget.name)
        return isSelected
      })

      const input = {
        content: `提取输入 [${selectedWidgets.length}/${node.widgets.length}]`,
        has_submenu: true,
        submenu: {
          options: node.widgets.map((widget) => {
            const isSelected = paramsNodes.some(
              (item) => item.id === node.id && item.selectedWidget.name === widget.name
            )
            return {
              content: isSelected ? `${widget.name} ✓` : widget.name,
              className: isSelected ? 'selected' : '',
              callback: () => {
                if (isSelected) {
                  paramsNodes = paramsNodes.filter(
                    (item) => item.id !== node.id || (item.id === node.id && item.selectedWidget.name !== widget.name)
                  )
                } else {
                  const color = getRandomColor()
                  paramsNodes.push({
                    ...node,
                    graph: undefined,
                    color,
                    category: 'input',
                    name: widget.name,
                    selectedWidget: widget
                  })
                }
                eventBus.send(
                  stringify({
                    eventType: 'updateParamsNodes',
                    data: paramsNodes
                  })
                )
              }
            }
          })
        }
      }

      options.push(input)
    }

    const isSelected = paramsNodes.some((item) => item.id === node.id && ['output'].includes(item.category))
    const output = {
      content: isSelected ? '提取为输出节点 ✓' : '提取为输出节点',
      className: isSelected ? 'selected-output' : '',
      has_submenu: false,
      callback: () => {
        if (isSelected) {
          const index = paramsNodes.findIndex((item) => item.id === node.id && item.selectedWidget.id === node.id)
          paramsNodes.splice(index, 1)
        } else {
          const color = getRandomColor()
          paramsNodes.push({
            ...node,
            graph: undefined,
            color,
            category: 'output',
            name: node.title,
            selectedWidget: { ...node, graph: undefined }
          })
        }
        eventBus.send(
          stringify({
            eventType: 'updateParamsNodes',
            data: paramsNodes
          })
        )
      }
    }

    options.push(output)

    return options
  }

  app.canvas.getCanvasMenuOptions = () => []

  app.canvas.centerOnNode = function (node) {
    const parent = this.canvas.parentNode
    const width = parent.offsetWidth
    const height = parent.offsetHeight
    this.ds.offset[0] = -node.pos[0] - node.size[0] * 0.5 + (width * 0.5) / this.ds.scale
    this.ds.offset[1] = -node.pos[1] - node.size[1] * 0.5 + (height * 0.5) / this.ds.scale
    this.setDirty(true, true)
  }

  eventBus.on(async (message) => {
    const { eventType, data } = JSON.parse(message)
    if (eventType === 'updateParamsNodes') {
      paramsNodes = data
      eventBus.send(
        stringify({
          eventType: 'updateParamsNodes',
          data: paramsNodes
        })
      )
    }
    if (eventType === 'centerOnNode') {
      const node = app.graph.getNodeById(data.id)
      app.canvas.centerOnNode(node)
    }
    if (eventType === 'loadGraphData') {
      app.loadGraphData(data)
      setTimeout(() => {
        const node = app.graph.getNodeById(data.nodes[0].id)
        app.canvas.centerOnNode(node)
      })
    }
    if (eventType === 'graphToPrompt') {
      const res = await app.graphToPrompt()
      eventBus.send(
        stringify({
          eventType: 'graphToPrompt',
          data: res
        })
      )
    }
  })
}

let timer = null

onMounted(() => {
  iframe.value.onload = function () {
    const global = this.contentWindow

    loadCssCode(
      `
      .comfy-menu {
        display: none !important;
      }

      .litemenu-entry.submenu.selected {
        color: yellow !important;
      }

      .litemenu-entry.submenu.selected-output {
        color: yellow !important;
      }

      rgthree-progress-bar {
        display: none !important;
      }

      .pysssss-image-feed {
        display: none !important;
      }
    `,
      global
    )

    let counter = 0
    function loop() {
      counter++
      clearTimeout(timer)
      if (counter > 100) {
        return
      }
      timer = setTimeout(() => {
        const { LGraph, app } = global
        if (LGraph && app) {
          handleComfyuiContext(global)
          // console.log(global)
          emit('onload')
        } else {
          loop()
        }
      }, 100)
    }

    loop()
  }

  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  clearTimeout(timer)
  window.removeEventListener('message', handleMessage)
})

defineExpose({
  postMessage,
  loadGraphData,
  graphToPrompt,
  updateParamsNodes
})
</script>

<style scoped lang="less">
.comfyui-playground {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>

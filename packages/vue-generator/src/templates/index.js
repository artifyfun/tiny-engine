import { generateTemplate as genDefaultStaticTemplate } from './vue-template'
import { generateTemplate as genElectronStaticTemplate } from './electron-template'

export const templateMap = {
  default: genDefaultStaticTemplate,
  electron: genElectronStaticTemplate,
}

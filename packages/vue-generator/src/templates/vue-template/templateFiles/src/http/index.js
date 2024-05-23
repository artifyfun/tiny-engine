import axios from './axios'
import config from './config'

export default (dataHandler) => {
  const http = axios(config)

  http.interceptors.response.use(dataHandler, (error) => {
    const response = error.response
    if (response.status === 403 && response.headers && response.headers['x-login-url']) {
      // TODO 处理无权限时，重新登录再发送请求
    }
  })

  return http
}

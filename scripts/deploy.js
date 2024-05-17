const fs = require('fs')

const distPath = 'packages/design-core/dist'

const serverPath = '../tiny-engine-webservice/app/public/design'

try {
  fs.rmSync(serverPath, { recursive: true })
} catch (e) {
  console.log('No such directory: ' + serverPath + ', skip it.')
}

fs.cpSync(distPath, serverPath, { recursive: true })

const viewPath = '../tiny-engine-webservice/app/view'

const files = [
  'canvas.html',
  'index.html',
  'preview.html',
  'previewApp.html',
]

files.forEach(file => {
  const filePath = distPath + '/' + file
  const viewsPath = viewPath + '/' + file
  try {
    fs.rmSync(viewsPath)
  } catch (e) {
    console.log('No such file: ' + viewsPath + ', skip it.')
  }

  fs.cpSync(filePath, viewsPath)
})

console.log('Deployed successfully!')
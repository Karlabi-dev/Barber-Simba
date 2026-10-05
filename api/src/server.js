import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { createApp } from './app.js'
import { mountFrontend } from './frontend.js'

const port = Number(process.env.PORT || 3001)
const app = createApp()
if (process.env.SERVE_FRONTEND === 'true') {
  mountFrontend(app, fileURLToPath(new URL('../../AppSimba/dist/', import.meta.url)))
}
app.listen(port, () => console.log(`Simba ouvindo na porta ${port}`))

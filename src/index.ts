if (process.env.NODE_ENV !== 'production') require('dotenv').config()
import { App, ExpressReceiver } from '@slack/bolt'
import { registerHNWebhookListeners } from './hn'
import { registerBotListeners } from './bot'
import express from 'express'

const router = express()

export const bot = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
})

registerBotListeners(bot)
registerHNWebhookListeners(router)

async function start() {
  const port = parseInt(process.env.PORT) || 5000
  router.listen(port)
  await bot.start(port)
  console.log('⚡️ Bot started')
}

start()

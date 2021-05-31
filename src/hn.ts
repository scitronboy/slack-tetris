import { App, ExpressReceiver } from '@slack/bolt'
import * as bodyParser from 'body-parser'
import { GraphQLClient, gql } from 'graphql-request'
import { onPayment } from './bot'

const jsonParser = bodyParser.json()

const gqlClient = new GraphQLClient('https://hn.rishi.cx/')
gqlClient.setHeader('secret', process.env.HN_API_KEY)

export function registerHNWebhookListeners(receiver: ExpressReceiver) {
  receiver.router.get('/test', (req, res) => {
    res.send('yay!')
  })

  receiver.router.post('/hn/payment', jsonParser, async (req) => {
    const paymentId = req.body?.body?.id

    if (!paymentId) return

    const { transaction } = await gqlClient.request(gql`
      query p($id: String!) {
        transaction(id: $id) {
          validated
          from {
            id
          }
          balance
          for
        }
      }
    `, {
      id: paymentId
    }).catch(console.error)

    if (transaction.validated) onPayment(transaction.from.id, transaction.balance, transaction.for)
  })
}

/** Sends an HN payment and returns the transaction ID */
export function sendPayment(to: string, amount: number, reason: string): Promise<string> {
  return gqlClient.request(gql`
    mutation payment($from: String!, $to: String!, $amount: Float!, $reason: String!) {
      send (
        data: {
          from: $from,
          to: $to,
          balance: $amount,
          for: $reason
        }
      ) {
        id
      }
    }
  `, {...arguments, from: process.env.BOT_SLACK_ID})
    .then(t => t.id)
    .catch(console.error)
}

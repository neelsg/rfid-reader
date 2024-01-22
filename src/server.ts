import { getConfig } from './config'
import WebSocket from 'ws'

type Server = {
  connect: () => Promise<void>;
  send: (data: string) => void;
  listen: (callback: (data:WebSocket.RawData) => void) => void;
}

export const server = ((): Server => {
  let clients: WebSocket[] = [];
  let listeners: ((data: WebSocket.RawData) => void)[] = [];
  
  const connect = async () => {
    const config = await getConfig()
    const port = config.server?.port || 8080
    const server = new WebSocket.Server({port})
    console.log(`serving on ws://localhost:${port}`)
    server.on('connection', (client: WebSocket) => {
      clients.push(client)
  
      client.on('message', (data) => {
        listeners.forEach((l) => {
          l(data)
        })
      })
  
      client.on('close', () => {
        clients = clients.filter((c) => c !== client)
      })
    })
  }

  const send = (data: string): void => {
    clients.forEach((c: WebSocket) => {
      c.send(data)
    })
  }
  const listen = (callback: (data: WebSocket.RawData) => void): void => {
    listeners.push(callback)
  };

  return {
    connect,
    send,
    listen
  };
})()
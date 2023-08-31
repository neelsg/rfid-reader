import { getConfig } from './config'
import WebSocket from 'ws'

type Server = {
  connect: () => Promise<void>;
  send: (data: string) => void;
  listen: (callback: (data:WebSocket.RawData) => void) => void;
}

export const server = ((): Server => {
  let sockets: WebSocket[] = [];
  let listeners: ((data: WebSocket.RawData) => void)[] = [];
  
  const connect = async () => {
    const config = await getConfig()
    const port = config.server?.port || 8080
    const server = new WebSocket.Server({port})
    console.log(`serving on ws://localhost:${port}`)
    server.on('connection', (socket) => {
      sockets.push(socket)
  
      console.log(`connected to client`)
      socket.send('commands:')
      socket.send('- start : start reading tags')
      socket.send('- stop : stop reading tags')
      socket.send('- reconnect : disconnect and reconnect from the reader')
      
      socket.on('message', (data) => {
        listeners.forEach((l) => {
          l(data)
        })
      })
  
      socket.on('close', () => {
        sockets = sockets.filter((s) => s !== socket)
        console.log(`disconnected from client`)
      })
    })
  }

  const send = (data: string): void => {
    sockets.forEach((s) => {
      s.send(data)
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
import type { RawData } from 'ws'
import { server } from "./server";
import { reader } from "./reader";

reader.connect()
reader.listen((data: string) => {
  server.send(data)
})

server.connect()
server.listen((data: RawData) => {
  const msg = data.toString().toLowerCase()
  if (msg == 'start') {
    reader.send('c102050000')
    server.send('starting')
  } else if (msg == 'stop') {
    reader.send('c000')
  } else if (msg == 'reconnect') {
    reader.disconnect()
    reader.connect()
    server.send('reconnecting')
  } else {
    server.send('unknown command')
  }
})
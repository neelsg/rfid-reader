import { getConfig } from './config'
import net  from 'node:net'
import crc from 'crc/crc16ccitt'

type Reader = {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  send: (data: string) => void;
  listen: (callback: (data: string) => void) => void;
}

export const reader = ((): Reader => {
  let clients: (net.Socket)[] = [];
  let listeners: ((data: string) => void)[] = [];

  const connect = async () => {
    const config = await getConfig()
    const address = config.reader?.address || '192.168.0.200'
    const port = config.reader?.port || 200
    const client = net.createConnection(port, address, () => {
      console.log(`connected to reader at tcp://${address}:${port}`)
      setTimeout(() => {send('c000')}, 100)
    })
    client.on('data', process)
    client.on('end', () => {
      clients.filter((c) => c.address != client.address)
      console.log('disconnected from reader')
    })

    clients.push(client)
  }

  const disconnect = async () => {
    clients.forEach((c) => {
      c.end()
    })
    clients = []
  }

  const process = (data: Buffer) => {
    if (data.length < 8) {
      console.log(`data err: data was too short: ${data.toString('hex')}`)
      return
    }
    if (data[0] != 0xAA || data[1] != 0xAA || data[2] != 0xFF) {
      console.log(`data err: did not start with 0xAAAAFF: ${data.toString('utf8')}`)
      return
    }
    if (data.length - 3 > data[3]) {
      process(data.subarray(0, data[3] + 3))
      process(data.subarray(data[3] + 3))
      return
    }
    if (data.length - 3 != data[3]) {
      console.log(`data err: length did not match: ${data.toString('hex')}`)
      return
    }
    const check = crc(data.subarray(0, -2))
    if (data[data.length - 2] != check >> 8 || data[data.length - 1] != check % 256) {
      console.log(`data err: crc did not match: ${data.toString('hex')}`)
      return
    }
    
    let message = `unknown message from reader: ${data.toString('hex')}`
    if (data[4] == 0xC0 && data[5] == 0x00 && data[6] == 0x00) {
      message = 'stopped'
    } else if (data[4] == 0xC1 && data[5] == 0x02 && data[6] == 0x00) {
      message = `tag ${data.subarray(10, -5).toString('hex')}`
    }

    listeners.forEach((l) => {
      l(message)
    })
  }

  const send = (data: string): void => {
    const tokens = data.match(/[0-9a-z]{2}/gi) ?? []
    const message = tokens.map(t => parseInt(t, 16))
    const prefix = [0xAA, 0xAA, 0xFF, message.length + 3]
    const check = crc(Buffer.from([...prefix, ...message]))
    const affix = [check >> 8, check % 256]
    const buffer = Buffer.from(new Uint8Array([...prefix, ...message, ...affix]))
    clients.forEach((c) => {
      c.write(buffer)
    })
  }

  const listen = (callback: (data: string) => void): void => {
    listeners.push(callback)
  };

  return {
    connect,
    disconnect,
    send,
    listen
  }
})()
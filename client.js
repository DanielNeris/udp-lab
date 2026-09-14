const dgram = require('node:dgram')

const socket = dgram.createSocket('udp4')
const PORT = 41234

// Take the message from the command line: node client.js oi mundo
const message = process.argv.slice(2).join(' ') || 'hi from client'
const payload = Buffer.from(message)

const sentAt = process.hrtime.bigint()

socket.on('message', (msg) => {
  clearTimeout(timer)
  const rttMs = Number(process.hrtime.bigint() - sentAt) / 1e6
  console.log(`-> sent      ${payload.length}B  "${payload.toString()}"`)
  console.log(`<- received  ${msg.length}B  "${msg.toString()}"`)
  console.log(`   rtt      ${rttMs.toFixed(2)} ms`)
  socket.close()
})

socket.on('error', (err) => {
  console.error('error in socket:', err)
  socket.close()
})

socket.send(payload, PORT, '127.0.0.1')

// If nothing returns in 2s, the datagram is lost and no one tells you.
// This silence is the most important thing in this session.
const timer = setTimeout(() => {
  console.log('nothing returned in 2000ms. the packet disappeared and no one told you.')
  socket.close()
}, 2000)
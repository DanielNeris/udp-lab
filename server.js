const dgram = require('node:dgram')

const socket = dgram.createSocket('udp4')
const PORT = 41234

// Fires once for each received datagram.
// msg  = Buffer with the raw bytes
// rinfo = { address, family, port, size } of the sender
socket.on('message', (msg, rinfo) => {
  console.log(
    `<- ${rinfo.address}:${rinfo.port}  ${msg.length}B  "${msg.toString()}"`
  )

  // Send the same bytes to the sender.
  // Note: there is no "connection". You only respond to the address
  // that came in the rinfo. This is the service model of the 2-2 lecture.
  socket.send(msg, rinfo.port, rinfo.address, (err) => {
    if (err) console.error('error sending:', err)
  })
})

socket.on('listening', () => {
  const a = socket.address()
  console.log(`server listening on ${a.address}:${a.port}`)
})

socket.on('error', (err) => {
  console.error('error in socket:', err)
  socket.close()
})

socket.bind(PORT)
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const io = require('socket.io')(http)

const players = {}

io.on('connection', socket => {
  console.log('a user connected')
  socket.on('disconnect', () => {
    console.log('user disconnected')
  })
  socket.on('player', player => {
    if (!player) return
    const name = String(player.n).substr(0, 8)
    players[name] = players[name] || {}
    if (players[name].cx !== player.cy || players[name].cy !== player.cy) {
      if (Math.random() > 0.95) {
        // console.log(name, 'moved', player)
        socket.broadcast.emit('player', player)
      }
    }
  })
  socket.on('platform', platform => {
    socket.broadcast.emit('platform', platform)
  })
})

app.use(express.static('dist'))

http.listen(3000, () => {
  console.log('listening on *:3000')
})

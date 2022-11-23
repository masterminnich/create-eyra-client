import { Server } from 'Socket.IO'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
  } else {
    console.log('Socket is initializing')
    const io = new Server(res.socket.server)
    res.socket.server.io = io

    io.on('connection', socket => {
        socket.on('state-change', msg => {
            socket.broadcast.emit('update-state', msg)
        });
        socket.on('membersCollection-change', msg => {
            socket.broadcast.emit('update-membersCollection', msg)
        });
        socket.on('activitiesCollection-change', msg => {
            socket.broadcast.emit('update-activitiesCollection', msg)
        });
        socket.on('membersAndActivities-change', data => {
            socket.broadcast.emit("update-both", data)
        });
    })
  }
  res.end()
}

export default SocketHandler
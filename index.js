const fastify = require('fastify')()

fastify.register(require('fastify-websocket'))
fastify.register(require('fastify-mongodb'), {
  forceClose: true,
  url: 'mongodb://localhost:27017/project1'
})
fastify.get('/chat', { websocket: true }, async function wsHandler (
  connection,
  req
) {
  connection.socket.on('message', async message => {
    connection.socket.send(message)
    let allClients = this.websocketServer.clients
    allClients.forEach(client => {
      console.log(client.readyState === connection.socket.OPEN)
      try {
        if (
          client.readyState === connection.socket.OPEN
        ) {
          client.send(message)
        }
      } catch (err) {
        console.log(err)
      }
    })
  })
})
// fastify.get(
//   '/chat/:driver/:user',
//   { websocket: true },
//   async function wsHandler (connection, req) {
//     const chat = this.mongo.db.collection('chats')
//     connection.socket.on('message', async message => {
//       const msgs = JSON.parse(message)
//       msgs.createdAt = new Date()
//       delete msgs._id
//       await chat.insertOne(msgs)
//       if (
//         msgs.driverID == req.params.driver &&
//         msgs.userID == req.params.user
//       ) {
//         if (msgs.type == 'send') {
//           connection.socket.send(`Message: ${msgs.messageContent}`)
//         } else {
//           const result = await chat
//             .find({
//               userID: msgs.userID,
//               driverID: msgs.driverID
//             })
//             .toArray()
//           const driverMessages = result.reduce((content, i) => {
//             if (i.senderType == 'driver') {
//               content.push(i.messageContent)
//             }
//             return content
//           }, [])
//           console.log('driver', driverMessages)
//           const userMessages = result.reduce((content, i) => {
//             if (i.senderType == 'driver') {
//               content.push(i.messageContent)
//             }
//             return content
//           }, [])
//           console.log('user', userMessages)
//           userMessages.forEach(d => {
//             connection.socket.send(`User Message: ${d}`)
//           })
//           driverMessages.forEach(d => {
//             connection.socket.send(`Driver Message: ${d}`)
//           })
//         }
//       }
//     })
//   }
// )

fastify.listen(3000, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  } else {
    fastify.log.info(address)
  }
})

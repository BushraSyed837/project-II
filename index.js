const fastify = require('fastify')()

fastify.register(require('fastify-websocket'))
fastify.register(require('fastify-mongodb'), {
  forceClose: true,
  url: 'mongodb://localhost:27017/project1'
})
fastify.get('/chat/:driver/:user', { websocket: true }, async function wsHandler (
  connection,
  req
) {
  const chat = this.mongo.db.collection('chats')
  connection.socket.on('message', async message => {
    var driverMessages = []
    var userMessages = []
    const msgs = JSON.parse(message)
    msgs.createdAt = new Date()
    delete msgs._id
    await chat.insertOne(msgs)
        if (
          msgs.driverID == req.params.driver &&
          msgs.userID == req.params.user
        ) {
          if (msgs.type == 'send') {
            connection.socket.send(`Message: ${msgs.messageContent}`)
          } else {
            const result = await chat
              .find({
                userID: msgs.userID,
                driverID: msgs.driverID
              })
              .toArray()
            console.log(result.length)

            for (let i = 0; i < result.length; i++) {
              if (result[i].senderType == 'driver') {
                driverMessages.push(result[i].messageContent)
              } else if (result[i].senderType == 'user') {
                userMessages.push(result[i].messageContent)
              }
            }
            userMessages.forEach(d => {
              connection.socket.send(`User Message: ${d}`)
            })
            driverMessages.forEach(d => {
              connection.socket.send(`Driver Message: ${d}`)
            })
          }
        }
  })
})

fastify.listen(3000, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  } else {
    fastify.log.info(address)
  }
})

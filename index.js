const fastify = require('fastify')()

fastify.register(require('fastify-websocket'))
fastify.register(require('fastify-mongodb'), {
  forceClose: true,
  url: 'mongodb://localhost:27017/project1'
})
fastify.get(
  '/chat/:driver/:user',
  { websocket: true },
  async function wsHandler (connection, req) {
    // collection instance
    const chat = this.mongo.db.collection('chats')
    // random ID
    let randomId = Math.floor(new Date().valueOf() * Math.random())
    //on connection
    connection.socket.on('message', async message => {
      // getting message object
      const msgs = JSON.parse(message)
      msgs.createdAt = new Date()
      delete msgs._id
      // match ids
      if (
        msgs.driverID == req.params.driver &&
        msgs.userID == req.params.user
      ) {
        // assigning unique client ids
        connection.socket.id = randomId
        msgs.clientID = connection.socket.id
        //insert message in DB
        try {
          await chat.insertOne(msgs)
        } catch (err) {
          console.log(err)
        }
        //loop for socket connections
        this.websocketServer.clients.forEach(async client => {
          const result = await chat
            .find({
              userID: msgs.userID,
              driverID: msgs.driverID
            })
            .toArray()
          // getting client ids
          const clientIdLists = result.map((data, i) => {
            return data.clientID
          })
          try {
            if (
              clientIdLists.includes(client.id) &&
              client.readyState === connection.socket.OPEN
            ) {
              if (msgs.type == 'send') {
                client.send(`Message: ${msgs.messageContent}`)
              } else {
                const driverMessages = result.map((data, i) => {
                  if (data.senderType == 'driver') {
                    return data.messageContent
                  }
                })
                console.log('driver', driverMessages)
                const userMessages = result.map((data, i) => {
                  if (data.senderType == 'user') {
                    return data.messageContent
                  }
                })
                console.log('user', userMessages)
                userMessages.forEach(d => {
                  if (d !== undefined) {
                    client.send(`User Message: ${d}`)
                  }
                })
                driverMessages.forEach(d => {
                  if (d !== undefined) {
                    client.send(`User Message: ${d}`)
                  }
                })
              }
            }
          } catch (err) {
            console.log(err)
          }
        })
      }
    })
  }
)

fastify.listen(3000, (err, address) => {
  if (err) {
    fastify.log.error(err)
    process.exit(1)
  } else {
    fastify.log.info(address)
  }
})

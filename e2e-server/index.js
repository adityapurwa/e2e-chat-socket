const fastify = require('fastify')({
    logger: false,
})
const http = require('http');
const sockjs = require('sockjs');
const Datastore = require('nedb');
const signage = new Datastore({inMemoryOnly: true});

const clients = []

function socksend(type, data) {
    return JSON.stringify({
        type,
        data
    })
}

const echo = sockjs.createServer({sockjs_url: 'http://cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js'});
echo.on('connection', function (conn) {
    clients.push(conn)
    conn.on('data', function (message) {
        const json = JSON.parse(message)
        for (const client of clients) {
            client.write(socksend('remessage', json.data))
        }
    });
    conn.on('close', function () {
    });
});
const server = http.createServer()
echo.installHandlers(server, {prefix: '/echo'});
server.listen(3002, '0.0.0.0');

fastify.register(require('fastify-cors'))

fastify.post('/sign', function (request, reply) {
    signage.insert(request.body, (err, doc) => {
        reply.send(signage.getAllData())
        for (const client of clients) {
            client.write(socksend('signage', signage.getAllData()))
        }
    })
})
fastify.get('/sign', (req, res) => {
    res.send(signage.getAllData())
})

fastify.listen(3001, function (err, address) {
    console.log('Fastify:3001');
})



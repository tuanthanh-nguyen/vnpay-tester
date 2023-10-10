const http = require('node:http')

http.createServer((req, res) => {
    if (req.url === '/ping') return res.end('pong')
}).listen(3444)

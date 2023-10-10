const axios = require('axios')

main()
function main() {
    axios.get('http://127.0.0.1:3444', { timeout: 5000 })
    .then(d => console.log(d))
    .catch(e => {
        if (e.code === 'ECONNABORTED') {
            return console.log('timeout')
        }
        console.error(1, e)
    })
}

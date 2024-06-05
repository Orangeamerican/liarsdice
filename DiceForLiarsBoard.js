var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

mongoose.Promise = Promise

var dbUrl = 'mongodb+srv://Orangeamerican:Golem963@cluster0.gbj7lng.mongodb.net/test';

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

var count = 1;
var count2 = 1;

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

app.post('/messages', async (req, res) => {
    var message = new Message(req.body)

    var savedMessage = await message.save()

    console.log('saved')

    var censored = await Message.findOne({ message: 'badword' })

    if (censored) 
    {
        console.log('censored words found', censored)
        await Message.remove({ _id: censored.id })
    }
    else
    {
        console.log('censored words not found')
        io.emit('message', req.body)
    }

    res.sendStatus(200)

        // .catch((err) => {
        //     res.sendStatus(500)
        //     return console.error(err)
        // })

})

io.on('connection', (socket) => {
  
    socket.on('login', function(socket){
        count2++;
        count++;
        io.emit('getnum', {"playa":count2});
        var mes = "Player " + count2 + " has joined the game";
        io.emit('message', mes);
    });

    socket.on('disconnect', (reason) => {
        console.log('a user disconnected')
        count--;
        if (count < 3){
            Message.remove({ name: 'admin', message: 'Maximum users reached' })
        }
    })

    if (count >= 3) {
        var max = new Message({ name: 'admin', message: 'Maximum users reached' })
        io.emit('message', max)
    }
    console.log(count2);
})

mongoose.connect(dbUrl, {}, (err) => {
    console.log('mongo db connection', err)
})

var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})
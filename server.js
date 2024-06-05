var express = require('express')
var bodyParser = require('body-parser')
var app = express()
var http = require('http').Server(app)
var io = require('socket.io')(http)
var mongoose = require('mongoose')
const { LEGAL_TCP_SOCKET_OPTIONS } = require('mongodb')
const internal = require('stream')
const { truncate } = require('fs')

// ------------------------------ (11/14/22)
const production = false;

var clients = new Map();
var clientId = 0;
var players = 0;
var playerturn = 0;
var socket2;
var socket3;
var socket4;
var socket5;
var socket6;
var maxplayers = 0;
var currentsocket;
var socket7;

function aKey(aSocket) {
    if (production) return aSocket.handshake.address;
    else return aSocket.id;
}
// ------------------------------ (11/14/22)

app.use(express.static(__dirname))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

const PORT = process.env.PORT || 3000;

mongoose.Promise = Promise

var dbUrl = 'mongodb+srv://Orangeamerican:Golem963@cluster0.gbj7lng.mongodb.net/test'

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

var Bid = mongoose.model('Bid', {
    number: Number,
    side: Number,
    id: Number
})

var players = [5, 5, 5, 5, 5, 5];

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages)
    })
})

app.get('/bids', (req, res) => {
    Bid.find({}, (err, bids) => {
        res.send(bids)
    })
})

var recentbid = 0;

// function bidding(bid) {
//     console.log(bid);
//     //io.emit('bidd', bid);
//     io.emit('bids', bid);
// }
var bod = new Bid();
app.post('/bids', async (req, res) => {
    bod = new Bid(req.body)

    recentbid = bod.id;

    var savedBid = await bod.save()

    console.log('saved')
    //console.log('bid', req.body)

    res.sendStatus(200)
})

app.post('/messages', async (req, res) => {
    var message = new Message(req.body)

    var savedMessage = await message.save()

    console.log('saved')

    var censored = await Message.findOne({ message: 'badword' })
    if (censored) 
        await Message.remove({ _id: censored.id })
    else
        io.emit('message', req.body)

    res.sendStatus(200)
})

// io.on("bid", bidding);
// io.on("call", playerCall);
// io.on("clickerid", clickerId);

var nums = [0, 0, 0, 0, 0, 0];
// ------------------------------ (11/14/22)
io.on("connection", (socket) => {
    var aKey = socket.id;
    clientId += 1;
    maxplayers++;
    clients.set(aKey, { id: clientId });
    console.log(`Player ${clientId} connected at socket: ${aKey}`);
    io.emit("players", { player: clientId });

    socket.on("bid", bidding);
    socket.on("caller", call);
    socket.on("spoton", spoton);

    socket.emit("welcome", { id: clientId, });
    // player 1 (boss)
    if (clientId == 1) {
        playerturn = 1;
        socket2 = socket;
        socket2.emit("boss",  {});
        socket2.emit("player", 1);
    }
    else if (clientId == 2) {
        socket3 = socket;
        socket3.emit("player",  2);
    }
    else if (clientId == 3) {
        socket4 = socket;
        socket4.emit("player",  3);
    }
    else if (clientId == 4) {
        socket5 = socket;
        socket5.emit("player",  4);
    }
    else if (clientId == 5) {
        socket6 = socket;
        socket6.emit("player",  5);
    }
    else if (clientId == 6) {
        socket7 = socket;
        socket7.emit("player",  6);
    }

    if (clientId == 6 && nums[0] == 0 && nums[1] == 0 && nums[2] == 0 && nums[3] == 0 && nums[4] == 0 && nums[5] == 0) {
        rolldice();
    }

        socket.on("disconnect", (reason) => {
            console.log("Disconnect from: " + socket.id + " ip: " + socket.handshake.address);
            var bye = clients.get(socket.id);
            
            maxplayers--;
            clientId -= 1;
            io.emit("player", { player: clientId });
            console.log(`See you next time ${bye.id}`);
        });
});

function spotoncorrect() {
    for (let i = 0; i < maxplayers; i++) {
        if (i != spotterid-1) {
            players[i] -= 1;
        }
        else
            players[i] += 1;
    }
    checkloss();
    var sen = "Spot on call was correct!"
    io.emit("sentence", sen);
}

function checkDiff() {
    var diff = 0;
    for (let i = 0; i < players.length; i++) {
        if (currentBid.side == 1) {
            diff = currentBid.number - nums[0];
            if (diff > 0)
                diff = diff * -1;
            nums[0] += diff;
        } else if (currentBid.side == 2) {
            diff = currentBid.number - nums[1];
            if (diff > 0)
                diff = diff * -1;
            nums[1] += diff;
        } else if (currentBid.side == 3) {
            diff = currentBid.number - nums[2];
            if (diff > 0)
                diff = diff * -1;
            nums[2] += diff;
        } else if (currentBid.side == 4) {
            diff = currentBid.number - nums[3];
            if (diff > 0)
                diff = diff * -1;
            nums[3] += diff;
        } else if (currentBid.side == 5) {
            diff = currentBid.number - nums[4];
            if (diff > 0)
                diff = diff * -1;
            nums[4] += diff;
        } else if (currentBid.side == 6) {
            diff = currentBid.number - nums[5];
            if (diff > 0)
                diff = diff * -1;
            nums[5] += diff;
        }
    }
}
function checkwin() {
    if (players[0] >= 0 && players[1] <= 0 && players[2] <= 0 && players[3] <= 0 && players[4] <= 0 && players[5] <= 0) {
        var sen = "Player one wins!"
        io.emit("sentence", sen);
    } else if (players[0] <= 0 && players[1] >= 0 && players[2] <= 0 && players[3] <= 0 && players[4] <= 0 && players[5] <= 0) {
        var sen = "Player two wins!"
        io.emit("sentence", sen);
    } else if (players[0] <= 0 && players[1] <= 0 && players[2] >= 0 && players[3] <= 0 && players[4] <= 0 && players[5] <= 0) {
        var sen = "Player three wins!"
        io.emit("sentence", sen);
    } else if (players[0] <= 0 && players[1] <= 0 && players[2] <= 0 && players[3] >= 0 && players[4] <= 0 && players[5] <= 0) {
        var sen = "Player four wins!"
        io.emit("sentence", sen);
    } else if (players[0] <= 0 && players[1] <= 0 && players[2] <= 0 && players[3] <= 0 && players[4] >= 0 && players[5] <= 0) {
        var sen = "Player five wins!"
        io.emit("sentence", sen);
    } else if (players[0] <= 0 && players[1] <= 0 && players[2] <= 0 && players[3] <= 0 && players[4] <= 0 && players[5] >= 0) {
        var sen = "Player six wins!"
        io.emit("sentence", sen);
    }
}

var loss = [0, 0, 0, 0, 0, 0];
function checkloss() {
    if (players[0] <= 0 && loss[0] == 0) {
        players[0] = 0;
        loss[0]++;
        var sen = "Player one is out!";
        io.emit("sentence", sen);
    } else if (players[1] <= 0 && loss[1] == 0) {
        players[1] = 0;
        loss[1]++;
        var sen = "Player two is out!";
        io.emit("sentence", sen);
    } else if (players[2] <= 0 && loss[2] == 0) {
        players[2] = 0;
        loss[2]++;
        var sen = "Player three is out!";
        io.emit("sentence", sen);
    } else if (players[3] <= 0 && loss[3] == 0) {
        players[3] = 0;
        loss[3]++;
        var sen = "Player four is out!";
        io.emit("sentence", sen);
    } else if (players[4] <= 0 && loss[4] == 0) {
        players[4] = 0;
        loss[4]++;
        var sen = "Player five is out!";
        io.emit("sentence", sen);
    } else if (players[5] <= 0 && loss[5] == 0) {
        players[5] = 0;
        loss[5]++;
        var sen = "Player six is out!";
        io.emit("sentence", sen);
    }
}

var spotterid = 0;
function spoton(value) {
    spotterid = value;
    if (currentBid.side == 1) {
        if (currentBid.number == nums[0]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else if (currentBid.side == 2) {
        if (currentBid.number == nums[1]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else if (currentBid.side == 3) {
        if (currentBid.number == nums[2]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else if (currentBid.side == 4) {
        if (currentBid.number == nums[3]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else if (currentBid.side == 5) {
        if (currentBid.number == nums[4]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else if (currentBid.side == 6) {
        if (currentBid.number == nums[5]) {
            spotoncorrect();
        } else {
            var sen = "Spot on call was incorrect!"
            io.emit("sentence", sen);
            checkDiff();
        }
    } else {
        var sen = "Spot on call was incorrect!"
        io.emit("sentence", sen);
        checkDiff();
    }
    checkloss();
    checkwin();
    rolldice();
    // io.emit("turn", playerturn2);
}

function rolldice() {
    nums = [0, 0, 0, 0, 0, 0];
    currentBid = { side: 0, number: 0 };
    for (let i = 0; i < maxplayers; i++) {
        if (i == 0) {
            if (players[0] > 0) {
                for (let j = 0; j < players[0]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket2.emit("num", num);
                    } else if (j == 1) {
                        socket2.emit("num2", num);
                    } else if (j == 2) {
                        socket2.emit("num3", num);
                    } else if (j == 3) {
                        socket2.emit("num4", num);
                    } else if (j == 4) {
                        socket2.emit("num5", num);
                    } else if (j == 5) {
                        socket2.emit("num6", num);
                    }
                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        } else if (i == 1) {
            if (players[1] > 0) {
                for (let j = 0; j < players[1]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket3.emit("num", num);
                    } else if (j == 1) {
                        socket3.emit("num2", num);
                    } else if (j == 2) {
                        socket3.emit("num3", num);
                    } else if (j == 3) {
                        socket3.emit("num4", num);
                    } else if (j == 4) {
                        socket3.emit("num5", num);
                    } else if (j == 5) {
                        socket3.emit("num6", num);
                    }
                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        } else if (i == 2) {
            if (players[2] > 0) {
                for (let j = 0; j < players[2]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket4.emit("num", num);
                    } else if (j == 1) {
                        socket4.emit("num2", num);
                    } else if (j == 2) {
                        socket4.emit("num3", num);
                    } else if (j == 3) {
                        socket4.emit("num4", num);
                    } else if (j == 4) {
                        socket4.emit("num5", num);
                    } else if (j == 6) {
                        socket4.emit("num6", num);
                    }
                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        } else if (i == 3) {
            if (players[3] > 0) {
                for (let j = 0; j < players[3]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket5.emit("num", num);
                    } else if (j == 1) {
                        socket5.emit("num2", num);
                    } else if (j == 2) {
                        socket5.emit("num3", num);
                    } else if (j == 3) {
                        socket5.emit("num4", num);
                    } else if (j == 4) {
                        socket5.emit("num5", num);
                    } else if (j == 5) {
                        socket5.emit("num6", num);
                    }
                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        } else if (i == 4) {
            if (players[4] > 0) {
                for (let j = 0; j < players[4]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket6.emit("num", num);
                    } else if (j == 1) {
                        socket6.emit("num2", num);
                    } else if (j == 2) {
                        socket6.emit("num3", num);
                    } else if (j == 3) {
                        socket6.emit("num4", num);
                    } else if (j == 4) {
                        socket6.emit("num5", num);
                    } else if (j == 5) {
                        socket6.emit("num6", num);
                    }
                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        } else if (i == 5) {
            if (players[5] > 0) {
                for (let j = 0; j < players[5]; j++) {
                    var num = Math.floor(Math.random() * (6 - 1 + 1)) + 1;
                    if (j == 0) {
                        socket7.emit("num", num);
                    } else if (j == 1) {
                        socket7.emit("num2", num);
                    } else if (j == 2) {
                        socket7.emit("num3", num);
                    } else if (j == 3) {
                        socket7.emit("num4", num);
                    } else if (j == 4) {
                        socket7.emit("num5", num);
                    } else if (j == 5) {
                        socket7.emit("num6", num);
                    }

                    if (num == 1) {
                        nums[0] += 1;
                    } else if (num == 2) {
                        nums[1] += 1;
                    } else if (num == 3) {
                        nums[2] += 1;
                    } else if (num == 4) {
                        nums[3] += 1;
                    } else if (num == 5) {
                        nums[4] += 1;
                    } else if (num == 6) {
                        for (let i = 0; i < nums.length; i++) 
                            nums[i] += 1;
                    }
                }
            }
        }
    }
    // var sentence = "Player " + playerturn-1 + " has " + players[playerturn-1] + " dice left.";
    // io.emit("sentence", sentence);
    console.log(nums);
}

function more(morenum) {
    players[callerid-1] -= morenum;
}

function less(id, lessnum) {
    players[lastbidderid-1] -= lessnum;
}

function equals() {
    for (let i = 0; i < players.length; i++) {
        if (i != lastbidderid-1) {
            players[i] -= 1;
        }
    }
    console.log(players);
}

var diff = 0;

//io.on("caller", call);
var callerid = 0;
function call(currentbid, callerid2) {
    if (players[callerid2] == 0 && players[callerid2] == playerturn) {
        playerturn++;
    } else if (players[playerid2] == 0) {
        return;
    }
    callerid = callerid2;
    var side = currentBid.side;
    var number = currentBid.number;
    if (lastbidderid == 0) {
        rolldice();
        return;
    }
    if (side == 1){
        if ((nums[0]) > number) {
            diff = (nums[0]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if ((nums[0]) == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else {
            diff = number - (nums[0]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    else if (side == 2){
        if ((nums[1]) > number) {
            diff = (nums[1]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if ((nums[1]) == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else {
            diff = number - (nums[1]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    else if (side == 3){
        if ((nums[2]) > number) {
            diff = (nums[2]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if ((nums[2]) == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else {
            diff = number - (nums[2]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    else if (side == 4){
        if ((nums[3]) > number) {
            diff = (nums[3]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if ((nums[3]) == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else {
            diff = number - (nums[3]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    else if (side == 5){
        if ((nums[4]) > number) {
            diff = (nums[4]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if ((nums[4]) == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else if ((nums[4]) < number) {
            diff = number - (nums[4]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    else if (side == 6){
        if (nums[5] > number) {
            diff = (nums[5]) - number;
            more(diff);
            var sen = "Bid was right!";
            io.emit("sentence", sen);
        } else if (nums[5] == number) {
            equals();
            var sen = "Exact!";
            io.emit("sentence", sen);
        } else {
            diff = number - (nums[5]);
            less(callerid, diff);
            var sen = "Call was right!";
            io.emit("sentence", sen);
        }
    }
    // for (let i = 0; i < players.length; i++) {
    //     if (players[i] <= 0) {
    //         players[i] == 0;
    //         var sen = "Player " + i + " has lost!";
    //         io.emit("sentence", sen);
    //     }
    // }
    checkloss();
    checkwin();
    nums = [0, 0, 0, 0, 0, 0];
    io.emit("resetroll", {});
    rolldice();
    // io.emit("turn", playerturn2);
}

function bidtrue(playerid, currentbid, bid) {
    lastbidderid = playerid2;
    currentBid.side = bid.side;
    currentBid.number = bid.number;
    playerturn++;
    currentBid = bid;
    //currentsocket.emit('clickerid', {id: playerid, ruling: diff});
    currentsocket.emit('postBids', bid);
    var sen = "Player bid: " + bid.number + " " + bid.side;
    io.emit("sentence", sen);
}

var lastbidderid = 0;
var playerid2 = 0;
var currentBid = new Bid();
currentBid = {side: 0, number: 0, id: 0};
function bidding(playerid, currentbid, bid) {
    playerid2 = playerid;
    if (players[playerid2] == 0 && players[playerid2] == playerturn) {
        playerturn++;
    }
    if (players[playerid2] == 0){
        var sen = "You have lost!";
        io.emit("sentence", sen);
        return;
    }
    if ( playerid2 == 1) {
        currentsocket = socket2;
    } else if (playerid2 == 2) {
        currentsocket = socket3;
    } else if (playerid2 == 3) {
        currentsocket = socket4;
    } else if (playerid2 == 4) {
        currentsocket = socket5;
    } else if (playerid2 == 5) {
        currentsocket = socket6;
    } else if (playerid2 == 6) {
        currentsocket = socket7;
    }

    if (playerturn > maxplayers){
        playerturn = 1;
    }

    if (playerid2 == playerturn) {
        // console.log(bid.number + " " + currentBid.number);
        // console.log(bid.side + " " + currentBid.side);
        //console.log(bid);
        if ((bid.number > currentBid.number && bid.side != 6) || (bid.number == currentBid.number && bid.side > currentBid.side) || (bid.side == 6)) {
            if ((bid.side == 6 || currentBid.side == 6)) {
                if (bid.side == 6 && bid.number == 10) {
                    if (bid.number < 20 && currentBid.side != 6){
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    } 
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 9) {
                    if (currentBid.number < 18 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 8) {
                    if (currentBid.number < 16 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 7) {
                    if (currentBid.number < 14 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 6) {
                    if (currentBid.number < 12 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 5) {
                    if (currentBid.number < 10 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 4) {
                    if (currentBid.number < 8 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 3) {
                    if (currentBid.number < 6 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 2) {
                    if (currentBid.number < 4 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } else if (bid.side == 6 && bid.number == 1) {
                    if (currentBid.number < 2 && currentBid.side != 6) {
                        bidtrue(playerid2, currentbid, bid);
                    } else if ( currentBid.side == 6 && bid.side == 6 && bid.number > currentBid.number) {
                        bidtrue(playerid2, currentbid, bid);
                    }
                    else {
                        console.log("Not allowed to bid that");
                    }
                } 
            } else {
                bidtrue(playerid2, currentbid, bid);
            }
        } else {
            console.log("Not allowed to bid that");
        }
    } else {
        // console.log(currentBid.side);
        currentsocket.emit('notbid', currentBid, bid);
        // console.log(bid.id);
        //console.log(playerturn);
        console.log("Not your turn");
    }
    // io.emit("turn", playerturn2);
}

mongoose.connect(dbUrl, { useNewUrlParser: true }, (err) => {
    console.log('mongo db connection', err)
})

var server = http.listen(3000, () => {
    console.log('server is listening on port', server.address().port)
})
const express = require ('express');
const app = express();
const cors = require('cors');
const http = require('http');
const {Server} = require('socket.io');
const PORT = 9999;

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: 'https://video-call-reactapp.vercel.app',
        methods: ['GET', 'POST']
    }
});

io.on('connection', (socket)=>{
    console.log(`socket connected to id : ${socket.id}`);

    // socket connection established
    socket.emit('me', socket.id);

    socket.on('disconnect', ()=>{
        socket.broadcast.emit("call_ended");
    })

    socket.on('call_user', (data)=>{
        console.log(`received data on call user: ${data}`);
        io.to(data.userToCall).emit("call_user", {signal: data.signalData, from: data.from, name: data.name});
    });

    socket.on('answer_call', (data)=>{
        io.to(data.to).emit("call_accepted", data.signal);
    });
});

server.listen(PORT, ()=>{
    console.log(`server connected to ${PORT}`);
});
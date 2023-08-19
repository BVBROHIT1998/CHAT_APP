const express = require('express')
const socketio = require('socket.io')
const http = require('http');


const { addUser, removeUser, getUser, getUsersInroom } = require('./users')
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000
const router = require('./router');

var io = require('socket.io')(server, {
    cors: {
        origin: true,
        credentials: true,
    }
});



io.on('connection', (socket) => {

    socket.on('join', ({ name, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, name, room });

        if (error) return callback(error);


        socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}` });
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined` })


        socket.join(user.room);

        io.to(user.room).emit('roomData', {room: user.name, users: getUsersInroom(user.room)})

        callback()

    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id);

        io.to(user.room).emit('message', { user: user.name, text: message });
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInroom(user.room)});
        callback()

    });

    socket.on('disconnect', () => {
        const user = removeUser(socket.id);

        if (user) {
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left` })
        }
    })
})

app.use(router)


server.listen(port, () => console.log(`server running on port ${port}`));
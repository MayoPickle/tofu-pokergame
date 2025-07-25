const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// 静态文件服务 - 优先提供构建后的文件
app.use('/dist', express.static(path.join(__dirname, 'public/dist')));
app.use(express.static('public'));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

app.get('/debug.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'debug.html'));
});

app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// 房间和用户管理
const rooms = new Map();
const users = new Map();

class Room {
    constructor(id, hostId) {
        this.id = id;
        this.hostId = hostId;
        this.users = new Map();
        this.game = null;
        this.gameState = 'waiting'; // waiting, playing, finished
        this.created = new Date();
    }

    addUser(user) {
        this.users.set(user.id, user);
        user.roomId = this.id;
    }

    removeUser(userId) {
        this.users.delete(userId);
        // 如果房主离开，转移权限
        if (this.hostId === userId && this.users.size > 0) {
            const nextHost = Array.from(this.users.values())[0];
            this.hostId = nextHost.id;
            return nextHost;
        }
        return null;
    }

    getUserList() {
        // 重新分配连续的号码牌
        const userList = Array.from(this.users.values());
        // 房主始终是1号
        const host = userList.find(user => user.id === this.hostId);
        const others = userList.filter(user => user.id !== this.hostId);
        
        const result = [];
        if (host) {
            result.push({
                id: host.id,
                nickname: host.nickname,
                number: 1,
                isHost: true
            });
        }
        
        others.forEach((user, index) => {
            result.push({
                id: user.id,
                nickname: user.nickname,
                number: index + 2, // 从2开始
                isHost: false
            });
        });
        
        return result;
    }
}

class User {
    constructor(id, nickname, socketId) {
        this.id = id;
        this.nickname = nickname;
        this.socketId = socketId;
        this.roomId = null;
        this.number = null;
        this.isOnline = true;
        this.disconnectedAt = null;
    }
}

// 数字炸弹游戏类
class NumberBombGame {
    constructor(room) {
        this.room = room;
        this.bombNumber = Math.floor(Math.random() * 100) + 1;
        this.currentRange = { min: 1, max: 100 };
        this.currentPlayer = null;
        this.isFinished = false;
        this.winner = null;
        this.loser = null;
    }

    start() {
        const users = Array.from(this.room.users.values());
        if (users.length < 2) {
            return { success: false, error: '至少需要2个玩家' };
        }
        this.currentPlayer = users[Math.floor(Math.random() * users.length)];
        return { success: true, currentPlayer: this.currentPlayer.id };
    }

    makeGuess(userId, guess) {
        if (this.isFinished) {
            return { success: false, error: '游戏已结束' };
        }

        if (this.currentPlayer.id !== userId) {
            return { success: false, error: '不是你的回合' };
        }

        const number = parseInt(guess);
        if (isNaN(number) || number < this.currentRange.min || number > this.currentRange.max) {
            return { success: false, error: `请输入${this.currentRange.min}-${this.currentRange.max}之间的数字` };
        }

        if (number === this.bombNumber) {
            // 猜中炸弹，游戏结束
            this.isFinished = true;
            this.loser = this.currentPlayer;
            const users = Array.from(this.room.users.values());
            this.winner = users.find(u => u.id !== userId);
            return {
                success: true,
                result: 'bomb',
                bombNumber: this.bombNumber,
                loser: this.loser.id,
                winner: this.winner?.id
            };
        } else {
            // 没猜中，缩小范围
            if (number < this.bombNumber) {
                this.currentRange.min = number + 1;
            } else {
                this.currentRange.max = number - 1;
            }

            // 切换到下一个玩家
            const users = Array.from(this.room.users.values());
            const currentIndex = users.findIndex(u => u.id === userId);
            const nextIndex = (currentIndex + 1) % users.length;
            this.currentPlayer = users[nextIndex];

            return {
                success: true,
                result: 'continue',
                newRange: this.currentRange,
                nextPlayer: this.currentPlayer.id,
                guess: number
            };
        }
    }
}

// Socket.io 连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 创建房间
    socket.on('createRoom', (data) => {
        const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const userId = uuidv4();
        const user = new User(userId, data.nickname, socket.id);
        const room = new Room(roomId, userId);
        
        user.number = 1;
        room.addUser(user);
        
        rooms.set(roomId, room);
        users.set(userId, user);
        
        console.log(`🏠 房间创建成功: ${roomId}, 用户: ${data.nickname} (${userId})`);
        console.log(`📊 当前房间数: ${rooms.size}, 用户数: ${users.size}`);
        
        socket.join(roomId);
        socket.emit('roomCreated', {
            roomId,
            userId,
            userNumber: user.number,
            isHost: true
        });
        
        socket.emit('userListUpdate', room.getUserList());
    });

    // 加入房间
    socket.on('joinRoom', (data) => {
        const room = rooms.get(data.roomId);
        if (!room) {
            socket.emit('error', '房间不存在');
            return;
        }

        const userId = uuidv4();
        const user = new User(userId, data.nickname, socket.id);
        user.number = room.users.size + 1;
        
        room.addUser(user);
        users.set(userId, user);
        
        socket.join(data.roomId);
        socket.emit('roomJoined', {
            roomId: data.roomId,
            userId,
            userNumber: user.number,
            isHost: user.id === room.hostId
        });
        
        // 通知房间内所有用户
        io.to(data.roomId).emit('userListUpdate', room.getUserList());
        io.to(data.roomId).emit('chatMessage', {
            type: 'system',
            message: `${user.nickname} 加入了房间`
        });
    });

    // 重连到房间（用于页面刷新后恢复状态）
    socket.on('reconnectToRoom', (data) => {
        console.log(`🔄 用户尝试重连: ${data.nickname} (${data.userId}) 到房间 ${data.roomId}`);
        console.log(`📊 当前存在的房间: [${Array.from(rooms.keys()).join(', ')}]`);
        
        const room = rooms.get(data.roomId);
        if (!room) {
            console.log(`❌ 房间 ${data.roomId} 不存在`);
            socket.emit('error', '房间不存在');
            return;
        }

        // 检查是否是已存在的用户重连
        const existingUser = users.get(data.userId);
        if (existingUser && existingUser.roomId === data.roomId) {
            // 重连成功，更新状态
            existingUser.socketId = socket.id;
            existingUser.isOnline = true;
            existingUser.disconnectedAt = null;
            
            socket.join(data.roomId);
            
            socket.emit('roomJoined', {
                roomId: data.roomId,
                userId: data.userId,
                userNumber: existingUser.number,
                isHost: existingUser.id === room.hostId
            });
            
            // 发送当前房间状态
            socket.emit('userListUpdate', room.getUserList());
            
            // 如果游戏进行中，发送游戏状态
            if (room.game && room.gameState === 'playing') {
                socket.emit('gameStarted', {
                    gameType: 'numberBomb',
                    currentPlayerId: room.game.currentPlayer.id,
                    rangeMin: room.game.currentRange.min,
                    rangeMax: room.game.currentRange.max,
                    bombNumber: room.game.bombNumber
                });
            }
            
            console.log(`✅ 用户重连成功: ${existingUser.nickname} (${data.userId})`);
        } else {
            // 用户不存在，按正常加入流程处理
            const userId = uuidv4();
            const user = new User(userId, data.nickname, socket.id);
            user.number = room.users.size + 1;
            
            room.addUser(user);
            users.set(userId, user);
            
            socket.join(data.roomId);
            socket.emit('roomJoined', {
                roomId: data.roomId,
                userId,
                userNumber: user.number,
                isHost: user.id === room.hostId
            });
            
            // 通知房间内所有用户
            io.to(data.roomId).emit('userListUpdate', room.getUserList());
            io.to(data.roomId).emit('chatMessage', {
                type: 'system',
                message: `${user.nickname} 加入了房间`
            });
        }
    });

    // 发送聊天消息
    socket.on('chatMessage', (data) => {
        console.log('💬 收到聊天消息:', data);
        
        // 通过 socket.id 查找当前用户
        let currentUser = null;
        let currentUserId = null;
        for (const [userId, user] of users.entries()) {
            if (user.socketId === socket.id) {
                currentUser = user;
                currentUserId = userId;
                break;
            }
        }
        
        if (currentUser && currentUser.roomId) {
            const room = rooms.get(currentUser.roomId);
            const userList = room ? room.getUserList() : [];
            const userInList = userList.find(u => u.id === currentUserId);
            const userNumber = userInList ? userInList.number : 1;
            
            console.log(`💬 ${currentUser.nickname} 在房间 ${currentUser.roomId} 发送消息: ${data.message}`);
            io.to(currentUser.roomId).emit('chatMessage', {
                type: 'user',
                userId: currentUserId,
                nickname: currentUser.nickname,
                userNumber: userNumber,
                message: data.message,
                timestamp: new Date()
            });
        } else {
            console.log('❌ 聊天消息发送失败: 用户未找到或不在房间中');
        }
    });

    // 开始数字炸弹游戏
    socket.on('startNumberBomb', (data) => {
        // 通过 socket.id 查找当前用户
        let currentUser = null;
        for (const [userId, user] of users.entries()) {
            if (user.socketId === socket.id) {
                currentUser = user;
                break;
            }
        }
        
        if (!currentUser || !currentUser.roomId) {
            socket.emit('error', '用户状态无效');
            return;
        }
        
        const room = rooms.get(currentUser.roomId);
        if (!room || room.hostId !== currentUser.id) {
            socket.emit('error', '只有房主可以开始游戏');
            return;
        }

        const game = new NumberBombGame(room);
        const result = game.start();
        
        if (result.success) {
            room.game = game;
            room.gameState = 'playing';
            
            io.to(currentUser.roomId).emit('gameStarted', {
                gameType: 'numberBomb',
                currentPlayerId: result.currentPlayer,
                rangeMin: game.currentRange.min,
                rangeMax: game.currentRange.max,
                bombNumber: game.bombNumber
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    // 数字炸弹猜数字
    socket.on('numberBombGuess', (data) => {
        // 通过 socket.id 查找当前用户
        let currentUser = null;
        let currentUserId = null;
        for (const [userId, user] of users.entries()) {
            if (user.socketId === socket.id) {
                currentUser = user;
                currentUserId = userId;
                break;
            }
        }
        
        if (!currentUser || !currentUser.roomId) {
            socket.emit('error', '用户状态无效');
            return;
        }
        
        const room = rooms.get(currentUser.roomId);
        if (!room || !room.game || room.gameState !== 'playing') {
            socket.emit('error', '游戏状态无效');
            return;
        }
        
        const result = room.game.makeGuess(currentUserId, data.number);
        
        if (result.success) {
            if (result.result === 'bomb') {
                room.gameState = 'finished';
                io.to(currentUser.roomId).emit('gameFinished', {
                    gameType: 'numberBomb',
                    result: 'bomb',
                    bombNumber: result.bombNumber,
                    loser: result.loser,
                    winner: result.winner
                });
            } else {
                const room = rooms.get(currentUser.roomId);
                const userList = room ? room.getUserList() : [];
                const userInList = userList.find(u => u.id === currentUserId);
                const userNumber = userInList ? userInList.number : 1;
                
                io.to(currentUser.roomId).emit('gameUpdate', {
                    gameType: 'numberBomb',
                    rangeMin: result.newRange.min,
                    rangeMax: result.newRange.max,
                    currentPlayerId: result.nextPlayer,
                    guess: {
                        number: result.guess,
                        playerNickname: currentUser.nickname,
                        playerNumber: userNumber
                    }
                });
            }
        } else {
            socket.emit('error', result.error);
        }
    });

    // 断开连接
    socket.on('disconnect', () => {
        console.log('⚡ 用户断开连接:', socket.id);
        
        // 查找用户但不立即删除，给重连机会
        for (const [userId, user] of users.entries()) {
            if (user.socketId === socket.id) {
                console.log(`📱 用户 ${user.nickname} (${userId}) 断开连接，等待重连...`);
                
                // 标记为离线但不删除用户
                user.isOnline = false;
                user.disconnectedAt = new Date();
                
                // 30秒后如果没有重连，才真正删除
                setTimeout(() => {
                    const currentUser = users.get(userId);
                    if (currentUser && !currentUser.isOnline) {
                        console.log(`⏰ 用户 ${currentUser.nickname} 超时未重连，删除用户`);
                        
                        if (currentUser.roomId) {
                            const room = rooms.get(currentUser.roomId);
                            if (room) {
                                const newHost = room.removeUser(userId);
                                
                                // 通知房间内其他用户
                                io.to(currentUser.roomId).emit('userListUpdate', room.getUserList());
                                io.to(currentUser.roomId).emit('chatMessage', {
                                    type: 'system',
                                    message: `${currentUser.nickname} 离开了房间`
                                });
                                
                                if (newHost) {
                                    io.to(currentUser.roomId).emit('hostChanged', {
                                        newHostId: newHost.id,
                                        newHostNickname: newHost.nickname
                                    });
                                }
                                
                                // 如果房间为空，删除房间
                                if (room.users.size === 0) {
                                    console.log(`🗑️ 删除空房间: ${currentUser.roomId}`);
                                    rooms.delete(currentUser.roomId);
                                }
                            }
                        }
                        users.delete(userId);
                    }
                }, 30000); // 30秒宽限期
                break;
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`甜梦小酒馆服务器运行在端口 ${PORT}`);
}); 
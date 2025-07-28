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
    constructor(id, hostId, hostMode = false) {
        this.id = id;
        this.hostId = hostId;
        this.users = new Map();
        this.game = null;
        this.gameState = 'waiting'; // waiting, playing, finished
        this.created = new Date();
        this.hostMode = hostMode; // 主持人模式
        this.virtualPlayers = new Map(); // 主持人模式下的虚拟参与者
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

    addVirtualPlayer(nickname) {
        if (!this.hostMode) {
            return { success: false, error: '只有主持人模式才能添加虚拟参与者' };
        }
        
        const playerId = `virtual_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const existingNumbers = new Set([
            ...Array.from(this.users.values()).map(u => u.number || 0),
            ...Array.from(this.virtualPlayers.values()).map(vp => vp.number)
        ]);
        
        // 找到下一个可用的号码
        let nextNumber = 2; // 房主是1号
        while (existingNumbers.has(nextNumber)) {
            nextNumber++;
        }
        
        this.virtualPlayers.set(playerId, {
            id: playerId,
            nickname: nickname.trim(),
            number: nextNumber,
            isVirtual: true
        });
        
        return { success: true, playerId };
    }
    
    removeVirtualPlayer(playerId) {
        if (!this.hostMode) {
            return { success: false, error: '只有主持人模式才能移除虚拟参与者' };
        }
        
        const removed = this.virtualPlayers.delete(playerId);
        return { success: removed };
    }

    getUserList() {
        // 重新分配连续的号码牌
        const userList = Array.from(this.users.values());
        const virtualList = Array.from(this.virtualPlayers.values());
        
        // 房主始终是1号
        const host = userList.find(user => user.id === this.hostId);
        const others = userList.filter(user => user.id !== this.hostId);
        
        const result = [];
        if (host) {
            result.push({
                id: host.id,
                nickname: host.nickname,
                number: 1,
                isHost: true,
                isVirtual: false
            });
        }
        
        // 添加真实用户（除房主外）
        others.forEach((user, index) => {
            result.push({
                id: user.id,
                nickname: user.nickname,
                number: index + 2, // 从2开始
                isHost: false,
                isVirtual: false
            });
        });
        
        // 如果是主持人模式，添加虚拟参与者
        if (this.hostMode) {
            // 重新分配虚拟参与者的号码，确保连续
            let nextNumber = result.length + 1;
            virtualList.forEach((virtualPlayer) => {
                result.push({
                    id: virtualPlayer.id,
                    nickname: virtualPlayer.nickname,
                    number: nextNumber++,
                    isHost: false,
                    isVirtual: true
                });
            });
        }
        
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
        const users = this.room.getUserList();
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
            const users = this.room.getUserList();
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

            // 切换到下一个玩家（包括虚拟玩家）
            const users = this.room.getUserList();
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

// 甜酒牌游戏类
class TianjiuPokerGame {
    constructor(room) {
        this.room = room;
        this.cards = ['A', 'K', 'Q', 'J', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'big_joker', 'small_jocker'];
        this.currentCard = null;
        this.currentPlayer = null;
        this.isFinished = false;
        this.reservedCards = new Map(); // 用户保留的8号牌
        this.gamePhase = 'waiting'; // waiting, card_drawn, effect_active
        this.cardEffects = {
            'A': '指定牌：拿到这张牌，可以指定任意玩家喝一杯',
            'K': '小姐牌：任何人喝酒，小姐都需要陪喝一杯。喝酒的说："小姐在哪呢"即可召唤，拿到此牌的说:"来啦来啦大爷我在这呢"',
            'Q': '打一样的字：拿到这张牌的玩家在群里扣字，全场要跟着打一样的字，慢的或者没打的喝',
            'J': '逛三园：拿到此牌的人需要喊:" 星期天逛公园"下个人喊" 什么园"接着下个人喊" xx园"可以是蔬菜园、花园、动物园',
            '1': '喝一杯：自己喝一杯',
            '2': '成语接龙：成语接龙，接不到词的喝',
            '3': '数字炸弹：1-100，选中数字，炸的喝',
            '4': '几棵柳树扭几扭：拿到此牌的人需要说几棵柳树扭几扭如:"6颗柳树扭6扭"，那下一个人就要说"7颗柳树扭7扭"',
            '5': '奥特曼语录：啊啊啊啊啊啊啊！燃烧吧！小宇宙!看我究极无敌天马流星拳！',
            '6': '表情包：拿到此牌的人快速在群里打出一个表情包，其他人要跟着打，打慢的喝',
            '7': '真心话：拿到此牌的人指定一个人问真心话，不回答就喝酒',
            '8': '趣味生煎：拿到这张牌的玩家可以趣味生煎，如果没有要喝三杯才能去（可保留）',
            '9': '唱歌：拿到此牌的人找一首歌有感情的读出来',
            '10': '撒娇卖萌八连：好不好嘛 求求你了 拜托拜托 行不行吖 我不管嘛 你最好了 我爱你呀 宝贝亲亲',
            'big_joker': '甜酒大王：红包牌，拿到此牌的玩家发红包一个，随意',
            'small_jocker': '甜酒小王：电话牌，给异性打电话，说我好想你啊'
        };
    }

    start() {
        const users = this.room.getUserList();
        if (users.length < 2) {
            return { success: false, error: '至少需要2个玩家' };
        }
        this.gamePhase = 'waiting';
        return { success: true };
    }

    drawCard(hostId) {
        const users = this.room.getUserList();
        if (users.length < 2) {
            return { success: false, error: '至少需要2个玩家' };
        }

        // 随机选择一张牌
        const randomCardIndex = Math.floor(Math.random() * this.cards.length);
        this.currentCard = this.cards[randomCardIndex];
        
        // 随机选择一个玩家（包括房主和虚拟玩家在内的所有玩家）
        const randomPlayerIndex = Math.floor(Math.random() * users.length);
        this.currentPlayer = users[randomPlayerIndex];
        
        this.gamePhase = 'card_drawn';

        // 记录抽牌日志
        console.log(`🎰 甜酒牌抽牌: 牌=${this.currentCard}, 获得者=${this.currentPlayer.nickname} (${this.currentPlayer.id}), 总人数=${users.length}`);
        console.log(`📋 参与玩家: ${users.map(u => u.nickname).join('、')}`);

        return {
            success: true,
            card: this.currentCard,
            player: {
                id: this.currentPlayer.id,
                nickname: this.currentPlayer.nickname,
                isVirtual: this.currentPlayer.isVirtual || false
            },
            effect: this.cardEffects[this.currentCard]
        };
    }

    useReservedCard(userId, targetUserId = null) {
        if (!this.reservedCards.has(userId)) {
            return { success: false, error: '你没有保留的8号牌' };
        }

        // 使用保留的8号牌
        this.reservedCards.delete(userId);
        const user = this.room.users.get(userId);
        const targetUser = targetUserId ? this.room.users.get(targetUserId) : null;

        return {
            success: true,
            action: 'use_reserved_8',
            user: { id: user.id, nickname: user.nickname },
            target: targetUser ? { id: targetUser.id, nickname: targetUser.nickname } : null,
            effect: '趣味生煎：使用保留的8号牌'
        };
    }

    handleCardEffect(action, data = {}) {
        if (this.currentCard === '8' && data.reserve) {
            // 保留8号牌
            this.reservedCards.set(this.currentPlayer.id, this.currentCard);
            return {
                success: true,
                action: 'card_reserved',
                card: this.currentCard,
                player: { id: this.currentPlayer.id, nickname: this.currentPlayer.nickname }
            };
        }

        // 根据不同的牌执行不同的效果
        switch (this.currentCard) {
            case 'A':
                if (!data.targetUserId) {
                    return { success: false, error: '请选择要指定的玩家' };
                }
                const targetUser = this.room.users.get(data.targetUserId);
                return {
                    success: true,
                    action: 'designate_drink',
                    target: { id: targetUser.id, nickname: targetUser.nickname },
                    message: `${this.currentPlayer.nickname} 指定 ${targetUser.nickname} 喝一杯！`
                };
            
            case '1':
                return {
                    success: true,
                    action: 'self_drink',
                    message: `${this.currentPlayer.nickname} 自己喝一杯！`
                };
            
            case '3':
                // 启动数字炸弹小游戏
                return {
                    success: true,
                    action: 'start_number_bomb',
                    message: `${this.currentPlayer.nickname} 触发数字炸弹！`
                };
            
            default:
                return {
                    success: true,
                    action: 'show_effect',
                    message: `${this.currentPlayer.nickname} 抽到了 ${this.currentCard}：${this.cardEffects[this.currentCard]}`
                };
        }
    }

    finishRound() {
        this.currentCard = null;
        this.currentPlayer = null;
        this.gamePhase = 'waiting';
        return { success: true };
    }

    getGameState() {
        return {
            currentCard: this.currentCard,
            currentPlayer: this.currentPlayer ? {
                id: this.currentPlayer.id,
                nickname: this.currentPlayer.nickname
            } : null,
            gamePhase: this.gamePhase,
            reservedCards: Array.from(this.reservedCards.keys())
        };
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
        const room = new Room(roomId, userId, data.hostMode || false);
        
        user.number = 1;
        room.addUser(user);
        
        rooms.set(roomId, room);
        users.set(userId, user);
        
        console.log(`🏠 房间创建成功: ${roomId}, 用户: ${data.nickname} (${userId}), 主持人模式: ${room.hostMode}`);
        console.log(`📊 当前房间数: ${rooms.size}, 用户数: ${users.size}`);
        
        socket.join(roomId);
        socket.emit('roomCreated', {
            roomId,
            userId,
            userNumber: user.number,
            isHost: true,
            hostMode: room.hostMode
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
                isHost: existingUser.id === room.hostId,
                hostMode: room.hostMode
            });
            
            // 发送当前房间状态
            socket.emit('userListUpdate', room.getUserList());
            
            // 如果游戏进行中，发送游戏状态
            if (room.game && room.gameState === 'playing') {
                if (room.gameType === 'numberBomb') {
                    socket.emit('gameStarted', {
                        gameType: 'numberBomb',
                        currentPlayerId: room.game.currentPlayer ? room.game.currentPlayer.id : null,
                        rangeMin: room.game.currentRange.min,
                        rangeMax: room.game.currentRange.max,
                        bombNumber: room.game.bombNumber
                    });
                } else if (room.gameType === 'tianjiuPoker') {
                    socket.emit('gameStarted', {
                        gameType: 'tianjiuPoker',
                        gameState: room.game.getGameState()
                    });
                }
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

    // 甜酒牌游戏事件处理
    socket.on('startTianjiuPoker', (data) => {
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

        // 创建甜酒牌游戏实例
        room.game = new TianjiuPokerGame(room);
        room.gameType = 'tianjiuPoker';
        room.gameState = 'playing';

        const result = room.game.start();
        if (result.success) {
            io.to(currentUser.roomId).emit('gameStarted', {
                gameType: 'tianjiuPoker',
                gameState: room.game.getGameState()
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('drawTianjiuCard', (data) => {
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
        if (!room || !room.game || room.gameType !== 'tianjiuPoker') {
            socket.emit('error', '游戏状态无效');
            return;
        }

        if (room.hostId !== currentUser.id) {
            socket.emit('error', '只有房主可以抽牌');
            return;
        }

        const result = room.game.drawCard(currentUser.id);
        if (result.success) {
            io.to(currentUser.roomId).emit('tianjiuCardDrawn', {
                card: result.card,
                player: result.player,
                effect: result.effect,
                gameState: room.game.getGameState()
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('handleTianjiuCardEffect', (data) => {
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
        if (!room || !room.game || room.gameType !== 'tianjiuPoker') {
            socket.emit('error', '游戏状态无效');
            return;
        }

        const result = room.game.handleCardEffect(data.action, data);
        if (result.success) {
            io.to(currentUser.roomId).emit('tianjiuCardEffect', {
                ...result,
                gameState: room.game.getGameState()
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('useReservedCard', (data) => {
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
        if (!room || !room.game || room.gameType !== 'tianjiuPoker') {
            socket.emit('error', '游戏状态无效');
            return;
        }

        const result = room.game.useReservedCard(currentUserId, data.targetUserId);
        if (result.success) {
            io.to(currentUser.roomId).emit('tianjiuReservedCardUsed', {
                ...result,
                gameState: room.game.getGameState()
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    socket.on('finishTianjiuRound', (data) => {
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
        if (!room || !room.game || room.gameType !== 'tianjiuPoker') {
            socket.emit('error', '游戏状态无效');
            return;
        }

        if (room.hostId !== currentUser.id) {
            socket.emit('error', '只有房主可以结束回合');
            return;
        }

        const result = room.game.finishRound();
        if (result.success) {
            io.to(currentUser.roomId).emit('tianjiuRoundFinished', {
                gameState: room.game.getGameState()
            });
        } else {
            socket.emit('error', result.error);
        }
    });

    // 添加虚拟参与者（仅主持人模式）
    socket.on('addVirtualPlayer', (data) => {
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
            socket.emit('error', '只有房主可以添加虚拟参与者');
            return;
        }

        if (!room.hostMode) {
            socket.emit('error', '只有主持人模式才能添加虚拟参与者');
            return;
        }

        const result = room.addVirtualPlayer(data.nickname);
        if (result.success) {
            io.to(currentUser.roomId).emit('userListUpdate', room.getUserList());
            socket.emit('virtualPlayerAdded', { playerId: result.playerId });
        } else {
            socket.emit('error', result.error);
        }
    });

    // 移除虚拟参与者（仅主持人模式）
    socket.on('removeVirtualPlayer', (data) => {
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
            socket.emit('error', '只有房主可以移除虚拟参与者');
            return;
        }

        if (!room.hostMode) {
            socket.emit('error', '只有主持人模式才能移除虚拟参与者');
            return;
        }

        const result = room.removeVirtualPlayer(data.playerId);
        if (result.success) {
            io.to(currentUser.roomId).emit('userListUpdate', room.getUserList());
            socket.emit('virtualPlayerRemoved', { playerId: data.playerId });
        } else {
            socket.emit('error', '移除虚拟参与者失败');
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
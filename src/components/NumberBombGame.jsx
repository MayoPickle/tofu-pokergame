import React, { useState, useEffect } from 'react';
import { Button, Tag, Row, Col, Typography } from 'antd';
import { PlayCircleOutlined, CoffeeOutlined, FireOutlined } from '@ant-design/icons';
import socketManager from '../utils/socket';

const { Title, Text } = Typography;

const NumberBombGame = ({ userInfo, isHost, isHostMode = false, userList = [] }) => {
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, playing, finished
    rangeMin: 1,
    rangeMax: 100,
    currentPlayerId: null,
    bombNumber: null,
    gameHistory: [],
    winner: null,
    loser: null
  });

  useEffect(() => {
    // 监听游戏开始
    socketManager.on('gameStarted', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'playing',
        rangeMin: data.rangeMin || 1,
        rangeMax: data.rangeMax || 100,
        currentPlayerId: data.currentPlayerId,
        bombNumber: data.bombNumber,
        gameHistory: []
      }));
    });

    // 监听游戏更新
    socketManager.on('gameUpdate', (data) => {
      setGameState(prev => ({
        ...prev,
        rangeMin: data.rangeMin,
        rangeMax: data.rangeMax,
        currentPlayerId: data.currentPlayerId,
        gameHistory: [...prev.gameHistory, data.guess]
      }));
    });

    // 监听游戏结束
    socketManager.on('gameFinished', (data) => {
      setGameState(prev => ({
        ...prev,
        status: 'finished',
        winner: data.winner,
        loser: data.loser,
        bombNumber: data.bombNumber
      }));
    });

    return () => {
      socketManager.off('gameStarted');
      socketManager.off('gameUpdate');
      socketManager.off('gameFinished');
    };
  }, []);

  const startGame = () => {
    socketManager.emit('startNumberBomb');
  };

  const makeGuess = (number) => {
    const currentPlayer = userList.find(u => u.id === gameState.currentPlayerId);
    const canGuess = gameState.status === 'playing' && (
      gameState.currentPlayerId === userInfo.userId || 
      (isHostMode && isHost && currentPlayer?.isVirtual)
    );
    
    if (canGuess) {
      socketManager.emit('numberBombGuess', { number });
    }
  };

  const renderWaitingArea = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <CoffeeOutlined style={{ 
        fontSize: '64px', 
        color: '#ff6b6b', 
        marginBottom: '24px',
        filter: 'drop-shadow(0 0 20px rgba(255, 107, 107, 0.5))'
      }} />
      <Title level={2} style={{ 
        color: 'white', 
        marginBottom: '16px',
        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        准备开始游戏
      </Title>
      <Text style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        fontSize: '16px',
        display: 'block',
        marginBottom: '32px'
      }}>
        {isHost ? '点击下方按钮开始游戏' : '等待房主选择游戏并开始...'}
      </Text>
      {isHost && (
        <Button 
          size="large" 
          icon={<PlayCircleOutlined />}
          onClick={startGame}
          style={{
            height: '48px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
            border: 'none',
            color: 'white',
            boxShadow: '0 4px 16px rgba(255, 107, 107, 0.4)',
            transition: 'all 0.3s ease',
            padding: '0 32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.4)';
          }}
        >
          开始数字炸弹
        </Button>
      )}
    </div>
  );

  const renderGameArea = () => (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        marginBottom: '24px',
        color: 'white'
      }}>
        <FireOutlined style={{ 
          marginRight: '12px', 
          fontSize: '24px',
          color: '#ff6b6b',
          filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.5))'
        }} />
        <Title level={3} style={{ 
          margin: 0,
          fontSize: '24px', 
          fontWeight: '600',
          background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          数字炸弹
        </Title>
      </div>

      <div style={{ 
        textAlign: 'center',
        marginBottom: '24px',
        padding: '16px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <Text style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px', marginRight: '12px' }}>
          当前范围: 
        </Text>
        <Tag style={{ 
          fontSize: '16px',
          padding: '6px 16px',
          background: 'linear-gradient(135deg, #48dbfb, #6bb6ff)',
          border: 'none',
          color: 'white',
          borderRadius: '12px',
          fontWeight: '600',
          boxShadow: '0 4px 12px rgba(72, 219, 251, 0.3)'
        }}>
          {gameState.rangeMin} - {gameState.rangeMax}
        </Tag>
      </div>

      <div style={{
        textAlign: 'center',
        marginBottom: '24px',
        padding: '16px',
        background: gameState.currentPlayerId === userInfo.userId 
          ? 'rgba(255, 107, 107, 0.15)' 
          : 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        border: `1px solid ${gameState.currentPlayerId === userInfo.userId 
          ? 'rgba(255, 107, 107, 0.3)' 
          : 'rgba(255, 255, 255, 0.1)'}`,
        boxShadow: gameState.currentPlayerId === userInfo.userId 
          ? '0 0 20px rgba(255, 107, 107, 0.2)' 
          : 'none'
      }}>
        {(() => {
          const currentPlayer = userList.find(u => u.id === gameState.currentPlayerId);
          const isMyTurn = gameState.currentPlayerId === userInfo.userId;
          const canPlayForVirtual = isHostMode && isHost && currentPlayer?.isVirtual;
          
          return (
            <div>
              <Text style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600',
                display: 'block',
                marginBottom: '8px'
              }}>
                {isMyTurn
                  ? "🎯 轮到你了！请选择数字"
                  : canPlayForVirtual
                    ? `🤖 轮到虚拟玩家 ${currentPlayer.nickname}，请代为选择数字`
                    : `⏳ 等待 ${currentPlayer?.nickname || '其他玩家'} 操作...`
                }
              </Text>
              {currentPlayer && currentPlayer.isVirtual && (
                <Tag color="blue" style={{ fontSize: '12px' }}>
                  虚拟玩家
                </Tag>
              )}
            </div>
          );
        })()}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <Row gutter={[8, 8]}>
          {Array.from({ length: gameState.rangeMax - gameState.rangeMin + 1 }, (_, i) => {
            const number = gameState.rangeMin + i;
            const currentPlayer = userList.find(u => u.id === gameState.currentPlayerId);
            const canGuess = gameState.currentPlayerId === userInfo.userId || 
                           (isHostMode && isHost && currentPlayer?.isVirtual);
            const isDisabled = !canGuess;
            const isInHistory = gameState.gameHistory.some(h => h.number === number);
            
            return (
              <Col key={number} span={3}>
                <Button
                  disabled={isDisabled || isInHistory}
                  onClick={() => makeGuess(number)}
                  style={{ 
                    width: '100%',
                    height: '40px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: isInHistory 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : isDisabled 
                        ? 'rgba(255, 255, 255, 0.05)'
                        : 'linear-gradient(135deg, #feca57, #ff9ff3)',
                    border: 'none',
                    color: isInHistory ? 'rgba(255, 255, 255, 0.3)' : 'white',
                    cursor: isDisabled || isInHistory ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    opacity: isInHistory ? 0.3 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled && !isInHistory) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(254, 202, 87, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isDisabled && !isInHistory) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  {number}
                </Button>
              </Col>
            );
          })}
        </Row>
      </div>

      {gameState.gameHistory.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <Text style={{ 
            color: 'white', 
            fontSize: '16px', 
            fontWeight: '600',
            marginBottom: '12px',
            display: 'block'
          }}>
            🎮 游戏历史:
          </Text>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {gameState.gameHistory.map((history, index) => (
              <Tag key={index} style={{ 
                background: 'rgba(72, 219, 251, 0.2)',
                border: '1px solid rgba(72, 219, 251, 0.4)',
                color: '#48dbfb',
                borderRadius: '8px',
                padding: '4px 8px',
                fontSize: '13px'
              }}>
                <span style={{ 
                  background: '#48dbfb',
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  marginRight: '6px',
                  fontWeight: '600'
                }}>
                  {history.playerNumber || '?'}
                </span>
                {history.playerNickname}: {history.number}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderFinishedArea = () => (
    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
      <FireOutlined style={{ 
        fontSize: '64px', 
        color: '#ff6b6b', 
        marginBottom: '24px',
        filter: 'drop-shadow(0 0 20px rgba(255, 107, 107, 0.6))',
        animation: 'pulse 2s infinite'
      }} />
      <Title level={2} style={{ 
        color: 'white', 
        marginBottom: '20px',
        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        🎉 游戏结束
      </Title>
      {gameState.loser && (
        <div style={{
          background: 'rgba(139, 69, 19, 0.15)',
          border: '1px solid rgba(139, 69, 19, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '32px',
          boxShadow: '0 0 20px rgba(139, 69, 19, 0.2)'
        }}>
          <Text style={{ 
            color: 'white', 
            fontSize: '18px',
            display: 'block',
            marginBottom: '8px'
          }}>
            💥 炸弹数字是 
            <Tag style={{ 
              background: 'linear-gradient(135deg, #8B4513, #A0522D)',
              border: 'none',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              padding: '4px 12px',
              borderRadius: '8px',
              margin: '0 8px',
              boxShadow: '0 4px 12px rgba(139, 69, 19, 0.4)'
            }}>
              {gameState.bombNumber}
            </Tag>
          </Text>
          <Text style={{ 
            color: '#feca57', 
            fontSize: '16px',
            fontWeight: '600'
          }}>
            {gameState.loser.nickname} 踩中了炸弹！
          </Text>
        </div>
      )}
      {isHost && (
        <Button 
          size="large" 
          icon={<PlayCircleOutlined />}
          onClick={startGame}
          style={{
            height: '48px',
            borderRadius: '16px',
            fontSize: '16px',
            fontWeight: '600',
            background: 'linear-gradient(135deg, #48dbfb, #6bb6ff)',
            border: 'none',
            color: 'white',
            boxShadow: '0 4px 16px rgba(72, 219, 251, 0.4)',
            transition: 'all 0.3s ease',
            padding: '0 32px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(72, 219, 251, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(72, 219, 251, 0.4)';
          }}
        >
          再来一局
        </Button>
      )}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `
      }} />
    </div>
  );

  if (gameState.status === 'waiting') {
    return renderWaitingArea();
  } else if (gameState.status === 'playing') {
    return renderGameArea();
  } else {
    return renderFinishedArea();
  }
};

export default NumberBombGame; 
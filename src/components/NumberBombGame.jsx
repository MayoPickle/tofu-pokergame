import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Alert, Row, Col, Typography, Space } from 'antd';
import { FireOutlined, PlayCircleOutlined } from '@ant-design/icons';
import socketManager from '../utils/socket';

const { Title, Text } = Typography;

const NumberBombGame = ({ userInfo, isHost }) => {
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
    if (gameState.currentPlayerId === userInfo.userId && gameState.status === 'playing') {
      socketManager.emit('numberBombGuess', { number });
    }
  };

  const renderWaitingArea = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <FireOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
        <Title level={3}>准备开始游戏</Title>
        <Text type="secondary">等待房主选择游戏并开始...</Text>
        {isHost && (
          <div style={{ marginTop: '24px' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlayCircleOutlined />}
              onClick={startGame}
            >
              开始数字炸弹
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  const renderGameArea = () => (
    <Card 
      title={
        <Space>
          <FireOutlined style={{ color: '#ff4d4f' }} />
          <span>数字炸弹</span>
        </Space>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text strong>当前范围: </Text>
        <Tag color="processing" style={{ fontSize: '14px' }}>
          {gameState.rangeMin} - {gameState.rangeMax}
        </Tag>
      </div>

      <Alert
        message={
          gameState.currentPlayerId === userInfo.userId
            ? "轮到你了！请选择数字"
            : "等待其他玩家操作..."
        }
        type={gameState.currentPlayerId === userInfo.userId ? "success" : "info"}
        style={{ marginBottom: '16px' }}
      />

      <div style={{ marginBottom: '16px' }}>
        <Row gutter={[8, 8]}>
          {Array.from({ length: gameState.rangeMax - gameState.rangeMin + 1 }, (_, i) => {
            const number = gameState.rangeMin + i;
            const isDisabled = gameState.currentPlayerId !== userInfo.userId;
            const isInHistory = gameState.gameHistory.some(h => h.number === number);
            
            return (
              <Col key={number} span={3}>
                <Button
                  size="small"
                  disabled={isDisabled || isInHistory}
                  onClick={() => makeGuess(number)}
                  style={{ 
                    width: '100%',
                    opacity: isInHistory ? 0.3 : 1
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
        <div>
          <Text strong>游戏历史:</Text>
          <div style={{ marginTop: '8px' }}>
            {gameState.gameHistory.map((history, index) => (
              <Tag key={index} style={{ margin: '2px' }}>
                <span style={{ 
                  backgroundColor: '#1890ff',
                  color: 'white',
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  marginRight: '4px'
                }}>
                  {history.playerNumber || '?'}
                </span>
                {history.playerNickname}: {history.number}
              </Tag>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  const renderFinishedArea = () => (
    <Card>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <FireOutlined style={{ fontSize: '48px', color: '#ff4d4f', marginBottom: '16px' }} />
        <Title level={3}>游戏结束</Title>
        {gameState.loser && (
          <Text>
            炸弹数字是 <Tag color="red">{gameState.bombNumber}</Tag>，
            <Text strong> {gameState.loser.nickname} </Text>踩中了炸弹！
          </Text>
        )}
        {isHost && (
          <div style={{ marginTop: '24px' }}>
            <Button 
              type="primary" 
              size="large" 
              icon={<PlayCircleOutlined />}
              onClick={startGame}
            >
              再来一局
            </Button>
          </div>
        )}
      </div>
    </Card>
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
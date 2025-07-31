import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Typography, Space, Tag, Spin } from 'antd';
import { PlayCircleOutlined, GiftOutlined, LoadingOutlined } from '@ant-design/icons';
import socketManager from '../utils/socket';

const { Title, Text } = Typography;

// 添加CSS动画样式
const animationStyles = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.8; }
  }
  
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  
  @keyframes shimmer {
    0% { text-shadow: 0 0 5px rgba(254, 202, 87, 0.5); }
    50% { text-shadow: 0 0 20px rgba(254, 202, 87, 1), 0 0 30px rgba(255, 107, 107, 0.8); }
    100% { text-shadow: 0 0 5px rgba(254, 202, 87, 0.5); }
  }
  
  @keyframes cardFlip {
    0% { 
      transform: rotateY(0deg); 
    }
    50% { 
      transform: rotateY(90deg); 
    }
    100% { 
      transform: rotateY(180deg); 
    }
  }
  
  @keyframes fadeInSlide {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes celebration {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(-5deg); }
    75% { transform: scale(1.1) rotate(5deg); }
  }
  
  @keyframes shuffleCard {
    0% { 
      transform: translateX(0) translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
    25% { 
      transform: translateX(-30px) translateY(-20px) rotate(-15deg) scale(0.9);
      opacity: 0.8;
    }
    50% { 
      transform: translateX(30px) translateY(-40px) rotate(10deg) scale(1.1);
      opacity: 0.6;
    }
    75% { 
      transform: translateX(-20px) translateY(-10px) rotate(-8deg) scale(0.95);
      opacity: 0.8;
    }
    100% { 
      transform: translateX(0) translateY(0) rotate(0deg) scale(1);
      opacity: 1;
    }
  }
  
  @keyframes shuffleDeck {
    0% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.05) rotate(2deg); }
    50% { transform: scale(0.95) rotate(-3deg); }
    75% { transform: scale(1.02) rotate(1deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  
  @keyframes floatingCards {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes shimmerEffect {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;

const TianjiuPokerGame = ({ userInfo, isHost, userList }) => {
  const [gameState, setGameState] = useState({
    status: 'waiting', // waiting, playing
    currentCard: null,
    currentPlayer: null,
    gamePhase: 'waiting', // waiting, card_drawn, effect_active
    reservedCards: []
  });

  const [currentCardData, setCurrentCardData] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [showCardReveal, setShowCardReveal] = useState(false);

  useEffect(() => {
    // 监听游戏开始
    socketManager.on('gameStarted', (data) => {
      if (data.gameType === 'tianjiuPoker') {
        setGameState(prev => ({
          ...prev,
          status: 'playing',
          ...data.gameState
        }));
      }
    });

    // 监听抽牌结果
    socketManager.on('tianjiuCardDrawn', (data) => {
      console.log('收到抽牌结果:', data);
      
      // 先设置卡牌数据
      setCurrentCardData(data);
      setGameState(prev => ({
        ...prev,
        ...data.gameState
      }));
      
      // 洗牌结束后，短暂延迟然后显示翻牌动画
      setTimeout(() => {
        setIsDrawing(false);
        // 再短暂延迟显示翻转效果
        setTimeout(() => {
          setShowCardReveal(true);
        }, 200);
      }, 500);
    });

    // 监听回合结束
    socketManager.on('tianjiuRoundFinished', (data) => {
      setGameState(prev => ({
        ...prev,
        ...data.gameState
      }));
      setCurrentCardData(null);
      setShowCardReveal(false);
      setIsDrawing(false);
      setIsShuffling(false);
    });

    return () => {
      socketManager.off('gameStarted');
      socketManager.off('tianjiuCardDrawn');
      socketManager.off('tianjiuRoundFinished');
    };
  }, []);

  const startGame = () => {
    socketManager.emit('startTianjiuPoker');
  };

  const drawCard = () => {
    setIsDrawing(true);
    setShowCardReveal(false);
    setCurrentCardData(null);
    
    // 开始洗牌动画
    setIsShuffling(true);
    
    // 洗牌动画持续2.5秒后发送抽牌请求
    setTimeout(() => {
      setIsShuffling(false);
      socketManager.emit('drawTianjiuCard');
    }, 2500);
  };

  const finishRound = () => {
    socketManager.emit('finishTianjiuRound');
  };

  const getCardImage = (card) => {
    if (!card) return null;
    
    // 处理文件名映射
    const cardFileName = card === 'small_jocker' ? 'small_jocker' : card;
    const imagePath = `/pic/tianjiu_poker/${cardFileName}.png`;
    
    // 调试日志
    console.log(`获取卡牌图片: ${card} -> ${imagePath}`);
    
    return imagePath;
  };

  const renderWaitingArea = () => (
    <div style={{ textAlign: 'center', padding: '80px 30px' }}>
      <GiftOutlined style={{ 
        fontSize: '120px', 
        color: '#ff6b6b', 
        marginBottom: '40px',
        filter: 'drop-shadow(0 0 30px rgba(255, 107, 107, 0.6))',
        animation: 'pulse 2s ease-in-out infinite'
      }} />
      <Title level={1} style={{ 
        color: 'white', 
        marginBottom: '30px',
        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontSize: '48px',
        fontWeight: 'bold'
      }}>
        甜酒牌游戏
      </Title>
      <Text style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        fontSize: '22px',
        display: 'block',
        marginBottom: '50px',
        lineHeight: '1.6'
      }}>
        {isHost ? '准备好开启命运之旅了吗？' : '等待房主开始甜酒牌游戏...'}
      </Text>
      {isHost && (
        <Button 
          type="primary" 
          size="large" 
          icon={<PlayCircleOutlined />}
          onClick={startGame}
          style={{
            background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
            border: 'none',
            borderRadius: '30px',
            padding: '20px 50px',
            fontSize: '20px',
            height: '70px',
            minWidth: '250px',
            fontWeight: 'bold',
            boxShadow: '0 12px 30px rgba(255, 107, 107, 0.4)',
            transform: 'scale(1)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 15px 40px rgba(255, 107, 107, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 12px 30px rgba(255, 107, 107, 0.4)';
          }}
        >
          开始甜酒牌游戏
        </Button>
      )}
    </div>
  );

  const renderGameArea = () => (
    <div style={{ padding: '30px' }}>
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <Title level={2} style={{ 
              color: 'white', 
              margin: 0,
              fontSize: '36px',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              甜酒牌游戏
            </Title>
          </div>
        </Col>

        {/* 抽牌区域 */}
        {gameState.gamePhase === 'waiting' && isHost && !isDrawing && (
          <Col span={24}>
            <Card 
              style={{ 
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '50px',
                borderRadius: '20px'
              }}
            >
              <Title level={2} style={{ 
                color: 'white', 
                marginBottom: '25px',
                fontSize: '32px',
                fontWeight: 'bold'
              }}>
                准备抽牌...
              </Title>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                marginBottom: '35px', 
                fontSize: '18px',
                lineHeight: '1.8'
              }}>
                参与玩家: <span style={{ fontWeight: 'bold', color: '#feca57' }}>
                  {userList.map(u => u.nickname).join('、')}
                </span>
                <br />
                所有人都有相同机会被抽中（包括房主）
              </div>
              <Button 
                type="primary" 
                size="large"
                onClick={drawCard}
                style={{
                  background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                  border: 'none',
                  borderRadius: '25px',
                  padding: '15px 40px',
                  fontSize: '20px',
                  height: '65px',
                  minWidth: '200px',
                  fontWeight: 'bold',
                  boxShadow: '0 8px 25px rgba(255, 107, 107, 0.4)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.boxShadow = '0 12px 35px rgba(255, 107, 107, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = '0 8px 25px rgba(255, 107, 107, 0.4)';
                }}
              >
                开始抽牌
              </Button>
            </Card>
          </Col>
        )}

        {/* 洗牌动画 */}
        {isDrawing && (
          <Col span={24}>
            <Card 
              style={{ 
                textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(254, 202, 87, 0.2))',
                border: '3px solid #feca57',
                padding: '60px',
                borderRadius: '20px',
                boxShadow: '0 0 50px rgba(254, 202, 87, 0.6)',
                overflow: 'hidden',
                position: 'relative'
              }}
            >
              {isShuffling ? (
                <>
                  {/* 洗牌卡片效果 */}
                  <div style={{ 
                    position: 'relative',
                    height: '200px',
                    marginBottom: '30px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {/* 多张卡片洗牌效果 */}
                    {[...Array(8)].map((_, index) => {
                      const cards = ['♠', '♥', '♦', '♣', 'A', 'K', 'Q', 'J'];
                      const colors = [
                        'linear-gradient(45deg, #667eea, #764ba2)',
                        'linear-gradient(45deg, #f093fb, #f5576c)',
                        'linear-gradient(45deg, #4facfe, #00f2fe)',
                        'linear-gradient(45deg, #43e97b, #38f9d7)',
                        'linear-gradient(45deg, #fa709a, #fee140)',
                        'linear-gradient(45deg, #a8edea, #fed6e3)',
                        'linear-gradient(45deg, #ffecd2, #fcb69f)',
                        'linear-gradient(45deg, #ff9a9e, #fecfef)'
                      ];
                      
                      return (
                        <div
                          key={index}
                          style={{
                            position: 'absolute',
                            width: '80px',
                            height: '112px',
                            background: colors[index],
                            borderRadius: '8px',
                            border: '2px solid #feca57',
                            animation: `shuffleCard ${0.6 + index * 0.1}s ease-in-out infinite`,
                            animationDelay: `${index * 0.15}s`,
                            zIndex: 10 - index,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            textShadow: '0 0 10px rgba(0,0,0,0.7)',
                            left: `${index * 2}px`,
                            top: `${index * 1.5}px`
                          }}
                        >
                          {cards[index]}
                        </div>
                      );
                    })}
                    
                    {/* 中央牌堆 */}
                    <div style={{
                      width: '100px',
                      height: '140px',
                      background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                      borderRadius: '12px',
                      border: '3px solid #ffd700',
                      animation: 'shuffleDeck 1s ease-in-out infinite',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      color: 'white',
                      textShadow: '0 0 10px rgba(0,0,0,0.5)',
                      zIndex: 15
                    }}>
                      ♠
                    </div>
                  </div>
                  
                  <Title level={2} style={{ 
                    color: 'white',
                    marginBottom: '25px',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    animation: `shimmer 2s ease-in-out infinite`
                  }}>
                    正在洗牌中...
                  </Title>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    fontSize: '20px',
                    fontWeight: '500'
                  }}>
                    命运卡牌正在重新洗混...
                  </div>
                </>
              ) : (
                <>
                  <Spin 
                    indicator={<LoadingOutlined style={{ fontSize: 80, color: '#feca57' }} spin />}
                    style={{ marginBottom: '30px' }}
                  />
                  <Title level={2} style={{ 
                    color: 'white',
                    marginBottom: '25px',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    animation: `shimmer 2s ease-in-out infinite`
                  }}>
                    正在抽牌中...
                  </Title>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.9)', 
                    fontSize: '20px',
                    fontWeight: '500'
                  }}>
                    命运之手正在选择幸运儿...
                  </div>
                </>
              )}
            </Card>
          </Col>
        )}

        {/* 显示当前抽到的牌 - 重新设计的大卡牌布局 */}
        {currentCardData && (
          <Col span={24}>
            <Card 
              style={{ 
                background: showCardReveal 
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 107, 107, 0.2))'
                  : 'rgba(255, 255, 255, 0.1)',
                border: showCardReveal 
                  ? '2px solid #ffd700' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                padding: '40px',
                borderRadius: '24px',
                boxShadow: showCardReveal 
                  ? '0 0 40px rgba(255, 215, 0, 0.6)' 
                  : 'none',
                transform: showCardReveal ? 'scale(1.02)' : 'scale(1)',
                transition: 'all 0.8s ease-in-out'
              }}
            >
              {/* 卡牌居中显示布局 */}
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                gap: '40px'
              }}>
                {/* 大卡牌显示区 */}
                <div style={{ 
                  textAlign: 'center',
                  perspective: '1000px'
                }}>
                  <div style={{
                    width: '400px',
                    height: '560px',
                    margin: '0 auto',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: showCardReveal ? 'cardFlip 2s ease-in-out' : 'none',
                    transform: showCardReveal ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: showCardReveal ? 'none' : 'transform 0.3s ease'
                  }}>
                    {/* 卡牌背面 */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      borderRadius: '20px',
                      border: '5px solid #feca57',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '80px',
                      fontWeight: 'bold',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.3)'
                    }}>
                      ♠
                    </div>
                    
                    {/* 卡牌正面 */}
                    <div style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}>
                      <img 
                        src={getCardImage(currentCardData.card)}
                        alt={currentCardData.card}
                        style={{ 
                          width: '100%',
                          height: '100%',
                          borderRadius: '20px',
                          border: '6px solid #ffd700',
                          objectFit: 'cover',
                          filter: 'drop-shadow(0 0 30px rgba(255, 215, 0, 0.8))',
                          boxShadow: '0 20px 50px rgba(255, 215, 0, 0.5)'
                        }}
                        onError={(e) => {
                          console.error(`卡牌图片加载失败: ${currentCardData.card}`);
                          // 如果图片加载失败，显示卡牌名称
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      {/* 图片加载失败时的备用显示 */}
                      <div style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '20px',
                        border: '6px solid #ffd700',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '36px',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        boxShadow: '0 20px 50px rgba(255, 215, 0, 0.5)'
                      }}>
                        {currentCardData.card}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* 信息显示区 */}
                <div style={{ 
                  width: '100%', 
                  maxWidth: '900px'
                }}>
                  {/* 玩家和卡牌信息 */}
                  <div style={{ 
                    animation: showCardReveal ? 'fadeInSlide 1s ease-out 0.8s both' : 'none',
                    marginBottom: '32px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(255, 107, 107, 0.15))',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 215, 0, 0.3)',
                      borderRadius: '24px',
                      padding: '24px 32px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '24px',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
                          color: '#8B4513',
                          padding: '16px 24px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '24px',
                          boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                          letterSpacing: '0.5px'
                        }}>
                          {currentCardData.card}
                        </div>
                        
                        <div style={{
                          background: currentCardData.player.id === userInfo.userId 
                            ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' 
                            : currentCardData.player.isVirtual
                              ? 'linear-gradient(135deg, #9c88ff, #b19cd9)'
                              : 'linear-gradient(135deg, #48dbfb, #6bb6ff)',
                          color: 'white',
                          padding: '16px 24px',
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          boxShadow: currentCardData.player.id === userInfo.userId 
                            ? '0 6px 20px rgba(255, 107, 107, 0.4)' 
                            : currentCardData.player.isVirtual
                              ? '0 6px 20px rgba(156, 136, 255, 0.4)'
                              : '0 6px 20px rgba(72, 219, 251, 0.4)',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}>
                          <span style={{ fontSize: '24px' }}>
                            {currentCardData.player.id === userInfo.userId 
                              ? "●" 
                              : currentCardData.player.isVirtual 
                                ? "○" 
                                : "◆"}
                          </span>
                          {currentCardData.player.nickname}
                          {currentCardData.player.id === userInfo.userId && (
                            <span style={{ 
                              fontSize: '20px', 
                              filter: 'drop-shadow(0 0 4px rgba(255,215,0,0.8))' 
                            }}>★</span>
                          )}
                          {currentCardData.player.isVirtual && (
                            <span style={{ 
                              fontSize: '14px', 
                              background: 'rgba(255,255,255,0.2)',
                              padding: '4px 8px',
                              borderRadius: '10px'
                            }}>虚拟</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 卡牌效果说明 */}
                  <div style={{ 
                    animation: showCardReveal ? 'fadeInSlide 1s ease-out 1.2s both' : 'none',
                    marginBottom: '40px'
                  }}>
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(30, 30, 30, 0.9), rgba(45, 45, 45, 0.8))',
                      backdropFilter: 'blur(15px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '24px',
                      padding: '32px 36px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '20px'
                      }}>
                        <div style={{
                          fontSize: '36px',
                          filter: 'drop-shadow(0 0 8px rgba(255, 215, 0, 0.6))',
                          flexShrink: 0
                        }}>♦</div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            color: 'rgba(255, 215, 0, 0.9)',
                            fontSize: '16px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '12px',
                            opacity: 0.8
                          }}>卡牌效果</div>
                          
                          <div style={{
                            color: 'white',
                            fontSize: '22px',
                            lineHeight: '1.6',
                            fontWeight: '500',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                          }}>
                            {currentCardData.effect}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 控制按钮 */}
                  {isHost && (
                    <div style={{ 
                      textAlign: 'center',
                      animation: showCardReveal ? 'fadeInSlide 1s ease-out 1.6s both' : 'none'
                    }}>
                      <Button 
                        type="primary"
                        onClick={finishRound}
                        style={{ 
                          background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                          border: 'none',
                          borderRadius: '24px',
                          padding: '20px 40px',
                          fontWeight: 'bold',
                          fontSize: '20px',
                          height: '70px',
                          minWidth: '240px',
                          boxShadow: '0 12px 32px rgba(255, 107, 107, 0.4)',
                          position: 'relative',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-3px) scale(1.02)';
                          e.target.style.boxShadow = '0 16px 40px rgba(255, 107, 107, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0) scale(1)';
                          e.target.style.boxShadow = '0 12px 32px rgba(255, 107, 107, 0.4)';
                        }}
                      >
                        <span style={{ position: 'relative', zIndex: 1 }}>继续抽牌</span>
                        {/* 按钮光效 */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: '-100%',
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                          animation: 'shimmerEffect 3s infinite',
                          zIndex: 0
                        }} />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </Col>
        )}

      </Row>

    </div>
  );

  return (
    <>
      {/* 注入CSS动画样式 */}
      <style>{animationStyles}</style>
      
      <div style={{ 
        minHeight: '650px',
        background: 'linear-gradient(135deg, rgba(74, 144, 226, 0.1), rgba(80, 200, 120, 0.1))',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '20px'
      }}>
        {gameState.status === 'waiting' ? renderWaitingArea() : renderGameArea()}
      </div>
    </>
  );
};

export default TianjiuPokerGame; 
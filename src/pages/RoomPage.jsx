import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Button, 
  Tag, 
  Space, 
  Row, 
  Col, 
  message,
  Tooltip,
  Typography
} from 'antd';
import { 
  CopyOutlined, 
  LogoutOutlined, 
  HeartOutlined,
  TeamOutlined,
  CoffeeOutlined
} from '@ant-design/icons';
import socketManager from '../utils/socket';
import { storage } from '../utils/storage';
import { GAME_TYPES } from '../utils/constants';
import NumberBombGame from '../components/NumberBombGame';
import TianjiuPokerGame from '../components/TianjiuPokerGame';
import UserList from '../components/UserList';
import ChatPanel from '../components/ChatPanel';
import HostPlayerManager from '../components/HostPlayerManager';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const RoomPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bubbles, setBubbles] = useState([]);
  const [gameType, setGameType] = useState(null);
  const [isHostMode, setIsHostMode] = useState(false);

  // 生成泡泡数据
  useEffect(() => {
    const bubbleData = [...Array(20)].map((_, i) => ({
      id: i,
      left: Math.random() * 95,
      size: Math.random() * 12 + 6,
      duration: Math.random() * 6 + 8,
      delay: Math.random() * 8,
      color: ['rgba(255, 107, 107, 0.4)', 'rgba(254, 202, 87, 0.35)', 'rgba(72, 219, 251, 0.3)'][Math.floor(Math.random() * 3)],
      drift: (Math.random() - 0.5) * 60
    }));
    setBubbles(bubbleData);
  }, []);

  useEffect(() => {
    // 获取用户信息
    const storedUserInfo = storage.getUserInfo();
    if (!storedUserInfo) {
      message.error('没有用户信息，请先创建或加入房间');
      window.location.href = '/';
      return;
    }

    setUserInfo(storedUserInfo);
    setIsHostMode(storedUserInfo.hostMode || false);
    
    // 连接到服务器
    socketManager.connect();
    
    // 尝试重连到房间
    socketManager.emit('reconnectToRoom', {
      roomId: storedUserInfo.roomId,
      userId: storedUserInfo.userId,
      nickname: storedUserInfo.nickname || '玩家'
    });

    // 监听重连成功
    socketManager.on('roomJoined', (data) => {
      setLoading(false);
      const updatedUserInfo = {
        ...storedUserInfo,
        userId: data.userId,
        userNumber: data.userNumber,
        isHost: data.isHost,
        hostMode: data.hostMode
      };
      setUserInfo(updatedUserInfo);
      setIsHostMode(data.hostMode || false);
      storage.setUserInfo(updatedUserInfo);
    });

    // 监听用户列表更新
    socketManager.on('userListUpdate', (userList) => {
      setUsers(userList);
    });

    // 监听房主变更
    socketManager.on('hostChanged', (data) => {
      message.info(`${data.newHostNickname} 成为了新的房主`);
      if (data.newHostId === userInfo?.userId) {
        const updatedUserInfo = { ...userInfo, isHost: true };
        setUserInfo(updatedUserInfo);
        storage.setUserInfo(updatedUserInfo);
      }
    });

    // 监听错误
    socketManager.on('error', (error) => {
      message.error(error);
      if (error.includes('房间不存在') || error.includes('用户不存在')) {
        storage.clearUserInfo();
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      }
    });

    return () => {
      socketManager.off('roomJoined');
      socketManager.off('userListUpdate');
      socketManager.off('hostChanged');
      socketManager.off('error');
    };
  }, []);

  const copyRoomLink = () => {
    const link = `${window.location.origin}/?room=${userInfo.roomId}`;
    navigator.clipboard.writeText(link).then(() => {
      message.success('房间链接已复制到剪贴板');
    }).catch(() => {
      message.error('复制失败，请手动复制链接');
    });
  };

  const leaveRoom = () => {
    socketManager.emit('leaveRoom');
    storage.clearUserInfo();
    window.location.href = '/';
  };

  const goHome = () => {
    window.location.href = '/';
  };

  if (loading || !userInfo) {
    return (
      <Layout style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(145deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 加载状态的泡泡背景 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                bottom: '-50px',
                left: `${Math.random() * 95}%`,
                width: `${Math.random() * 12 + 6}px`,
                height: `${Math.random() * 12 + 6}px`,
                background: ['rgba(255, 107, 107, 0.4)', 'rgba(254, 202, 87, 0.35)', 'rgba(72, 219, 251, 0.3)'][Math.floor(Math.random() * 3)],
                borderRadius: '50%',
                animation: `bubbleFloat ${Math.random() * 6 + 8}s infinite linear`,
                animationDelay: `${Math.random() * 8}s`
              }}
            />
          ))}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bubbleFloat {
                0% { transform: translateY(0px) translateX(0px) scale(0.1); opacity: 0; }
                10% { opacity: 0.8; transform: translateY(-100px) translateX(5px) scale(1); }
                50% { opacity: 0.6; transform: translateY(-50vh) translateX(15px) scale(0.8); }
                100% { transform: translateY(-100vh) translateX(30px) scale(0.2); opacity: 0; }
              }
            `
          }} />
        </div>
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{
            textAlign: 'center',
            color: 'white',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            padding: '40px 60px',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)'
          }}>
            <CoffeeOutlined style={{ 
              fontSize: '48px', 
              color: '#ff6b6b', 
              marginBottom: '20px',
              filter: 'drop-shadow(0 0 16px rgba(255, 107, 107, 0.5))'
            }} />
            <div style={{ fontSize: '18px', fontWeight: '500' }}>正在连接房间...</div>
            <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px' }}>
              请稍候片刻
            </div>
          </div>
        </Content>
      </Layout>
    );
  }

      return (
      <Layout style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(145deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 动态泡泡背景 */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
          overflow: 'hidden'
        }}>
          {bubbles.map((bubble) => (
            <div
              key={bubble.id}
              className="bubble"
              style={{
                position: 'absolute',
                bottom: '-50px',
                left: `${bubble.left}%`,
                width: `${bubble.size}px`,
                height: `${bubble.size}px`,
                background: bubble.color,
                borderRadius: '50%',
                filter: 'blur(0.5px)',
                boxShadow: `inset 0 0 ${bubble.size/3}px rgba(255, 255, 255, 0.4), 0 0 ${bubble.size/2}px ${bubble.color}`,
                animation: `bubbleFloat ${bubble.duration}s infinite linear`,
                animationDelay: `${bubble.delay}s`,
                '--drift': `${bubble.drift}px`
              }}
            />
          ))}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes bubbleFloat {
                0% { transform: translateY(0px) translateX(0px) scale(0.1); opacity: 0; }
                10% { opacity: 0.8; transform: translateY(-100px) translateX(5px) scale(1); }
                50% { opacity: 0.6; transform: translateY(-50vh) translateX(15px) scale(0.8); }
                100% { transform: translateY(-100vh) translateX(30px) scale(0.2); opacity: 0; }
              }
              .bubble { will-change: transform, opacity; backdrop-filter: blur(1px); }
            `
          }} />
        </div>
        <Header style={{ 
          background: 'rgba(255, 255, 255, 0.05)', 
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          zIndex: 10,
          padding: '16px 24px',
          height: 'auto',
          lineHeight: 'normal'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            minHeight: '48px',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <CoffeeOutlined style={{ 
                  fontSize: '24px', 
                  color: '#ff6b6b', 
                  marginRight: '12px',
                  filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.3))'
                }} />
                <Title level={4} style={{ 
                  margin: 0, 
                  marginRight: '16px',
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>游戏房间</Title>
                <Tag style={{ 
                  fontSize: '14px', 
                  padding: '6px 12px',
                  background: 'rgba(72, 219, 251, 0.2)',
                  border: '1px solid rgba(72, 219, 251, 0.4)',
                  color: '#48dbfb',
                  fontWeight: '600',
                  borderRadius: '8px'
                }}>
                  {userInfo.roomId}
                </Tag>
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: 'rgba(255, 255, 255, 0.8)',
                display: 'flex',
                alignItems: 'center'
              }}>
                <TeamOutlined style={{ marginRight: '6px', color: '#feca57' }} />
                在线玩家: {users.length} 人
              </div>
            </div>
            <Space size="middle">
              <Tooltip title="复制房间链接">
                <Button 
                  icon={<CopyOutlined />}
                  onClick={copyRoomLink}
                  style={{
                    background: 'rgba(254, 202, 87, 0.2)',
                    border: '1px solid rgba(254, 202, 87, 0.4)',
                    color: '#feca57',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(254, 202, 87, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(254, 202, 87, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  复制链接
                </Button>
              </Tooltip>
              <Tooltip title="返回首页">
                <Button 
                  icon={<HeartOutlined />}
                  onClick={goHome}
                  style={{
                    background: 'rgba(72, 219, 251, 0.2)',
                    border: '1px solid rgba(72, 219, 251, 0.4)',
                    color: '#48dbfb',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(72, 219, 251, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(72, 219, 251, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  首页
                </Button>
              </Tooltip>
              <Tooltip title="离开房间">
                <Button 
                  icon={<LogoutOutlined />}
                  onClick={leaveRoom}
                  style={{
                    background: 'rgba(255, 107, 107, 0.2)',
                    border: '1px solid rgba(255, 107, 107, 0.4)',
                    color: '#ff6b6b',
                    borderRadius: '8px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.3)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 107, 107, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  离开房间
                </Button>
              </Tooltip>
            </Space>
          </div>
        </Header>

      <Layout style={{ background: 'transparent' }}>
        <Content style={{ 
          padding: '24px',
          position: 'relative',
          zIndex: 10
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <Row gutter={24} style={{ height: '100%' }}>
              <Col xs={24} lg={16}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  padding: '24px',
                  minHeight: '500px'
                }}>
                  {!gameType ? (
                    // 游戏选择界面
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <Title level={2} style={{ 
                        color: 'white', 
                        marginBottom: '30px',
                        background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}>
                        选择游戏
                      </Title>
                      
                      {userInfo.isHost ? (
                        <Space direction="vertical" size="large">
                          <Button 
                            type="primary" 
                            size="large"
                            onClick={() => setGameType(GAME_TYPES.NUMBER_BOMB)}
                            style={{
                              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
                              border: 'none',
                              borderRadius: '25px',
                              padding: '12px 32px',
                              fontSize: '16px',
                              width: '200px',
                              height: '50px'
                            }}
                          >
                            数字炸弹
                          </Button>
                          
                          <Button 
                            type="primary" 
                            size="large"
                            onClick={() => setGameType(GAME_TYPES.TIANJIU_POKER)}
                            style={{
                              background: 'linear-gradient(45deg, #feca57, #ff6b6b)',
                              border: 'none',
                              borderRadius: '25px',
                              padding: '12px 32px',
                              fontSize: '16px',
                              width: '200px',
                              height: '50px'
                            }}
                          >
                            甜酒牌
                          </Button>
                        </Space>
                      ) : (
                        <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '16px' }}>
                          等待房主选择游戏...
                        </div>
                      )}
                    </div>
                  ) : gameType === GAME_TYPES.NUMBER_BOMB ? (
                    <NumberBombGame 
                      userInfo={userInfo} 
                      isHost={userInfo.isHost}
                      isHostMode={isHostMode}
                      userList={users}
                    />
                  ) : gameType === GAME_TYPES.TIANJIU_POKER ? (
                    <TianjiuPokerGame 
                      userInfo={userInfo} 
                      isHost={userInfo.isHost}
                      userList={users}
                    />
                  ) : null}
                  
                  {/* 返回游戏选择按钮 */}
                  {gameType && userInfo.isHost && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                      <Button 
                        size="small"
                        onClick={() => setGameType(null)}
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          color: 'white'
                        }}
                      >
                        返回选择
                      </Button>
                    </div>
                  )}
                </div>
              </Col>
              
              <Col xs={24} lg={8}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  {/* 主持人模式下显示参与者管理面板 */}
                  {isHostMode && userInfo.isHost && (
                    <HostPlayerManager 
                      userList={users}
                      isHost={userInfo.isHost}
                    />
                  )}
                  
                  {/* 普通模式下显示在线玩家列表 */}
                  {!isHostMode && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      padding: '20px'
                    }}>
                      <UserList 
                        users={users} 
                        playerCount={users.length}
                        currentUserId={userInfo.userId}
                      />
                    </div>
                  )}
                  
                  {/* 普通模式或主持人模式都显示聊天面板 */}
                  {!isHostMode && (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '20px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      padding: '20px',
                      minHeight: '300px'
                    }}>
                      <ChatPanel 
                        userInfo={userInfo} 
                      />
                    </div>
                  )}
                </Space>
              </Col>
            </Row>
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RoomPage; 
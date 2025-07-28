import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Input,
  Modal,
  Row,
  Col,
  Typography,
  message,
  Form,
  Switch,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  PlayCircleOutlined,
  CoffeeOutlined,
  HeartOutlined,
  CrownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import socketManager from '../utils/socket';
import { storage } from '../utils/storage';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const HomePage = () => {
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [actionType, setActionType] = useState(''); // 'create' or 'join'
  const [form] = Form.useForm();
  const [bubbles, setBubbles] = useState([]);
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
    // 检查URL参数，如果有room参数则自动设置
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl && roomFromUrl.length === 6) {
      setRoomIdInput(roomFromUrl);
      setActionType('join');
      setIsNicknameModalVisible(true);
      // 清除URL参数，避免刷新时重复触发
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 连接到服务器
    socketManager.connect();

    // 监听房间创建成功
    socketManager.on('roomCreated', (data) => {
      message.success('房间创建成功！');
      storage.setUserInfo({
        userId: data.userId,
        roomId: data.roomId,
        userNumber: data.userNumber,
        isHost: data.isHost,
        hostMode: data.hostMode,
        nickname: form.getFieldValue('nickname')
      });
      window.location.href = '/room.html';
    });

    // 监听加入房间成功
    socketManager.on('roomJoined', (data) => {
      message.success('成功加入房间！');
      storage.setUserInfo(data);
      window.location.href = '/room.html';
    });

    // 监听错误
    socketManager.on('error', (error) => {
      message.error(error);
    });

    return () => {
      socketManager.off('roomCreated');
      socketManager.off('roomJoined');
      socketManager.off('error');
    };
  }, []);

  const handleCreateRoom = () => {
    setActionType('create');
    setIsNicknameModalVisible(true);
  };

  const handleJoinRoom = () => {
    if (!roomIdInput.trim()) {
      message.warning('请输入房间号');
      return;
    }
    setActionType('join');
    setIsNicknameModalVisible(true);
  };

  const handleNicknameSubmit = (values) => {
    const { nickname } = values;
    if (!nickname.trim()) {
      message.warning('请输入昵称');
      return;
    }

    if (actionType === 'create') {
      socketManager.emit('createRoom', { 
        nickname: nickname.trim(),
        hostMode: isHostMode
      });
    } else if (actionType === 'join') {
      socketManager.emit('joinRoom', {
        roomId: roomIdInput.trim().toUpperCase(),
        nickname: nickname.trim()
      });
    }

    setIsNicknameModalVisible(false);
    form.resetFields();
  };

  const handleRoomIdChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setRoomIdInput(value);
    }
  };

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
              0% {
                transform: translateY(0px) translateX(0px) scale(0.1);
                opacity: 0;
              }
              10% {
                opacity: 0.8;
                transform: translateY(-100px) translateX(5px) scale(1);
              }
              50% {
                opacity: 0.6;
                transform: translateY(-50vh) translateX(15px) scale(0.8);
              }
              100% {
                transform: translateY(-100vh) translateX(30px) scale(0.2);
                opacity: 0;
              }
            }
            
            .bubble {
              will-change: transform, opacity;
              backdrop-filter: blur(1px);
            }
          `
        }} />
      </div>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CoffeeOutlined style={{ 
              fontSize: '28px', 
              color: '#ff6b6b', 
              marginRight: '16px',
              filter: 'drop-shadow(0 0 8px rgba(255, 107, 107, 0.3))'
            }} />
            <Title level={2} style={{ 
              margin: 0, 
              color: 'white',
              fontWeight: '600',
              fontSize: '24px',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              甜梦小酒馆
            </Title>
          </div>
          <Button 
            type="text" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              height: '36px'
            }}
            icon={<HeartOutlined />}
            onClick={() => window.location.reload()}
          >
            首页
          </Button>
        </div>
      </Header>

      <Content style={{ 
        padding: '20px 24px', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', flex: 1 }}>
          {/* 主要内容区域 - 左侧内容，右侧超大看板娘 */}
          <Row style={{ minHeight: 'calc(100vh - 200px)', marginBottom: '40px' }}>
            {/* 左侧：标题、描述和操作区域 */}
            <Col xs={24} lg={14} xl={12}>
              <div style={{ 
                paddingRight: '40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 200px)',
                paddingTop: '20px'
              }}>
                {/* 主标题 */}
                <Title level={1} style={{ 
                  color: 'white', 
                  marginBottom: '24px',
                  fontSize: '64px',
                  fontWeight: '800',
                  background: 'linear-gradient(45deg, #ff6b9d, #feca57, #48dbfb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255, 107, 157, 0.4)',
                  lineHeight: '1.1',
                  animation: 'titleShine 3s ease-in-out infinite alternate'
                }}>
                  甜梦小酒馆
                </Title>
                
                {/* 副标题 */}
                <Paragraph style={{ 
                  fontSize: '28px', 
                  color: 'rgba(255, 255, 255, 0.95)',
                  marginBottom: '20px',
                  lineHeight: '1.4',
                  fontWeight: '500'
                }}>
                  🌸 温馨可爱的游戏乐园
                </Paragraph>
                
                {/* 描述文字 */}
                <Paragraph style={{ 
                  fontSize: '20px', 
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: '50px',
                  lineHeight: '1.7',
                  fontWeight: '400',
                  maxWidth: '500px'
                }}>
                  与朋友们一起享受轻松愉快的游戏时光，创造美好回忆～<br/>
                  数字炸弹、甜酒牌等精彩游戏等你来体验！
                </Paragraph>
                
                {/* 快速开始按钮 */}
                <div style={{ marginBottom: '60px' }}>
                  <Button 
                    type="primary" 
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={handleCreateRoom}
                    style={{ 
                      height: '72px',
                      borderRadius: '36px',
                      fontSize: '22px',
                      fontWeight: '700',
                      background: 'linear-gradient(135deg, #ff6b9d, #ff8fab)',
                      border: 'none',
                      boxShadow: '0 8px 32px rgba(255, 107, 157, 0.5)',
                      transition: 'all 0.3s ease',
                      padding: '0 48px',
                      marginRight: '20px',
                      marginBottom: '16px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 16px 48px rgba(255, 107, 157, 0.7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 32px rgba(255, 107, 157, 0.5)';
                    }}
                  >
                    💫 创建房间
                  </Button>
                  
                  <Button 
                    size="large"
                    icon={<UserAddOutlined />}
                    onClick={() => {
                      if (!roomIdInput.trim()) {
                        message.warning('请先在下方输入房间号');
                        return;
                      }
                      setActionType('join');
                      setIsNicknameModalVisible(true);
                    }}
                    style={{ 
                      height: '72px',
                      borderRadius: '36px',
                      fontSize: '22px',
                      fontWeight: '700',
                      background: 'rgba(255, 255, 255, 0.15)',
                      border: '3px solid rgba(255, 255, 255, 0.4)',
                      color: 'white',
                      transition: 'all 0.3s ease',
                      padding: '0 48px',
                      marginBottom: '16px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    }}
                  >
                    🚀 加入房间
                  </Button>
                </div>
                
                {/* 房间号输入区域 */}
                <Card
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '24px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    transition: 'all 0.3s ease',
                    maxWidth: '500px'
                  }}
                  styles={{
                    body: { padding: '32px' }
                  }}
                >
                  <div style={{ marginBottom: '24px' }}>
                    <Title level={4} style={{ 
                      marginBottom: '12px', 
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>🎯 加入现有房间</Title>
                    <Paragraph style={{ 
                      color: 'rgba(255, 255, 255, 0.8)', 
                      margin: 0,
                      fontSize: '16px',
                      lineHeight: '1.6',
                      textAlign: 'center'
                    }}>
                      输入朋友分享的6位房间号
                    </Paragraph>
                  </div>
                  
                  <Row gutter={12}>
                    <Col span={14}>
                      <Input
                        placeholder="输入6位房间号"
                        value={roomIdInput}
                        onChange={handleRoomIdChange}
                        style={{ 
                          height: '56px',
                          fontSize: '18px',
                          borderRadius: '16px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          textAlign: 'center',
                          fontWeight: '600',
                          letterSpacing: '2px'
                        }}
                        maxLength={6}
                      />
                    </Col>
                    <Col span={10}>
                      <Button 
                        type="primary" 
                        size="large" 
                        block
                        onClick={handleJoinRoom}
                        style={{ 
                          height: '56px',
                          borderRadius: '16px',
                          fontSize: '16px',
                          fontWeight: '600',
                          background: 'linear-gradient(135deg, #48dbfb, #6bb6ff)',
                          border: 'none',
                          boxShadow: '0 4px 16px rgba(72, 219, 251, 0.4)',
                          transition: 'all 0.3s ease'
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
                        加入
                      </Button>
                    </Col>
                  </Row>
                </Card>
              </div>
            </Col>
            
            {/* 右侧：超大看板娘 */}
            <Col xs={24} lg={10} xl={12}>
              <div style={{ 
                position: 'relative',
                minHeight: 'calc(100vh - 200px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                {/* 看板娘背景装饰 - 多层光效 */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '600px',
                  height: '600px',
                  background: 'radial-gradient(circle, rgba(255, 182, 193, 0.4), rgba(255, 192, 203, 0.15), transparent)',
                  borderRadius: '50%',
                  filter: 'blur(30px)',
                  animation: 'kanbanGlow 6s ease-in-out infinite alternate',
                  zIndex: 0
                }} />
                
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '400px',
                  height: '400px',
                  background: 'radial-gradient(circle, rgba(255, 107, 157, 0.3), rgba(254, 202, 87, 0.15), transparent)',
                  borderRadius: '50%',
                  filter: 'blur(20px)',
                  animation: 'kanbanGlow 4s ease-in-out infinite alternate-reverse',
                  zIndex: 1
                }} />
                
                {/* 超大看板娘图片 */}
                <div style={{
                  position: 'relative',
                  zIndex: 2,
                  transform: 'scale(1)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer'
                }}>
                  <img 
                    src="/pic/kanban.PNG" 
                    alt="甜梦小酒馆看板娘" 
                    style={{
                      width: '450px',
                      height: 'auto',
                      maxWidth: '90vw',
                      filter: 'drop-shadow(0 20px 60px rgba(255, 182, 193, 0.5))',
                      animation: 'kanbanFloat 8s ease-in-out infinite'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.08)';
                      e.target.style.filter = 'drop-shadow(0 30px 80px rgba(255, 182, 193, 0.8))';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1)';
                      e.target.style.filter = 'drop-shadow(0 20px 60px rgba(255, 182, 193, 0.5))';
                    }}
                  />
                </div>
                
                {/* 看板娘对话框 */}
                <div style={{
                  position: 'absolute',
                  bottom: '10%',
                  right: '10%',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(15px)',
                  padding: '20px 28px',
                  borderRadius: '24px',
                  border: '3px solid rgba(255, 182, 193, 0.6)',
                  boxShadow: '0 12px 48px rgba(255, 182, 193, 0.4)',
                  maxWidth: '300px',
                  zIndex: 3,
                  animation: 'dialogBounce 4s ease-in-out infinite'
                }}>
                  <div style={{
                    color: '#ff6b9d',
                    fontSize: '16px',
                    fontWeight: '700',
                    textAlign: 'center',
                    lineHeight: '1.5'
                  }}>
                    💖 欢迎来到甜梦小酒馆！<br/>
                    🎉 和朋友们一起玩游戏吧～
                  </div>
                  {/* 对话框小尾巴 */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '12px solid transparent',
                    borderRight: '12px solid transparent',
                    borderTop: '12px solid rgba(255, 255, 255, 0.95)'
                  }} />
                </div>
              </div>
            </Col>
          </Row>
          
          {/* 添加动画样式 */}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes kanbanFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                25% { transform: translateY(-15px) rotate(1deg); }
                50% { transform: translateY(-20px) rotate(0deg); }
                75% { transform: translateY(-10px) rotate(-1deg); }
              }
              
              @keyframes kanbanGlow {
                0% { opacity: 0.4; transform: translate(-50%, -50%) scale(1); }
                100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
              }
              
              @keyframes dialogBounce {
                0%, 100% { transform: translateY(0px) scale(1); }
                50% { transform: translateY(-8px) scale(1.02); }
              }
              
              @keyframes titleShine {
                0% { filter: brightness(1) saturate(1); }
                100% { filter: brightness(1.3) saturate(1.2); }
              }
            `
          }} />

          {/* 功能特性 - 简化版 */}
          <Row gutter={[20, 20]} style={{ marginBottom: '30px' }}>
            <Col xs={24} md={8}>
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(255, 107, 157, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 107, 157, 0.15)',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(255, 107, 157, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 107, 157, 0.08)';
              }}>
                <PlayCircleOutlined style={{ 
                  fontSize: '32px', 
                  color: '#ff6b9d', 
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 0 6px rgba(255, 107, 157, 0.4))'
                }} />
                <Title level={5} style={{ 
                  marginBottom: '6px', 
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>🎮 多样小游戏</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  数字炸弹、甜酒牌等精彩游戏
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(254, 202, 87, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(254, 202, 87, 0.15)',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(254, 202, 87, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(254, 202, 87, 0.08)';
              }}>
                <UsergroupAddOutlined style={{ 
                  fontSize: '32px', 
                  color: '#feca57', 
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 0 6px rgba(254, 202, 87, 0.4))'
                }} />
                <Title level={5} style={{ 
                  marginBottom: '6px', 
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>💬 实时互动</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  文字聊天、实时同步体验
                </Paragraph>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{
                textAlign: 'center',
                padding: '24px 16px',
                background: 'rgba(72, 219, 251, 0.08)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(72, 219, 251, 0.15)',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.background = 'rgba(72, 219, 251, 0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(72, 219, 251, 0.08)';
              }}>
                <CoffeeOutlined style={{ 
                  fontSize: '32px', 
                  color: '#48dbfb', 
                  marginBottom: '12px',
                  filter: 'drop-shadow(0 0 6px rgba(72, 219, 251, 0.4))'
                }} />
                <Title level={5} style={{ 
                  marginBottom: '6px', 
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>🏠 温馨空间</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  margin: 0,
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}>
                  创建专属房间，邀请好友
                </Paragraph>
              </div>
            </Col>
          </Row>
        </div>
      </Content>

      {/* 昵称设置模态框 */}
      <Modal
        title={
          <div style={{ textAlign: 'center', color: 'white' }}>
            <CoffeeOutlined style={{ fontSize: '24px', marginRight: '8px', color: '#ff6b6b' }} />
            {actionType === 'join' && roomIdInput ? `加入房间 ${roomIdInput}` : "设置昵称"}
          </div>
        }
        open={isNicknameModalVisible}
        onCancel={() => {
          setIsNicknameModalVisible(false);
          setRoomIdInput('');
          setActionType('');
          form.resetFields();
        }}
        footer={null}
        centered
        styles={{
          mask: { backdropFilter: 'blur(8px)' },
          content: {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '24px',
            boxShadow: '0 20px 64px rgba(0, 0, 0, 0.6)'
          },
          header: {
            background: 'rgba(26, 26, 46, 0.95)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px 24px 0 0',
            padding: '20px 24px'
          },
          body: {
            background: 'rgba(26, 26, 46, 0.95)',
            padding: '24px'
          }
        }}
      >
        <Form
          form={form}
          onFinish={handleNicknameSubmit}
          layout="vertical"
          style={{ marginTop: '24px' }}
        >
          <Form.Item
            label={
              <span style={{ 
                color: 'rgba(255, 255, 255, 0.9)', 
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {actionType === 'join' && roomIdInput ? 
                  `请输入昵称以加入房间 ${roomIdInput}` : 
                  "请输入你的昵称"
                }
              </span>
            }
            name="nickname"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 20, message: '昵称不能超过20个字符' },
              { min: 1, message: '昵称不能为空' }
            ]}
          >
            <Input
              placeholder="昵称 (1-20个字符)"
              size="large"
              maxLength={20}
              style={{ 
                borderRadius: '16px',
                height: '48px',
                fontSize: '16px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            />
          </Form.Item>
          
          {/* 主持人模式选项 */}
          {actionType === 'create' && (
            <div style={{ 
              marginTop: '24px',
              padding: '20px',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CrownOutlined style={{ 
                    color: '#ffd700', 
                    fontSize: '18px', 
                    marginRight: '8px' 
                  }} />
                  <span style={{ 
                    color: 'white', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    主持人模式
                  </span>
                  <Tooltip 
                    title="主持人模式下，只有你一个人在房间，可以手动添加和管理参与者名单"
                    placement="top"
                  >
                    <InfoCircleOutlined 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        marginLeft: '8px',
                        cursor: 'help'
                      }} 
                    />
                  </Tooltip>
                </div>
                <Switch
                  checked={isHostMode}
                  onChange={setIsHostMode}
                  style={{
                    backgroundColor: isHostMode ? '#ffd700' : 'rgba(255, 255, 255, 0.3)'
                  }}
                />
              </div>
              <div style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '13px',
                lineHeight: '1.4'
              }}>
                {isHostMode 
                  ? '🎭 已启用主持人模式 - 您可以手动管理参与者名单'
                  : '👥 普通模式 - 其他玩家可以通过房间号加入'
                }
              </div>
            </div>
          )}
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'center', marginTop: '24px' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ 
                borderRadius: '16px',
                fontWeight: '600',
                height: '48px',
                width: '100%',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #ff6b6b, #feca57)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(255, 107, 107, 0.4)',
                transition: 'all 0.3s ease'
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
              确认进入
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default HomePage;
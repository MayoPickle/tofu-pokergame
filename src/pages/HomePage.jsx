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
  Form
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  UsergroupAddOutlined,
  PlayCircleOutlined,
  CoffeeOutlined,
  HeartOutlined
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
      socketManager.emit('createRoom', { nickname: nickname.trim() });
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
        padding: '40px 24px', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 'calc(100vh - 64px)',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', flex: 1 }}>
          {/* 欢迎区域 */}
          <div style={{ textAlign: 'center', marginBottom: '64px', paddingTop: '40px' }}>
            <Title level={1} style={{ 
              color: 'white', 
              marginBottom: '24px',
              fontSize: '48px',
              fontWeight: '700',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57, #48dbfb)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(255, 107, 107, 0.3)'
            }}>
              欢迎来到甜梦小酒馆
            </Title>
            <Paragraph style={{ 
              fontSize: '20px', 
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.8',
              fontWeight: '300'
            }}>
              在这个温馨的数字空间里，与朋友们一起享受轻松愉快的游戏时光
            </Paragraph>
          </div>

          {/* 功能特性 */}
          <Row gutter={[32, 32]} style={{ marginBottom: '64px' }}>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                styles={{
                  body: { textAlign: 'center', padding: '40px 24px' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
              >
                <PlayCircleOutlined style={{ 
                  fontSize: '56px', 
                  color: '#ff6b6b', 
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 0 12px rgba(255, 107, 107, 0.4))'
                }} />
                <Title level={4} style={{ 
                  marginBottom: '16px', 
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>多样小游戏</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  数字炸弹等经典聚会游戏，更多精彩持续更新
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                styles={{
                  body: { textAlign: 'center', padding: '40px 24px' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
              >
                <UsergroupAddOutlined style={{ 
                  fontSize: '56px', 
                  color: '#feca57', 
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 0 12px rgba(254, 202, 87, 0.4))'
                }} />
                <Title level={4} style={{ 
                  marginBottom: '16px', 
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>实时互动</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  文字聊天、实时同步，让距离不再是问题
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
                styles={{
                  body: { textAlign: 'center', padding: '40px 24px' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
                }}
              >
                <CoffeeOutlined style={{ 
                  fontSize: '56px', 
                  color: '#48dbfb', 
                  marginBottom: '20px',
                  filter: 'drop-shadow(0 0 12px rgba(72, 219, 251, 0.4))'
                }} />
                <Title level={4} style={{ 
                  marginBottom: '16px', 
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>温馨空间</Title>
                <Paragraph style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  margin: 0,
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  创建专属房间，邀请好友一起畅玩
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* 操作区域 */}
          <Row gutter={[40, 40]} justify="center">
            <Col xs={24} lg={11}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                styles={{
                  body: { padding: '48px 40px' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 64px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.4)';
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <PlusOutlined style={{ 
                    fontSize: '64px', 
                    color: '#ff6b6b', 
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 0 16px rgba(255, 107, 107, 0.5))'
                  }} />
                  <Title level={3} style={{ 
                    marginBottom: '12px', 
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>创建房间</Title>
                  <Paragraph style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}>
                    成为房主，邀请朋友加入你的游戏房间
                  </Paragraph>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    height: '56px', 
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 107, 107, 0.1)',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                    borderRadius: '16px',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: '14px'
                  }}>
                    点击下方按钮即可创建房间
                  </div>
                  <Button 
                    type="primary" 
                    size="large" 
                    block
                    onClick={handleCreateRoom}
                    style={{ 
                      height: '56px',
                      borderRadius: '16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #ff6b6b, #ff8e8e)',
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
                    创建房间
                  </Button>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} lg={11}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 48px rgba(0, 0, 0, 0.4)',
                  transition: 'all 0.3s ease',
                  overflow: 'hidden'
                }}
                styles={{
                  body: { padding: '48px 40px' }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 64px rgba(0, 0, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.4)';
                }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <UserAddOutlined style={{ 
                    fontSize: '64px', 
                    color: '#48dbfb', 
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 0 16px rgba(72, 219, 251, 0.5))'
                  }} />
                  <Title level={3} style={{ 
                    marginBottom: '12px', 
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: '600'
                  }}>加入房间</Title>
                  <Paragraph style={{ 
                    color: 'rgba(255, 255, 255, 0.8)', 
                    margin: 0,
                    fontSize: '16px',
                    lineHeight: '1.6'
                  }}>
                    输入房间号，快速加入朋友的游戏房间
                  </Paragraph>
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <Input
                    placeholder="输入6位房间号"
                    value={roomIdInput}
                    onChange={handleRoomIdChange}
                    style={{ 
                      height: '56px',
                      fontSize: '16px',
                      borderRadius: '16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      width: '100%',
                      marginBottom: '16px'
                    }}
                    maxLength={6}
                  />
                  <Button 
                    type="primary" 
                    size="large" 
                    block
                    onClick={handleJoinRoom}
                    style={{ 
                      height: '56px',
                      borderRadius: '16px',
                      fontSize: '18px',
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
                    加入房间
                  </Button>
                </div>
              </Card>
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
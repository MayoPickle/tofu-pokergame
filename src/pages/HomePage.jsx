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
  Space,
  message,
  Form
} from 'antd';
import socketManager from '../utils/socket';
import { storage } from '../utils/storage';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

const HomePage = () => {
  const [isNicknameModalVisible, setIsNicknameModalVisible] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [actionType, setActionType] = useState(''); // 'create' or 'join'
  const [form] = Form.useForm();

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
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff9a9e 100%)'
    }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.2)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 2px 20px rgba(255, 192, 203, 0.3)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Title level={2} style={{ 
              margin: 0, 
              color: 'white', 
              fontFamily: '"PingFang SC", "Hiragino Sans GB", sans-serif',
              fontWeight: '300',
              letterSpacing: '2px'
            }}>
              甜梦小酒管
            </Title>
          </div>
          <Button 
            type="text" 
            style={{ 
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '20px',
              padding: '4px 16px',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
            onClick={() => window.location.reload()}
          >
            首页
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {/* 欢迎区域 */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={1} style={{ 
              color: 'white', 
              marginBottom: '24px',
              fontFamily: '"PingFang SC", "Hiragino Sans GB", sans-serif',
              fontWeight: '200',
              fontSize: '3.5em',
              textShadow: '0 4px 8px rgba(255, 192, 203, 0.3)'
            }}>
              欢迎来到甜梦小酒管
            </Title>
            <Paragraph style={{ 
              fontSize: '20px', 
              color: 'rgba(255, 255, 255, 0.9)',
              maxWidth: '700px',
              margin: '0 auto',
              lineHeight: '1.8',
              fontWeight: '300'
            }}>
              在这里与好友分享美好时光，创造专属的甜蜜回忆
            </Paragraph>
          </div>

          {/* 功能特性 */}
          <Row gutter={[32, 32]} style={{ marginBottom: '60px' }}>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(255, 192, 203, 0.2)'
                }}
                bodyStyle={{ textAlign: 'center', padding: '40px 24px' }}
              >
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '40px',
                  background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(253, 203, 110, 0.4)'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '20px',
                    background: 'white'
                  }}></div>
                </div>
                <Title level={4} style={{ marginBottom: '16px', color: 'white', fontWeight: '300' }}>
                  精选小游戏
                </Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.6' }}>
                  数字炸弹等经典聚会游戏，在轻松愉快中拉近彼此距离
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(255, 192, 203, 0.2)'
                }}
                bodyStyle={{ textAlign: 'center', padding: '40px 24px' }}
              >
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '40px',
                  background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(232, 67, 147, 0.4)'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '20px',
                    background: 'white'
                  }}></div>
                </div>
                <Title level={4} style={{ marginBottom: '16px', color: 'white', fontWeight: '300' }}>
                  温馨互动
                </Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.6' }}>
                  文字聊天、实时同步，让心与心的距离更加贴近
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '20px',
                  boxShadow: '0 8px 32px rgba(255, 192, 203, 0.2)'
                }}
                bodyStyle={{ textAlign: 'center', padding: '40px 24px' }}
              >
                <div style={{ 
                  width: '80px', 
                  height: '80px', 
                  borderRadius: '40px',
                  background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 20px rgba(108, 92, 231, 0.4)'
                }}>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '20px',
                    background: 'white'
                  }}></div>
                </div>
                <Title level={4} style={{ marginBottom: '16px', color: 'white', fontWeight: '300' }}>
                  私人空间
                </Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: '1.6' }}>
                  创建专属房间，邀请好友共度美好时光
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* 操作区域 */}
          <Row gutter={[32, 32]} justify="center">
            <Col xs={24} lg={10}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(255, 192, 203, 0.3)'
                }}
                bodyStyle={{ padding: '48px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(253, 203, 110, 0.4)'
                  }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '25px',
                      background: 'white'
                    }}></div>
                  </div>
                  <Title level={3} style={{ marginBottom: '12px', color: 'white', fontWeight: '300' }}>
                    创建房间
                  </Title>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, lineHeight: '1.6' }}>
                    开启一个温馨的聚会空间，邀请朋友们一起度过美好时光
                  </Paragraph>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={handleCreateRoom}
                  style={{ 
                    height: '52px',
                    borderRadius: '26px',
                    fontSize: '16px',
                    fontWeight: '400',
                    background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                    border: 'none',
                    boxShadow: '0 6px 20px rgba(232, 67, 147, 0.4)'
                  }}
                >
                  创建房间
                </Button>
              </Card>
            </Col>
            
            <Col xs={24} lg={10}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.25)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '24px',
                  boxShadow: '0 12px 40px rgba(255, 192, 203, 0.3)'
                }}
                bodyStyle={{ padding: '48px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: '50px',
                    background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                    margin: '0 auto 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 30px rgba(108, 92, 231, 0.4)'
                  }}>
                    <div style={{ 
                      width: '50px', 
                      height: '50px', 
                      borderRadius: '25px',
                      background: 'white'
                    }}></div>
                  </div>
                  <Title level={3} style={{ marginBottom: '12px', color: 'white', fontWeight: '300' }}>
                    加入房间
                  </Title>
                  <Paragraph style={{ color: 'rgba(255, 255, 255, 0.9)', margin: 0, lineHeight: '1.6' }}>
                    输入房间号，加入朋友的温馨聚会
                  </Paragraph>
                </div>
                <Space.Compact style={{ width: '100%', marginBottom: '20px' }}>
                  <Input
                    placeholder="输入6位房间号"
                    value={roomIdInput}
                    onChange={handleRoomIdChange}
                    style={{ 
                      height: '52px',
                      fontSize: '16px',
                      borderRadius: '26px 0 0 26px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.15)'
                    }}
                    maxLength={6}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleJoinRoom}
                    style={{ 
                      height: '52px',
                      fontSize: '16px',
                      fontWeight: '400',
                      borderRadius: '0 26px 26px 0',
                      background: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
                      border: 'none',
                      boxShadow: '0 6px 20px rgba(108, 92, 231, 0.4)'
                    }}
                  >
                    加入
                  </Button>
                </Space.Compact>
              </Card>
            </Col>
          </Row>
        </div>
      </Content>

      {/* 昵称设置模态框 */}
      <Modal
        title={actionType === 'join' && roomIdInput ? `加入房间 ${roomIdInput}` : "设置昵称"}
        open={isNicknameModalVisible}
        onCancel={() => {
          setIsNicknameModalVisible(false);
          setRoomIdInput('');
          setActionType('');
          form.resetFields();
        }}
        footer={null}
        centered
        style={{ 
          borderRadius: '20px'
        }}
        modalRender={(modal) => (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 12px 40px rgba(255, 192, 203, 0.3)'
          }}>
            {modal}
          </div>
        )}
      >
        <Form
          form={form}
          onFinish={handleNicknameSubmit}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label={
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '300',
                color: '#333'
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
                borderRadius: '12px',
                height: '48px',
                fontSize: '16px',
                background: 'rgba(255, 255, 255, 0.8)'
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ 
                borderRadius: '12px',
                fontWeight: '400',
                height: '48px',
                paddingLeft: '32px',
                paddingRight: '32px',
                background: 'linear-gradient(135deg, #fd79a8, #e84393)',
                border: 'none',
                boxShadow: '0 6px 20px rgba(232, 67, 147, 0.4)'
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
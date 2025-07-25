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
import {
  PlusOutlined,
  LoginOutlined,
  RocketOutlined,
  MessageOutlined,
  HomeOutlined,
  CopyOutlined
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
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header style={{ 
        background: 'rgba(255, 255, 255, 0.1)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <RocketOutlined style={{ fontSize: '24px', color: 'white', marginRight: '12px' }} />
            <Title level={3} style={{ margin: 0, color: 'white' }}>
              游戏大厅
            </Title>
          </div>
          <Button 
            type="text" 
            style={{ color: 'white' }}
            icon={<HomeOutlined />}
            onClick={() => window.location.reload()}
          >
            首页
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          {/* 欢迎区域 */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <Title level={1} style={{ color: 'white', marginBottom: '16px' }}>
              欢迎来到游戏大厅
            </Title>
            <Paragraph style={{ 
              fontSize: '18px', 
              color: 'rgba(255, 255, 255, 0.8)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              与好友一起享受精彩的在线游戏体验，创建房间或加入好友的游戏
            </Paragraph>
          </div>

          {/* 功能特性 */}
          <Row gutter={[24, 24]} style={{ marginBottom: '48px' }}>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px'
                }}
                bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
              >
                <RocketOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4} style={{ marginBottom: '12px' }}>多样小游戏</Title>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  数字炸弹等经典聚会游戏，更多精彩持续更新
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px'
                }}
                bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
              >
                <MessageOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4} style={{ marginBottom: '12px' }}>实时互动</Title>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  文字聊天、实时同步，让距离不再是问题
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                style={{ 
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '12px'
                }}
                bodyStyle={{ textAlign: 'center', padding: '32px 24px' }}
              >
                <HomeOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={4} style={{ marginBottom: '12px' }}>私人房间</Title>
                <Paragraph style={{ color: '#666', margin: 0 }}>
                  创建专属房间，邀请好友一起畅玩
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* 操作区域 */}
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} lg={10}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                bodyStyle={{ padding: '40px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <PlusOutlined style={{ fontSize: '48px', color: '#52c41a', marginBottom: '16px' }} />
                  <Title level={3} style={{ marginBottom: '8px' }}>创建房间</Title>
                  <Paragraph style={{ color: '#666', margin: 0 }}>
                    成为房主，邀请朋友加入你的游戏房间
                  </Paragraph>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  block
                  onClick={handleCreateRoom}
                  style={{ 
                    height: '48px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500'
                  }}
                >
                  创建房间
                </Button>
              </Card>
            </Col>
            
            <Col xs={24} lg={10}>
              <Card
                style={{ 
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
                }}
                bodyStyle={{ padding: '40px' }}
              >
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <LoginOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={3} style={{ marginBottom: '8px' }}>加入房间</Title>
                  <Paragraph style={{ color: '#666', margin: 0 }}>
                    输入房间号，快速加入朋友的游戏房间
                  </Paragraph>
                </div>
                <Space.Compact style={{ width: '100%', marginBottom: '16px' }}>
                  <Input
                    placeholder="输入6位房间号"
                    value={roomIdInput}
                    onChange={handleRoomIdChange}
                    style={{ 
                      height: '48px',
                      fontSize: '16px'
                    }}
                    maxLength={6}
                  />
                  <Button 
                    type="primary" 
                    onClick={handleJoinRoom}
                    style={{ 
                      height: '48px',
                      fontSize: '16px',
                      fontWeight: '500'
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
        style={{ borderRadius: '12px' }}
      >
        <Form
          form={form}
          onFinish={handleNicknameSubmit}
          layout="vertical"
          style={{ marginTop: '16px' }}
        >
          <Form.Item
            label={actionType === 'join' && roomIdInput ? 
              `请输入昵称以加入房间 ${roomIdInput}` : 
              "请输入你的昵称"
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
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ 
                borderRadius: '8px',
                fontWeight: '500'
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
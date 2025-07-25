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
  HomeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import socketManager from '../utils/socket';
import { storage } from '../utils/storage';
import NumberBombGame from '../components/NumberBombGame';
import UserList from '../components/UserList';
import ChatPanel from '../components/ChatPanel';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const RoomPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 获取用户信息
    const storedUserInfo = storage.getUserInfo();
    if (!storedUserInfo) {
      message.error('没有用户信息，请先创建或加入房间');
      window.location.href = '/';
      return;
    }

    setUserInfo(storedUserInfo);
    
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
        isHost: data.isHost
      };
      setUserInfo(updatedUserInfo);
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
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <div>正在连接房间...</div>
        </Content>
      </Layout>
    );
  }

      return (
      <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Header 
          style={{ 
            background: 'white',
            borderBottom: '1px solid #f0f0f0',
            padding: '16px 24px',
            height: 'auto',
            lineHeight: 'normal'
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            minHeight: '48px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <Title level={4} style={{ margin: 0, marginRight: '12px' }}>游戏房间</Title>
                <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                  {userInfo.roomId}
                </Tag>
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <TeamOutlined style={{ marginRight: '4px' }} />
                在线玩家: {users.length} 人
              </div>
            </div>
            <Space>
              <Tooltip title="复制房间链接">
                <Button 
                  icon={<CopyOutlined />}
                  onClick={copyRoomLink}
                >
                  复制链接
                </Button>
              </Tooltip>
              <Tooltip title="返回首页">
                <Button 
                  icon={<HomeOutlined />}
                  onClick={goHome}
                >
                  首页
                </Button>
              </Tooltip>
              <Tooltip title="离开房间">
                <Button 
                  danger
                  icon={<LogoutOutlined />}
                  onClick={leaveRoom}
                >
                  离开房间
                </Button>
              </Tooltip>
            </Space>
          </div>
        </Header>

      <Layout style={{ background: '#f0f2f5' }}>
        <Content style={{ padding: '24px' }}>
          <Row gutter={24} style={{ height: '100%' }}>
            <Col xs={24} lg={16}>
              <NumberBombGame 
                userInfo={userInfo} 
                isHost={userInfo.isHost} 
              />
            </Col>
            
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <UserList 
                  users={users} 
                  playerCount={users.length}
                  currentUserId={userInfo.userId}
                />
                
                <ChatPanel 
                  userInfo={userInfo} 
                />
              </Space>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
};

export default RoomPage; 
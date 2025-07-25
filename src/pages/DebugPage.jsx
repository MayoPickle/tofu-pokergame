import React, { useState, useEffect, useRef } from 'react';
import {
  Layout,
  Card,
  Button,
  Input,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  message,
  Divider
} from 'antd';
import {
  BugOutlined,
  DeleteOutlined,
  ReloadOutlined,
  HomeOutlined,
  WifiOutlined,
  DatabaseOutlined,
  PlayCircleOutlined,
  UserAddOutlined,
  LinkOutlined
} from '@ant-design/icons';
import socketManager from '../utils/socket';
import { storage } from '../utils/storage';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const DebugPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState([]);
  const [nickname, setNickname] = useState('测试用户');
  const [roomId, setRoomId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    // 初始化
    updateLocalStorageStatus();
    addLog('调试工具已加载', 'info');

    // 连接Socket
    socketManager.connect();

    // Socket事件监听
    socketManager.on('connect', () => {
      setIsConnected(true);
      addLog('Socket.io 连接成功', 'success');
    });

    socketManager.on('disconnect', () => {
      setIsConnected(false);
      addLog('Socket.io 连接断开', 'error');
    });

    socketManager.on('roomCreated', (data) => {
      addLog(`✅ 房间创建成功: ${JSON.stringify(data)}`, 'success');
      const newUserInfo = {
        userId: data.userId,
        roomId: data.roomId,
        userNumber: data.userNumber,
        isHost: data.isHost,
        nickname: nickname
      };
      storage.setUserInfo(newUserInfo);
      updateLocalStorageStatus();
    });

    socketManager.on('roomJoined', (data) => {
      addLog(`✅ 加入房间成功: ${JSON.stringify(data)}`, 'success');
      updateLocalStorageStatus();
    });

    socketManager.on('error', (error) => {
      addLog(`❌ 错误: ${error}`, 'error');
    });

    socketManager.on('userListUpdate', (users) => {
      addLog(`👥 用户列表更新: ${users.length} 人在线`);
      users.forEach(user => {
        addLog(`  - ${user.nickname} (${user.number}) ${user.isHost ? '[房主]' : ''}`);
      });
    });

    socketManager.on('chatMessage', (data) => {
      if (data.type === 'system') {
        addLog(`📢 系统消息: ${data.message}`);
      } else {
        addLog(`💬 ${data.nickname}: ${data.message}`);
      }
    });

    return () => {
      socketManager.off('connect');
      socketManager.off('disconnect');
      socketManager.off('roomCreated');
      socketManager.off('roomJoined');
      socketManager.off('error');
      socketManager.off('userListUpdate');
      socketManager.off('chatMessage');
    };
  }, [nickname]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { 
      id: Date.now() + Math.random(),
      timestamp, 
      message, 
      type 
    }]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const updateLocalStorageStatus = () => {
    const userInfo = storage.getUserInfo();
    setUserInfo(userInfo);
  };

  const clearStorage = () => {
    storage.clearUserInfo();
    updateLocalStorageStatus();
    addLog('已清空 localStorage', 'success');
  };

  const testCreateRoom = () => {
    if (!nickname.trim()) {
      addLog('请输入昵称', 'error');
      return;
    }
    addLog(`开始创建房间，昵称: ${nickname}`);
    socketManager.emit('createRoom', { nickname: nickname.trim() });
  };

  const testJoinRoom = () => {
    if (!roomId.trim() || !nickname.trim()) {
      addLog('请输入房间号和昵称', 'error');
      return;
    }
    const formattedRoomId = roomId.trim().toUpperCase();
    addLog(`开始加入房间，房间号: ${formattedRoomId}, 昵称: ${nickname}`);
    socketManager.emit('joinRoom', { 
      roomId: formattedRoomId, 
      nickname: nickname.trim() 
    });
  };

  const testReconnect = () => {
    if (!userInfo) {
      addLog('没有用户信息，无法重连', 'error');
      return;
    }
    addLog(`开始重连，房间号: ${userInfo.roomId}, 用户ID: ${userInfo.userId}`);
    socketManager.emit('reconnectToRoom', {
      roomId: userInfo.roomId,
      userId: userInfo.userId,
      nickname: userInfo.nickname || '玩家'
    });
  };

  const goToMainPage = () => {
    window.location.href = '/';
  };

  const renderLog = (log) => {
    const getColor = (type) => {
      switch (type) {
        case 'error': return '#ff4d4f';
        case 'success': return '#52c41a';
        case 'warning': return '#faad14';
        default: return '#333';
      }
    };

    return (
      <div 
        key={log.id}
        style={{ 
          fontSize: '12px',
          fontFamily: 'monospace',
          color: getColor(log.type),
          marginBottom: '4px'
        }}
      >
        [{log.timestamp}] {log.message}
      </div>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ 
        background: 'white',
        borderBottom: '1px solid #f0f0f0',
        padding: '0 24px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          height: '100%'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <BugOutlined style={{ fontSize: '24px', color: '#1890ff', marginRight: '12px' }} />
            <Title level={3} style={{ margin: 0 }}>
              调试工具
            </Title>
          </div>
          <Button 
            icon={<HomeOutlined />}
            onClick={goToMainPage}
          >
            返回首页
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        <Row gutter={[24, 24]}>
          {/* 连接状态 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <WifiOutlined />
                  <span>连接状态</span>
                </Space>
              }
              size="small"
            >
              <Tag 
                color={isConnected ? 'success' : 'error'}
                style={{ fontSize: '14px', padding: '4px 12px' }}
              >
                {isConnected ? '✅ 已连接到服务器' : '❌ 连接断开'}
              </Tag>
            </Card>
          </Col>

          {/* localStorage 状态 */}
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <DatabaseOutlined />
                  <span>localStorage 状态</span>
                </Space>
              }
              size="small"
              extra={
                <Button 
                  size="small" 
                  danger 
                  onClick={clearStorage}
                  icon={<DeleteOutlined />}
                >
                  清空
                </Button>
              }
            >
              {userInfo ? (
                <div style={{ fontSize: '12px' }}>
                  <div><strong>用户ID:</strong> {userInfo.userId}</div>
                  <div><strong>房间号:</strong> {userInfo.roomId}</div>
                  <div><strong>昵称:</strong> {userInfo.nickname || '未知'}</div>
                  <div><strong>是否房主:</strong> {userInfo.isHost ? '是' : '否'}</div>
                </div>
              ) : (
                <Text type="secondary">无用户信息</Text>
              )}
            </Card>
          </Col>

          {/* 房间操作测试 */}
          <Col xs={24}>
            <Card 
              title={
                <Space>
                  <PlayCircleOutlined />
                  <span>房间操作测试</span>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="昵称"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    prefix={<UserAddOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Input
                    placeholder="房间号"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    maxLength={6}
                    prefix={<LinkOutlined />}
                  />
                </Col>
                <Col xs={24} sm={8}>
                  <Space wrap>
                    <Button type="primary" onClick={testCreateRoom}>
                      创建房间
                    </Button>
                    <Button onClick={testJoinRoom}>
                      加入房间
                    </Button>
                    <Button onClick={testReconnect}>
                      重连
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 日志输出 */}
          <Col xs={24}>
            <Card 
              title={
                <Space>
                  <BugOutlined />
                  <span>日志输出</span>
                </Space>
              }
              extra={
                <Button 
                  size="small" 
                  danger 
                  onClick={clearLogs}
                  icon={<DeleteOutlined />}
                >
                  清空日志
                </Button>
              }
            >
              <div
                style={{
                  background: '#f5f5f5',
                  padding: '12px',
                  borderRadius: '6px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  border: '1px solid #d9d9d9'
                }}
              >
                {logs.map(renderLog)}
                <div ref={logsEndRef} />
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default DebugPage; 
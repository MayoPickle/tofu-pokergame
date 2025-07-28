import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Input, 
  List, 
  Typography, 
  message, 
  Modal,
  Tag,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  CrownOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons';
import socketManager from '../utils/socket';

const { Text } = Typography;

const HostPlayerManager = ({ userList, isHost }) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [loading, setLoading] = useState(false);

  const addVirtualPlayer = async () => {
    if (!newPlayerName.trim()) {
      message.warning('请输入参与者名称');
      return;
    }

    if (newPlayerName.trim().length > 20) {
      message.warning('名称不能超过20个字符');
      return;
    }

    setLoading(true);
    try {
      socketManager.emit('addVirtualPlayer', { 
        nickname: newPlayerName.trim() 
      });
      
      // 监听添加成功
      const handleSuccess = () => {
        message.success('参与者添加成功');
        setNewPlayerName('');
        setIsAddModalVisible(false);
        setLoading(false);
        socketManager.off('virtualPlayerAdded', handleSuccess);
        socketManager.off('error', handleError);
      };

      const handleError = (error) => {
        message.error(error || '添加参与者失败');
        setLoading(false);
        socketManager.off('virtualPlayerAdded', handleSuccess);
        socketManager.off('error', handleError);
      };

      socketManager.on('virtualPlayerAdded', handleSuccess);
      socketManager.on('error', handleError);

    } catch (error) {
      console.error('添加虚拟参与者失败:', error);
      message.error('添加参与者失败');
      setLoading(false);
    }
  };

  const removeVirtualPlayer = (playerId) => {
    socketManager.emit('removeVirtualPlayer', { playerId });
    
    const handleSuccess = () => {
      message.success('参与者移除成功');
      socketManager.off('virtualPlayerRemoved', handleSuccess);
      socketManager.off('error', handleError);
    };

    const handleError = (error) => {
      message.error(error || '移除参与者失败');
      socketManager.off('virtualPlayerRemoved', handleSuccess);
      socketManager.off('error', handleError);
    };

    socketManager.on('virtualPlayerRemoved', handleSuccess);
    socketManager.on('error', handleError);
  };

  if (!isHost) {
    return null;
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CrownOutlined style={{ 
            color: '#ffd700', 
            fontSize: '20px', 
            marginRight: '8px' 
          }} />
          <span style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
            参与者管理
          </span>
        </div>
      }
      style={{
        background: 'rgba(255, 215, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 215, 0, 0.3)',
        borderRadius: '16px',
        marginBottom: '20px'
      }}
      styles={{
        header: {
          background: 'rgba(255, 215, 0, 0.1)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          borderRadius: '16px 16px 0 0'
        },
        body: { padding: '20px' }
      }}
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalVisible(true)}
          style={{
            background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
            border: 'none',
            color: '#8B4513',
            fontWeight: '600',
            borderRadius: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 215, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          添加参与者
        </Button>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '14px' 
        }}>
          主持人模式：您可以手动添加和管理参与者名单
        </Text>
      </div>

      <List
        dataSource={userList}
        renderItem={(user) => (
          <List.Item
            style={{
              background: user.isVirtual 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 215, 0, 0.1)',
              border: `1px solid ${user.isVirtual 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(255, 215, 0, 0.2)'}`,
              borderRadius: '8px',
              marginBottom: '8px',
              padding: '12px 16px'
            }}
            actions={user.isVirtual ? [
              <Popconfirm
                title="确定要移除此参与者吗？"
                onConfirm={() => removeVirtualPlayer(user.id)}
                okText="确定"
                cancelText="取消"
                key="delete"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  size="small"
                  style={{ color: '#ff4d4f' }}
                />
              </Popconfirm>
            ] : []}
          >
            <List.Item.Meta
              avatar={
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: user.isHost 
                    ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                    : user.isVirtual
                      ? 'linear-gradient(135deg, #48dbfb, #6bb6ff)'
                      : 'linear-gradient(135deg, #ff6b9d, #ff8fab)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: user.isHost ? '#8B4513' : 'white',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  {user.isHost ? (
                    <CrownOutlined />
                  ) : user.isVirtual ? (
                    <RobotOutlined />
                  ) : (
                    <UserOutlined />
                  )}
                </div>
              }
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: '600',
                    fontSize: '16px'
                  }}>
                    {user.nickname}
                  </span>
                  <Tag 
                    color={user.isHost ? 'gold' : user.isVirtual ? 'blue' : 'pink'}
                    style={{ 
                      fontSize: '12px',
                      borderRadius: '4px',
                      fontWeight: '500'
                    }}
                  >
                    #{user.number}
                  </Tag>
                  {user.isHost && (
                    <Tag 
                      color="gold" 
                      style={{ 
                        fontSize: '11px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      主持人
                    </Tag>
                  )}
                  {user.isVirtual && (
                    <Tag 
                      color="blue" 
                      style={{ 
                        fontSize: '11px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}
                    >
                      虚拟
                    </Tag>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
        locale={{
          emptyText: (
            <div style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              padding: '20px',
              textAlign: 'center'
            }}>
              暂无参与者，点击上方按钮添加
            </div>
          )
        }}
      />

      {/* 添加参与者模态框 */}
      <Modal
        title={
          <div style={{ color: 'white', display: 'flex', alignItems: 'center' }}>
            <PlusOutlined style={{ 
              color: '#ffd700', 
              fontSize: '18px', 
              marginRight: '8px' 
            }} />
            添加参与者
          </div>
        }
        open={isAddModalVisible}
        onOk={addVirtualPlayer}
        onCancel={() => {
          setIsAddModalVisible(false);
          setNewPlayerName('');
        }}
        okText="添加"
        cancelText="取消"
        confirmLoading={loading}
        centered
        styles={{
          mask: { backdropFilter: 'blur(8px)' },
          content: {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '16px'
          },
          header: {
            background: 'rgba(26, 26, 46, 0.95)',
            borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '16px 16px 0 0'
          },
          body: {
            background: 'rgba(26, 26, 46, 0.95)'
          }
        }}
        okButtonProps={{
          style: {
            background: 'linear-gradient(135deg, #ffd700, #ffed4e)',
            border: 'none',
            color: '#8B4513',
            fontWeight: '600'
          }
        }}
      >
        <div style={{ marginTop: '20px' }}>
          <Text style={{ 
            color: 'rgba(255, 255, 255, 0.9)', 
            fontSize: '16px',
            fontWeight: '500',
            display: 'block',
            marginBottom: '12px'
          }}>
            参与者名称
          </Text>
          <Input
            placeholder="输入参与者名称 (1-20个字符)"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            maxLength={20}
            style={{
              borderRadius: '8px',
              height: '40px',
              fontSize: '16px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              color: 'white'
            }}
            onPressEnter={addVirtualPlayer}
          />
          <Text style={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: '13px',
            marginTop: '8px',
            display: 'block'
          }}>
            💡 提示：虚拟参与者将自动分配号码牌
          </Text>
        </div>
      </Modal>
    </Card>
  );
};

export default HostPlayerManager;
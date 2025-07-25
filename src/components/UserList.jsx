import React from 'react';
import { Card, List, Avatar, Tag, Typography, Badge } from 'antd';
import { UserOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons';

const { Text } = Typography;

const UserList = ({ users, playerCount, currentUserId }) => {
  const getAvatarColor = (userNumber) => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#87d068', '#ff85c0'];
    return colors[userNumber % colors.length];
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <UserOutlined style={{ marginRight: '8px' }} />
          <span>在线玩家 ({playerCount})</span>
        </div>
      }
      size="small"
    >
      <List
        dataSource={users}
        renderItem={(user) => {
          const isCurrentUser = user.id === currentUserId;
          return (
            <List.Item style={{ 
              padding: '8px 0', 
              border: 'none',
              backgroundColor: isCurrentUser ? '#f0f8ff' : 'transparent',
              borderRadius: isCurrentUser ? '6px' : '0',
              marginBottom: '4px'
            }}>
              <List.Item.Meta
                avatar={
                  <Badge 
                    count={user.number} 
                    style={{ 
                      backgroundColor: getAvatarColor(user.number),
                      fontSize: '10px',
                      minWidth: '16px',
                      height: '16px',
                      lineHeight: '16px'
                    }}
                  >
                    <Avatar 
                      style={{ 
                        backgroundColor: getAvatarColor(user.number),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }} 
                      size="small"
                    >
                      {user.nickname?.charAt(0) || user.number}
                    </Avatar>
                  </Badge>
                }
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text style={{ 
                      fontSize: '14px',
                      fontWeight: isCurrentUser ? 'bold' : 'normal'
                    }}>
                      {user.nickname || `玩家${user.number}`}
                    </Text>
                    {isCurrentUser && (
                      <Tag 
                        icon={<StarOutlined />}
                        color="blue"
                        style={{ 
                          fontSize: '11px',
                          lineHeight: '16px',
                          height: '18px'
                        }}
                      >
                        我
                      </Tag>
                    )}
                    {user.isHost && (
                      <Tag 
                        icon={<CrownOutlined />}
                        color="gold"
                        style={{ 
                          fontSize: '11px',
                          lineHeight: '16px',
                          height: '18px'
                        }}
                      >
                        房主
                      </Tag>
                    )}
                  </div>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default UserList; 
import React from 'react';
import { List, Avatar, Tag, Typography, Badge } from 'antd';
import { UsergroupAddOutlined, CrownOutlined, StarOutlined } from '@ant-design/icons';

const { Text } = Typography;

const UserList = ({ users, playerCount, currentUserId }) => {
  const getAvatarColor = (userNumber) => {
    const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
    return colors[userNumber % colors.length];
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: '16px',
        color: 'white'
      }}>
        <UsergroupAddOutlined style={{ 
          marginRight: '8px', 
          fontSize: '18px',
          color: '#feca57',
          filter: 'drop-shadow(0 0 6px rgba(254, 202, 87, 0.4))'
        }} />
        <span style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          background: 'linear-gradient(45deg, #feca57, #ff6b6b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          在线玩家 ({playerCount})
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const avatarColor = getAvatarColor(user.number);
          
          return (
            <div 
              key={user.id}
              style={{ 
                padding: '16px', 
                background: isCurrentUser 
                  ? 'rgba(255, 107, 107, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                border: isCurrentUser 
                  ? '1px solid rgba(255, 107, 107, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s ease',
                cursor: 'default',
                boxShadow: isCurrentUser 
                  ? '0 0 20px rgba(255, 107, 107, 0.2)'
                  : '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}
              onMouseEnter={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* 头像区域 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar 
                    style={{ 
                      background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: '16px',
                      boxShadow: `0 0 16px ${avatarColor}40`,
                      border: `2px solid ${avatarColor}60`
                    }} 
                    size={48}
                  >
                    {user.nickname?.charAt(0)?.toUpperCase() || user.number}
                  </Avatar>
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: `0 0 12px ${avatarColor}60`,
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {user.number}
                  </div>
                </div>

                {/* 用户信息区域 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: '16px',
                    fontWeight: isCurrentUser ? '600' : '500',
                    color: 'white',
                    marginBottom: '6px',
                    wordBreak: 'break-word'
                  }}>
                    {user.nickname || `玩家${user.number}`}
                  </div>
                  
                  {/* 标签区域 */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {isCurrentUser && (
                      <Tag 
                        icon={<StarOutlined />}
                        style={{ 
                          fontSize: '11px',
                          height: '22px',
                          lineHeight: '20px',
                          background: 'rgba(72, 219, 251, 0.2)',
                          border: '1px solid rgba(72, 219, 251, 0.5)',
                          color: '#48dbfb',
                          borderRadius: '8px',
                          padding: '0 8px',
                          margin: 0
                        }}
                      >
                        我
                      </Tag>
                    )}
                    {user.isHost && (
                      <Tag 
                        icon={<CrownOutlined />}
                        style={{ 
                          fontSize: '11px',
                          height: '22px',
                          lineHeight: '20px',
                          background: 'rgba(254, 202, 87, 0.2)',
                          border: '1px solid rgba(254, 202, 87, 0.5)',
                          color: '#feca57',
                          borderRadius: '8px',
                          padding: '0 8px',
                          margin: 0
                        }}
                      >
                        房主
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UserList; 
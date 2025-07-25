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
      
      <div 
        style={{ 
          maxHeight: users.length > 6 ? '320px' : 'auto',
          overflowY: users.length > 6 ? 'auto' : 'visible',
          display: 'flex', 
          flexDirection: 'column', 
          gap: users.length > 8 ? '8px' : '12px',
          paddingRight: users.length > 6 ? '4px' : '0',
          scrollBehavior: 'smooth'
        }}
      >
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;
          const avatarColor = getAvatarColor(user.number);
          const compactMode = users.length > 8;
          
          return (
            <div 
              key={user.id}
              style={{ 
                padding: compactMode ? '12px' : '16px', 
                background: isCurrentUser 
                  ? 'rgba(255, 107, 107, 0.15)' 
                  : 'rgba(255, 255, 255, 0.05)',
                borderRadius: compactMode ? '12px' : '16px',
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
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isCurrentUser) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: compactMode ? '12px' : '16px' }}>
                {/* 头像区域 */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar 
                    style={{ 
                      background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      fontSize: compactMode ? '14px' : '16px',
                      boxShadow: `0 0 ${compactMode ? '12px' : '16px'} ${avatarColor}40`,
                      border: `2px solid ${avatarColor}60`
                    }} 
                    size={compactMode ? 40 : 48}
                  >
                    {user.nickname?.charAt(0)?.toUpperCase() || user.number}
                  </Avatar>
                  <div style={{
                    position: 'absolute',
                    top: compactMode ? '-6px' : '-8px',
                    right: compactMode ? '-6px' : '-8px',
                    background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                    color: 'white',
                    borderRadius: '50%',
                    width: compactMode ? '20px' : '24px',
                    height: compactMode ? '20px' : '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: compactMode ? '10px' : '12px',
                    fontWeight: '700',
                    boxShadow: `0 0 ${compactMode ? '8px' : '12px'} ${avatarColor}60`,
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {user.number}
                  </div>
                </div>

                {/* 用户信息区域 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ 
                    fontSize: compactMode ? '14px' : '16px',
                    fontWeight: isCurrentUser ? '600' : '500',
                    color: 'white',
                    marginBottom: compactMode ? '4px' : '6px',
                    wordBreak: 'break-word',
                    lineHeight: '1.2'
                  }}>
                    {user.nickname || `玩家${user.number}`}
                  </div>
                  
                  {/* 标签区域 */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {isCurrentUser && (
                      <Tag 
                        icon={<StarOutlined />}
                        style={{ 
                          fontSize: compactMode ? '10px' : '11px',
                          height: compactMode ? '18px' : '22px',
                          lineHeight: compactMode ? '16px' : '20px',
                          background: 'rgba(72, 219, 251, 0.2)',
                          border: '1px solid rgba(72, 219, 251, 0.5)',
                          color: '#48dbfb',
                          borderRadius: '6px',
                          padding: compactMode ? '0 6px' : '0 8px',
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
                          fontSize: compactMode ? '10px' : '11px',
                          height: compactMode ? '18px' : '22px',
                          lineHeight: compactMode ? '16px' : '20px',
                          background: 'rgba(254, 202, 87, 0.2)',
                          border: '1px solid rgba(254, 202, 87, 0.5)',
                          color: '#feca57',
                          borderRadius: '6px',
                          padding: compactMode ? '0 6px' : '0 8px',
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
        
        {/* 滚动提示 */}
        {users.length > 6 && (
          <div style={{
            textAlign: 'center',
            padding: '8px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px',
            fontStyle: 'italic'
          }}>
            {users.length > 8 ? '滚动查看更多玩家' : `共 ${users.length} 位玩家`}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserList; 
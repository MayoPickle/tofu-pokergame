import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Tag } from 'antd';
import { UsergroupAddOutlined, SendOutlined } from '@ant-design/icons';
import socketManager from '../utils/socket';

const { Text } = Typography;

const ChatPanel = ({ userInfo }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 监听聊天消息
    socketManager.on('chatMessage', (data) => {
      console.log('💬 收到聊天消息:', data);
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        ...data,
        timestamp: new Date()
      }]);
    });

    return () => {
      socketManager.off('chatMessage');
    };
  }, []);

  const sendMessage = () => {
    const message = inputValue.trim();
    if (!message) return;

    console.log('💬 发送聊天消息:', message);
    socketManager.emit('chatMessage', {
      message,
      nickname: userInfo.nickname || `玩家${userInfo.userNumber}`
    });

    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (msg) => {
    if (msg.type === 'system') {
      return (
        <div key={msg.id} style={{ 
          textAlign: 'center', 
          margin: '20px 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(72, 219, 251, 0.3), transparent)'
          }} />
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(72, 219, 251, 0.1)',
            padding: '8px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(72, 219, 251, 0.3)'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#48dbfb',
              boxShadow: '0 0 8px rgba(72, 219, 251, 0.6)'
            }} />
            <Text style={{ 
              fontSize: '13px',
              color: '#48dbfb',
              fontWeight: '500'
            }}>
              {msg.message}
            </Text>
          </div>
          <div style={{
            flex: 1,
            height: '1px',
            background: 'linear-gradient(to left, transparent, rgba(72, 219, 251, 0.3), transparent)'
          }} />
        </div>
      );
    }

    const isOwnMessage = msg.userId === userInfo.userId;
    const avatarColors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'];
    const userColor = avatarColors[(msg.userNumber || 1) % avatarColors.length];

    return (
      <div 
        key={msg.id}
        style={{ 
          margin: '18px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        {/* 消息头部信息 */}
        <div style={{ 
          fontSize: '12px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row'
        }}>
          {!isOwnMessage && (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ 
                  background: `linear-gradient(135deg, ${userColor}, ${userColor}dd)`,
                  color: 'white',
                  padding: '3px 8px',
                  borderRadius: '10px',
                  fontSize: '11px',
                  fontWeight: '700',
                  boxShadow: `0 0 8px ${userColor}40`,
                  minWidth: '24px',
                  textAlign: 'center'
                }}>
                  {msg.userNumber || '?'}
                </span>
                <span style={{ fontWeight: '500', color: userColor }}>
                  {msg.nickname}
                </span>
              </div>
              <span style={{ opacity: 0.7 }}>•</span>
            </>
          )}
          {isOwnMessage && (
            <span style={{ fontWeight: '500', color: 'rgba(255, 255, 255, 0.8)' }}>
              我
            </span>
          )}
          <span>{formatTime(msg.timestamp)}</span>
        </div>

        {/* 消息气泡 */}
        <div
          style={{
            maxWidth: '80%',
            padding: '12px 16px',
            borderRadius: isOwnMessage ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isOwnMessage 
              ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' 
              : 'rgba(255, 255, 255, 0.12)',
            color: 'white',
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            backdropFilter: 'blur(15px)',
            border: isOwnMessage 
              ? 'none' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isOwnMessage 
              ? '0 8px 24px rgba(255, 107, 107, 0.25)' 
              : '0 8px 24px rgba(0, 0, 0, 0.15)',
            minWidth: '40px'
          }}
        >
          {msg.message}
        </div>
      </div>
    );
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
          color: '#48dbfb',
          filter: 'drop-shadow(0 0 6px rgba(72, 219, 251, 0.4))'
        }} />
        <span style={{ 
          fontSize: '16px', 
          fontWeight: '600',
          background: 'linear-gradient(45deg, #48dbfb, #feca57)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          聊天室
        </span>
      </div>
      
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            marginBottom: '16px',
            padding: '8px 0',
            background: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            scrollBehavior: 'smooth'
          }}
        >
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '15px',
              textAlign: 'center',
              padding: '40px 20px'
            }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '16px',
                opacity: 0.4,
                background: 'linear-gradient(135deg, #48dbfb, #feca57)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>💬</div>
              <div style={{ 
                fontSize: '16px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                欢迎来到聊天室
              </div>
              <div style={{ 
                fontSize: '13px', 
                opacity: 0.7,
                lineHeight: '1.5'
              }}>
                和其他玩家一起聊天吧<br/>
                按回车键快速发送消息
              </div>
            </div>
          ) : (
            <div style={{ padding: '12px 16px' }}>
              {messages.map(renderMessage)}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <Input.TextArea
              placeholder="输入消息... (按回车发送)"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={200}
              autoSize={{ minRows: 1, maxRows: 3 }}
              style={{
                flex: 1,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '14px',
                resize: 'none'
              }}
            />
            <Button 
              icon={<SendOutlined />}
              onClick={sendMessage}
              disabled={!inputValue.trim()}
              style={{
                borderRadius: '12px',
                background: inputValue.trim() 
                  ? 'linear-gradient(135deg, #48dbfb, #6bb6ff)' 
                  : 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: 'white',
                height: '40px',
                minWidth: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                boxShadow: inputValue.trim() 
                  ? '0 4px 12px rgba(72, 219, 251, 0.3)' 
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (inputValue.trim()) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(72, 219, 251, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (inputValue.trim()) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(72, 219, 251, 0.3)';
                }
              }}
            />
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <span>💡 提示: 按回车键发送消息</span>
            <span>{inputValue.length}/200</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 
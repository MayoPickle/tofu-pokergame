import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Typography, Tag, Space } from 'antd';
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
        <div key={msg.id} style={{ textAlign: 'center', margin: '12px 0' }}>
          <Tag style={{ 
            fontSize: '12px',
            background: 'rgba(72, 219, 251, 0.2)',
            border: '1px solid rgba(72, 219, 251, 0.5)',
            color: '#48dbfb',
            borderRadius: '8px'
          }}>
            系统消息
          </Tag>
          <Text style={{ 
            fontSize: '12px', 
            marginLeft: '8px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            {msg.message}
          </Text>
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
          margin: '12px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        <div style={{ 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.6)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          {!isOwnMessage && (
            <>
              <span style={{ 
                background: `linear-gradient(135deg, ${userColor}, ${userColor}dd)`,
                color: 'white',
                padding: '2px 6px',
                borderRadius: '6px',
                fontSize: '10px',
                fontWeight: '600',
                boxShadow: `0 0 6px ${userColor}40`
              }}>
                {msg.userNumber || '?'}
              </span>
              <span style={{ fontWeight: '500' }}>{msg.nickname}</span>
            </>
          )}
          <span>{formatTime(msg.timestamp)}</span>
        </div>
        <div
          style={{
            maxWidth: '75%',
            padding: '10px 14px',
            borderRadius: '16px',
            background: isOwnMessage 
              ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' 
              : 'rgba(255, 255, 255, 0.1)',
            color: 'white',
            fontSize: '14px',
            wordBreak: 'break-word',
            backdropFilter: 'blur(10px)',
            border: isOwnMessage 
              ? 'none' 
              : '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: isOwnMessage 
              ? '0 4px 12px rgba(255, 107, 107, 0.3)' 
              : '0 4px 12px rgba(0, 0, 0, 0.2)'
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
      
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            marginBottom: '16px',
            padding: '4px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)'
          }}
        >
          {messages.length === 0 ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '14px'
            }}>
              还没有消息，开始聊天吧～
            </div>
          ) : (
            messages.map(renderMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Input
              placeholder="输入消息..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={200}
              style={{
                flex: 1,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white'
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
                height: '32px',
                width: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel; 
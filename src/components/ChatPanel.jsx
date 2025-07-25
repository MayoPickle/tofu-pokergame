import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, Typography, Tag, Space } from 'antd';
import { MessageOutlined, SendOutlined } from '@ant-design/icons';
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
        <div key={msg.id} style={{ textAlign: 'center', margin: '8px 0' }}>
          <Tag color="blue" style={{ fontSize: '12px' }}>
            系统消息
          </Tag>
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
            {msg.message}
          </Text>
        </div>
      );
    }

    const isOwnMessage = msg.userId === userInfo.userId;

    return (
      <div 
        key={msg.id}
        style={{ 
          margin: '8px 0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwnMessage ? 'flex-end' : 'flex-start'
        }}
      >
        <div style={{ 
          fontSize: '11px', 
          color: '#999',
          marginBottom: '2px'
        }}>
          {!isOwnMessage && (
            <>
              <span style={{ 
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '1px 4px',
                borderRadius: '3px',
                fontSize: '10px',
                marginRight: '4px'
              }}>
                {msg.userNumber || '?'}
              </span>
              {msg.nickname}
            </>
          )} {formatTime(msg.timestamp)}
        </div>
        <div
          style={{
            maxWidth: '70%',
            padding: '6px 12px',
            borderRadius: '12px',
            backgroundColor: isOwnMessage ? '#1890ff' : '#f0f0f0',
            color: isOwnMessage ? 'white' : '#333',
            fontSize: '14px',
            wordBreak: 'break-word'
          }}
        >
          {msg.message}
        </div>
      </div>
    );
  };

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <MessageOutlined style={{ marginRight: '8px' }} />
          <span>聊天室</span>
        </div>
      }
      size="small"
      bodyStyle={{ padding: '12px' }}
    >
      <div style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
        <div 
          style={{ 
            flex: 1, 
            overflowY: 'auto',
            marginBottom: '12px',
            padding: '0 4px'
          }}
        >
          {messages.map(renderMessage)}
          <div ref={messagesEndRef} />
        </div>
        
        <div>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入消息..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              maxLength={200}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={sendMessage}
            />
          </Space.Compact>
        </div>
      </div>
    </Card>
  );
};

export default ChatPanel; 
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import HomePage from './pages/HomePage';
import 'antd/dist/reset.css';

// 自定义主题配置
const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 8,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  components: {
    Card: {
      borderRadiusLG: 12,
    },
    Button: {
      borderRadius: 8,
    },
    Input: {
      borderRadius: 8,
    },
    Modal: {
      borderRadiusLG: 12,
    }
  }
};

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <ConfigProvider locale={zhCN} theme={theme}>
    <HomePage />
  </ConfigProvider>
); 
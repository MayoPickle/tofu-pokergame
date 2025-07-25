// localStorage 管理工具
export const storage = {
  // 获取用户信息
  getUserInfo() {
    try {
      const userInfo = localStorage.getItem('userInfo');
      return userInfo ? JSON.parse(userInfo) : null;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return null;
    }
  },

  // 保存用户信息
  setUserInfo(userInfo) {
    try {
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      return true;
    } catch (error) {
      console.error('保存用户信息失败:', error);
      return false;
    }
  },

  // 清除用户信息
  clearUserInfo() {
    try {
      localStorage.removeItem('userInfo');
      return true;
    } catch (error) {
      console.error('清除用户信息失败:', error);
      return false;
    }
  },

  // 更新用户信息的某个字段
  updateUserInfo(updates) {
    const currentUserInfo = this.getUserInfo();
    if (currentUserInfo) {
      const updatedUserInfo = { ...currentUserInfo, ...updates };
      return this.setUserInfo(updatedUserInfo);
    }
    return false;
  }
}; 
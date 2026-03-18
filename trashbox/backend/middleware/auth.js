/**
 * JWT 认证中间件
 * 处理用户身份验证和授权
 */

const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');

// JWT 密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * 生成 JWT Token
 * @param {Object} payload - 包含用户信息的载荷
 * @returns {string} JWT Token
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * 验证 JWT Token
 * @param {string} token - JWT Token
 * @returns {Object} 解码后的载荷
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * JWT 认证中间件
 * 验证请求中的 Authorization header
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new AppError('未提供认证令牌', 401, 'MISSING_TOKEN');
    }

    // 支持 "Bearer <token>" 格式
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new AppError('认证令牌格式错误', 401, 'INVALID_TOKEN_FORMAT');
    }

    const token = parts[1];
    const decoded = verifyToken(token);
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AppError('无效的认证令牌', 401, 'INVALID_TOKEN'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AppError('认证令牌已过期', 401, 'TOKEN_EXPIRED'));
    } else {
      next(error);
    }
  }
};

/**
 * 可选认证中间件
 * 有 Token 则解析，没有也不报错
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const token = parts[1];
        const decoded = verifyToken(token);
        req.user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // 可选认证不报错，继续处理
    next();
  }
};

/**
 * 角色授权中间件
 * 检查用户是否具有指定角色
 * @param {...string} allowedRoles - 允许的角色列表
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('未登录', 401, 'UNAUTHORIZED'));
    }

    const userRole = req.user.role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      return next(new AppError('权限不足', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};

/**
 * 刷新 Token 中间件
 * 在 Token 即将过期时自动刷新
 */
const refreshToken = (req, res, next) => {
  try {
    if (req.user) {
      // 检查 Token 是否即将过期（小于24小时）
      const tokenExp = req.user.exp * 1000;
      const now = Date.now();
      const timeUntilExp = tokenExp - now;
      
      if (timeUntilExp < 24 * 60 * 60 * 1000) {
        // 生成新 Token
        const { iat, exp, ...userData } = req.user;
        const newToken = generateToken(userData);
        res.setHeader('X-New-Token', newToken);
      }
    }
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  optionalAuth,
  authorize,
  refreshToken,
  JWT_SECRET
};
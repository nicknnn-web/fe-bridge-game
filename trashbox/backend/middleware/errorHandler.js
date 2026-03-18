/**
 * 统一错误处理中间件
 * 集中处理所有 API 错误，统一响应格式
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 错误处理
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`路径 ${req.originalUrl} 不存在`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

// 全局错误处理中间件
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || '服务器内部错误';

  // 开发环境：返回详细错误信息
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: {
      message: err.message,
      code: err.errorCode || 'INTERNAL_ERROR',
      ...(isDevelopment && {
        stack: err.stack,
        details: err
      })
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.requestId || generateRequestId()
    }
  };

  // 记录错误日志
  if (err.statusCode >= 500) {
    console.error('[SERVER ERROR]', {
      path: req.originalUrl,
      method: req.method,
      error: err.message,
      stack: err.stack
    });
  } else {
    console.warn('[CLIENT ERROR]', {
      path: req.originalUrl,
      method: req.method,
      statusCode: err.statusCode,
      error: err.message
    });
  }

  res.status(err.statusCode).json(errorResponse);
};

// 异步函数错误捕获包装器
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 生成请求 ID
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

module.exports = {
  AppError,
  notFoundHandler,
  globalErrorHandler,
  asyncHandler
};
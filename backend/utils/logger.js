// backend/utils/logger.js
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDir();
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${logData}\n`;
  }

  info(message, data = null) {
    const formatted = this.formatMessage('info', message, data);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️', message, data || '');
    }
    
    this.writeToFile('info.log', formatted);
  }

  error(message, error = null, data = null) {
    const errorData = error ? { error: error.message, stack: error.stack, ...data } : data;
    const formatted = this.formatMessage('error', message, errorData);
    
    console.error('❌', message, errorData || '');
    this.writeToFile('error.log', formatted);
  }

  warn(message, data = null) {
    const formatted = this.formatMessage('warn', message, data);
    
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️', message, data || '');
    }
    
    this.writeToFile('warn.log', formatted);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      const formatted = this.formatMessage('debug', message, data);
      console.log('🐛', message, data || '');
      this.writeToFile('debug.log', formatted);
    }
  }

  writeToFile(filename, content) {
    try {
      fs.appendFileSync(path.join(this.logDir, filename), content);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Performance logging
  performance(operation, duration, data = null) {
    const message = `${operation} completed in ${duration}ms`;
    this.info(message, data);
    
    if (duration > 1000) {
      this.warn(`Slow operation detected: ${operation}`, { duration, ...data });
    }
  }
}

module.exports = new Logger();
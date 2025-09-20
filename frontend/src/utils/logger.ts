// Simple logger utility for clean console output
class Logger {
  private isDevelopment = import.meta.env.DEV

  info(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(`ℹ️ ${message}`, ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.warn(`⚠️ ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]) {
    console.error(`❌ ${message}`, ...args)
  }

  debug(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.debug(`🐛 ${message}`, ...args)
    }
  }

  success(message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console.log(`✅ ${message}`, ...args)
    }
  }
}

export const logger = new Logger()
export default logger

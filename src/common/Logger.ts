export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

const LEVEL_LABELS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
  [LogLevel.SILENT]: '',
};

/**
 * 分级日志器
 */
export class Logger {
  private level: LogLevel;
  private readonly prefix: string;

  constructor(prefix = 'CesiumSDK', level: LogLevel = LogLevel.WARN) {
    this.prefix = prefix;
    this.level = level;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  getLevel(): LogLevel {
    return this.level;
  }

  debug(...args: unknown[]): void {
    this.log(LogLevel.DEBUG, args);
  }

  info(...args: unknown[]): void {
    this.log(LogLevel.INFO, args);
  }

  warn(...args: unknown[]): void {
    this.log(LogLevel.WARN, args);
  }

  error(...args: unknown[]): void {
    this.log(LogLevel.ERROR, args);
  }

  private log(level: LogLevel, args: unknown[]): void {
    if (level < this.level) return;
    const tag = `[${this.prefix}][${LEVEL_LABELS[level]}]`;
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(tag, ...args);
        break;
      case LogLevel.INFO:
        console.info(tag, ...args);
        break;
      case LogLevel.WARN:
        console.warn(tag, ...args);
        break;
      case LogLevel.ERROR:
        console.error(tag, ...args);
        break;
    }
  }

  /** 创建子 logger */
  child(subPrefix: string): Logger {
    const child = new Logger(`${this.prefix}:${subPrefix}`, this.level);
    return child;
  }
}

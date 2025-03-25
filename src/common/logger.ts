import * as fs from 'fs';
import * as path from 'path';

// Define log levels
export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

// Logger configuration interface
export interface LoggerConfig {
    level: LogLevel;
    useConsole: boolean;
    useFile: boolean;
    filePath?: string;
    fileMaxSize?: number; // in bytes
}

// Define log level names mapping
const LOG_LEVEL_NAMES: Record<LogLevel, string> = {
    [LogLevel.ERROR]: 'ERROR',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.TRACE]: 'TRACE',
};

// Log method type for console methods
type LogMethod = (message?: any, ...optionalParams: any[]) => void;

export class Logger {
    private config: LoggerConfig;
    private static defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        useConsole: true,
        useFile: true,
    };

    // Console method mapping
    private consoleMethods: Record<string, LogMethod> = {
        ERROR: console.error,
        WARN: console.warn,
        INFO: console.info,
        DEBUG: console.debug,
        TRACE: console.trace,
    };

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = { ...Logger.defaultConfig, ...config };

        // Create log directory if file logging is enabled
        if (this.config.useFile && this.config.filePath) {
            const logDir = path.dirname(this.config.filePath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
        }
    }

    // Private method to format log messages
    private formatMessage(level: string, message: any): string {
        const timestamp = new Date().toISOString();
        if (typeof message === 'object' && message !== null) {
            return `[${timestamp}] [${level}] ${JSON.stringify(message, null, 2)}`;
        }
        return `[${timestamp}] [${level}] ${message}`;
    }

    // Private method to log to file
    private logToFile(formattedMessage: string): void {
        if (!this.config.useFile || !this.config.filePath) return;

        try {
            // Append to file with newline
            fs.appendFileSync(this.config.filePath, formattedMessage + '\n');

            // Check file size and rotate if needed
            if (this.config.fileMaxSize) {
                const stats = fs.statSync(this.config.filePath);
                if (stats.size > this.config.fileMaxSize) {
                    const backupPath = `${this.config.filePath}.${Date.now()}.backup`;
                    fs.renameSync(this.config.filePath, backupPath);
                }
            }
        } catch (error) {
            console.error(`Failed to write to log file: ${error}`);
        }
    }

    // Core log method that handles all logging
    private log(logLevel: LogLevel, message: any, ...args: any[]): void {
        if (this.config.level < logLevel) return;

        const levelName = LOG_LEVEL_NAMES[logLevel];
        const formattedMsg = this.formatMessage(levelName, message);

        // Handle console output
        if (this.config.useConsole) {
            const logMethod = this.consoleMethods[levelName];
            if (typeof message === 'object' && message !== null) {
                logMethod(`[${new Date().toISOString()}] [${levelName}]`, message, ...args);
            } else {
                logMethod(formattedMsg, ...args);
            }
        }

        // Handle file output
        this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
    }

    // Public logging methods
    error(message: any, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, ...args);
    }

    warn(message: any, ...args: any[]): void {
        this.log(LogLevel.WARN, message, ...args);
    }

    info(message: any, ...args: any[]): void {
        this.log(LogLevel.INFO, message, ...args);
    }

    debug(message: any, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, ...args);
    }

    trace(message: any, ...args: any[]): void {
        this.log(LogLevel.TRACE, message, ...args);
    }

    // Method to update configuration
    updateConfig(newConfig: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// Create and export a default logger instance
export const logger = new Logger();

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

export class Logger {
    private config: LoggerConfig;
    private static defaultConfig: LoggerConfig = {
        level: LogLevel.INFO,
        useConsole: true,
        useFile: true,
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
    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
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

    // Log methods
    error(message: string, ...args: any[]): void {
        if (this.config.level >= LogLevel.ERROR) {
            const formattedMsg = this.formatMessage('ERROR', message);
            if (this.config.useConsole) console.error(formattedMsg, ...args);
            this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.config.level >= LogLevel.WARN) {
            const formattedMsg = this.formatMessage('WARN', message);
            if (this.config.useConsole) console.warn(formattedMsg, ...args);
            this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.config.level >= LogLevel.INFO) {
            const formattedMsg = this.formatMessage('INFO', message);
            if (this.config.useConsole) console.info(formattedMsg, ...args);
            this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.config.level >= LogLevel.DEBUG) {
            const formattedMsg = this.formatMessage('DEBUG', message);
            if (this.config.useConsole) console.debug(formattedMsg, ...args);
            this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
        }
    }

    trace(message: string, ...args: any[]): void {
        if (this.config.level >= LogLevel.TRACE) {
            const formattedMsg = this.formatMessage('TRACE', message);
            if (this.config.useConsole) console.trace(formattedMsg, ...args);
            this.logToFile(formattedMsg + (args.length ? ' ' + JSON.stringify(args) : ''));
        }
    }

    // Method to update configuration
    updateConfig(newConfig: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

// Create and export a default logger instance
export const logger = new Logger();

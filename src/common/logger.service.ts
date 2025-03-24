export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    VERBOSE = 4,
}

export interface LoggerOptions {
    level?: LogLevel;
    context?: string;
}

export class Logger {
    private static globalLogLevel: LogLevel = LogLevel.INFO;
    private context: string;
    private level: LogLevel;

    constructor(context?: string, options: LoggerOptions = {}) {
        this.context = context || '';
        this.level = options.level !== undefined ? options.level : Logger.globalLogLevel;
    }

    public static setGlobalLogLevel(level: LogLevel): void {
        Logger.globalLogLevel = level;
    }

    public error(message: string, trace?: string | Error): void {
        if (this.level >= LogLevel.ERROR) {
            const formattedMessage = this.formatMessage('ERROR', message);
            console.error(formattedMessage);

            if (trace) {
                const errorTrace = trace instanceof Error ? trace.stack : trace;
                console.error(errorTrace);
            }
        }
    }

    public warn(message: string): void {
        if (this.level >= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', message));
        }
    }

    public info(message: string): void {
        this.log(message);
    }

    public log(message: string): void {
        if (this.level >= LogLevel.INFO) {
            console.log(this.formatMessage('INFO', message));
        }
    }

    public debug(message: string): void {
        if (this.level >= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message));
        }
    }

    public verbose(message: string): void {
        if (this.level >= LogLevel.VERBOSE) {
            console.log(this.formatMessage('VERBOSE', message));
        }
    }

    private formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString();
        const contextPart = this.context ? `[${this.context}] ` : '';
        return `${timestamp} ${level} ${contextPart}${message}`;
    }
}

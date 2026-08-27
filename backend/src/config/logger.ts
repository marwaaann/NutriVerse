    import winston from "winston"
    import DailyRotateFiles from "winston-daily-rotate-file"
    import { TransformableInfo } from "logform";
import { ENV } from "./env";


    //this for log formating:
    const customFormat=winston.format.printf(({level,message,timestamp}:TransformableInfo)=>{
        return `[${timestamp}] ${level.toUpperCase()} : ${message}`
    })


    //create instance of logger

    const logger=winston.createLogger({
        level:ENV.NODE_ENV =="development"?"debug":"info",

        format:winston.format.combine(winston.format.timestamp(),customFormat),

        transports:[

            //Console logs for development
            ...(ENV.NODE_ENV==="development" ?
                [
                new winston.transports.Console({
                level:"debug",
                format:winston.format.combine(winston.format.colorize(),winston.format.timestamp(),customFormat)  
                }),
                ] : []
            ),

            // Daily rotate file for all logs
            new DailyRotateFiles({
                dirname:"logs",
                filename:"combined-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                maxSize: "20m",
                maxFiles: "14d",
            }),

            //Daily rotate file for error logs only
            new DailyRotateFiles({
                dirname:"logs",
                filename:"errors-%DATE%.log",
                datePattern: "YYYY-MM-DD",
                maxSize: "20m",
                maxFiles: "30d",
                level: "error",
            })
        ]
    })

   export default logger    

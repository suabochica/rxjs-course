import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export enum RxJsLoggingLevel {
    TRACE,
    DEBUG,
    INFO,
    ERROR
}

let rxjsLoggingLevel = RxJsLoggingLevel.INFO

export function setRxJsLoggingLevel(level: RxJsLoggingLevel) {
    rxjsLoggingLevel = level;
}

export const debug = (loggingLevel: number, message: string) =>
    (sourceObservable: Observable<any>) => sourceObservable
        .pipe(
            tap(value => {
                if (loggingLevel >= rxjsLoggingLevel) {
                    console.log(message, value);
                }
            })
        );
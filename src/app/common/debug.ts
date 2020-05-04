import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export const debug = (loggingLevel: number, message: string) =>
    (sourceObservable: Observable<any>) => sourceObservable
        .pipe(
            tap(value => {
                console.log(`${message}: ${value}`);
            })
        );
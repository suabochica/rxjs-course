# Chapter 4: Building a Custom RxJs Operator

## Index
- The RxJs Custom Operator - Debug
- The Debug Operator
- The RxJs forkJoin Operator

## The RxJs Custom Operator - Debug
In this section we will crate a custom RxJs operator to debug the operator chain. This action is useful when the Observable has an extensive operator chain.

Commonly, we use the `tap` operator to force a side effect an record the console log in the console. The next snippet shows a use of the `tap` operator:

```ts
ngAfterViewInit() {
    const lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
        .pipe(
            map(event => event.target.value),
            startWith(''),
            tap(search => console.log("search", search)),
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(search => this.loadLessons(search))
        );
}
```

Here, we log the typed value to release the search. Let's create a custom operator called `debug` to complement the `tap` operator. Below, the code of the `debug` operator:

```ts
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export const debug = (loggingLevel: number, message: string) =>
    (sourceObservable: Observable<any>) => sourceObservable
        .pipe(
            tap(value => {
                console.log(`${message}: ${value}`);
            })
        );
```

Notice that with the `debug` operator we will receive a logging level to identify the type of log (info, warning or error) and the message that we will display in the console. Next code consumes the `debug` operator:

```ts
ngAfterViewInit() {
    const lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
        .pipe(
            map(event => event.target.value),
            startWith(''),
            debug(RxJsLoggingLevel.INFO, "search"),
            debounceTime(400),
            distinctUntilChanged(),
            switchMap(search => this.loadLessons(search))
        );
}
```

## The Debug Operator
Let's implement a logic to organize the level of the logs in the `debug` operator. First of all, we will define four levels: TRACE, DEBUG, INFO and ERROR. By default we will just log the message that are under the info level. Next code shows the mentioned scenario:

```ts
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

export enum RxJsLoggingLevel {
    INFO,
    TRACE,
    DEBUG,
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
```

Notice the `setRxJSLoggingLevel`. This method will allow us to increase the logging level and log the message that are in superior levels to INFO, like TRACE or DEBUG. The next code will consume all the features of the `debug` operator:

```ts
ngOnInit() {
this.courseId = this.route.snapshot.params['id'];
this.course$ = createHttpObservable(`/api/courses/${this.courseId}`)
    .pipe(
        debug(RxJsLoggingLevel.INFO, "course value"),
    );

    setRxJsLoggingLevel(RxJsLoggingLevel.DEBUG)
}

ngAfterViewInit() {
const lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
    .pipe(
        map(event => event.target.value),
        startWith(''),
        debug(RxJsLoggingLevel.INFO, "search"),
        debounceTime(400),
        distinctUntilChanged(),
        switchMap(search => this.loadLessons(search)),
        debug(RxJsLoggingLevel.INFO, "lessons value")
    );
}
```

Check that we use the `setRxJsLoggingLevel` to enable the log of DEBUG label. If we execute this code, we will se in our console tab the expected values for course, lessons and the search.

## The RxJs forkJoin Operator
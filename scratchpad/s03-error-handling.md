# Chapter 3: RxJs Error Handling

## Index
- RxJs Error Handling Guide
- RxJs Error Handling - The Catch and Replace Error Handling Strategy
- The Catch and Rethrow RxJs Error Handling Strategy
- The Retry RxJs Error Handling Strategy
- The startWith RxJs Operator
- RxJs Throttling vs Debouncing

## RxJs Error Handling Guide
Error handling is an essential part of RxJs, as we will need it in just about any reactive program that we write.

Error handling in RxJs is likely not as well understood as other parts of the library, but it is actually quite simple to understand if we _focus on understanding first_ the Observable contract in general.

Also, it is recommendable keep in mind the **most common error handling strategies** that you will need in order to cover most practical scenarios, starting with the basis of the Observable contract. These strategies are:

- The catch and replace strategy
- throwError and the catch and rethrow strategy
- The retry strategy
- The immediate retry strategy
- The delayed retry strategy

### The Observable contract
In order to understand error handling in RxJs, we need to first understand that any given stream _can only error out once_. This is defined by the Observable contract which says that a stream can emit zero or more values.

The contract works that way because that is just how all the streams that we observe in our runtime work in practice. Network request can fail, for example.

A stream can also complete which means:

- The stream has ended its life cycle without any error
- After completion, the stream will not emit any further values

As an alternative to completion, a stream can also error out, which means that:

- The stream has ended its life cycle with an error
- After error is thrown, the stream will not emit any other values

Notice that completion or error are mutually exclusive: _if the stream completes, it cannot error out afterwards_ and _if the streams errors out, it cannot complete afterwards_.

Additionally, there is no obligation for the stream to complete _or_ error out, those two possibilities are optional. But only one of those two _can_ occur, not both. So if a stream errors out, we cannot use it anymore.

### RxJs subscribe an error callback
Remember that the subscribe call takes three optional arguments:

- A success handler function, which is called each time that the stream emits a value
- An error handler function, that gets called only if an error occurs. This handler receive the error itself.
- A completion handler function, which is called only if the stream completes.

The next example shows the last definition with help of the scenarios to do a HTTP request.

```ts
@Component({
    selector: 'home',
    templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit {
    constructor(private http: HttpClient) {}

    ngOnInit() {
        const http$ = this.http.get<Course[]>('/api/courses');
        http$.subscribe(
            res => console.log('HTTP response', res), // HTTP response {payload: Array(0)}
            err => console.log('HTTP Error', err), // HTTP Error {HttpErrorResponse}
            () => console.log('HTTP request completed.') // HTTP request completed
        );
    }
}
```

Handling errors using the subscribe call is sometimes all we need, but this error handling approach is **limited**. Using this approach, we cannot recover from the error or emit an alternative fallback value that replace the value tah we were expecting from the back-end.

Let's then lear a few operators that will allow us to implement more advanced error handling strategies.

### The cathError operator
In synchronous programming, we have the option to wrap a block of code in a try clause, catch any error that it might throw with a catch block and then handle the error.

Here is what the synchronous catch syntax looks like:

```ts
try {
    // sync operation
    const httpResponse = getHttpResponseSync('/api/courses');
} catch {
    // handle error
}

```

This mechanism is very powerful because we can handle in one place any error that happens inside the try/catch block. The problem is that in JavaScript many operations are asynchronous.

RxJS provide us with something close to this functionality, via the RxJs `catchError` operator. This operator is a function that takes in an input Observable, and outputs an output Observable, then with each call to `catchError` we need to pass it a function which we will call the error handling function.

The `catchError` operator takes as input an Observable that _might_ error out, and start emitting the values of the input Observable in its output Observable.

If _no error occurs_, the output Observable produced by `catchError` works exactly the same way as the input Observable.

If an _error occurs_ then the `catchError` logic is going to kick in. The `cathError` operator is going to take the error and pass it to the error handling function. That function is expected to return an Observable which is going to be a _replacement observable_ for the stream that just error out.

Remember that the input stream of `catchError` has error out, and according to the Observable contract, we cannot use it any more. The _replacement observable_ is then going to be subscribed to and its values are going to be used _in place_ of the error out input Observable.

### The Catch and Replace Strategy
Lets give an example of how `catchError` can be used to provide a replacement Observable that emits fallback values:

```ts
const http$ = this.http.get<course[]>('/api/courses');

http$
  .pipe(
    catchError(err => of([]))
  )
  .subscribe(
    res => console.log('http response', res),
    err => console.log('http error', err),
    () => console.log('http request completed')
  );
```

As you notice, we are passing to the `catchError` operator a function which is the error handling function. This function is not called immediately, and in general, its usually _not_ called. _Only_ when an error occurs in the input Observable of `catchError` the error handling function will be called, and, in this case the error handling function will return an Observable built using the `of([])` function. The `of()` function builds an Observable that emits only one value `([])` and then it completes. This Observable gets subscribed to by the `catchError` operator. Finally the values of the recovery Observable are then emitted as replacement values in the output Observable returned by the `catchError`.

At the end result, the `http$` Observable will not error out anymore! It will print:

```
HTTP response []
HTTP request completed
```

Here the error handling callback in the `subscribe()` is not invoked anymore. Instead, the empty array value `[]` is emitted and the `http$` Observable is then completed.

Basically this is the catch and replace strategy, and we can expand it to send the error instead of an empty values, as shown below:

```ts
const http$ = this.http.get<course[]>('/api/courses');

http$
  .pipe(
    catchError(err => {
      console.log('Handling error locally and rethrowing it', err)
      
      return throwError(err);
    })
  )
  .subscribe(
    res => console.log('http response', res),
    err => console.log('http error', err),
    () => console.log('http request completed')
  );
```
In this case, we are simply logging the error to the console, but we could instead add any local error handling
logic that we want, such as for example showing an error message to the user. Noe, we are then returning a replacement Observable that this time was created using `throwError`. Running this code will print the specific error in the request.

For the other hand, it is important keep in mind that the `catchError` operator return an Observable, so we can use it several times, and even we can combine it with other operators.

```ts
http$
  .pipe(
    map(res => res['payload']),
    catchError(err => {
      console.log('Handling error locally and rethrowing it', err)
      
      return throwError(err);
    }), 
    catchError(err => {
      console.log('Caught rethrown error.')
      
      return of([])
    });
  )
  .subscribe(
    res => console.log('http response', res),
    err => console.log('http error', err),
    () => console.log('http request completed')
  );
```

### The Finalize Operator
Besides a catch block for handling errors, the synchronous JavaScript syntax also provides a finally block that can be used to run code that we *always* want to executed. The `finally` block is typically used for releasing expensive resources, such as for example closing down network connections or releasing memory.

Unlike the code in the catch block, the code in the finally block will get executed independently if an error is thrown or not:

```ts
try {
    // sync operation
    const httpResponse = getHttpResponseSync('/api/courses');
} catch(error){
    // handle error, only executed in case for error
} finally {
  // this will always get executed
}
```

RxJs provides us with an operator that has a similar behavior to the finally functionality, the `finalize` operator. Just like `catchError`, we can add multiple finalize calls at different places in the Observable chain if needed, in order to make sure that the multiple resources are correctly released.

```ts
http$
  .pipe(
    map(res => res['payload']),
    catchError(err => {
      console.log('Handling error locally and rethrowing it', err)
      
      return throwError(err);
    }), 
    finalize(() => console.log("first finalize block executed"))
    catchError(err => {
      console.log('Caught rethrown error.')
      
      return of([])
    }),
    finalize(() => console.log("second finalize block executed"));
  )
  .subscribe(
    res => console.log('http response', res),
    err => console.log('http error', err),
    () => console.log('http request completed')
  );
```
 When you run this code, you will see how the multiple finalize blocks are being executed. Pay attention that the last finalize block is executed _after_ the subscribe value handler and completion handler functions.
 
### The Retry Strategy
An alternative to rethrowing the error or providing fallback values, we can also simply _retry_ to subscribe to the errored out Observable. Let's remember, once the stream errors out we cannot recover it, but nothing prevents us from subscribing _again_ to the Observable from which the stream was derive from, and create another stream.

The big question here is, _when_ are we going to subscribe again to the input Observable, and retry to execute the input stream: Immediately, with a small delay or only a limited amount of times, and then error out the output stream. To answer these questions, we going to need a second auxiliary Observable, the Notifier. The Notifier will to determine _when_ the retry attempt occurs.

Basically, RxJs offer us operators to define each of the mentioned scenarios to subscribing to the input observable:

- To subscribe immediately we can use `retryWhen`
- To subscribe with a small delay we can use `delayWhen` in combination with the `timer` operator.

### Conclusions
As we have seen, understanding RxJs error handling is all about understanding the fundamentals of the Observable contract first. We need to keep in mind that any given stream can only error out _once_, and is exclusive with stream completion: _only one of the two scenarios can happen_.

In order to recover from an error, the only way is to somehow generate a replacement stream as an alternative to the errored out stream, like happens in the case of `catchError` or `retryWhen` Operators.

## The Catch and Replace RxJs Error Handling Strategy
In order to handling error we have to force an error in the response of the HTTP request to the `/api/courses` endpoint. Let's return the error in the `get-courses.ts` file.

```ts
export function getAllCourses(req: Request, res: Response) {
    setTimeout(() => {
        // res.status(200).json({payload:Object.values(COURSES)});
        res.status(500).json({ message: 'random error occurred.' });
    }, 200);
}
```
Good. Now that we have a forced the error 500 for the HTTP request and get the 'random error ocurred' message as response we have three strategies to face it:

1. Catch the error and try to recover from it by for example providing and alternative value.
2. Catch the error log in the console and rethrow it to the observable that is consuming these observable.
3. Try again the operation just failed 

Let's check the first strategy. The next code applies the definition of the first way:

```ts
  ngOnInit() {
    const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        tap(() => console.log("HTTP request")),
        map(response => Object.values(response["payload"])),
        shareReplay(),
        catchError(error => of([
          {
            id: 0,
            description: "RxJs In Practice Course",
            iconUrl: 'https://s3-us-west-1.amazonaws.com/angular-university/course-images/rxjs-in-practice-course.png',
            courseListIcon: 'https://angular-academy.s3.amazonaws.com/main-logo/main-page-logo-small-hat.png',
            longDescription: "Understand the RxJs Observable pattern, learn the RxJs Operators via practical examples",
            category: 'BEGINNER',
            lessonsCount: 10
          }
        ]))
      );
```

Notice that we use the `catchError` operator and with help of the `of` method we provide an alternative value, that in this case is a hard coded object of a course. In sophisticated projects you can return here the values stored in a offline database.

## The Catch and Rethrow RxJs Error Handling Strategy
Before to start with or retry error handling, let's improve the code of out `createHttpObservable` method, because currently we catch error if we got network error but we aren't catching errors when the response of the server is an error. The next code is the improve versions of the code.

```ts
export function createHttpObservable(url: string) {
  return Observable.create(observer => {
    const controller = new AbortController()
    const signal = controller.signal;

    fetch(url, { signal })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          observer.error(`Request failed with status code ${response.status}`)
        }
      })
      .then(body => {
        observer.next(body);
        observer.complete();
      })
      .catch(err => {
        observer.error(err);
      });

    return () => controller.abort();
  });
}
```

Basically, we add a if statement in first `then` of the `fetch` method validating if the response is ok. In that case the code returns the payload of the response. Otherwise, we use the `observer.error` methdo sending a message with the status of the error. 

Now, lets use the implement the `catchError` and `throwError` strategy, as shows the next snippet.

```ts
  ngOnInit() {
    const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        catchError(error => {
          console.log("Error ocurred", error);

          return throwError(error);
        }),
        finalize(() => console.log("Finalize executed")),
        tap(() => console.log("HTTP request")),
        map(response => Object.values(response["payload"])),
        shareReplay(),
      );
    // --snip--
  }
```

We have to key points in this code, and an important detail. The first key point is that in our `catchError` operator we print the error and use the `throwError` method to return the observable that the `catchError` requires.

The second point is the use of the `finalize` operator. This operator is going to take a function that will be invoked in one of the two possible cases: when the observable completes or when it errors out. This is useful to check the track of the observable.

Finally, and important detail of the code is the order in which the operators are executed. We put the `cathError` and the `finalize` at the beginning to avoid duplicated request generated by the `shareReplay` operator.

## The Retry RxJs Error Handling Strategy
To check the retry error handling strategy, let's provide a scenario where the fifty percent of the tries to get all the courses will fail and the other fifty percent of tries will be successful. The code below is a variation to the `getAllCourses` method to force the mentioned scenario:

```ts
export function getAllCourses(req: Request, res: Response) {
    const error = (Math.random() >= 0.5);

    if (error) {
        console.log("ERROR loading courses!");
        res.status(500).json({ message: 'random error occurred.' });
    } else {
        setTimeout(() => {
            res.status(200).json({ payload: Object.values(COURSES) });
        }, 200);
    }
}
```

Good, now we have the context to apply the retry error handling strategy. The next snippet shows the use of the `retryWhen` operator.

```ts
  ngOnInit() {
    const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        tap(() => console.log("HTTP request")),
        map(response => Object.values(response["payload"])),
        shareReplay(),
        retryWhen(errors => errors.pipe(
          delayWhen(() => timer(2000))
        )),
      );
    
    // --snip--
  }
}
```
Here, we have a major detail to keep in mind. The `retryWhen` operator will receive a parameter an `errors` Observable, that will emit as values the current errors generated. At the moment to use the `retryWhen` operator we should consider when we send the observable again. In this case, we are sending the error after two seconds with help of the `delayWhen` operator and the `timer` method. We can send the try immediately, however, in practice this decision is not common because many of these requests failures are due to intermittent problems. That is why the delay is a best approach.

## The startWith RxJs Operator
Now, let's do an improvement over the code of the `ngAfterViewInit` method inside the `course.component.ts` file, with help of the `startWith` operator. Currently the code is like:

```ts
ngAfterViewInit() {
  const searchLessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
    .pipe(
      map(event => event.target.value),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search => this.loadLessons(search))
    );

  const initialLessons$ = this.loadLessons();
  this.lessons$ = concat(initialLessons$, searchLessons$);
}

loadLessons(search = ''): Observable<Lesson[]> {
  return createHttpObservable(
    `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
  )
    .pipe(
      map(response => response["payload"])
    );
}
```

As you can see, we first create the `searchLessons$` observable, to send the HTTP request from the `keyup` event. Next we create the `initialLessons$` observable to handle the first scenario of our search, an empty value. And finally, we use the `concat` operator to create our output observable from `searchLessons$` and `initialLessons$`.

However, we can get the same result we less code, as shown below:

```ts
ngAfterViewInit() {
  const lessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
    .pipe(
      map(event => event.target.value),
      startWith(''),
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(search => this.loadLessons(search))
    );
}

loadLessons(search = ''): Observable<Lesson[]> {
  return createHttpObservable(
    `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
  )
    .pipe(
      map(response => response["payload"])
    );
}
```

Here, we assign directly the `fromEvent` to our `lessons$` observable and with help of the `startsWith` operator we supply the empty search scenario.

## RxJs Throttling vs Debouncing
Let's review the difference between debouncing and throttling to identify what approach is better in specific cases. With debouncing, the observable waiting for the values when they are stable. Let's check the implementation of the search filter reviewed before:

```ts
fromEvent<any>(this.input.nativeElement, 'keyup')
.pipe(
  map(event => event.target.value),
  debounceTime(400),
)
.subscribe();
```

Good, now let's review the throttle way. Basically, the `throttleTime` operator is used for limit the quantity of values emitted from the input observable. It will require as parameter the interval of time to emit the values. The next snippet shows the mentioned scenario:

```ts
fromEvent<any>(this.input.nativeElement, 'keyup')
.pipe(
  map(event => event.target.value),
  throttleTime(400),
)
.subscribe();
```

So, for the search type head is more convenient use `debounceTime`, because we need a stable set of characters to do the search. The `throttleTime` operator is good for communication between web sockets or channels where the priority is emit values frequently.
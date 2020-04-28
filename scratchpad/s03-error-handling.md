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

Handling errors using the subscribe call is sometimes all we need, but this error handling approach is **limited**. Using this approach, we cannot recover from the error or emit an alternative fallback value that replace the value tah we were expecting from the backend.

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

## The Catch and Rethrow RxJs Error Handling Strategy
## The Retry RxJs Error Handling Strategy
## The startWith RxJs Operator
## RxJs Throttling vs Debouncing

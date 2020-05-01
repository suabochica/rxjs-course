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

## The Catch and Rethrow RxJs Error Handling Strategy
## The Retry RxJs Error Handling Strategy ## The startWith RxJs Operator
## RxJs Throttling vs Debouncing

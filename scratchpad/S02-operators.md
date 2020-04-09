# Essential RxJs Operators and Reactive Design #

## Index ##
- What are RxJs Oprators?
- Building Components with RxJs - Imperative Design
- Building Components with RxJs - Reactive Design
- Sharing HTTP Responses with the shareReplay Operator
- RxJs Higher-Order Mapping Operators
- Observable Concatenation
- From Draft Pre-Save Example and the RxJs Filter Operator
- The RxJs concatMap Operator
- Understanding the Merge Observable Combination Strategy
- The RxJs mergeMap Operator
- The RxJs exhaustMap Operator
- Unsubscription in Detail
- Setting Up the Course Component
- Building a Search Typehead 
- Finishing the Search Typehead

## What are RxJs Oprators? - The Map Operator
A `operator` is a high order function that allow us apply an action over the stream of values. To illustrate the concept lets evaluate the `map` operator.

The map operator is applies a given `project` function to each values emitted by the source Observable, and emits the resulting value as an Observable. So, for example we have an stream with the `1, 2, and 3` values. Then we apply the function `(x) => x * 10` to get another stream with the `10, 20, and 30` values. The operators are explained in a marvel diagram. The next marvel diagram expose our last description.

![Map Marvel](../assets/imgs/02-map_marvel.png)

In our case, we will use the map operator to turn the object response of the course endpoint in a array of object. To achieve this goal, lets separate the logic the make the HTTP request in a function. Check the next snippet:

```js
export const createHttpCoursesObservable = (url: string) => {
  Observable.create(observer => {
    fetch(url)
      .then(response => {
        return response.json();
      })
      .then(body => {
        observer.next(body);
        observer.complete();
      })
      .catch(err => {
        observer.error(err);
      });
  });
}
```
Now, we will consume this observable to create another observable where we will use the `map` operator to create the array of objects:

```js
const httpCourses$ = createHttpCoursesObservable('/api/courses');
const courses$ = httpCourses$
  .pipe(
    map(response => Object.values(response["payload"]))
  );

courses$.subscribe(
  courses => console.log(courses),
  noop,
  () => console.log('completed')
);
```

So, let's go in detail we the last code. First we use the `.pipe` method to shape multiple operators in order to produce a new observable. Next, inside the `.pipe`, we use the `map` operator where we get the `response` from the `httpCourses$` observable and with help of the native `Object.values` method we create and array with the payload of the request.

Finally, we `subscribe` to the `courses$` observable to print in the log the generated array.

## Building Components with RxJs - Imperative Design
## Building Components with RxJs - Reactive Design
## Sharing HTTP Responses with the shareReplay Operator
## RxJs Higher-Order Mapping Operators
## Observable Concatenation
## From Draft Pre-Save Example and the RxJs Filter Operator
## The RxJs concatMap Operator
## Understanding the Merge Observable Combination Strategy
## The RxJs mergeMap Operator
## The RxJs exhaustMap Operator
## Unsubscription in Detail
## Setting Up the Course Component
## Building a Search Typehead
## Finishing the Search Typehead

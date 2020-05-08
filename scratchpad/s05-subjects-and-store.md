
# Chapter 5: RxJs Subjects and the Store Pattern

## Index
- What are RxJs Subjects?
- BehaviorSubject
- AsyncSubject and Replay Subject
- Store Service Design
- The Store Pattern
- BehaviorSubject Store
- Refactoring the Course Component Using Store
- Forcing the Completion of Long Running Observable
- The withLatestFrom RxJs Operator

## What are RxJs Subjects?
Until now we know that we have two ways to create on observable:

1. Using the `Observable.create` method that receive the observer as parameter
2. Using some of the many methods available in our exchange such as `fromPromise` or `fromEvent` that allow us to create and observable directly from the source.

However, these methods are not convenient for scenarios where the source data is not easily transformable into an observable or if we are doing multicasting of one value to separate multiple observable. For these cases is favorable talk about _subject_

The _subject_ notion is confusing because by definition a subject is at the same time an observer and an observable. Let's use a snippet to illustrate the subject concept:

```ts
ngOnInit() {
    const subject = new Subject();
    const series$ = subject.asObservable();

    series$.subscribe(console.log);

    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();
};
```

Note that after define the subject we use the method `asObservable` to determine that our subject will be a observable. Then we can use the `next` and the `complete` methods of the observable.

## BehaviorSubject
The `BehaviorSubject` share the same principle of the `Subject` but has specific features the made it a little bit different. Let's check the next code sample to understand the distinction between `BehaviorSubject` and `Subject`:

```ts
    const subject = new Subject();
    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`early sub: ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    // subject.complete();

    setTimeout(() => {
      series$.subscribe(value => console.log(`late sub: ${value}`));
      subject.next(4)
    }, 3000)
```
Here, we are doing an early subscription and a late subscription. When you check the console you will see the for the early subscription we have all th values (1, 2, 3, 4) and for the late subscription we just have the 4 value. In other words, the late subscription is not aware of the values in the early subscription, this means that the `Subject` is not have memory.

Now lets check the example using the `BehaviorSubject`:

```ts
    const subject = new BehaviorSubject(0);
    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`early sub: ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    // subject.complete();

    setTimeout(() => {
      series$.subscribe(value => console.log(`late sub: ${value}`));
      subject.next(4)
    }, 3000)
```
Several key points on this case. First, check that the `BehaviorSubject` receive as parameter a 0. This is required because the `BehaviorSubject` should initialize the observable with a value. Second, with this modification, when you check the console you will see that for the early subscription we have all the values again, and for the late subscription we got 3 and 4. The `BehaviorSubject` allow us to get the last value of a previous subscription.

Lastly, check that in both example we comment the `subject.complete` line. This is intentional, because if the subject is complete we cannot subscribe to the observable after the complete state.

## AsyncSubject and Replay Subject
Let's check two new `Subject` alternatives

### Async Subject
The `AsyncSubject` is ideal for using with long running calculations where the observable is emitting a lot of intermediate calculation values but for us it is important get the finished calculation value. It means that we want to get the last value emitted by the subject before the subject is going to be completed.

Let's check the next snippet:

```ts
    const subject = new AsyncSubject();
    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`first sub: ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    subject.complete();

    setTimeout(() => {
      series$.subscribe(value => console.log(`second sub: ${value}`));
    }, 3000)
```

When we check the console we get for both subscription the 3 value. that is the last value before the subject will completed. It is important to highlight that the `AsyncSubject` just works if the subject is completed. Otherwise, we never will get the values from the subject

### Replay Subject
The `ReplaySubject` will give us all the values in each subscription, and it _not_ depends to the subject completion. Check to code below:

```ts
    const subject = new ReplaySubject();
    const series$ = subject.asObservable();

    series$.subscribe(value => console.log(`first sub: ${value}`));

    subject.next(1);
    subject.next(2);
    subject.next(3);
    // subject.complete();

    setTimeout(() => {
      series$.subscribe(value => console.log(`second sub: ${value}`));
      subject.next(4)
    }, 3000)
```

When we check the console, we see that for both subscriptions we will get all the values (1, 2, 3) initially and then after three seconds we got the 4.

## Store Service Design
Now let's introduce a store service service wit help of subjects by implementing a very common design pattern web application: _centralize store service_.

Currently, the design in the home component, we had that every time that we navigate toward the route of the home component we are trigger a new HTTP request to fetch the course data from the back-end.

We are aware that the data did not change, so a good approach is after fetching the data from the back-end we should kept it in the client memory to avoid make duplicated HTTP request for the same endpoint. The goal is store the data in the client side independently of the component, so, whenever the home component gets the data should consume it from the store. The centralize store service will help us with this goal, exposing the data as Observable and make the back-end request in the appropriate moment.

The next snippet is a definition of the store:

```ts
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { Course } from "../model/course";

@Injectable({
    providedIn: 'root'
})
export class Store {
    private subject = new BehaviorSubject<Course[]>([]);
    courses$: Observable<Course[]> = this.subject.asObservable()
}
```

Note that we are using the `@Injectable` decorator to enable the store at root level. That means that the store is available for any component.
On the other hand, check that we are using the `BehaviorSubject` instead of a `Observable.create`, because it is important for the application that the late subscribers to the observable also gets the latest emitted values.

For example, when the user navigate throughout the application going to the about screen to the courses screen, we will have each time new instances of the home component, since the component gets destroyed an recreated as we navigate back to the course route. So we want that the later instances of the component also gets the course's data.

Now, lets check how consume the store:

```ts
export class HomeComponent implements OnInit {

  constructor(private store: Store) {
    
  }
}
```
As store is provided a root level, we can consume it in the constructor function of the component passing it as parameter.

## The Store Pattern
## BehaviorSubject Store
## Refactoring the Course Component Using Store
## Forcing the Completion of Long Running Observable
## The withLatestFrom RxJs Operator
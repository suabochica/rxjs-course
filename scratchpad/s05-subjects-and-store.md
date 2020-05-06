
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
## AsyncSubject and Replay Subject
## Store Service Design
## The Store Pattern
## BehaviorSubject Store
## Refactoring the Course Component Using Store
## Forcing the Completion of Long Running Observable
## The withLatestFrom RxJs Operator
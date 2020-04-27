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
Let's split our courses array in the beginner and advanced categories. We can do the separation in the `subscribe` method of the `courses$` observable, as shown below.

```js
export class HomeComponent implements OnInit {
  beginnerCourses: Course[];
  advancedCourses: Course[];

  ngOnInit() {
    const httpCourses$ = createHttpCoursesObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        map(response => Object.values(response["payload"]))
      );

    courses$.subscribe(
      courses => {
        this.beginnerCourses = courses.filter(course => course.category === 'BEGINNER');
        this.advancedCourses = courses.filter(course => course.category === 'ADVANCED');
      },
      noop,
      () => console.log('completed')
    );
  }
}
```

Notice that we are using the `.filter` method of the native JavaScript Array (not the RxJs operator). We store the courses in their respective variables, and how they are defined in the scope of the component we can use them in the `html` file of it;

```html
<div class="courses-panel">
    <h3>All Courses</h3>
    <mat-tab-group>
        <mat-tab label="Beginners">
            <courses-card-list
                    [courses]="beginnerCourses">
            </courses-card-list>
        </mat-tab>
        <mat-tab label="Advanced">
            <courses-card-list
                    [courses]="advancedCourses"
            ></courses-card-list>
        </mat-tab>
    </mat-tab-group>
</div>
```

Now our component render the courses information as expected but this approach have some details. The problem with having the logic inside the `subscribe` call, is that our code will not be scale easily. One of the purpose of use RxJs is avoid callbacks, and putting this logic in the `subscribe` method goes against this principle. This approach is considered imperative, because we save the logic inside the `subscribe` call that is attending more responsibilities that the subscription.

## Building Components with RxJs - Reactive Design
The goal here is to refactor our component in order to have it use a reactive design instead. So, for the imperative version we just define one stream of data courses, and then we subscribe to it and extract the respective data. Let's change this approach creating to streams of data, one for the beginner courses and the other to the advanced courses, as shown below:

Notice that our observables are of type `<Course[]>`. Wit our observables available, we can start to use the RxJs operators on it and get the array of courses split by category. Catch that we use the `.pipe` operator to start our sequence and the `.filter` to split the courses. Additionaly we use the native JavaScript `map` array to return the array of courses.

Now, we should modify the markup to render the courses. Look at the next snippet.


```html
<div class="courses-panel">
    <h3>All Courses</h3>
    <mat-tab-group>
        <mat-tab label="Beginners">
            <courses-card-list
                    [courses]="beginnerCourses$ | async"
            ></courses-card-list>
        </mat-tab>
        <mat-tab label="Advanced">
            <courses-card-list
                    [courses]="advancedCourses$ | async"
            ></courses-card-list>
        </mat-tab>
    </mat-tab-group>
</div>
```

The key change of this code is in the `[courses]="beginnerCourses$ | async"` line. Here we use the async pipe syntax of angular to indicate that we will going to subscribe to these observable to retrieve the data and assign it to the markup.

Now, our approach looks promising as it is more maintainable. We don't run into nested subscribe. However we would face other problems now, because we are fetching the data twice from back-end. Let's check the RxJs operator that will help us with this issue.

## Sharing HTTP Responses with the shareReplay Operator
With the reactive design approach implemented, now we are facing the problem of send two request to retrieve the same data. If you check your _Network_ tab in the developer tools of the browser you will see two GET calls to the `courses` endpoints. If in our code we add another call to the `courses$` observable, like `courses$.subscribe()`, then we the _Network_ call will record three calls to the `courses` endpoint. The next code will allow as to just send one call to the endpoint.

```js
ngOnInit() {
  const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
  const courses$ = httpCourses$
    .pipe(
      tap(() => console.log("HTTP request")),
      map(response => Object.values(response["payload"])),
      shareReplay()
    );

  this.beginnerCourses$ = courses$
    .pipe(
      map(courses => courses.filter(course => course.category === 'BEGINNER'))
    );

  this.advancedCourses$ = courses$
    .pipe(
      map(courses => courses.filter(course => course.category === 'ADVANCED'))
    );
}
```

Here is important to highlight the `shareReplay` operator. This operator makes that the stream be executed only once and then the result of that stream will be replayed to each new subscriber. This definition grant to us that our HTTP response is going to be passed on to new each subscription.

Another key detail of the last code is the use of the `tap` operator. This operator able to us introduce side effects in the observable chain for use the helpful `console.log()` to check the execution code of our code.

## RxJs Higher-Order Mapping Operators

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
Let's split our courses array in the beginner and advanced categories. We can do the separation in the `subscribe` method of the `courses$` observable, as shown below.

```js
export class HomeComponent implements OnInit {
  beginnerCourses: Course[];
  advancedCourses: Course[];

  ngOnInit() {
    const httpCourses$ = createHttpCoursesObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        map(response => Object.values(response["payload"]))
      );

    courses$.subscribe(
      courses => {
        this.beginnerCourses = courses.filter(course => course.category === 'BEGINNER');
        this.advancedCourses = courses.filter(course => course.category === 'ADVANCED');
      },
      noop,
      () => console.log('completed')
    );
  }
}
```

Notice that we are using the `.filter` method of the native JavaScript Array (not the RxJs operator). We store the courses in their respective variables, and how they are defined in the scope of the component we can use them in the `html` file of it;

```html
<div class="courses-panel">
    <h3>All Courses</h3>
    <mat-tab-group>
        <mat-tab label="Beginners">
            <courses-card-list
                    [courses]="beginnerCourses">
            </courses-card-list>
        </mat-tab>
        <mat-tab label="Advanced">
            <courses-card-list
                    [courses]="advancedCourses"
            ></courses-card-list>
        </mat-tab>
    </mat-tab-group>
</div>
```

Now our component render the courses information as expected but this approach have some details. The problem with having the logic inside the `subscribe` call, is that our code will not be scale easily. One of the purpose of use RxJs is avoid callbacks, and putting this logic in the `subscribe` method goes against this principle. This approach is considered imperative, because we save the logic inside the `subscribe` call that is attending more responsibilities that the subscription.

## Building Components with RxJs - Reactive Design
The goal here is to refactor our component in order to have it use a reactive design instead. So, for the imperative version we just define one stream of data courses, and then we subscribe to it and extract the respective data. Let's change this approach creating to streams of data, one for the beginner courses and the other to the advanced courses, as shown below:

Notice that our observables are of type `<Course[]>`. Wit our observables available, we can start to use the RxJs operators on it and get the array of courses split by category. Catch that we use the `.pipe` operator to start our sequence and the `.filter` to split the courses. Additionaly we use the native JavaScript `map` array to return the array of courses.

Now, we should modify the markup to render the courses. Look at the next snippet.


```html
<div class="courses-panel">
    <h3>All Courses</h3>
    <mat-tab-group>
        <mat-tab label="Beginners">
            <courses-card-list
                    [courses]="beginnerCourses$ | async"
            ></courses-card-list>
        </mat-tab>
        <mat-tab label="Advanced">
            <courses-card-list
                    [courses]="advancedCourses$ | async"
            ></courses-card-list>
        </mat-tab>
    </mat-tab-group>
</div>
```

The key change of this code is in the `[courses]="beginnerCourses$ | async"` line. Here we use the async pipe syntax of angular to indicate that we will going to subscribe to these observable to retrieve the data and assign it to the markup.

Now, our approach looks promising as it is more maintainable. We don't run into nested subscribe. However we would face other problems now, because we are fetching the data twice from back-end. Let's check the RxJs operator that will help us with this issue.

## Sharing HTTP Responses with the shareReplay Operator
With the reactive design approach implemented, now we are facing the problem of send two request to retrieve the same data. If you check your _Network_ tab in the developer tools of the browser you will see two GET calls to the `courses` endpoints. If in our code we add another call to the `courses$` observable, like `courses$.subscribe()`, then we the _Network_ call will record three calls to the `courses` endpoint. The next code will allow as to just send one call to the endpoint.

```js
ngOnInit() {
  const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
  const courses$ = httpCourses$
    .pipe(
      tap(() => console.log("HTTP request")),
      map(response => Object.values(response["payload"])),
      shareReplay()
    );

  this.beginnerCourses$ = courses$
    .pipe(
      map(courses => courses.filter(course => course.category === 'BEGINNER'))
    );

  this.advancedCourses$ = courses$
    .pipe(
      map(courses => courses.filter(course => course.category === 'ADVANCED'))
    );
}
```

Here is important to highlight the `shareReplay` operator. This operator makes that the stream be executed only once and then the result of that stream will be replayed to each new subscriber. This definition grant to us that our HTTP response is going to be passed on to new each subscription.

Another key detail of the last code is the use of the `tap` operator. This operator able to us introduce side effects in the observable chain for use the helpful `console.log()` to check the execution code of our code.

## RxJs Higher-Order Mapping Operators
The higher order mapping operators that we will review are:

- `switchMap`
- `mergeMap`
- `concatMap`
- `exhaustMap`

These operators are so common when we do network calls. An important detail of the mappings operators is that knowing which operator to use in a given situation _can be a little be confusing_, because it is necessary understand the Observable combination strategy that each one uses internally and then we can proceed with the definition of the mapping operator by itself.

### How the base Map Operator works ###
With the map operator, we can take an input stream (with values 1, 2, 3), and from it, we can create a derived mapped output stream (with values 10, 20, 30).

```js
const arr = [1, 2, 3];

const arr10 = arr.map(x => x * 10); // [10, 20 30]
```

The values of the output stream in the bottom are obtained by taking the values of the input stream and applying them a function: this function simply multiplies the values by 10.

### What is Higher-Order Observable Mapping? ###
In higher-order mapping, instead of mapping a plain value like 1 to another value like 10, we are going to map a value into an Observable!

The result is a higher-order Observable. It's just an Observable like any other, but its values are themselves Observables as well, that we can subscribe to separately. This might sound far-fetched, but in reality, this type of mapping happens all the time.

### Why Higher-Order Observables? ###
In order to implement the form draft save functionality, we need to take the form value, and then create a second HTTP observable that performs a backend save, and then subscribe to it.

We could try to do all of this manually, but then we would fall in the *nested subscribes anti-pattern*.

```js
this.form.valueChanges .subscribe(
      formValue => {
        const httpPost$ = this.http.put(`/api/course/${courseId}`

        httpPost$.subscribe(
          res => ... handle successful save ...
          err => ... handle save error ...
        );
    }
);
```

As we can see, this would cause our code to nest at multiple levels quite quickly, which was one of the problems that we were trying to avoid while using RxJs in the first place.

### Avoiding nested subscriptions ###
We would like to do all this process in a much more convenient way: we would like to take the form value, and `map` it into a save Observable. And this would effectively create a higher-order Observable, where each value corresponds to a save request.

We want to then transparently subscribe to each of these network Observables, and directly receive the network response all in one go, to avoid any nesting.
And we could do all this if we would have available some sort of a higher order RxJs mapping operator! Why do we need four different operators then?

To understand that, imagine what happens if multiple form values are emitted by the `valueChanges` observable in quick succession
and the save operation takes some time to complete:

- should we wait for one save request to complete before doing another save? - Concatenate
- should we do multiple saves in parallel? - Merge
- should we cancel an ongoing save and start a new one? - Switch
- should we ignore new save attempts while one is already ongoing? - Exhaust

Before exploring each one of these use cases, let's go back to the nested subscribes code above.
     
In the nested subscribes example, we are actually triggering the save operations in parallel, which is not what we want because there is no strong guarantee that the backend will handle the saves sequentially and that the last valid form value is indeed the one stored on the backend.


### How to choose the right mapping Operator? ###
The behavior of `concatMap`, `mergeMap`, `switchMap` and `exhaustMap` is similar in the sense they are all higher order mapping operators. But its also so different in so many subtle ways, that there isn't really one operator that can be safely pointed to as a default.

Instead, we can simply choose the appropriate operator based on the use case:

- if we need to do things in sequence while waiting for completion, then `concatMap` is the right choice
- for doing things in parallel, `mergeMap `is the best option
- in case we need cancellation logic, `switchMap` is the way to go (e.g search type head)
- for ignoring new Observables while the current one is still ongoing, `exhaustMap` does just that (e.g form's save button the send the request just once)

### Conclusions ###
As we have seen, the RxJs higher-order mapping operators are essential for doing some very common operations in reactive programming, like network calls.

In order to really understand these mapping operators and their names, we need to first focus on understanding the underlying Observable combination strategies concat, merge, switch and exhaust.

We also need to realize that there is a higher order mapping operation taking place, where values are being transformed into separated Observables, and those Observables are getting subscribed to in a hidden way by the mapping operator itself.

Choosing the right operator is all about choosing the right inner Observable combination strategy. Choosing the wrong operator often does not result in an immediatelly broken program, but it might lead to some hard to troubleshoot issues over time.

> Note: Check the handbook at the `assets/s02-exjs_high_order_mapping_operators.pdf`

## Observable Concatenation
The explain the notion of the observable concatenation lets use the next code as references.

```js
ngOnInit() {
  const source1$ = of(1, 2, 3);
  const source2$ = of(4, 5, 6);
  const source3$ = of(7, 8, 9);

  const result$ = concat(source1$, source2$, source3$); // 1, 2, 3, 4, 5, 6, 7 ,8, 9
  result$.subscribe(console.log);
};
```

So in this code, we define three observables like sources and one as the result of the concatenation. Time to go deep with the information that is relevant to the `concat` operator. First of all, to concatenate the sources observables, we should have to guarantee that these observables are complete. Just under this rule, we can subscribe to the another observable. Therefore if we compile the next code:

```js
ngOnInit() {
  const source1$ = interval(100);
  const source2$ = of(4, 5, 6);
  const source3$ = of(7, 8, 9);

  const result$ = concat(source1$, source2$, source3$); // 1, 2, 3, 4, 5, 6, 7 ,8, 9
  result$.subscribe(console.log);
};

```

The `source2$` and the `source3$` never will be concatenated to the `result$` observable. Second, remember call the `subscribe` method in the `result$` observable to instance it. for the sources observables the subscriptions occurs under the `concat` method.

## From Draft Pre-Save Example and the RxJs Filter Operator
Here we are going to cover a possible use case of the observable concatenation and the `filter` operator. To illustrates these concepts we will use the next example: In the course dialog component, we have a simple form to edit the fields that are relevant for a course —name, category, and description—. All the changes on the form will be a stream of values, and the HTTP PUT request to update the information of the course will be another.

Our first approach will use the _nested subscribe anti-pattern_ and will look like:

```js
import {FormGroup} from "@angular/forms";

...
form: FormGroup;
...

ngOnInit() {
  this.form.valueChanges
    .pipe(
      filter(() => this.form.valid)
    )
    .subscribe(changes => {
      const saveCourses$ = fromPromise(
        fetch(`/api/courses/{$this.course.id}`),
        {
          method: 'PUT',
          body: JSON.stringify(changes),
          headers: {
            'content-type': 'application-json'
          }
        }
      )

      saveCourses$.subscribe();
    });
}
```

Several important thing in this code. The first one is that the observable `this.form.valuesChanges` is provided by angular. The second item is that we use the `filter` operator to keep the forms that are valid. For other side, after subscribe to the `this.form.ValueChanges` observable we use the `fromPromise` operator of RxJs to convert the promise returned by `fethc` into an observable. Finally we have to subscribe it to the definition of the `saveCourses$` observable to instance it. 

This solution works, but follow the _nested subscribe anti-pattern_. Also, if you check the Network tab of your developer tools, you will see that every time that you modify the form, we are sending the PUT request. Let's check how to fix it in the next section.

## The RxJs concatMap Operator
Concatenation is ideally suited for safe operations and when these operations happen in the same order as the values are emitted. To start to organize our code, first we will to take the logic of the `fromPromise `observable and save it in a new method called `saveCourse`. This method will receive just one parameter, the stream values of the changes that the user is making in the form. The next code shows the mentioned split. 

```ts
ngOnInit() {
  this.form.valueChanges
    .pipe(
      filter(() => this.form.valid)
      concatMap(changes => this.saveCourse(changes))
    )
    .subscribe();
}

saveCourse(changes) {
  return fromPromise(
    fetch(`/api/courses/{$this.course.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(changes),
      headers: {
        'content-type': 'application-json'
      }
    }
    )
  );
}
```

Now, let's dive in the definition of `concatMap`. And important rule of the `concatMap` is that it will take the values of the source observable and for each values will create a new safe observable. Then it will concatenate all those derive observables together in order to make sure that the safe operations are done in the right order.

In summary, the `concatMap` higher-order operation map values to inner observable, subscribe and emit then in order. Notice that the operator do the subscriptions of his observables internally.

In our case, we use the `concatMap` operator after filter the valid forms, passing the values changes and returning the `saveCourses` observable. You can check how works this implementation in the Network tab of the developer tools.

- [concatMap Documentation](https://rxjs.dev/api/operators/concatMap)

## Understanding the Merge Observable Combination Strategy
By definition the `merge` operator creates an output observable which concurrently emits all values from every given input observable. To illustrate this notion, lets evaluate the next snippet:

```ts
ngOnInit() {
  const interval1$ = interval(1000);
  const interval2$ = interval1$.pipe(map(val => 10 * val));

  const result$ = merge(interval1$, interval2$);
  result$.subscribe(console.log); // prints: 1, 10, 2, 20, 3, 30, ...
};
```

In this code, we have two input observables: `interval1$` that emit a value each second and `interval2$` that takes the `interval1$` and via `map` multiplies the values by 10. In the `result$` observable, we use the `merge` operator to flat the values of the input observables by blending their values in the output observable. For more information about how this operators works, please visit the official documentation.

- [merge Documentation](https://rxjs.dev/api/index/function/merge)

## The RxJs mergeMap Operator
The `mergeMap` operator share the same principle of the `concatMap` operator. We will operate over the source observable, and we are going to apply a mapping function that will take the value to produce a new observable. The difference with `concatMap` is that instead of wait until the source observable be completed to start with the second observable, the `mergeMap` will map the values of the second observable as it find them. In other words, it will operate in *parallel* the mapping function. Let's check the notion of `mergeMap` with an example:


```ts
ngOnInit() {
  this.form.valueChanges
    .pipe(
      filter(() => this.form.valid)
      mergeMap(changes => this.saveCourse(changes))
    )
    .subscribe();
}

saveCourse(changes) {
  return fromPromise(
    fetch(`/api/courses/{$this.course.id}`,
    {
      method: 'PUT',
      body: JSON.stringify(changes),
      headers: {
        'content-type': 'application-json'
      }
    })
  );
}
```

The above code replace the `concatMap` by `mergeMap` at the moment to send our PUT request when the user edit the form. If you check in the network tab, every time that the user changes the form, a request will be emitted, because the mapping function is executed as values are found, no matters if belongs to a different source observable.

For the user form changes, it is suitable send the request in sequence, it is for that reason that the `concatMap` operator is the appropriate to guarantee the expected behavior. For more information about the `mergeMap` operator, please visit the official documentation.

- [mergeMap Documentation](https://rxjs.dev/api/operators/mergeMap)

## The RxJs exhaustMap Operator
To explain the `exhaustMap` operator let's define a concrete example where it could be useful. In the edit course dialog we have there a save button. The goals is that whenever the user click on the save button we will trigger the `saveCourse` method that we have on the back-end.

One common feature to implement in these cases is to prevent the user from hitting the save button multiple times sending multiple calls to the back-end. So in our context our markup will be like:

```html
<mat-dialog-actions>

    <button class="mat-raised-button"
            (click)="close()">
        Close
    </button>

    <button class="mat-raised-button mat-primary" #saveButton>
        Save
    </button>

</mat-dialog-actions>
```

Here it is important the `#saveButton` to send the element references in the DOM to the `.ts` file and retrieve the event button. The next snippet shows the content of the typescript file of the component:

```ts

    //--snippet--
    
    @ViewChild('saveButton', { static: true }) saveButton: ElementRef;

    //...

    ngAfterViewInit() {
      fromEvent(this.saveButton.nativeElement, 'click')
        .pipe(
          exhaustMap(() => this.saveCourse(this.form.value));
        )
    }
```

The last snippet use the `fromEvent` to create the observable that will listen the `click` event on the save button. Then we open the `.pipe` method and finally the `exhaustMap` appears. By definition, the `exhaustMap` projects each source values to an Observable which is merge in the output observable only if the previous projected Observable has completed. The benefit that we gain with the `exhaustMap` is that the values after completed the output Observable will be ignored. This description is ideal for our save form button to avoid send the HTTP PUT request every time that the user clicks in the button.

- [exhaustMap Documentation](https://rxjs.dev/api/operators/exhaustMap)

## Unsubscription in Detail
The unsubscription feature of Observables, allow us to cancel the operations on the stream value. This scenario should be useful for a search feature where after the user types some character we cancel the subscription to retrieve the results. Let's introduce the unsubscription with the next example:

```ts
  const interval1$ = interval(1000);
  const sub = interval1$.subscribe(console.log);

  setTimeout(() => sub.unsubscribe(), 5000); // prints: 0, 1 ,2, 3, 4
```

In the last code, we use the `setTimeout` function to indicate that after five seconds, the unsubscription to the interval1$ Observable will be effective. That is the reason why in the console of the developer tools we see the log of the first five values that generate the observable.

Let's follow the reviewed principle with a common case in web development: Cancel HTTP request. The next code is a variation of our `createHttpObservable` method in the `util.ts` file:

```ts
export function createHttpObservable(url: string) {
  return Observable.create(observer => {
    const controller = new AbortController()
    const signal = controller.signal;

    fetch(url, { signal })
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

    return () => controller.abort();
  });
}
```

Here, we use the `AbortController` class provided by the Fetch API, retrieve the `signal` property of the `controller` that will be passed to the `fetch` method, and then we use the `abort()` method to cancel the request. Below show how to cancel the HTTP request once is triggered:

```ts
const http$ = createHttpObservable('/api/courses');
const subHttp = http$.subscribe(console.log);

setTimeout(() => subHttp.unsubscribe(), 0);
```

## Setting Up the Course Component
Before to continue with the `switchMap` operator, first let's set up an scenario where is enable a type search bar to find lessons of a course. The next code is on the `course.component.ts` file. The user can navigate to this view if click on the _view course_ button. The next code is the implementation to render the information of the course. 

```ts
export class CourseComponent implements OnInit, AfterViewInit {
    course$: Observable<Course>;
    lessons$: Observable<Lesson[]>;

    @ViewChild('searchInput', { static: true }) input: ElementRef;

    constructor(private route: ActivatedRoute) {

    }

    ngOnInit() {
      const courseId = this.route.snapshot.params['id'];
      this.course$ = createHttpObservable(`/api/courses/${courseId}`);
      // --snip--
    }

    ngAfterViewInit() {

    }
}
```

Notice that the `course$` Observable is created with help of the `createHttpObservable` method from our `util.ts` file. Additionally, the request is send to the course endpoint with the `courseId` parameter, to bring the information of that particular course. This set up is consume in the next markup. 

```html
<div class="course">
    <ng-container *ngIf="(course$ | async) as course">
        <h2>{{course?.description}}</h2>
        <img class="course-thumbnail" [src]="course?.iconUrl">
    </ng-container>

    <mat-form-field class="search-bar">
        <input matInput placeholder="Type your search" #searchInput autocomplete="off">
    </mat-form-field>

    <!-- snip --/>
</div>
```

As you can see, here we use again the `course$ | async` syntax to subscribe into the `course$` Observable. Then, with help of the optional operator `?`, the information of the course is displayed.

Similarly, we follow the last logic for get the lessons of the course. below the code related to request the lessons endpoint in the `course.component.ts` file.

```ts
export class CourseComponent implements OnInit, AfterViewInit {
    ngOnInit() {
      // --snip--
      this.lessons$ = createHttpObservable(`/api/lessons?courseId=${courseId}&pageSize=100`)
        .pipe(
          map(response => response["payload"])
        );
    }

    ngAfterViewInit() {

    }
}
```

The additional step for lessons, is that we send the `pageSize` parameter to limit the quantity of lessons displayed in the page, andthe `map` for the `payload` property. Next, it is the markup for the lessons of the course.

```html
<div class="course">
    <!-- snip --/>
    <table class="lessons-table mat-elevation-z7" *ngIf="(lessons$ | async) as lessons">
        <thead>
            <th>#</th>
            <th>Description</th>
            <th>Duration</th>
        </thead>

        <tr *ngFor="let lesson of lessons">
            <td class="seqno-cell">{{lesson.seqNo}}</td>
            <td class="description-cell">{{lesson.description}}</td>
            <td class="duration-cell">{{lesson.duration}}</td>
        </tr>
    </table>
</div>
```

Again, we use the `lessons$ | async` syntax to subscribe into the observable, and we render the lessons information in a table.

Now that we have the set up of our course lessons, let's dive in the `switchMap` operator to enable the search typehead feature.

## Building a Search Typehead
To start or search type head feature, we will use an input file in the markup of our `course.component` to retrieve the typed keys to establish the search. The next code is a snippet of the `course.component.html` file that corresponds to the input field to receive the search.

```html
<!-- snip --/>
    <mat-form-field class="search-bar">
        <input matInput placeholder="Type your search" #searchInput autocomplete="off">
    </mat-form-field>

```

Once this definition is ready we can consume it in the `course.component.ts` with help of the `@ViewChild` directive of angular as shown below.

```ts
@ViewChild('searchInput', { static: true }) input: ElementRef;

// -- snip ---

ngAfterViewInit() {
  fromEvent<any>(this.input.nativeElement, 'keyup')
    .pipe(
      map(event => event.target.value),
      debounceTime(400),
      distinctUntilChanged()
    ).
    subscribe(console.log);
}
```

Finally in our `ngAfterViewInit` we set the logic to create an Observable from the `keyup` event that get the search input. First we map our data to retrieve the respective value of the event, in this cases the character key.

Second, we use the `debounceTime` operator to set stability in the values of the streams. If you log the Observable without the `debounceTime` operator, you will see duplicated values and also all the typed characters. This behavior is not the expected because the each log represent a request to our backend. Then the `debounceTime` operator allow us to emit a value from the source Observable only after a particular time span has passed without another source emission.

Lastly, we use the `distinctUntilChanged` operator to validate that the emitted items by the source Observable are distinct by comparison from the previous item. This way we avoid the duplicated values that the Observable can record.

Now we have the basis to send the request of the search. Time to see what would be the best operator to this cases. The previous higher map operators are not a good choice, the give us a clue to check the `switchMap` operator.

- [debounceTime Documentation](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-debounceTime)
- [distinctUntilChanged Documentation](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-distinctUntilChanged)

## Finishing the Search Typehead
Before continue, lets abstract the logic to load the lessons in a method that could be called from the `ngAfterViewInit`. This implies that we have to set the `courseId` value as a global variable of the component. The changes of the code inside the `CourseComponent` is below.

```ts
export class CourseComponent implements OnInit, AfterViewInit {
    courseId: Number;
    course$: Observable<Course>;
    lessons$: Observable<Lesson[]>;

    @ViewChild('searchInput', { static: true }) input: ElementRef;

    constructor(private route: ActivatedRoute) {

    }

    ngOnInit() {
      this.courseId = this.route.snapshot.params['id'];
      this.course$ = createHttpObservable(`/api/courses/${this.courseId}`);
    }

    ngAfterViewInit() {
      const searchLessons$ = fromEvent<any>(this.input.nativeElement, 'keyup')
        .pipe(
          map(event => event.target.value),
          debounceTime(400),
          distinctUntilChanged(),
          switchMap(search => this.loadLessons(search))
        );

        const initialLessons$ = this.loadLessons();
        concat(initialLessons$, searchLessons$);
    }

    loadLessons(search = ''): Observable<Lesson[]> {
      return createHttpObservable(
        `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
      )
      .pipe(
        map(response => response["payload"])
      )
    }
}
```

Notice the use of the `switchMap` in the `ngAfterViewInit` method. The `switchMap` operator projects each source value to an Observable which is merged in the output Observable, emitting values only from the most recently projected Observable. This is perfect for release the search because we can interrupt the emitting values until we have the stable presentation of the word to do the search.

- [switchMap Documentation](http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html#instance-method-switchMap)

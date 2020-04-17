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
## The RxJs concatMap Operator
## Understanding the Merge Observable Combination Strategy
## The RxJs mergeMap Operator
## The RxJs exhaustMap Operator
## Unsubscription in Detail
## Setting Up the Course Component
## Building a Search Typehead
## Finishing the Search Typehead

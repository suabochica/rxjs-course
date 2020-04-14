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

```js
export class HomeComponent implements OnInit {
  beginnerCourses$: Observable<Course[]>;
  advancedCourses$: Observable<Course[]>;

  ngOnInit() {
    const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');
    const courses$ = httpCourses$
      .pipe(
        map(response => Object.values(response["payload"]))
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
}
```
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

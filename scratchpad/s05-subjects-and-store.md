
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
To continue with the implementation of the store, we will start by filling out the store with the courses data. The appropriate moment to make the request to the back-end is when we start the application. So let's consume our store from the `app.component.ts` file:

```ts
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  constructor(private store: Store) {
  }

  ngOnInit() {
    this.store.init();
  }
}
```

Note that we are calling `this.store.init` method. So, the next step is define what will to do the `init` method of the store. Here is the common place to create our HTTP observable, and take away this logic from the component by itself. The next snippet consolidate our `Store` service:

```ts
export class Store {
    private subject = new BehaviorSubject<Course[]>([]);
    courses$: Observable<Course[]> = this.subject.asObservable()

    init() {
        const httpCourses$: Observable<Course[]> = createHttpObservable('/api/courses');

        httpCourses$
            .pipe(
                tap(() => console.log("HTTP request")),
                map(response => Object.values(response["payload"])),
            )
            .subscribe(
                courses => this.subject.next(courses)
            );
    }

    selectBeginnerCourses() {
        return this.filterByCategory('BEGINNER');
    }

    selectAdvancedCourses() {
        return this.filterByCategory('ADVANCED');
    }

    filterByCategory(category: string) {
        return this.courses$
            .pipe(
                map(courses => courses.filter(course => course.category === category))
              );

    }
}
```

Good, now we are fetch the data from the `init` method of our store. Moreover, check that we define method helpers to filter the courses according the category. Thanks to this helpers the `home.component.ts` will be:

```ts
@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
}) 

export class HomeComponent implements OnInit {
  beginnerCourses$: Observable<Course[]>;
  advancedCourses$: Observable<Course[]>;

  constructor(private store: Store) {

  }

  ngOnInit() {
    const courses$ = this.store.courses$;

    this.beginnerCourses$ = this.store.selectBeginnerCourses();
    this.advancedCourses$ = this.store.selectAdvancedCourses();
  }
}
```

Much simpler! That is one of the benefits of use the store pattern. Now our components just have to consume the data in the store.

## Data Modification via Store
Some lessons ago, we reviewed a scenario in the application where we did changes in the information of a course using the `course-dialog.component.ts`. In this first approach, we did the PUT HTTP request to modify the data directly in the component. Let's fit these context under the store pattern. 

First of all, we have to associate a save method from save button that confirm the modification of the course info. Next markup let us attach the method to the click event in the `course-dialog.component.html` file.

```html
<mat-dialog-actions>
    <button class="mat-raised-button"
            (click)="close()">
        Close
    </button>
    <button class="mat-raised-button mat-primary" #saveButton (click)="save()">
        Save
    </button>
</mat-dialog-actions>
```

Now, we will use this save method to call the store from our component. Remember that one of the purposes of the store service is reduce the responsibilities of the components. So the code in the `course-dialog.component.ts` file will:

```ts
    save() {
      this.store.saveCourse(this.course.id, this.form.value)
        .subscribe(
          () => this.close(),
          error => console.log("Error saving course", error)
        );
    }
```

Note that the `saveCourse` will receive two parameters; the id of the course that will be updated, and the values established in the form. Afterwards, we subscribe to this subject handled from the store, then, we close the observable in the complete state, and if we get an error we will print it in the console.

Now all the burden to modify the data relies on the `saveCourse` method of the store, let's review his implementation:

```ts
    saveCourse(courseId: number, changes): Observable<any> {
        const courses = this.subject.getValue();
        const courseIndex = courses.findIndex(course => course.id === courseId);
        const newCourses = courses.slice(0);

        newCourses[courseIndex] = {
            ...courses[courseIndex],
            ...changes
        };

        this.subject.next(newCourses);

        return fromPromise(fetch(`/api/courses.${courseId}`, {
            method: PUT,
            body: JSON.stringify(changes),
            headers: {
                'content-type': 'application'
            }
        }));
    }
```

Several thing happens here. First we get the courses from the subject. Second, we get the index of the course that will be updated, and parallel we create a `newCourses` array with help of the `slice` method.

Then, we modify the new courses array applying the changes to the element that match with the course index. We use the spread operator to fit the array. Later we pass the new array to the `next` method of the subject. Finally, we return an observable using the `fromPromise` method to send the PUT HTTP request.

## Refactoring the Course Component Using Store
Time to fit the `course.component.ts` to the store service pattern. Let's check the modifications in the code:

```ts
export class CourseComponent implements OnInit, AfterViewInit {
    courseId: string;
    course$: Observable<Course>;
    lessons$: Observable<Lesson[]>;

    @ViewChild('searchInput', { static: true }) input: ElementRef;

    constructor(private route: ActivatedRoute, private store: Store) { }

    ngOnInit() {
        this.courseId = this.route.snapshot.params['id'];
        const course$ = this.store.selectCourseById(this.courseId);
        const lessons$ = this.loadLessons();

        forkJoin(course$, lessons$)
        .pipe(
            tap(([course, lessons]) => {
            console.log('course', course);
            console.log('lessons', lessons);
            })
        )
        .subscribe();
    }
```

So, again we first have to inject the store in the constructor of the component. Now in the `ngOnInit` method we get the course from the `selectCourseById` method in the store. Let's check this filter method.

```ts
    selectCourseById(courseId: number) {
        return this.courses$
            .pipe(
                map(courses => courses.find(course => course.id === courseId))
            );
    }
```

This function is very similar to the `selectBeginnerCourses`, instead of use the `filter` array function we sue the `find` an the criteria is the `courseId`. An important detail to highlight in the `course.component.ts` is that here we set the HTTP request to load the lessons directly in the component instead of put it in the store. The reason is because the search functionality have a high rate change, so it is not a candidate to be handled from the store.

## Forcing the Completion of Long Running Observable
One particular function of the Observable generate by the subject and lives in the store is that this Observable never completes. This will be a problem if we want to use operators that depends of the complete state of the Observable, like `forkJoin`. If we try to use this operator we can't use it as expected.

```ts

    ngOnInit() {
        this.courseId = this.route.snapshot.params['id'];
        const course$ = this.store.selectCourseById(this.courseId);
        const lessons$ = this.loadLessons();

        forkJoin(course$, lessons$)
        .subscribe(console.log); // operator don't log anything
    }
```

To fix this scenario we can use the `first` operator to force the completion of the Observable. Principally, the `first` operator will complete the Observable with the first value in the observable. Before to use it, we have to fit the `selectCourseById` method in our store service just to validate that the method will return a value:

```ts
    selectCourseById(courseId: number) {
        return this.courses$
            .pipe(
                map(courses => courses.find(course => course.id === courseId)),
                filter(course => !!course)
            );
    }
```

Above, we use the `filter` method to check that the course values have at least one values with help of the `!!` type coercion operator of JavaScript. Now in our component we can use the `first` operator:

```ts
    ngOnInit() {
        this.courseId = this.route.snapshot.params['id'];
        const course$ = this.store.selectCourseById(this.courseId)
            .pipe(
                first()
            );
        const lessons$ = this.loadLessons();

        forkJoin(course$, lessons$)
        .pipe(
            tap(([course, lessons]) => {
            console.log('course', course);
            console.log('lessons', lessons);
            })
        )
        .subscribe();
    }
```

Now our `forkJoin` method works as expected. Sometimes, we need to complete the Observable with a different value of the first one. For that case we can use the `take` operator which receive as parameter the position of the value with we want to complete the Observable. So if we declare `take(3)` the Observable will be completed with the third value in the stream.

## The withLatestFrom RxJs Operator
The last operator to review to work with the long value Observable that purpose the store service pattern is the `withLatestFrom`. Basically, this operator combines the source Observable with the output Observable to create a new Observable whose values are calculated from the latest values of each, only when the source emits.

For our case, lets combine the lessons Observable with the course Observable via `withLatestFrom`. Check the code below.

```ts
    ngOnInit() {
        this.courseId = this.route.snapshot.params['id'];
        const course$ = this.store.selectCourseById(this.courseId);

        this.loadLessons()
            .pipe(
                withLatestFrom(this.course$)
            )
            .subscribe(([lessons, course]) => {
                console.log('course', course);
                console.log('lessons', lessons);
            });
    }
```

For detailed information  about the `withLatestFrom`, please review the official documentation.

- [withLatestFrom](https://rxjs-dev.firebaseapp.com/api/operators/withLatestFrom)

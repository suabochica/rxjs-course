import { Component, OnInit } from '@angular/core';
import { Course } from "../model/course";
import { interval, Observable, of, timer, throwError } from 'rxjs';
import { catchError, delayWhen, map, retryWhen, shareReplay, tap, finalize } from 'rxjs/operators';

import { createHttpObservable, noop } from '../common/util'

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

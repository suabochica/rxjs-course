import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Course } from "../model/course";
import { Store } from "../common/store.service";
import {
  debounceTime,
  throttleTime,
  distinctUntilChanged,
  startWith,
  tap,
  delay,
  map,
  concatMap,
  switchMap,
  withLatestFrom,
  concatAll,
  shareReplay
} from 'rxjs/operators';
import { merge, fromEvent, Observable, concat, forkJoin } from 'rxjs';

import { createHttpObservable } from '../common/util';
import { Lesson } from '../model/lesson';
import { response } from 'express';
import { debug, RxJsLoggingLevel, setRxJsLoggingLevel } from '../common/debug';


@Component({
  selector: 'course',
  templateUrl: './course.component.html',
  styleUrls: ['./course.component.css']
})
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

    ngAfterViewInit() {
        fromEvent<any>(this.input.nativeElement, 'keyup')
        .pipe(
            map(event => event.target.value),
            startWith(''),
            throttleTime(400),
        )
        .subscribe(console.log);
    }

    loadLessons(search = ''): Observable<Lesson[]> {
        return createHttpObservable(
        `/api/lessons?courseId=${this.courseId}&pageSize=100&filter=${search}`
        )
        .pipe(
            map(response => response["payload"])
        );
    }
}

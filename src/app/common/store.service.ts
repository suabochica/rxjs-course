import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { map, tap } from 'rxjs/operators';

import { createHttpObservable, noop } from '../common/util'
import { Course } from '../model/course';

@Injectable({
    providedIn: 'root'
})
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
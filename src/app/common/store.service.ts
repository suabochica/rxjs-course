import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { fromPromise } from 'rxjs/internal-compatibility';
import { map, tap, filter } from 'rxjs/operators';

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

    selectCourseById(courseId: number) {
        return this.courses$
            .pipe(
                map(courses => courses.find(course => course.id === courseId)),
                filter(course => !!course)
            );
    }

    filterByCategory(category: string) {
        return this.courses$
            .pipe(
                map(courses => courses.filter(course => course.category === category))
            );
    }

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
}

import { Observable } from 'rxjs';

export function createHttpCoursesObservable(url: string) {
  return Observable.create(observer => {
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

export function noop() { }

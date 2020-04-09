import { Observable } from 'rxjs';

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

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { noop, concat, pipe, of, merge, interval } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
    // Explaining the concat operator
    // ---------------------------------

    // const source1$ = of(1, 2, 3);
    // const source2$ = of(4, 5, 6);
    // const source3$ = of(7, 8, 9);

    // const result$ = concat(source1$, source2$, source3$);
    // result$.subscribe(console.log);

    // Explaining the merge operator
    // ---------------------------------

    const interval1$ = interval(1000);
    const interval2$ = interval1$.pipe(map(value => 10 * value));

    const result$ = merge(interval1$, interval2$);
    result$.subscribe(console.log);
    };
};

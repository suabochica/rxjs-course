import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { noop, pipe } from 'rxjs';

import { createHttpCoursesObservable } from '../common/util'

@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  };
};

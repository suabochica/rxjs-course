# Section 01: Introduction to RxJs #

## Index ##
- RxJs In Practice Course Helicopter View
- Recommended Software Versions
- The TypeScript Jumpstart Ebook
- Environment Setup
- Understanding RxJs - What are Streams?
- What is RxJs? What Problem Does It Solve?
- What is an RxJs Observable? A Simple Explanation 
- Core RxJs Concepts -Errors, Completion and Subscriptions
- Learn How Observables Work Under the Hood

## RxJs In Practice Course Helicopter View
Please, check the README.md file to check the contents that will attended in the course.

## Recommended Software Versions
Hello everyone,

Just a quick note to let you know that the current recommended node version for this course is:

- Node 12

Please use this version of node, which is compatible with the `package-lock.json` available in the repository. This will avoid any semantic versioning issues, and ensure you a smooth installation and course taking experience.

## The TypeScript Jumpstart Ebook
This course will be in the Typescript language, which is closely related to other languages that you are *likely already familiar with*. 

But it that is not the case, we have here a **E-Book aimed at getting you started quickly with the language**, so that you can focus on the Advanced Angular features presented during the course.

Before starting setting up your development environment, please take a moment to download the Typescript Jumpstart Ebook, that is available together with this video course:

This book covers the *Typescript Type System* and the multiples *Type Definitions*, which are the most unique parts of the language that are a bit different from other closely related languages. 

### This Book In a Nutshell ###
This book is aimed at  developers that want to get a *deeper understanding of Typescript*. If you have been trying to learn or use Typescript and would now like to go deeper into the language and learn how to make the most of its **powerful type system**, then this book is for you.

### What is the core value proposition of this book? ###
Sit down in one *evening* with this book, and learn the **key aspects** of the language and its type system that might take months of experience and long stackoverflow sessions to gather the hard way.

Become a lot more comfortable using Typescript on a daily basis, learn quickly the fundamentals of the language so that you can focus on other things in your project.

### Why a Fast-track Guide to Typescript? ###
Typescript combines many of the best features of **statically-typed languages**, together with some of the best features of **dynamically-typed languages**.

So this means that if you already know one of the following: Javascript /ES6, Java, C#, Ruby Python, you will notice many overlapping features. So you already know a lot about Typescript, and only really need to learn what is unique about it.

### A Deceivingly Familiar Language! ###
Many times developers can just jump right into the language without any formal training, because the **language looks** so familiar. And this is very often the case in the Angular Ecosystem for example, where we often just start using the language straight away.

But you might notice that some things just don't work as expected: for example, compiler error messages show up for something that apparently should just work.

The problem is that the Typescript type system **works in a very different way** than the type systems of the most popular statically typed languages, and there are good reasons for that.

The familiarity with other languages is a great feature, but that familiarity alone might not be enough for a comfortable development experience.

To get the most out of Typescript, we really need to take a moment to **dive deeper into its type system**, and that is what this book is specifically about.

### I'm a Javascript Developer, is this book for me? ###

If you are afraid that using Typescript means a lot of ceremony and verbosity for just a bit of tooling, in this book you will learn that we can actually have the **best of both worlds in Typescript**:

we can write very concise code with almost no type annotations, but still benefit from all the tooling like auto-completion and refactoring working out-of-the-box.

> Note: Check the handbook at the `assets/s01-typescript_jumpstart_handbook.pdf`

## Environment Setup

### Installation pre-requisites ###
- Node over v12
- Angular CLI
- An IDE

### Relevant commands ###
To run the development backend server execute:

    npm run server
    
This is a small Node REST API server.

To run the development UI server execute:

    npm start

The application is visible at port 4200: http://localhost:4200

## Understanding RxJs - What are Streams?
Before to start with observables it is important understand the notion of a stream of values. 

In a web application often we have asynchronous request coming from the network bringing new values from the back-end. Additionally we have timeouts occurring in the front-end when we have user interaction reflected in events (e.g the click event). The combination of those asynchronous tasks are necessary to produce the final result of our program.

A stream is basically a sequence of data values over time, this can range from a simple increment of number printed in 6 seconds (0, 1, 2, 3, 4, 5), or coordinates printed over time, and even the data value of inputs in a form. These all represent data values will be collected over the time, hence the name stream.

Next we will share you three example. The first one is and stream of values that collect the click event when a user click over any place in a web page:

```js
document.addEventListener('click', event => {
    console.log(event); // output: [MouseEvent{}, MouseEvent{}, MouseEvent{}, ...]
})
```

The second one use the `setInterval` method of an API to print a the increment of a counter each second:

```js
let counter = 0;

setInterval(() => {
    console.log(counter); // output: [1, 2, 3, 4, ...]
    counter++;
}, 1000)
```

The last one use the `setTimeout` method of an API to print `finished...` after three seconds:

```js
setTimeout(() => {
    console.log("finished..."); // finished...
}, 3000)
```

Here we got that in the first and the second example the stream have multiple values and they can continue to emit values over the time, so they will never complete. In the third example, the stream have just one values and is completed after three seconds.

## What is RxJs? What Problem Does It Solve?
RxJS is a framework for reactive programming that makes use of Observables, making it really easy to write asynchronous code.

So, to understand this definition let's to combine our three stream values with the next sequence: After the user clicks on the page, we will trigger the `setTimeout` function and then we execute the `setInterval` stream. To achieve this in JavaScript we should nest the order via callbacks as we show below:

```js
document.addEventListener('click', event => {
    console.log(event) // output: [MouseEvent{}, MouseEvent{}, MouseEvent{}, ...]

    setTimeout(() => {
      console.log("finished..."); // finished...

      let counter = 0;

      setInterval(() => {
          console.log(counter); // output: [1, 2, 3, 4, ...]
          counter++;
      }, 1000);
    }, 3000);
});
```

We combine our stream values and our program behaves as we expect, but, we fall in a common problem in JavaScript that is called the callback hell. The callback hell issue makes that the programs will hard to understand and complicated to maintain. Here, RxJs came to the rescue.

RxJs that stands for reactive extensions for JavaScript, is a library that makes it very simple to combine stream of values together in a maintainable way.

## What is an RxJs Observable? A Simple Explanation
Streams are important to understand because they are facilitated by RxJS Observables. An Observable is basically a function that can return a stream of values to an observer over time, this can either be synchronously or asynchronously. The data values returned can go from zero to an infinite range of values.

So, to continue with this explanation, let's use the stream of values that we define in vanilla JavaScript before, and we start to use the methods of the RxJs library, as shown next:

```js
import { fromEvent, timer, interval } from 'rxjs'

const interval$ = interval(1000);
interval$.subscribe(value => console.log(`Interval Stream: ${value}`));

const timer$ = timer(3000, 1000);
timer$.subscribe(value => console.log(`Timer Stream: ${value}`));

const click$ = fromEvent(document, 'click');
click$.subscribe(event => console.log(event));
```

First of all, check that the `fromEvent`, `timer`, and `interval` are methods from RxJs that are equivalent to `addEventListener`, `setTimeout` and `setInterval` respectively.

Here, it is important highlight that the `$` at the end of the variable name is a convention to indicate the observable. In this first assignation we are _defining_ a stream of values. In the vanilla example, we are instancing the stream of values directly. To instance the stream of values we have to use the `subscribe` method of an RxJs Observable.

## Core RxJs Concepts - Errors, Completion and Subscriptions
To explore the RxJs core concepts we should dive in the `subscribe` methods. By definition, the `subscribe` methods can receive three parameters:

1. A callback function to handle the `next` (emit) scenario
1. A callback function to handle the `error` scenario
1. A callback function to handle the `complete` scenario

So let's bolster our `fromEvent` subscription:

```js
const click$ = fromEvent(document, 'click');
click$.subscribe(
    event => console.log(event),
    error => console.log(error),
    () => console.log("completed")
);
```

Now we include a logic for the error handling and the complete scenario for our `fromEvent` observable.  An important aspect is that the error and complete scenario are exclusive. If one is executed the stream will not emit values.

Another important notion in what concerns observables is the notion of subscription and cancellation. For example, if for the `timer$` observable we want to unsubscribe it after five seconds and no long handle the values it might emitting, we can use the next approach.

```js
const timer$ = timer(3000, 1000);
timer$.subscribe(value => console.log(`Timer Stream: ${value}`));

setTimeout(() => timer$.unsubscribe(), 5000)
```

As we can see, RxJs offer the `unsubscribe` method for observable to cancel the subscription from the stream of values.

## Learn How Observables Work Under the Hood
To check how observables work under the Hood, let's check a practical example of a HTTP stream. Before to start, please check that your back-end server is up getting an response from the next URL:

```
http://localhost:9000/api/courses
```

Once this endpoint is giving us a response let's create an observable over our HTTP request, as shown below:

```js
const httpCourse$ = Observable.create(observer => {
  fetch('/api/courses')
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
```

First of all, notice the `Observable.create` method. This is the explicit way of create an observable from scratch and this method is called in the by the `fromEvent`, `interval` and `timer` methods that we used before.

Second thing, this function takes one parameter which is known as the `observer`. The `observer` is what is going to allow us to emit new values, handling the error or the complete scenario of the observable.

At this point in the body of the function that we pass to the `create` method, we use the Fetch API to get the response of our `.api/course` endpoint. Remember that the `fetch` function returns a promise. In our first `.then` we get the body of the response. In the second `.then` we pass this body to the `next` method of the observer to emit the value and later we notify that the observable is complete. Additionally in the `.catch` function we handle any possible error.

The current code is just the definition of the stream of values. We precise a subscription to instantiate the observable, as shown below:

```json
httpCourses$.subscribe(
  courses => console.log(courses),
  noop,
  () => console.log('completed')
);
```

Now, if we check the browser console we will get the object with the response of the courses endpoint. Also, note that we use the three parameters of the `subscribe` method to validate each of the respective scenarios.

Finally you will ask yourself why we transform the `fetch` promise into an observable, if we got our data as expected. The main advantage is that now, we can use all the RxJs operators to easily combine our HTTP stream with other streams of values such as click handlers or timeouts. Let's dive down in the next section the different operators the RxJs offer us.

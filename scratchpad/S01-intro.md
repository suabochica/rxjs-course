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

> Note: Check the handbook at the `assets/ch01_typescript_jumpstart_handbook.pdf`

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
## Core RxJs Concepts -Errors, Completion and Subscriptions
## Learn How Observables Work Under the Hood

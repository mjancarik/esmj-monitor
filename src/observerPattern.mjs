export class ObserverInterface {
  pipe() {}
  next() {}
  error() {}
  complete() {}
}

export class Observable extends ObserverInterface {
  #observers = [];

  pipe(...operations) {
    return Array.from(operations).reduce(
      (observable, operation) => operation(observable),
      this
    );
  }

  next(...rest) {
    this.#observers.forEach((observer) => {
      typeof observer === 'function'
        ? observer(...rest)
        : observer.next(...rest);
    });
  }

  error(...rest) {
    this.#observers.forEach((observer) => {
      observer?.error?.(...rest);
      this.unsubscribe(observer);
    });
  }

  complete(...rest) {
    this.#observers.forEach((observer) => {
      observer?.complete?.(...rest);
      this.unsubscribe(observer);
    });
  }

  subscribe(observer) {
    this.#observers.push(observer);

    return () => {
      this.unsubscribe(observer);
    };
  }

  unsubscribe(observer) {
    const index = this.#observers.indexOf(observer);

    this.#observers.splice(index, 1);
  }
}

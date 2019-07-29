class History {
  constructor(canvas, rows, cols) {
    this.canvas = canvas;
    this.rows = rows;
    this.cols = cols;
    // states contains the entire canvas data
    // in a list going back to the beginning
    this.states = [];
  }

  /**
   * TODO: this is generating too many states,
   * we might need to have some timeout indicating which states should be dropped.
   * We can have will modify check the states, start a timer and at the end of the timer
   * OR at the point of mouse-released we can take the most recent state and push that to
   * states. So there would be a temporary places for all states during the timer
   * but only one is kept on time expired. This could continue while and until the
   * mousereleased event is fired?
   *
   * the willModify captures the imageData of the ctx of
   * this.canvas at the point of before the initial stroke of the transaction.
   * This is pushed to state so that the entire transaction that is about
   * to happen when this method is called can be undone
   * by reverting to the object passed to this method.
   *
   * This method should be called before the start of a transaction.
   * Alternatively, it may be called at the end of every transaction,
   * before the start of new one, so long as it is called once before the
   * drawing begins
   */
  willModify() {
    let ctx = this.canvas.elt.getContext('2d');
    let imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.states.push(imageData);
  }

  /**
   * This method pops the last state off of this.states
   * and puts that image data into the cavas overwriting
   * the current data that is there.
   */
  undo() {
    let data = this.states.pop();
    let ctx = this.canvas.elt.getContext('2d');
    ctx.putImageData(data, 0, 0);
  }


}

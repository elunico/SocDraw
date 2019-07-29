// eslint-disable-next-line no-unused-vars
class CanvasHistory {
  constructor(canvas, rows, cols) {
    this.canvas = canvas;
    this.rows = rows;
    this.cols = cols;
    // states contains the entire canvas data
    // in a list going back to the beginning
    this.states = [];

    this.inProgress = false;
    this.last = -1;
    this.timer = null;
  }

  /**
   * TODO: keep track of and transmit undo events over the sockets
   * transmit: send the state that is the target of the undo over the network
   *           and place it in the canvas ctx? Could be a problem for race conditions!
   * keep track of: ???? how will I transmit this over the network???
   *               Perhaps an undo can cause a reset? that means all susequent actions
   *               are relative to that canvas state (Operational transform)
   *               the undo triggers a reset of all previous data, and the state
   *               is simply used as the starting point this happens for every undo
   *
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
    if (!this.inProgress) {
      this.last = this.states.length - 1;
      this.inProgress = true;
      this.timer = setTimeout(this.condense.bind(this), 350);
    }
    let ctx = this.canvas.elt.getContext('2d');
    let imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.states.push(imageData);
  }


  condense() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.inProgress = false;
    /* this.last is the last element before the impending modification
    * this.last + 1 would start deleting at the first element of the impending
    * (or currently running) modification
    * this.last + 2 starts deleting from the second element. Since splice
    * ranges include the first element we have to start with the element after
    * the first element in the new modification
    * Then since we go two past the last, we delete the length of the array
    * minute where we started (this.last) minus 2
    */
    this.states.splice(this.last + 2, this.states.length - this.last - 2);
  }

  /**
   * This method pops the last state off of this.states
   * and puts that image data into the cavas overwriting
   * the current data that is there.
   */
  undo() {
    let data = this.states.pop();
    if (data) {
      let ctx = this.canvas.elt.getContext('2d');
      ctx.putImageData(data, 0, 0);
    }
  }


}

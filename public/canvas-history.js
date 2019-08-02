// eslint-disable-next-line no-unused-vars
class CanvasHistory {
  constructor(canvas, rows, cols, maxStates) {
    this.canvas = canvas;
    this.rows = rows;
    this.cols = cols;
    // states contains the entire canvas data
    // in a list going back to the beginning
    this.states = [];

    this.inProgress = false;
    this.last = -1;
    this.timer = null;
    this.maxStates = maxStates || 50;
    this.timeStepMillis = 350;
  }

  /**
   * *TODO*: clearing the canvas poses a problem. When undoing the clear
   * this works for all connected clients but since undo transactions
   * are descretized by mouse released this undo is not recorded in
   * previous data which is cleared, so new clients connecting to the
   * room receive a blank canvas when it was cleared. This is a consequence
   * of the 'states' array in history representing essentially a similar thing
   * to the previousData array but different.
   *
   * Currently clear just issues an 'un-undoable' warning and continues
   * clearing the state of history so undo is not done by accident
   * This could be solved by simply choosing a random client when connecting
   * to a room and just sending the image data to the new client.
   *
   * Since canvas's should be always the same this *should* mean only
   * one random client has to send this.
   *
   * The would lead to the problem of having no one to get the image from
   * if all the people leave a room. Now, a single client refreshing is ok,
   * this could be remedied by polling a random client and caching the
   * canvas view on the server in case someone connects to a room of 0 people.
   * This would not be sufficient for active rooms with members since
   * the person receiving the cached copy would lacking some data, so this could only be used
   * when a 0 room is joined. A further alternative that is perhaps *better*
   * is to take the canvas image data from the last client to disconnect
   * and hold onto it incase anyone else connections and then trash it.
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
      // this.timer = setTimeout(this.didModify.bind(this), this.timeStepMillis);
    }
    let ctx = this.canvas.elt.getContext('2d');
    let imageData = ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.states.push(imageData);
  }


  didModify() {
    // if (this.timer) {
    // clearTimeout(this.timer);
    // this.timer = null;
    // }
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
    this.limitSize();
  }

  limitSize() {
    if (this.states.length > this.maxStates) {
      let i = 0;
      this.states = this.states.filter(() => i++ < this.maxStates);
    }
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

  reset() {
    this.states = [];
    this.inProgress = false;
    this.last = -1;
    this.timer = null;
  }


}

try {
  module.exports = CanvasHistory;
} catch (e) {
  if (e instanceof ReferenceError);
  else throw e;
}

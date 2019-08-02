class Room {
  constructor(name) {
    this.name = name;
    this.clients = [];
    this.deleteTimer = null;
  }

  willBeDeleted() {
    return this.deleteTimer != null;
  }

  cancelDeletion() {
    clearTimeout(this.deleteTimer);
    this.deleteTimer = null;
  }

  numClients() {
    return this.clients.length;
  }

  addClient(socket) {
    if (this.clients.filter(s => s.id == socket.id).length > 0) {
      throw 'No Duplicate Clients!';
    }
    this.clients.push({ socket: socket, id: socket.id });
  }

  removeClient(clientId) {
    for (let i = this.clients.length - 1; i >= 0; i--) {
      if (this.clients[i].id == clientId) {
        this.clients.splice(i, 1);
        break;
      }
    }
  }

  isEmpty() {
    return this.clients.length == 0;
  }

  randomClient() {
    let c = this.clients[0];
    return c;
  }

}

module.exports = Room;

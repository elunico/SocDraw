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

  addClient(clientId) {
    if (this.clients.indexOf(clientId) >= 0) {
      throw 'No Duplicate Clients!';
    }
    this.clients.push(clientId);
  }

  removeClient(clientId) {
    for (let i = this.clients.length - 1; i >= 0; i--) {
      if (this.clients[i] == clientId) {
        this.clients.splice(i, 1);
        break;
      }
    }
  }

  isEmpty() {
    return this.clients.length == 0;
  }
}

module.exports = Room;

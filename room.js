class Room {
  constructor(name) {
    this.name = name;
    this.clients = [];
    this.deleteTimer = null;
  }

  toJSON() {
    const ret = {
      name: this.name,
      deleteTimer: null,
      clients: [],
      links: {
        relative: `/api/rooms/${this.name}`,
        absolute: `http://localhost:8000/api/rooms/${this.name}`
      }
    };

    if (this.deleteTimer) {
      ret.deleteTimer = 'Timer{active: true, [circular]}';
    }

    for (let socket of this.clients) {
      ret.clients.push(socket.id);
    }
    return ret;
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
      throw new Error('No Duplicate Clients!');
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

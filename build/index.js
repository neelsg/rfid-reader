"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
const reader_1 = require("./reader");
reader_1.reader.connect();
reader_1.reader.listen((data) => {
    server_1.server.send(data);
});
server_1.server.connect();
server_1.server.listen((data) => {
    const msg = data.toString().toLowerCase();
    if (msg == 'start') {
        reader_1.reader.send('c102050000');
        server_1.server.send('starting');
    }
    else if (msg == 'stop') {
        reader_1.reader.send('c000');
    }
    else if (msg == 'reconnect') {
        reader_1.reader.disconnect();
        reader_1.reader.connect();
        server_1.server.send('reconnecting');
    }
    else {
        server_1.server.send('unknown command');
    }
});

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reader = void 0;
const config_1 = require("./config");
const node_net_1 = __importDefault(require("node:net"));
const crc16ccitt_1 = __importDefault(require("crc/crc16ccitt"));
exports.reader = (() => {
    let clients = [];
    let listeners = [];
    const connect = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const config = yield (0, config_1.getConfig)();
        const address = ((_a = config.reader) === null || _a === void 0 ? void 0 : _a.address) || '192.168.0.200';
        const port = ((_b = config.reader) === null || _b === void 0 ? void 0 : _b.port) || 200;
        const client = node_net_1.default.createConnection(port, address, () => {
            console.log(`connected to reader at tcp://${address}:${port}`);
            setTimeout(() => { send('c000'); }, 100);
        });
        client.on('data', process);
        client.on('end', () => {
            clients.filter((c) => c.address != client.address);
            console.log('disconnected from reader');
        });
        clients.push(client);
    });
    const disconnect = () => __awaiter(void 0, void 0, void 0, function* () {
        clients.forEach((c) => {
            c.end();
        });
        clients = [];
    });
    const process = (data) => {
        if (data.length < 8) {
            console.log(`data err: data was too short: ${data.toString('hex')}`);
            return;
        }
        if (data[0] != 0xAA || data[1] != 0xAA || data[2] != 0xFF) {
            console.log(`data err: did not start with 0xAAAAFF: ${data.toString('utf8')}`);
            return;
        }
        if (data.length - 3 > data[3]) {
            process(data.subarray(0, data[3] + 3));
            process(data.subarray(data[3] + 3));
            return;
        }
        if (data.length - 3 != data[3]) {
            console.log(`data err: length did not match: ${data.toString('hex')}`);
            return;
        }
        const check = (0, crc16ccitt_1.default)(data.subarray(0, -2));
        if (data[data.length - 2] != check >> 8 || data[data.length - 1] != check % 256) {
            console.log(`data err: crc did not match: ${data.toString('hex')}`);
            return;
        }
        let message = `unknown message from reader: ${data.toString('hex')}`;
        if (data[4] == 0xC0 && data[5] == 0x00 && data[6] == 0x00) {
            message = 'stopped';
        }
        else if (data[4] == 0xC1 && data[5] == 0x02 && data[6] == 0x00) {
            message = `tag ${data.subarray(10, -5).toString('hex')}`;
        }
        listeners.forEach((l) => {
            l(message);
        });
    };
    const send = (data) => {
        var _a;
        const tokens = (_a = data.match(/[0-9a-z]{2}/gi)) !== null && _a !== void 0 ? _a : [];
        const message = tokens.map(t => parseInt(t, 16));
        const prefix = [0xAA, 0xAA, 0xFF, message.length + 3];
        const check = (0, crc16ccitt_1.default)(Buffer.from([...prefix, ...message]));
        const affix = [check >> 8, check % 256];
        const buffer = Buffer.from(new Uint8Array([...prefix, ...message, ...affix]));
        clients.forEach((c) => {
            c.write(buffer);
        });
    };
    const listen = (callback) => {
        listeners.push(callback);
    };
    return {
        connect,
        disconnect,
        send,
        listen
    };
})();

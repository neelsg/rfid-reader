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
exports.server = void 0;
const config_1 = require("./config");
const ws_1 = __importDefault(require("ws"));
exports.server = (() => {
    let clients = [];
    let listeners = [];
    const connect = () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const config = yield (0, config_1.getConfig)();
        const port = ((_a = config.server) === null || _a === void 0 ? void 0 : _a.port) || 8080;
        const server = new ws_1.default.Server({ port });
        console.log(`serving on ws://localhost:${port}`);
        server.on('connection', (client) => {
            clients.push(client);
            client.on('message', (data) => {
                listeners.forEach((l) => {
                    l(data);
                });
            });
            client.on('close', () => {
                clients = clients.filter((c) => c !== client);
            });
        });
    });
    const send = (data) => {
        clients.forEach((c) => {
            c.send(data);
        });
    };
    const listen = (callback) => {
        listeners.push(callback);
    };
    return {
        connect,
        send,
        listen
    };
})();

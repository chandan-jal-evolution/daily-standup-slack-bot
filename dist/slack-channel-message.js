"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageToSlackChannel = void 0;
const axios_1 = __importDefault(require("axios"));
async function sendMessageToSlackChannel(text) {
    await axios_1.default.post("https://hooks.slack.com/services/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", {
        text,
    });
}
exports.sendMessageToSlackChannel = sendMessageToSlackChannel;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageStatus = void 0;
// Message status enum for type safety
var MessageStatus;
(function (MessageStatus) {
    MessageStatus["SENT"] = "SENT";
    MessageStatus["DELIVERED"] = "DELIVERED";
    MessageStatus["READ"] = "READ";
    MessageStatus["FAILED"] = "FAILED";
})(MessageStatus || (exports.MessageStatus = MessageStatus = {}));

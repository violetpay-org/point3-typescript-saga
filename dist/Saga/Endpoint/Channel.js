"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractChannel = void 0;
class AbstractChannel {
    parseMessageWithOrigin(message) {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}
exports.AbstractChannel = AbstractChannel;
class MessageWithOrigin {
    constructor(origin, message) {
        this.origin = origin;
        this.message = message;
    }
    getOrigin() {
        return this.origin;
    }
    getSagaMessage() {
        return this.message;
    }
}
//# sourceMappingURL=Channel.js.map
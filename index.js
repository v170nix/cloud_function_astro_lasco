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
Object.defineProperty(exports, "__esModule", { value: true });
const LascoVideoCreator_1 = require("./data/LascoVideoCreator");
const LascoImageRepository_1 = require("./data/LascoImageRepository");
module.exports.handler = function (event, context) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("event", event);
        console.log("context", context);
        const repo = new LascoImageRepository_1.LascoImageRepository();
        const creator = new LascoVideoCreator_1.LascoVideoCreator(repo);
        yield creator.update();
        return {
            statusCode: 200,
            body: JSON.stringify({
                event: event,
                context: context
            })
        };
    });
};
//# sourceMappingURL=index.js.map
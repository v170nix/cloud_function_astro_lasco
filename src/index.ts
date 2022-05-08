import {LascoVideoCreator} from "./data/LascoVideoCreator";
import {LascoImageRepository} from "./data/LascoImageRepository";


module.exports.handler = async function (event, context) {
    console.log("event", event);
    console.log("context", context);

    const repo = new LascoImageRepository();
    const creator = new LascoVideoCreator(repo);
    await creator.update()

    return {
        statusCode: 200,
        body: JSON.stringify({
            event: event,
            context: context
        })
    };
};
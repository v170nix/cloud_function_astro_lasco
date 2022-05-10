import {LascoVideoCreator} from "./data/LascoVideoCreator";
import {LascoImageRepository, LascoImageType} from "./data/LascoImageRepository";


module.exports.handler = async function (event, context) {
    const fontsDir = './fonts/'
    process.env.FONTCONFIG_PATH = fontsDir

    const repo = new LascoImageRepository(LascoImageType.C2, fontsDir);
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
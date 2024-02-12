import {LascoVideoCreator} from "./data/LascoVideoCreator";
import {LascoImageRepository, LascoImageType} from "./data/LascoImageRepository";
import {AppLascoMetadata, AppLascoMetadataRepository} from "./data/AppLascoMetadataRepository";

module.exports.handler = async function () {
    const fontsDir = './fonts/'
    process.env.FONTCONFIG_PATH = fontsDir

    try {
        const creatorC2 = new LascoVideoCreator(new LascoImageRepository(LascoImageType.C2, fontsDir));
        const metadataC2 = await creatorC2.update();
        const creatorC3 = new LascoVideoCreator(new LascoImageRepository(LascoImageType.C3, fontsDir));
        const metadataC3 = await creatorC3.update();
        const metadata = new AppLascoMetadata(
            metadataC2[0], metadataC2[1], metadataC3[0], metadataC3[1]
        );
        await new AppLascoMetadataRepository().saveMetadata(metadata);
    }
    catch (e) {
        console.error("error", e);
        throw e;
    }

    return {
        statusCode: 200,
        body: "ok"
    };
};
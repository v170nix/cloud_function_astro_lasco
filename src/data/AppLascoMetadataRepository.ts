import {YandexS3} from "../libs/YandexS3";
import {Readable} from "stream";

export class AppLascoMetadataRepository {

    private readonly yandexS3: YandexS3
    private readonly storageDirectory: string

    constructor() {
        this.yandexS3 = new YandexS3("sunexplorer");
        this.storageDirectory = `lasco/`;
    }

    async saveMetadata(metadata: AppLascoMetadata) {
        await this.yandexS3.upload(
            this.storageDirectory + "video_metadata.json",
            Readable.from([JSON.stringify(metadata)]),
            null,
            "application/json",
            "public, max-age=3600, s-maxage=3600",
        )
    }


}

export class AppLascoMetadata {

    constructor(readonly c2DateBegin: number,
                readonly c2DateEnd: number,
                readonly c3DateBegin: number,
                readonly c3DateEnd: number) {
    }

}
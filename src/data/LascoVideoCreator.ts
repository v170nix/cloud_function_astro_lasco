import {LascoImageRepository} from "./LascoImageRepository";
import {ListBucketsCommand, S3Client} from "@aws-sdk/client-s3";
// const AWS = require('aws-sdk')

export class LascoVideoCreator {

    constructor(readonly imageRepository: LascoImageRepository) {
    }

    async update(type = "c2") {
        const storageDirectory = `lasco/last_images/${type}/`;
        // const dates: number[] = await this.imageRepository.getList(type, new Date(), 100);
        // if (dates.length < 100) return;
        // console.log(dates);
        const REGION = "ru-central1";

        // const s3 = new AWS.S3()
        // AWS.config.update({
        //     region: "ru-central1"
        // })

        // s3.listBuckets({ err, data ->
        //
        // })

        const s3Client = new S3Client({
            region: "ru-central1",
            endpoint: "https://storage.yandexcloud.net",
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            }
        });
        // export { s3Client };
        try {
            const data = await s3Client.send(new ListBucketsCommand({}));
            console.log("Success", data.Buckets);
            console.log("Success!!!");
            return data; // For unit tests.
        } catch (err) {
            console.log("Error", err);
        }

    }

}
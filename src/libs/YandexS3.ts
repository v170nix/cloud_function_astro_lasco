import {s3Client} from "./s3Client";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    DeleteObjectsCommand,
    GetObjectCommand,
    GetObjectCommandOutput,
    HeadObjectCommand,
    ListObjectsCommand, PutObjectCommand
} from "@aws-sdk/client-s3";
import {ReadStream} from "fs";
import {ObjectIdentifier} from "@aws-sdk/client-s3/dist-types/models/models_0";

// noinspection JSUnusedGlobalSymbols
export class YandexS3 {

    constructor(
        readonly bucket: string
    ) {}

    async upload(path: string,
                 readStream: ReadStream,
                 contentEncoding?: string,
                 contentType?: string,
                 cacheControl?: string,
                 expires?: Date,
                 metadata?: {
                     [key: string]: string;
                 }) {
        await s3Client.send(new PutObjectCommand({
            Bucket: this.bucket,
            Key: path,
            Body: readStream,
            CacheControl: cacheControl,
            ContentEncoding: contentEncoding,
            ContentType: contentType,
            Expires: expires,
            Metadata: metadata
        }))
    }

    async getSmallList(directory: string): Promise<string[]> {
        const response = await s3Client.send(new ListObjectsCommand({
            Bucket: this.bucket,
            Prefix: directory,
            Delimiter: '/'
        }))
        if (response.IsTruncated) throw RangeError("more 1000 objects")
        if (response.Contents == undefined) {
            return []
        }
        return response.Contents.map((value) => {
            return value.Key
        })
    }


    async fileExists(path: string): Promise<boolean> {
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: path
            }))
            return true
        } catch (e) {
            return false
        }
    }

    async download(path: string): Promise<GetObjectCommandOutput> {
        return await s3Client.send(new GetObjectCommand({
            Bucket: this.bucket,
            Key: path
        }))
    }

    async copy(path: string,
               copyPath: string) {
        await s3Client.send(new CopyObjectCommand({
            Bucket: this.bucket,
            Key: path,
            CopySource: copyPath
        }))
    }

    async delete(path: string) {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: path
        }))
    }

    async deleteAll(paths: string[]) {
        const objects: ObjectIdentifier[] = paths.map((value) => {
            return new class implements ObjectIdentifier {
                Key = value
            }
        })
        await s3Client.send(new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
                Objects: objects
            }
        }))
    }

}
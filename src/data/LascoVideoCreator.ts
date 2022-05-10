import {LascoImageRepository} from "./LascoImageRepository";
import {YandexS3} from "../libs/YandexS3";
import * as path from "path";
import * as ffmpeg from "fluent-ffmpeg";
import * as videoshow from "videoshow";
import * as os from "os";
import * as fs from "fs";
import ReadableStream = NodeJS.ReadableStream;
import {IO} from "../libs/IO";
import * as ffmpegPath from 'ffmpeg-static'
import * as ffprobePath from '@ffprobe-installer/ffprobe'

// const AWS = require('aws-sdk')

export class LascoVideoCreator {

    private readonly yandexS3: YandexS3
    private readonly storageImageDirectory: string
    private readonly storageVideoDirectory: string

    constructor(readonly imageRepository: LascoImageRepository) {
        this.yandexS3 = new YandexS3("sunexplorer")
        this.storageImageDirectory =`lasco/image/${imageRepository.type}/`;
        this.storageVideoDirectory =`lasco/video/${imageRepository.type}/`;
    }

    async update() {
        const dates: number[] = await this.imageRepository.getRemoteList(new Date(), 100);
        const files = await this.yandexS3.getSmallList(this.storageImageDirectory);
        if (dates.length < 100) return;

        try {
            const paths = await this.getImages(dates);
            paths.sort();
            await this.deleteOldImages(dates, files);
            await this.createVideo(this.storageVideoDirectory + "lasco_video.mp4", paths)

            console.log("Success");
            return ""; // For unit tests.
        } catch (err) {
            console.log("Error", err);
        }

    }

    private async deleteOldImages(dates: number[], files: string[]) {
        const filesToDelete = files.filter((file) => {
            const name = path.basename(file);
            return dates.indexOf(parseInt(name)) < 0
        })

        if (filesToDelete.length > 0) {
            await this.yandexS3.deleteAll(filesToDelete)
        }
    }

    private async getImages(dates: number[]): Promise<string[]> {
        const paths: string [] = [];
        await Promise.all(dates.map( async (date) => {
            const filePath = this.storageImageDirectory + date.toString()
            if (!await this.yandexS3.fileExists(filePath)) {
                const stream = this.imageRepository.downloadImageToFile(date)
                await this.yandexS3.upload(filePath, stream,
                    null,
                     "image/jpeg",
                    "public, max-age=31536000, s-maxage=31536000")
            }
            paths.push(filePath)
        }))
        return paths
    }

    private async createVideo(
        videoPath: string,
        imagePaths: string[]
    ) {
        ffmpeg.setFfmpegPath(ffmpegPath);
        ffmpeg.setFfprobePath(ffprobePath.path)
        const crf = 24;

        const videoOptions = {
            fps: 30,
            transition: false,
            // videoBitrate: 1024,
            videoCodec: 'libx264',
            size: '1024x1024',
            // outputOptions: ['-crf 20'],
            outputOptions: [`-crf ${crf}`, '-pix_fmt yuv420p'],
            pixelFormat: 'yuv420p',
            format: 'mp4'
        };

        const images = [];
        await Promise.all(imagePaths.map(async (pathName) => {
            const fileName = path.basename(pathName);
            const tempFilePath = path.join(os.tmpdir(), fileName);
            const file = await this.yandexS3.download(pathName);
            const readable: ReadableStream = file.Body
            const pipeTo = fs.createWriteStream(tempFilePath)
            await IO.awaitEndStream(readable.pipe(pipeTo))
        }));

        for (const pathName of imagePaths) {
            const fileName = path.basename(pathName);
            const tempFilePath = path.join(os.tmpdir(), fileName);
            const obj = {path: tempFilePath, loop: 0.1};
            images.push(obj);
        }

        const targetTempFileName = `lasco_${this.imageRepository.type}_video.mp4`;
        const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);

        await new Promise<boolean>((resolve, reject) => {

            videoshow(images, videoOptions)
                .save(targetTempFilePath)
                .on('start', (command) => {
                    console.log('encoding ' + targetTempFilePath + ' with command ' + command)
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('Error:', err);
                    console.error('ffmpeg stderr:', stderr);
                    reject(err);
                })
                .on('end', () => {
                    console.log("done");
                    resolve(true);
                });
        });

        const expires = new Date(new Date().getTime() + 12 * 60 * 60 * 1000);

        await this.yandexS3.upload(videoPath, fs.createReadStream(targetTempFilePath),
            null,
            "video/mp4",
            null,
            expires
        )

    }

}
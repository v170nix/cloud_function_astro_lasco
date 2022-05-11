import got from "got";
import {pad} from "../util/pad";
import * as cheerio from "cheerio";
import sharp = require("sharp");
import {ReadStream} from "fs";

export enum LascoImageType {
    C2 = 'c2', C3 = 'c3'
}

// noinspection CssUnknownTarget
export class LascoImageRepository {

    constructor(
        readonly type: LascoImageType,
        readonly fontsDir: string
    ) {
        // https://github.com/lovell/sharp/issues/1875
        process.env.FONTCONFIG_PATH = this.fontsDir
    }

    public async getRemoteList(date: Date, count = 100): Promise<number[]> {
        const day1 = new Date();
        day1.setDate(date.getDate() - 1);
        const day2 = new Date();
        day2.setDate(date.getDate() - 2);

        const [dates0, dates1, dates2] = await Promise.all([
            this.getDates(date),
            this.getDates(day1),
            this.getDates(day2)
        ]);
        return dates0
            .concat(dates1, dates2)
            .sort((n1, n2) => n2 - n1)
            .slice(0, count)
            .sort((n1, n2) => n1 - n2);
    }

    async getDates(date: Date): Promise<number[]> {
        try {
            const url = this.getUrlList(date);
            const response = await got(url, {responseType: "text", resolveBodyOnly: true});
            const stringList = LascoImageRepository.parseListItems(response);
            return stringList.map(value => {
                return LascoImageRepository.parseDate(value)
            });
        } catch (e) {
            return [];
        }
    }

    private getUrlList(date: Date): string {
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        return `https://soho.nascom.nasa.gov/data/REPROCESSING/Completed/${year}/${this.type}/${year}${month}${day}/`;
    }

    private static parseListItems(body): string[] {
        const $ = cheerio.load(body);
        const items = [];
        $('a').each((i, elem) => {
            const text = $(elem).text();
            if (text.search(/1024.jpg/) === -1) return;
            items.push(text);
        });
        return items
    }

    private static parseDate(value: string): number {
        const items = value.split('_');
        try {
            const year = Number(items[0].substring(0, 4));
            const month = Number(items[0].substring(4, 6)) - 1;
            const day = Number(items[0].substring(6, 8));
            const hour = Number(items[1].substring(0, 2));
            const minute = Number(items[1].substring(2, 4));
            return Date.UTC(year, month, day, hour, minute);
        } catch (e) {
            return 0
        }
    }

    public downloadImageToFile(time: number,
                               imageJpegOptions = {
                                   quality: 85,
                                   chromaSubsampling: '4:4:4'
                               }): ReadStream {
        const date = new Date(time);
        const url = this.getImageUrl(date);
        return this.innerUpdate(url, date, imageJpegOptions);
    }

    private getImageUrl(date): string {
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        const hour = pad(date.getUTCHours(), 2);
        const minute = pad(date.getUTCMinutes(), 2);
        return `https://soho.nascom.nasa.gov/data/REPROCESSING/Completed/${year}/${this.type}/${year}${month}${day}/${year}${month}${day}_${hour}${minute}_${this.type}_1024.jpg`;
    }

    private innerUpdate(requestUrl,
                               date: Date,
                               imageJpegOptions = {}
    ): ReadStream {
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDay(), 2);
        const hours = pad(date.getUTCHours(), 2);
        const minutes = pad(date.getMinutes(), 2);
        const text = `${year}-${month}-${day} ${hours}:${minutes} UTC`;
        let fill = "rgb(78, 0,0)";
        if (this.type == LascoImageType.C3) {
            fill = "rgb(8,49,177)";
        }


        const svgText = `
<svg width="1024" height="1024">
<style>
@font-face {
  font-family: 'Roboto';
  src: url("${this.fontsDir}Roboto-Regular.ttf");
}
</style>
<style>
    .date {fill: #ffffff; font-size: 32px; font-family: "Roboto", sans-serif }
    .url {fill: #ffffff; font-size: 24px; font-family: "Roboto", sans-serif }
</style>
    <rect y="960" width="350" height="64" style="pointer-events: none; stroke: transparent; stroke-opacity: 0; fill: ${fill};"></rect>
    <text x="14" y="1004" text-anchor="start"  class="date">${text}</text>
<!--    <text x="1012" y="1012" text-anchor="end" class="url">sunexplorer.org</text>-->
</svg>`;

        const svgBuffer = Buffer.from(svgText);

        const transformer = sharp()
            .extract({left: 0, top: 0, width: 1024, height: 1024})
            .composite([
                {
                    input: svgBuffer,
                    top: 0,
                    left: 0,
                }
            ]);

        transformer.clone().jpeg(imageJpegOptions);

        const readStream = got.stream(requestUrl);
        return readStream.pipe(transformer);
    }

}
import got from "got";
import {pad} from "../util/pad";
import * as cheerio from "cheerio";

export class LascoImageRepository {

    public async getList(type: string, date: Date ,count = 100): Promise<number[]> {
        const day1 = new Date();
        day1.setDate(date.getDate() - 1);
        const day2 = new Date();
        day2.setDate(date.getDate() - 2);

        const [dates0, dates1, dates2] = await Promise.all([
            this.getDates(date, type),
            this.getDates(day1, type),
            this.getDates(day2, type)
        ]);
        return dates0
            .concat(dates1, dates2)
            .sort((n1, n2) => n2 - n1)
            .slice(0, count)
            .sort((n1, n2) => n1 - n2);
    }

    private async getDates(date: Date, type: string): Promise<number[]> {
        try {
            const url = LascoImageRepository.getUrlList(date, type);
            const response = await got(url, {responseType: "text", resolveBodyOnly: true});
            const stringList = LascoImageRepository.parseListItems(response);
            return stringList.map(value => {
                return LascoImageRepository.parseDate(value)
            });
        } catch (e) {
            return [];
        }
    }

    private static getUrlList(date: Date, type: string): string {
        const year = date.getUTCFullYear();
        const month = pad(date.getUTCMonth() + 1, 2);
        const day = pad(date.getUTCDate(), 2);
        return `https://soho.nascom.nasa.gov/data/REPROCESSING/Completed/${year}/${type}/${year}${month}${day}/`;
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
            const month = Number(items[0].substring(4, 2)) - 1;
            const day = Number(items[0].substring(6, 2));
            const hour = Number(items[1].substring(0, 2));
            const minute = Number(items[1].substring(2, 2));
            return Date.UTC(year, month, day, hour, minute);
        } catch (e) {
            return 0
        }
    }

}
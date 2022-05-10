import WritableStream = NodeJS.WritableStream;

export class IO {
    static awaitEndStream(stream: WritableStream): Promise<boolean> {
        return new Promise<boolean>((resolve, reject) => {
            stream.on(
                'finish', () => {
                    resolve(true);
                }
            ).on("error", (e) => reject(e));
        })
    }
}
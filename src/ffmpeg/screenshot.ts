import ffmpeg from "fluent-ffmpeg";

export function singleScreenshot(
  video: string,
  output: string,
  time: number,
  maxWidth = 960
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(video)
      .seekInput(time)
      .output(output)
      .outputOptions("-frames", "1")
      .size(`"${maxWidth}x?"`)
      .on("end", () => {
        resolve(output);
      })
      .on("error", (err: Error) => {
        reject(err);
      })
      .run();
  });
}

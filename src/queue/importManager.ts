import * as logger from "../logger";
import ImageQueue from "./image/imageQueue";
import VideoQueue from "./video/videoQueue";

export type onQueueEmptied = () => void;

export default class ImportManager {
  private numFoundVideoPaths: number;
  private videoQueue: VideoQueue;

  private numFoundImagePaths: number;
  private imageQueue: ImageQueue;

  /**
   *
   * @param onVideoProcesingQueueEmpty - Called every time the video import
   * queue is emptied
   * @param onImageProcesingQueueEmpty - Called every time the image import
   * queue is emptied
   */
  constructor(
    onVideoProcesingQueueEmpty?: onQueueEmptied,
    onImageProcesingQueueEmpty?: onQueueEmptied
  ) {
    this.numFoundVideoPaths = 0;
    this.videoQueue = new VideoQueue(onVideoProcesingQueueEmpty);

    this.numFoundImagePaths = 0;
    this.imageQueue = new ImageQueue(onImageProcesingQueueEmpty);
  }

  /**
   * @param paths - the image and/or video paths to import
   */
  public importPaths(...paths: string[]) {
    this.importVideoPaths(...paths);
    this.importImagePaths(...paths);
  }

  /**
   * @param paths - the video paths to import
   */
  public importVideoPaths(...addedPaths: string[]) {
    for (const addedPath of addedPaths) {
      logger.log(`[processingManager]: handling new video path ${addedPath}`);

      this.numFoundVideoPaths++;
      this.videoQueue.addPathToQueue(addedPath);
    }
  }

  /**
   * @param paths - the image paths to import
   */
  public importImagePaths(...addedPaths: string[]) {
    for (const addedPath of addedPaths) {
      logger.log(`[processingManager]: handling new image path ${addedPath}`);

      this.numFoundImagePaths++;
      this.imageQueue.addPathToQueue(addedPath);
    }
  }

  public resetFoundVideosCount() {
    this.numFoundVideoPaths = 0;
  }

  public getFoundVideosCount() {
    return this.numFoundVideoPaths;
  }

  public resetFoundImagesCount() {
    this.numFoundImagePaths = 0;
  }

  public getFoundImagesCount() {
    return this.numFoundImagePaths;
  }
}

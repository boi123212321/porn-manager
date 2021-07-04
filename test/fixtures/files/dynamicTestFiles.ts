import { SceneStreamTypes } from "./../../../src/transcode/transcoder";
import { downloadFile } from "../../../src/utils/download";

export const TEST_VIDEOS = {
  MP4: {
    url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    filename: "test.mp4",
    metadata: {
      dimensions: {
        width: 1280,
        height: 720,
      },
      duration: 15.020833,
      fps: 24,
      size: 2252313,
      audioCodec: "aac",
      bitrate: 1002377,
      container: "mov,mp4,m4a,3gp,3g2,mj2",
      videoCodec: "h264",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  WEBM_VP8: {
    url: "https://test-videos.co.uk/vids/bigbuckbunny/webm/vp8/360/Big_Buck_Bunny_360_10s_1MB.webm",
    filename: "test.webm",
    metadata: {
      dimensions: {
        width: 640,
        height: 360,
      },
      duration: 10,
      fps: 30,
      size: 1049824,
      audioCodec: null,
      bitrate: 104982,
      container: "matroska,webm",
      videoCodec: "vp8",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  WEBM_VP9: {
    url: "https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm",
    filename: "test.webm",
    metadata: {
      dimensions: {
        width: 640,
        height: 360,
      },
      duration: 10,
      fps: 30,
      size: 1052940,
      audioCodec: null,
      bitrate: 105294,
      container: "matroska,webm",
      videoCodec: "vp9",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  MKV_H264: {
    url: "http://mirrors.standaloneinstaller.com/video-sample/small.mkv",
    filename: "test.mkv",
    metadata: {
      dimensions: {
        width: 560,
        height: 320,
      },
      duration: 5.58,
      fps: 30,
      size: 176123,
      audioCodec: "vorbis",
      bitrate: 31563,
      container: "matroska",
      videoCodec: "h264",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  AVI: {
    url: "http://mirrors.standaloneinstaller.com/video-sample/small.avi",
    filename: "test.avi",
    metadata: {
      dimensions: {
        width: 560,
        height: 320,
      },
      duration: 5.566667,
      fps: 30,
      size: 410162,
      audioCodec: "mp3",
      bitrate: 499524,
      container: "avi",
      videoCodec: "mpeg4",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  MOV: {
    url: "http://mirrors.standaloneinstaller.com/video-sample/small.mov",
    filename: "test.mov",
    metadata: {
      dimensions: {
        width: 560,
        height: 320,
      },
      duration: 5.533333,
      fps: 30,
      size: 179789,
      audioCodec: "aac",
      bitrate: 178627,
      container: "mov,mp4,m4a,3gp,3g2,mj2",
      videoCodec: "h264",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
  WMV: {
    url: "http://mirrors.standaloneinstaller.com/video-sample/small.wmv",
    filename: "test.wmv",
    metadata: {
      dimensions: {
        width: 560,
        height: 320,
      },
      duration: 5.59,
      fps: 30,
      size: 455446,
      audioCodec: "wmav2",
      bitrate: 81475,
      container: "asf",
      videoCodec: "wmv2",
    },
    streamTypes: [
      SceneStreamTypes.DIRECT,
      SceneStreamTypes.MP4_TRANSCODE,
      SceneStreamTypes.WEBM_TRANSCODE,
    ],
  },
};

export async function downloadRandomImage(path: string): Promise<void> {
  await downloadFile("https://picsum.photos/seed/picsum/200/300.jpg", path);
}

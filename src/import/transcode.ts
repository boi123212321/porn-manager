import Scene, { runFFprobe } from "../types/scene";
import ffmpeg, { FfprobeData, ffprobe } from "fluent-ffmpeg";
import { getConfig, IConfig } from "../config";
import * as logger from "../logger";
import path, { basename } from "path";
import { existsSync, renameSync } from "fs";
import mkdirp from "mkdirp";

let config: IConfig;
let currentProgress = 0;

//compatible codecs for html5 video element (mp4/webm)
const vcodecs = ['h264','vp8','vp9','av1', 'theora'];
const acodecs = ['aac','ogg','opus','vorbis'];

export const transcode = async (scene:Scene):Promise<string|null>=>{
    return new Promise(async (resolve, reject)=>{
        if (!scene.path) {
          logger.warn("No scene path, aborting transcoding.");
          return resolve(scene.path);
        }
  
        const tmpFolder = path.join("tmp", scene._id);
        if (!existsSync(tmpFolder)) mkdirp.sync(tmpFolder);
  
        const extension = scene.path.slice((Math.max(0, scene.path.lastIndexOf(".")) || Infinity) + 1);
        config = getConfig();

        if(!(await canPlayInputVideo(scene.path))){
          //transcode the file
          logger.message(`Transcoding file ${scene.path}`);
          const folderPath = path.dirname(scene.path);
          let outputFilename = `${scene.name}.mp4`;
          if(outputFileExists(path.join(folderPath, outputFilename))) outputFilename = `${scene.name}_pv-transcoded.mp4`;
          const outfile = path.join(folderPath, outputFilename);
             
          ffmpeg(scene.path)
          .on('end', async ()=>{
            process.stdout.write('\n');
            logger.success(`Transcoded file ${scene.path} to ${outfile}`);
            //rename the old file with a leading '$_' so we ignore it on the next scan
            //also so we can easily search for and remove it later
            const oldPath = scene.path!;          
            renameSync(oldPath, path.join(path.dirname(oldPath), `$_${basename(oldPath)}`));         
            resolve(outfile);
          })
          .on('error', (err)=>{
            logger.error(err.message);
            resolve(scene.path);
          })
          .on('start', async  (cmd)=>onTranscodeStart(cmd, scene))
          .on('progress', async (args)=>onTranscodeProgress(args, scene))
          .addOptions(config.TRANSCODE_OPTIONS)
          .save(outfile);
        }else{
          logger.message(`Skipping transcoding of compatible file: ${scene.path}`);
          resolve(scene.path);
        }
      });
};

const canPlayInputVideo = async (path:string):Promise<boolean>=>{
    const streams = (await runFFprobe(path)).streams;
    let isVCompat = false;
    let isACompat = false;
    let vcodec = '';
    let acodec = '';
    for(const stream of streams){
        logger.message(stream.codec_name);
        if(vcodecs.indexOf(stream.codec_name!) !== -1) {
            isVCompat = true;
            vcodec = stream.codec_name!;
        }
        if(acodecs.indexOf(stream.codec_name!) !== -1) {
            isACompat = true;
            acodec = stream.codec_name!;
        }
    }
    //a video without an audio stream can still be compatible
    return (isVCompat && isACompat) || (isVCompat && !isACompat && vcodec !== '' && acodec === '');
};

const outputFileExists = (path:string):boolean => {
    if(existsSync(path)) return true;
    return false;
};

const onTranscodeStart = async (cmd:string, scene:Scene) => {
    //logger.message(cmd);
    logger.message(`Starting transcoding of ${scene.name}`);
    logger.message(`Using transcoding options: ${config.TRANSCODE_OPTIONS}`);
};

const onTranscodeProgress = async (args:any, scene:Scene)=>{
    const progress = (args.percent * 1) / 5;
    if(currentProgress !== progress){
      process.stdout.cursorTo(0);            
      const progressBar = `${'='.repeat(progress)}${' '.repeat(20-progress)}`;
      let outString = `Processing of ${scene.name}: [${progressBar}]`;            
      process.stdout.write(outString);
      currentProgress = progress;
    }
};
# Main configuration

> Some parameters that are essential to the program are defined via environment variables. [See here](advanced-config/env)

If the program cannot find a config file, the program will go through an interactive setup, and then create a config file for you.

> Note: not all settings will be prompted to the user, the rest will automatically taken from defaults, [that you can find here](https://github.com/porn-vault/porn-vault/blob/dev/config.example.json).

## Config location

The config file must be located in the folder defined by the environment variable `PV_CONFIG_FOLDER` (usually the same folder as the program), and can either be JSON or YAML. It must be named `config.json` or `config.yaml`. If both files exist, the program will use JSON over YAML.

## Adjusting the config

A base config file [can be found here](https://github.com/porn-vault/porn-vault/blob/dev/config.example.json). It's used for Docker containers, but you can copy the file even if you are not using Docker.
You just need to adjust the values for `binaries.ffmpeg` and `binaries.ffprobe`, as those depend on your setup. Here's how they should look:

```json
{
  "binaries": {
    "ffmpeg": "path/to/your/ffmpeg",
    "ffprobe": "path/to/your/ffprobe"
  }
}
```

If you do not have FFMPEG, download them manually or start the program without a config: when starting the program **without** a config, the program will ask you if it should download these binaries and will automatically set the paths if it does.

## Config parameters

### search.host

- Type: string
- Default: `http://localhost:9200`

Elasticsearch host URL to connect to.

### search.version

- Type: string
- Default: `7.x`

Elasticsearch version.

### search.log

- Type: boolean
- Default: `false`

Enable Elasticsearch trace logging (debug). Logs all requests & responses that Porn Vault makes to Elasticsearch.

### search.auth

- Type: string | null
- Default: `null`

Elasticsearch authentication string (user:password).

### binaries.ffmpeg

- Type: string
- Default: -

Where the ffmpeg binary is located; will be placed in working directory when downloading using the interactive setup

### binaries.ffprobe

- Type: string
- Default: -

Where the ffprobe binary is located; will be placed in working directory when downloading using the interactive setup. Should be next to ffmpeg.

### binaries.izzyPort

- Type: number
- Default: `8000`

Port to bind the database server to.

### import.images

- Type: string array
- Default: -

Paths of folder that images should be imported from - subfolders will be searched recursively.

### import.videos

- Type: string array
- Default: -

Paths of folder that videos should be imported from - subfolders will be searched recursively.

### log.level

- Type: string
- Default: `info`

Level of messages to log to the console. [See dedicated docs here](advanced-config/logging).

### log.maxSize

- Type: string
- Default: `20m`

Max. size for a single log file. This can be a number of bytes, or units of kb, mb, and gb. If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number.

### log.maxFiles

- Type: string
- Default: `5`

Max. amount of log files to store, for a single writeFile configuration. This can be a number of files or number of days. If using days, add 'd' as the suffix.

### log.writeFile

- Type: array

Array of log file configurations.

### log.writeFile[0].level

- Type: string
- Default: `error`

Level of messages to write to this file.

### log.writeFile[0].prefix

- Type: string
- Default: `errors-`

Prefix to apply to the log file.

### log.writeFile[0].silent

- Type: boolean
- Default: `false`

Quick flag to temporarily disable this file configuration so you don't have to remove/add the whole configuration.

### matching.applySceneLabels

- Type: boolean
- Default: `true`

When a scene plugin is run, if the scene labels should be added to images created by the plugin. [See dedicated docs here](advanced-config/apply-labels.html#scenes).

### matching.applyActorLabels

- Type: string array
- Default: see example

The events where actor labels should be applied to scenes, images & plugin images the actor is starring in. [See dedicated docs here](advanced-config/apply-labels.html#actors).

### matching.applyStudioLabels

- Type: string array
- Default: see example

Same as `matching.applyActorLabels`, but for studios; if their labels should be added to scenes of the studio & images created by plugins. [See dedicated docs here](advanced-config/apply-labels.html#studios).

### matching.extractSceneActorsFromFilepath

- Type: boolean
- Default: `true`

When a scene is imported (created), if existing actors should be matched to the scene's filepath and added to the scene.

### matching.extractSceneLabelsFromFilepath

- Type: boolean
- Default: `true`

Same as `matching.extractSceneActorsFromFilepath`, but for labels.

### matching.extractSceneMoviesFromFilepath

- Type: boolean
- Default: `true`

Same as `matching.extractSceneActorsFromFilepath`, but for movies.

### matching.extractSceneStudiosFromFilepath

- Type: boolean
- Default: `true`

Same as `matching.extractSceneActorsFromFilepath`, but for studios.

### matching.matchCreatedActors

- Type: boolean
- Default: `true`

When an actor is created, if it should automatically be matched and added to existing scenes.

### matching.matchCreatedStudios

- Type: boolean
- Default: `true`

Same as `matching.matchCreatedActors`, but for studios.

### matching.matchCreatedLabels

- Type: boolean
- Default: `true`

Same as `matching.matchCreatedActors`, but for labels.

### matching.matcher.type

- Type: string
- Default: `word`

How strings should be matched when extracting actors, labels, etc from file paths.

### matching.matcher.options

- Type: string
- Default: see example

Options for the matcher. Each matcher has different options. [See here for available options](advanced-config/matcher.html#options).

### persistence.backup.enable

- Type: boolean
- Default: `true`

Whether to create a backup of the database files when starting the server.

### persistence.backup.maxAmount

- Type: number
- Default: `10`

Max amount of backups in backups/ folder. Oldest one will be deleted, if max amount has been reached.

### persistence.libraryPath

- Type: string
- Default: Current working directory

Path where the library (.db files & uploaded files & processed images) will be stored.

### plugins.allowActorThumbnailOverwrite

- Type: boolean
- Default: `false`

Allow plugins to overwrite actor images.

### plugins.allowMovieThumbnailOverwrite

- Type: boolean
- Default: `false`

Allow plugins to overwrite movie images.

### plugins.allowSceneThumbnailOverwrite

- Type: boolean
- Default: `false`

Allow plugins to overwrite scene thumbnail.

### plugins.allowStudioThumbnailOverwrite

- Type: boolean
- Default: `false`

Allow plugins to overwrite studio thumbnail.

### plugins.createMissingActors

- Type: boolean
- Default: `false`

Create actors returned from plugins when not found in library.

### plugins.createMissingLabels

- Type: boolean
- Default: `false`

Create labels returned from plugins when not found in library.

### plugins.createMissingMovies

- Type: boolean
- Default: `false`

Create movie returned from plugins when not found in library.

### plugins.createMissingStudios

- Type: boolean
- Default: `false`

Create studio returned from plugins when not found in library.

### plugins.markerDeduplicationThreshold

- Type: number
- Default: `5`

Threshold (in seconds) in which new markers will be ignored.

### plugins.register

- Type: Plugin register object
- Default: -

Define plugins and their own configuration.

[See here for more info](/guides/plugins/plugins-intro.html#register-plugin).

### plugins.events

- Type: Plugin events object
- Default: -

Which plugins to run for which events. The names of the plugins are the names defined in `plugins.register`.

[See here for more info](/guides/plugins/plugins-intro.html#run-registered-plugin).

### processing.doProcessing

- Type: boolean
- Default: `true`

Whether queued scenes should be processed.

### processing.generatePreviews

- Type: boolean
- Default: `true`

Whether video preview (scrub preview) should be generated from imported videos (used in video player seek bar).

### processing.generateScreenshots

- Type: boolean
- Default: `false`

Whether screenshots should be extracted from imported videos and saved in the image library.

### processing.screenshotInterval

- Type: number
- Default: `120`

Time between thumbnail screenshots in seconds.

### processing.readImagesOnImport

- Type: boolean
- Default: `false`

Read image dimensions on import, will greatly increase import time for a big image library (10000+).

### processing.imageCompressionSize

- Type: number
- Default: `720`

Max. image width to compress thumbnails to.

### processing.generateImageThumbnails

- Type: boolean
- Default: `true`

Whether thumbnails should be generated for every image created. Uses approximately 1 GB per 10k images. Reduces disk usage, and internet bandwidth when browsing through images. Original, full size images will still be shown when clicking on an image to view its details.

### scan.excludeFiles

- Type: string array
- Default: -

Array of regular expressions that, if any of them match a file name, will cause the file to be ignored.

### scan.interval

- Type: number
- Default: `108000000` (3 hours)

Rescan paths all X milliseconds - only works when scan.scanOnStartup is enabled.

### scan.scanOnStartup

- Type: boolean
- Default: `false`

Whether video and image paths should be scanned.

### server.https.enable

- Type: boolean
- Default: `false`

Enable https instead of http.

### server.https.key

- Type: string
- Default: -

Path to the ssl key file used if server.https.enable is activated.

### server.https.certificate

- Type: string
- Default: -

Path to the ssl cert file used if server.https.enable is activated.

### server.port

- Type: number
- Default: `3000`

Port server is running on.

### transcode.hwaDriver

- Type: string | null
- Default: `null`

The hardware driver to use for trancodes. Set to null to disable hardware acceleration.

Possible values are:

- qsv
- vaapi
- nvenc
- cuda
- amf
- videotoolbox

When using vaapi, you must set transcode.vaapiDevice.

### transcode.vaapiDevice

- Type: string
- Default: `/dev/dri/renderD128`

Sets the DRM device used for the vaapi driver.

### transcode.h264.preset

- Type: string
- Default: `veryfast`

H264 encoding preset.

Possible values are:

- ultrafast
- superfast
- veryfast
- faster
- fast
- medium
- slow
- slower
- veryslow

### transcode.h264.crf

- Type: number
- Default: `23`

Constant rate factor. Set a value from 0-51. Lower is better quality.

### transcode.webm.deadline

- Type: string
- Default: `realtime`

Efficiency of compression.

Possible values:

- realtime
- good
- best

### transcode.webm.cpuUsed

- Type: number
- Default: `5`

Cpu utilisation. Set a value from 0-5. Higher value increases encode speed at expense of quality.

### transcode.webm.crf

- Type: number
- Default: `31`

Constant rate factor. Set a value from 0-64. Lower is better quality.

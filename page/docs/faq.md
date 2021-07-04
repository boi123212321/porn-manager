# Frequently asked questions

#### Table of contents

[[toc]]

## General

### Will Porn Vault play all my video files?

As of 0.27+, Porn Vault will transcode files if needed, so they can play in web browsers. Older versions do not transcode or remux your files and will only play HTML5 compliant formats supported by your web browser, such as MP4 and WebM containers using H.264, VP8, VP8, AV1, and AAC codecs. H.265 and HEVC are _not_ HTML5 compliant codecs for most browsers.

For more information, please read the following:

- [HTML5 supported video formats](https://en.wikipedia.org/wiki/HTML5_video#Browser_support)
- [HTML5 supported audio formats](https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats)
- [Understanding the difference between containers and codecs](http://www.pitivi.org/manual/codecscontainers.html)

### Pre-0.27: Why won't some of my MP4 files play?

Not all MP4 files are using HTML5 compliant codecs. Some MP4 files may be using the H.265/HEVC codec which is not compatible with most browsers. To determine what codecs your files are using try using checking the ffprobe data on the scene's page (Run FFProbe).

### Where can I find a list of plugins?

Here:

- https://github.com/porn-vault/porn-vault-plugins
- [Discord](https://discord.gg/t499hxK) `#plugins` channel

Install plugins at your own discretion and test using a dry run mode first if the plugin provides it.

### Why are deleted scenes still showing up?

Porn-Vault does not track the deletion of files done outside the interface. You can delete scenes from inside Porn-Vault which will delete the file as well.

> Note: From 0.27, you have the option to delete a scene without deleting the video file

### How can I add a password after the initial setup (or in Docker)?

You can set a password by placing the SHA512 hash of your password in `auth.password`

### How can I reset my password ?

Simply remove or change the hashed value in `auth.password`.

___

## Matching

### Why won't some actors be added to scenes?

If your actor names are single words, they will not be automatically added to scenes to prevent false positives. A workaround, is to add a regex alias to the actor. For example: for an actor `Sybil`, add the alias `regex:Sybil`.

### I've scanned scenes, but actors, studios aren't populated

Porn-Vault automatically extracts **existing** actors, studios... from the filename. If you want to pull in _new_ information, use a plugin.  
If you think you have existing items that should've been added, make sure your matching configuration would've allowed a match. You can also check the logs to see precisely what was/wasn't matched.

___

## Config

Before looking for any specific error in your config, please make sure that the JSON/YAML is written correctly: use an online linter.

### My config is invalid, what do I do?

The logs should explain what is wrong with your config. Examples:

- > Issue #0: unrecognized_keys at **binaries**  
  > Unrecognized key(s) in object: '**giannaPort**'

  Remove the key and value for `binaries.giannaPort`

- > Issue #1: invalid_type at `matching.matchCreatedActors`
  > Required

  Add the key and value for `matching.matchCreatedActors`

- > Issue #5: invalid_enum_value at `log.level`  
  > Input must be one of these values: error, warn, info, http, verbose, debug, silly

  Make sure the value of `log.level` is one of the listed values

- > Issue #6: invalid_union at `log.maxFiles`  
  > Invalid input

  Make sure the value of `log.maxFiles` is of the correct type: string, number, array...

**If your problem is not listed here**, make sure you understand [the config guide](https://github.com/porn-vault/porn-vault/blob/dev/doc/config.md) and look at the [example config](https://github.com/porn-vault/porn-vault/blob/dev/config.example.json) to get an idea of what should be in it

___

## Plugins

### I get an error when running a plugin
> Example:  
> `error: Plugin error: Cannot read property 'load' of undefined`

Make sure you are running the correct version of the plugin for your Porn Vault server.

### My plugins are returning actors/labels/movies/studios but they are not added in the interface.

Make sure the relevant configs are enabled: `createMissingActors/createMissingLabels/createMissingMovies/createMissingStudios`

___

## Database, Search

### What is Izzy?

Izzy is the database engine used by Porn-Vault. The database is read from the `.db` files in the `libraryPath` and stored in memory. All operations are done in memory and then written to disk for persistence. This means that any changes by the user to the .db files are not taken into account while Izzy is running.

### What is Elasticsearch and why do I need it?

Elasticsearch is a search engine that allows Porn-Vault to quickly search for items.

### Elasticsearch doesn't startup: `org.elasticsearch.ElasticsearchException: Failure running machine learning native code`

Try this: [https://stackoverflow.com/questions/56126244/unable-to-start-elasticsearch-in-my-machine-startupexception-is-occuring-while/56126982#56126982](https://stackoverflow.com/questions/56126244/unable-to-start-elasticsearch-in-my-machine-startupexception-is-occuring-while/56126982#56126982) - for Linux, the path is `/etc/elasticsearch/elasticsearch.yml`

### Elasticsearch doesn't work: `flood stage disk watermark [95%] exceeded`

Try this: [https://stackoverflow.com/questions/33369955/low-disk-watermark-exceeded-on](https://stackoverflow.com/questions/33369955/low-disk-watermark-exceeded-on)

### No mapping found for [...]

> Example:  
> `No mapping found for [releaseDate] in order to sort on, with { index_uuid="_STh3iG7QoW21ucADfoS5Q" & index="pv-movies" }",`

Your indexes are out of date. Reindex to ensure they they are up to date.

### Retrieved some null value from getBulk

The search from Elasticsearch returned some items that were not found in the database. This likely means that your indexes
are not up to date. Try reindexing.

### Can I edit my database manually / start from scratch?

You may edit any values in the `.db` files. Each line in a file is a JSON object.  
**WARNING**: You must reset Izzy and reindex after any operation on the .db files:

- Since the database is operated on in memory, any changes to the files will be overwritten: reset Izzy
- Any changes in the database (the files or in-memory) are not automatically synchronized to Elasticsearch: trigger a reindex

### How do I reset my database?

Simply delete all .db files and then reset Izzy and reindex.

> Note: you may keep `custom_fields.db` if you wish to preserve your custom field mappings

### What does resetting Izzy mean?

On startup, Porn-Vault starts Izzy, which reads the .db files and loads them into memory.
Resetting Izzy means to quit Izzy so that a subsequent start will make it load the files again.

### How do I reset Izzy?

There are several ways to reset Izzy:

- Simply stop the Izzy process and restart Porn-Vault. It will be started automatically with Porn-Vault
- When running from the terminal, you may stop Porn-Vault and start it using the `--reset-izzy` argument which will automatically stop and restart Izzy. For more information, see [the startup options guide](guides/startup-options)
- In Docker, just restart the container, Izzy will start automatically

### How do I stop Izzy on Windows?

Izzy doesn't show up in the Task Manager but there are other ways to kill it

- Open "Resource Monitor". In the "Overview" tab, expand the "CPU" panel and look for `izzy.exe`. Right click and select "End Process"
- Open "Powershell" copy paste and run this command `Get-Process izzy | Stop-Process`

### What does reindexing Elasticsearch mean?

Porn-Vault indexes the values of the database in a format optimized for search queries and stores them in indexes in Elasticsearch. To reindex means to regenerate the indexes using the most up to date values from the database.

> When reindexing, no actual data is lost.

### How do I reindex Elasticsearch?

On startup, Porn-Vault automatically triggers the indexing of any index if that index does not exist in Elasticsearch. Thus, to trigger a reindex, there are several solutions:

- Delete the relevant index and then restart Porn-Vault
- When running from the terminal, you may stop Porn-Vault and start it using the `--reindex` argument which will automatically delete all Porn-Vault indexes, and then regenerate them. For more information, see [the startup options guide](guides/startup-options)
- To delete a single index with curl: `curl -X DELETE localhost:9200/INDEX` where `INDEX` is the name of the index to delete
- To delete all Porn-Vault indexes with curl: `curl -X DELETE "localhost:9200/pv-*"` (all Porn-Vault indexes are prefixed by `pv-`)
- To delete a single index in Powershell: `Invoke-WebRequest -Method DELETE -Uri "http://localhost:9200/INDEX"`
- With Docker, you cannot use `--reindex`. But you can delete the index via curl or other, and then restart the container
  > Example:  
  > `curl -X DELETE "localhost:9200/pv-studios` - delete the studio index  
  > `sudo docker container restart porn-vault` - restart the container to trigger reindexing

### Error pinging Elasticsearch

Make sure that Porn-Vault can access Elasticsearch at the URL defined by `search.host` in your config, and that `search.version` matches your version of Elasticsearch

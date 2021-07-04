# Plugin development

Plugins are Javascript files that expose a Javascript function.
They receive a plugin context to do some task.
Per event (e.g. on creation of some item), multiple plugins can be executed serially.
Check the plugin repository [porn-vault/plugins](https://github.com/porn-vault/plugins) for plugins and inspiration.

## Example plugin

As an example, here's a plugin that will attach the label 'Female' to every item (scene or actor) that is created.

```js
module.exports = (ctx) => {
  // Attach label 'Female' to every actor (actress) we create
  return {
    labels: ["Female"],
  };
};
```

## Plugin boilerplate

```js
module.exports = (ctx) => {
  return {};
};
```

If you do asynchronous tasks (like scraping a website), you'll need to export an async function instead.

```js
// Returns a promise, which will be awaited by the plugin handler
module.exports = async (ctx) => {
  return {};
};
```

## Plugin context

The plugin context contains loads of useful modules & functions, and event-specific info (see [Events](#events)), to ease plugin development.

> If you suspect this documentation of being outdated, you can verify the main context passed to the plugin functions as well as event-specific context in the following code files:
>
> - [src/plugins/context.ts](https://github.com/porn-vault/porn-vault/blob/dev/src/plugins/context.ts)
> - [src/plugins/events/actor.ts](https://github.com/porn-vault/porn-vault/blob/dev/src/plugins/events/actor.ts) and all the other events.  
>   Additionally, the main plugin repository contains all these types to facilitate development: [porn-vault/plugins/tree/master/types](https://github.com/porn-vault/plugins/tree/master/types)

### Injected modules

- `$axios`, to run http requests (https://github.com/axios/axios)
- `$boxen`, create boxes in the terminal (https://github.com/sindresorhus/boxen)
- `$ffmpeg`: fluent ffmpeg (https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- `$fs`: Node FS API
- `$inquirer`: Inquirer (https://github.com/SBoudrias/Inquirer.js)
- `$jimp`: Jimp (https://github.com/oliver-moran/jimp)
- `$loader`, to show a loading spinner (https://github.com/sindresorhus/ora)
- `$moment`, to parse time (https://github.com/moment/moment)
- `$os`: Node OS API
- `$path`: Node path API
- `$readline`: Node line reader API
- `$semver`: semantic versioner (https://github.com/npm/node-semver)
- `$util`: Node util API
- `$yaml`: YAML (https://github.com/eemeli/yaml)
- `$zod`: Typescript schema declaration and validation (https://github.com/colinhacks/zod)

### Injected Porn Vault context

- `$config: object`: current Porn Vault config object
- `$cwd: string`: Current working directory
- `$formatMessage(message: unknown) => string`: Takes anything in input, and returns a string version (for logging)
- `$getMatcher(type: string, options: unknown) => Matcher`: Creates a string or word matcher.
- `$library: string`: Libary path
- `$log(...str) => void` **DEPRECATED** use `$logger`: to pretty print messages; this should be preferred over using the default console log
- `$logger: winston.Logger`: A winson logger (https://github.com/winstonjs/winston)
- `$matcher: Matcher`: The matcher corresponding to the one selected in the config
- `$require(path: string) => unknown`: Load a JS file as dependency, like require, but works with relative paths
- `$store`: Persistent in-memory data store (namespaced per plugin)
- `$throw(message: string)`: to throw errors; this should be preferred over using the default Javascript throw
- `$version: string`: the current Porn Vault version
- `$walk(options: IWalkOptions): Promise<void | string>`: recursive filesystem walker
- `$createImage(url: string, name: string, thumbnail?: boolean) => Promise<string>`: Downloads and inserts an image into the database. thumbnail should be set to true if the image is supposed to be a thumbnail.
  Returns ID of the image, which can be used to set the thumbnail.
  Note this function is async, so await has to be used.
- `async $createLocalImage(path: string, name: string, thumbnail?: boolean => Promise<string>`, same as `$createImage`, but doesn't download an image, but searches on the local file system instead.

### Injected plugin context

- `$pluginName: string`: Name of currently running plugin
- `$pluginPath: string`: Path of currently running plugin
- `args: object`: Plugin arguments (see [Additional Arguments](#additional-arguments))
- `data: Output`: Result from previously ran plugins in chain. The object is the output type of the plugin event.
- `event: string`: Event name

## Events

### Actor

**actorCreated/actorCustom**

Added context:

- `$actor: Actor`: Actor object (database format)
- `$actorName: string`: name of the actor
- `$countries: ICountry[]`: array of countries supported by Porn Vault. Can be used to map a country name to a country code
- `$getAverageRating => Promise<number]>`: Retrieves the current rating of the actor
- `$getLabels => Promise<Label[]>`: Retrieves the current labels of the actor

Possible output:

```typescript
interface Ouput {
  addedOn: number; // **milliseconds** since epoch
  aliases: string[];
  altThumbnail: string; // Image id
  avatar: string; // Image id
  bookmark: boolean;
  bornOn: number; // **milliseconds** since epoch
  custom: Record<string, any>;
  description: string;
  favorite: boolean;
  hero: string; // Image id
  labels: string[]; // Label ids
  name: string;
  nationality: string | null; // 2 letter country code (alpha2)
  rating: number; // Number for 0-10
  thumbnail: string; // Image id
}
```

### Scene

**sceneCreated/sceneCustom**

Added context:

- `$scene: Scene`: Scene object (database format)
- `$sceneName: string`: name of the scene
- `$scenePath: string`: path to the scene file
- `$getActors => Promise<Actor[]>`: Retrieves the current actors of the scene
- `$getLabels => Promise<Label[]>`: Retrieves the current labels of the scene
- `$getWatches => Promise<SceneView[]>`: Retrieves the current watches of the scene
- `$getStudio => Promise<Studio[]>`: Retrieves the studio of the scene
- `$getMovies => Promise<Movie[]>`: Retrieves the movies to which the scene belongs
- `$createMarker(name: string, seconds: number) => Promise<string>`: Creates a marker in the scene at the specified time

Possible output:

```typescript
interface Output {
  actors: string[]; // Actor ids
  addedOn: number; // **milliseconds** since epoch
  bookmark: boolean;
  custom: Record<string, any>;
  description: string;
  favorite: boolean;
  labels: string[]; // Label ids
  movie: string;
  name: string;
  path: string; // New location for the scene
  rating: number; // Number from 0-10
  releaseDate: number; // **milliseconds** since epoch
  studio: string;
  thumbnail: string; // Image id
  views: number[]; // Array of **milliseconds** since epoch
  watches: number[]; // Array of **milliseconds** since epoch
}
```

### Movie

**movieCreated**

> The `movieCustom` event is coming soon

Added context:

- `$movie: Movie`: Movie object (database format)
- `$movieName: string`: name of the movie
- `$getActors => Promise<Actor[]>`: Retrieves the current actors of the movie
- `$getLabels => Promise<Label[]>`: Retrieves the current labels of the movie
- `$getScenes => Promise<Scene[]>`: Retrieves the current scenes of the movie
- `$getRating => Promise<number>`: Retrieves the current rating of the movie

Possible output:

```typescript
interface Output {
  addedOn: number; // **milliseconds** since epoch
  backCover: string; // Image id
  bookmark: boolean;
  custom: Record<string, any>;
  description: string;
  favorite: boolean;
  frontCover: string; // Image id
  labels: string[]; // Label ids
  name: string;
  rating: number;
  releaseDate: number; // **milliseconds** since epoch
  spineCover: string; // Image id
  studio: string;
}
```

## Additional arguments

Additional arguments can be passed to plugins.
They will be accessible as `ctx.args`.  
[See the plugin intro to see how they are defined](/guides/plugins/plugins-intro)

## Advanced stuff

[Pipe plugin results](/guides/plugins/pipe-plugins)

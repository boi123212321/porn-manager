# Plugins Intro

To use plugins, follow these steps:

- Download the plugin file somewhere
- Register the plugin and ensure the `path` and `args` are correct
- Add the plugin to the relevant events.

## Register plugin

To use a plugin, first it needs to be registered in the config.json/yaml.
Inside the `register` block, add a block with the name of your plugin. That block will contain the path
to the plugin file and any arguments to pass to the plugin.

The path to the plugin can be:

- **absolute**: starts with a slash `/` or a drive letter `C:\` This means the path must lead from the root of your pc/drive all the way to the plugin file.
- **relative**: starts with a period `.` This means the path starts from the same folder as the Porn Vault executable.

> 💡 To register multiple plugins, add multiple blocks ("plugin_one", "plugin_two") inside the same `register` block. Do not create multiple
> `register` blocks.

> 💡 When using Docker, the Porn Vault executable is at the root of the container `/`. If you download your plugins
> to the `/config` volume, you can use an absolute path: `/config/path/to/plugin.js`

JSON

```javascript
{
  "plugins": {
    "register": {
      "femaleplugin": {
        "path": "./plugins/female.js"
      },
      "anotherplugin": {
        "path": "./plugins/another.js"
      },
      "thirdplugin": {
        "path": "/absolute/path/porn-vault/plugins/third.js"
      }
    }
  }
}
```

YAML

```yaml
---
plugins:
  register:
    femaleplugin:
      path: "./plugins/female.js"
    anotherplugin:
      path: "./plugins/another.js"
    thirdplugin:
      path: "/absolute/path/porn-vault/plugins/third.js"
```

## Run registered plugin

Tu run a plugin, add it to the list of the relevant event in the `events` block.  
Every event accepts a list of plugins to run _in series_. The names to add to the list are
the names of the plugin blocks that you added in the `register` block.  
Plugin results will be **aggregated** into one object and then processed.
That means the results of the last plugin to run have higher priority.

JSON

```javascript
{
  "plugins": {
    "events": {
      "actorCreated": ["femaleplugin"],
      "actorCustom": ["femaleplugin", "anotherplugin"]
    }
  }
}
```

YAML

```yaml
---
plugins:
  events:
    actorCreated:
      - femaleplugin
    actorCustom:
      - femaleplugin
      - anotherplugin
```

## Events

Here are the events that you can run plugins for. If your config file is missing an event, you can add it yourself.

### Actor

- **`actorCreated`**
- - Ran when an actor is created
- **`actorCustom`**
- - Ran when the user runs the plugin manually in the interface

### Scene

- **`sceneCreated`**
- - Ran when an actor is created
- **`sceneCustom`**
- - Ran when the user runs the plugin manually in the interface

### Movie

- **`movieCreated`**
- - Ran when an actor is created
- **`movieCustom`** - coming soon
- - Ran when the user runs the plugin manually in the interface

## Additional arguments

Additional arguments can be passed to plugins.

JSON

```javascript
{
  "plugins": {
    "register": {
      "someScraper": {
        "path": "./plugins/imaginaryapi.js",
        "args": {
          "verbose": true
        }
      }
    }
  }
}
```

YAML

```yaml
---
plugins:
  register:
    someScraper:
      path: "./plugins/imaginaryapi.js"
      args:
        verbose: true
```

## Advanced stuff

[Plugin development](/guides/development/plugin-development)

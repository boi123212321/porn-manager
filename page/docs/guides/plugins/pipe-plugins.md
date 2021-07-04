# Piping plugins

Take this plugin as an example of an imaginary API that we have fetched data from:

```js
// ./plugins/imaginaryapi.js
module.exports = () => {
  return {
    labels: ["anal", "dp", "gangbang", "blonde"],
  };
};
```

```javascript
// config.json

{
  "plugins": {
    "events": {
      "actorCreated": ["imaginaryapi"]
    },
    "register": {
      "imaginaryapi": {
        "path": "./plugins/imaginaryapi.js"
      }
    }
  }
}
```

What if we don't want any hair color associated via a label?
This can be solved by transforming the plugin result with another plugin, instead of filtering in the API plugin.

```js
// ./plugins/nohaircolor.js

module.exports = ({ data }) => {
  if (data.labels) {
    return {
      labels: data.labels.filter((s) => s != "blonde"),
    };
  }
  return {};
};
```

```javascript
// config.json

{
  "plugins": {
    "events": {
      "actorCreated": ["imaginaryapi", "nohaircolor"]
    },
    "register": {
      "imaginaryapi": {
        "path": "./plugins/imaginaryapi.js"
      },
      "nohaircolor": {
        "path": "./plugins/nohaircolor.js"
      }
    }
  }
}
```

### Result

![Result](/plugin_filter.png)

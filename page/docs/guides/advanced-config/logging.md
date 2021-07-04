# Logging

Logs are written to the console and can be written to files at the same time.
These are the available log levels:

- `error` - errors during execution
- `warn` - warnings for the user
- `info` - main information messages for the user. This is the recommended level for console logs
- `http` - http logs
- `verbose` - describes most top level operations
- `debug` - describes the execution of operations
- `silly` - describes minute operations

Enabling a log level will also enable levels of higher priority.
Example: enabling `info` will also enable `error` and `warn`

## Logging to files

The logs may be written to one or more files with `log.writeFile`. Here you can list the files you want to write to with a specific log level for each one.  
It is recommended to maintain at least an error log so you can easily go back and see any errors that may have passed by too fast in the console.

For each file configuration, a new file will be created every hour or if the file reaches the `maxSize` size or if the number of files
for that configuration reaches `maxFiles`.

When debugging or asking for help, you can add a second `debug` or `silly` configuration such as:

```json
{
  "level": "debug",
  "prefix": "debug-",
  "silent": false
}
```

This will help you to retrace the exact steps of the program.  
You can also keep this in your config file, but quickly toggle it on/off via `silent: true/false`

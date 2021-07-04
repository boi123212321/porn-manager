# Automatic name matching

## Type

- There are two types of matchers.
- - `string`
- - `word`
- The matcher is used to extract labels, actors, studios... from scene file paths and to recognize existing items returned by plugins.
- When items are extracted from a file path, all existing items of that type are compared to the path, to only return 1 item per substring matched (only for word matcher, see `overlappingInputPreference`).
- In the case of studios, scenes and movies, all matches are sorted be name length, and the one with the longest name is used. This is because a scene/movie can only have a single studio.
- - For other items (actors, labels), all matches will be used.

### String

- For a given item (actor/label... name) and file path, the item will match the file path simply if the file path contains the item's name (or one of its aliases). This means that "male" will match "female", "art" will match "Part 10" etc
- Note that spaces, periods and special characters are removed.
- Items are tested against the full file path

### Word

- For a given item, the item will match the file path only if all the words of the item (one of the name or aliases) exactly match the words in the file path.
- - "male" will not match "female"
- - An actor "Example Actor" will match "file path with example actor" but not "file path with longexample actorname"
- For the item and file path, the full strings are split into words and groups of words (see `enableWordGroups` and `camelCaseWordGroups`).
- Groups of words will only match the exact same group of words.
- - "EvilAngel" or "Evil-Angel" will only match instances of those two exact words and not simply "Evil" or "Angel".
- The file path is split up into parts that are individually tested against items. This allows for different matching behaviors for different parts of the file path thanks to `wordSeparatorFallback`.
  Example: to tag videos in an "EvilAngel" folder, which itself is in a "videos" folder, you can try `regex:/videos/EvilAngel`
- - The split of the file path is configured via `filepathSeparators`
- - The extension of the file is automatically split from the last part of the file path
- Regex names `regex:mystr` are still matched against the full file path without any transformations. You can use this to match paths instead of words.
- Example: the file path`'/my root/my videos/TestStudio/group and word-separator/my-example-video.mp4'` will first be split into `['my root', 'my videos', 'TestStudio', 'group and word-separator', 'my-example-video', 'mp4']` (sse `filepathSeparators`).
- - `'my root'` contains a known group separator (the space) so it is treated as two words, allowing `'my'`, `'root'` and `'my root'` to match.
- - same for `'my videos'`
- - If `camelCaseWordGroups` is enabled: `'TestStudio'` will be treated as a _group_ of 2 words `[['Test', 'Studio']]`, _only_ allowing `'test studio'` to be matched, preventing `'test'` or `'studio'`.
- - If `camelCaseWordGroups` is disabled: `'TestStudio'` will simply be treated as 2 words `['Test', 'Studio']`, allowing `'test'`, `'studio'` _and_ `'test studio'`to match.
- - `'group and word-separator'` contains _both_ group and word separators, so it will split into 3 groups: `['group', 'and', ['word', 'separator']]`. Allows matches of `'group'`, `'and'`, `'group and'`, `'word-separator'`, `'WordSeparator'`. Prevents `'and word'`, `'group and word'`, `'group and word separator'`
- - If `wordSeparatorFallback` is enabled: `'my-example-video'` will be treated as if it was simply 3 words `['my', 'example', 'video']`, allowing `'example'`, `'videos'` and `'my example videos'` to be matched.
- - If `wordSeparatorFallback` is disabled: `'my-example-video'` will be treated as a _group_ of 3 words `[['my', 'example', 'video']]`, _only_ allowing `'MyExampleVideo'` and `'my-example-video'` to match, preventing `'example'` and `'videos'` (_Depending on your separators_).
- - `'mp4'` is treated as a single word
- - Note that `'my root my videos'` will not match the path since `'my root'` and `'my videos'` were split. But you can use a regex (mentioned above)

## Options

- `matching.matcher.options` contains the options for a single one of these matchers. When a specific matcher is enabled, all and only the matcher's options must be present in the config. For example `enableWordGroups` should not be present when using the `string` matcher

### String options

| Key                                          | Recommended value | Description                                                                                                                                                                                                 |
| -------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `matching.matcher.type`                      | `"string"`        | Enables the string matcher                                                                                                                                                                                  |
| `matching.matcher.options.ignoreSingleNames` | `true`            | If enabled, for a name or alias that only has a single word (does not contain spaces), it will not be matched against file paths. It is recommended to enable it in this mode to prevent aggressive matches |

### Word options

| Key                                                   | Recommended value         | Description                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------- |
| `matching.matcher.type`                               | `"word"`                  | Enables the word matcher                                                                                                                                                                                                                                                                                                                       |
| `matching.matcher.options.ignoreSingleNames`          | `false`                   | If enabled, for a name or alias that only has a single word (does not contain spaces), it will not be matched against file paths. Disabling this option is considered safe in this mode                                                                                                                                                        |
| `matching.matcher.options.ignoreDiacritics`           | `true`                    | If enabled, characters' accents will be stripped. Ex: `'tést'` will match `'test'`                                                                                                                                                                                                                                                             |
| `matching.matcher.options.enableWordGroups`           | `true`                    | If grouping of words should be enabled. This allows "my-word-group" to **only** match "MyWordGroup" and prevent matching individual words like "My" or "Group". Otherwise the words of the group are split up and treated as individual words.                                                                                                 |
| `matching.matcher.options.wordSeparatorFallback`      | `true`                    | When there are no word _group_ separators, if the word separators should be used to split groups instead. Example: "my-studio-example" will be treated as "my studio example" allowing "studio" to be matched. Otherwise, the full string will be considered a group, only matching "My Studio Example". Only relevant when `enableWordGroups` |
| `matching.matcher.options.camelCaseWordGroups`        | `true`                    | If camelCase or PascalCase words should be treated as word groups. Does **not** require `enableWordGroups`                                                                                                                                                                                                                                     |
| `matching.matcher.options.overlappingInputPreference` | `"longest"`               | When multiple strings matched against a part of a file path, which string to apply the match to. Can be one of `"all"                                                                                                                                                                                                                          | "longest" | "shortest"` |
| `matching.matcher.options.groupSeparators`            | `["[\\s',()[\\]{}*\\.]"]` | Array of string regexes to separate groups of words. Note that the example has a single string containing a character class regex and not a nested array. It could be written as `["\\s", "'", ",", ...]`                                                                                                                                      |
| `matching.matcher.options.wordSeparators`             | `["[-_]"]`                | Array of string regexes to separate words inside a group. If `enableWordGroups` is **disabled**, the separators will be used to complement those in `groupSeparators`                                                                                                                                                                          |
| `matching.matcher.options.filepathSeparators`         | `["[/\\\\&]"]`            | Array of string regexes to separate the file path into individual parts that will be matched against items.                                                                                                                                                                                                                                    |

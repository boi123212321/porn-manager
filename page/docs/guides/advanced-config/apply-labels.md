# Automatically applying labels

For actors, studios and scenes, you can decide when their labels are added to their associated content: scenes and/or images

Example: Kali Roses has labels "blonde" & "tattoos". Importing a new video featuring Kali Roses (will be matched if "Kali Roses" is in the video title or path), the newly created scene will automatically inherit "blonde" & "tattoos" + other labels that have been extracted from the title or path.

## Actors

> `matching.applyActorLabels`

A list of events for when to apply actor labels to their scenes/images. Possible events:

- `"event:actor:create"` - When an actor is created, the actor's labels will be pushed to the matched scenes (keep in mind this includes labels returned by plugins, right before the actor is created).
- `"event:actor:update"` - When an actor is updated, if their labels were modified and this event is enabled, **new** labels will be added to the actor's existing scenes.
- `"event:actor:find-unmatched-scenes"` When manually executing the "Find unmatched scenes" action, all the actor's current labels will be added to newly matched scenes.
- `"plugin:actor:create"` - When running actor plugins before an actor creation, the new labels will be added to the images created by the plugins (thumbnail, avatar...). 🚨 This includes any labels that the creation process was started with.
- `"event:scene:create"` - When creating (from the graphql api) or importing a scene, the scene's actor's labels will be applied to the scene
- `"event:scene:update"` - same as above but when updating a scene.
- `"plugin:scene:create"` - When when the plugins are run right before creating or importing a scene, for the actors that were returned by the plugins, their labels will be applied to the scene.
- `"plugin:scene:custom"` - same as above but when plugins are run from the UI (includes existing actor's labels).
- `"event:image:create"` - When uploading an image for actor(s), the actors' labels will be added to the image
- `"event:image:update"` - same as above but when updating an image
- `"event:marker:create"` - When an marker is created, the actor's labels will be added to the marker
- `"plugin:marker:create"` - When an marker is created by a plugin, the scene's actors' labels will be added to the marker

## Studios

> `matching.applyStudioLabels`

A list of events for when to apply studio labels to their scenes/images. Basically the same as `applyActorLabels` but for studios. Possible events:

- `"event:studio:create"` - When a studio is created, the studio's labels will be pushed to the matched scenes (keep in mind this includes labels returned by plugins, right before the studio is created).
- `"event:studio:update"` - When a studio is updated, if their labels were modified, **new** labels will be added to the studio's existing scenes.
- `"event:studio:find-unmatched-scenes"` When manually executing the "Find unmatched scenes" action, all the studio's current labels will be added to newly matched scenes.
- `"plugin:studio:create"` - When running studio plugins before a studio creation, the new labels will be added to the images created by the plugins (thumbnail). 🚨 This includes any labels that the creation process was started with.
- `"plugin:studio:custom"` - Same as above, but when updating a studio (includes any existing labels of the studio).
- `"event:scene:create"` - When creating (from the graphql api) or importing a scene, the scene's studio's labels will be applied to the scene
- `"event:scene:update"` - same as above but when updating a scene.
- `"plugin:scene:create"` - When when the plugins are run right before creating or importing a scene, for the actors that were returned by the plugins, their labels will be applied to the scene.
- `"plugin:scene:custom"` - same as above but when plugins are run from the UI (includes existing studio's labels).

## Scenes

> `matching.applySceneLabels`

Scenes are particular because their only derived content are images.  
This config is a simple boolean: whether to apply the scene's labels to the images derived from the scene (thumbnails, screenshots...).

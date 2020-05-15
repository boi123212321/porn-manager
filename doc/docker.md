# Docker guide

You can build a docker image yourself with the `Dockerfile` at the root of this repository. To do this, you must "clone" this git repository or download a zip from Github. Then you can follow one of the steps below.
If you want to build using an unofficial image, the parameters described should still be valid.

### docker create

```
docker create \
  --name=porn-vault \
  -p 3000:3000 \
  -v /etc/localtime:/etc/localtime:ro \
  -v /path/to/library_parent_dir:/config \
  -v /path/to/config.json:/config.json \
  -v /path/to/first/videos:/videos_1 \
  -v /path/to/more/videos:/videos_2 \
  -v /path/to/first/images:/images_1 \
  -v /path/to/more/images:/images_2 \
  --restart unless-stopped \
  ./path/to/Dockerfile_directory
```

Then start the container `docker start porn-vault`.

If you want to create a container using an image from Docker Hub, replace the path (the last line) with the docker image name from the registry
Example: `dummy_username/porn-vault:latest`

### docker-compose

```
version: "3"
services:
  porn-vault:
    build: ./path/to/Dockerfile_directory
    container_name: porn-vault
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "/path/to/library_parent_dir:/config"
      - "/path/to/config.json:/config.json"
      - "/path/to/first/videos:/videos_1"
      - "/path/to/more/videos:/videos_2"
      - "/path/to/first/images:/images_1"
      - "/path/to/more/images:/images_2"
    ports:
      - "3000:3000"
    restart: unless-stopped
```

If you want to create using an image from Docker Hub, replace `build: ./path/to/Dockerfile_directory` with `image: <image_name>` using the image name from the registry.
Example: `image: dummy_username/porn-vault:latest`

### Docker parameters

The container requires some parameters for the app to run correctly. These parameters are separated by a colon and indicate `<external>:<internal>` respectively. For example, `-p 8080:3000` would expose port `3000` from inside the container to be accessible from the host's IP on port `8080` outside the container.

|               Parameter                | Function                                                                                                                                               |
| :------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
|               `-p 3000`                | The port for the porn-vault webinterface. This must match what is in your config file.                                                                 |
| `-v /config.json` OR `-v /config.yaml` | Location of the config file to read from. It must be either one of these.                                                                              |
|              `-v /config`              | Directory for the `LIBRARY_PATH` parameter in the config file. This allows for the database to be persisted on the host. It must be exactly this name. |
|              `-v /videos`              | A directory for the `VIDEO_PATHS` parameter. The volume can have whatever name you want such as `/videos_from_drive_1` or `/videos_from_drive_2`.      |
|              `-v /images`              | A directory for the `IMAGE_PATHS` parameter The volume can have whatever name you want such as `/images_from_drive_1` or `/images_from_drive_2`.       |

The 'videos' and 'images' volume names do not have to be strictly named as such and are not strictly necessary. You could have a single volume such as `-v /path/to/somewhere:/porn_vault_root` and then use it like this in your config file:

```json
{
  "VIDEO_PATHS": ["/porn_vault_root/my_videos_directory"],
  "IMAGE_PATHS": ["/porn_vault_root/my_images_directory"]
}
```

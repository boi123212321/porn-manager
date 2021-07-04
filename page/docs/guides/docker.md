# Docker

## Dockerhub

[https://hub.docker.com/repository/docker/boi12321/porn-vault](https://hub.docker.com/repository/docker/boi12321/porn-vault)

## docker cli

```bash
docker run \
  --name=porn-vault \
  -p 3000:3000 \
  -v /etc/localtime:/etc/localtime:ro \
  -v /porn_vault_config:/config \
  -v /my_videos:/videos \
  -v /my_images:/images \
  -e PUID=1000 \
  -e GUID=1000 \
  --device=/dev/dri/renderD128:/dev/dri/renderD128 # For VAAPI users
  --network=porn-vault-net # When you run Elasticsearch with Docker
  --restart unless-stopped \
  -d \
  porn-vault
```

## docker-compose

```yml
version: "3"
services:
  porn-vault:
    image: porn-vault
    container_name: porn-vault
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "/porn_vault_config:/config"
      - "/my_videos:/videos"
      - "/my_images:/images"
    ports:
      - "3000:3000"
    devices: # Only for vaapi users
      - /dev/dri/renderD128:/dev/dri/renderD128
    restart: unless-stopped
    networks: # When you run Elasticsearch with Docker
      - porn-vault-net
  elasticsearch:
    image: 'docker.elastic.co/elasticsearch/elasticsearch:7.13.1'
    environment:
        - discovery.type=single-node
    ports:
        - '9200:9200'
        - '9300:9300'
    networks:
      - porn-vault-net
networks:
  porn-vault-net:
    driver: bridge
```

## Docker parameters

The container requires some parameters for the app to run correctly. These parameters are separated by a colon and indicate `<external>:<internal>` respectively. For example, `-p 8080:3000` would expose port `3000` from inside the container to be accessible from the host's IP on port `8080` outside the container.

|      Parameter      | Function                                                                                                                                                                                               |
| :-----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
|      `-p 3000`      | The port for the porn-vault webinterface. This must match what is in your config file.                                                                                                                 |
|    `-v /config`     | Directory for persistent files (config file, database, backups...). Unless you changed the environment variable `PV_CONFIG_FOLDER`, it must be exactly this name.                                      |
|    `-v /videos`     | A directory for the `import.videos` config setting. The volume can have whatever path you want such as `/videos_from_drive_1` or `/videos_from_drive_2` _as long as you use that path in your config_. |
|    `-v /images`     | A directory for the `import.images` config The volume can have whatever path you want such as `/images_from_drive_1` or `/images_from_drive_2` _as long as you use that path in your config_.          |
|      `-e PUID`      | The uid to apply to the container's user                                                                                                                                                               |
|      `-e GUID`      | The guid to apply to the container's user                                                                                                                                                              |
| `--device /dev/dri` | VAAPI devices to mount to /dev/dri inside the container                                                                                                                                                |

The 'videos' and 'images' volume paths do not have to be strictly named as such and are not strictly necessary. If you have a folder structure like this:

```
my-stuff/
├── images
└── videos
```

You could have a single volume such as `-v /my-stuff:/root_stuff` and then use it like this in your config file:

```json
// config.json
{
  "import": {
    "videos": ["/root_stuff/videos"],
    "images": ["/root_stuff/images"]
  }
}
```

## Integration with Elasticsearch

You may run Elasticsearch and Porn-Vault either separately, or in a single docker-compose.yml.  
To setup elasticsearch with Docker, please refer to [https://www.elastic.co/guide/en/elasticsearch/reference/7.10/docker.html](https://www.elastic.co/guide/en/elasticsearch/reference/7.10/docker.html)

When running both with Docker, you must make sure the Porn-Vault container can access the Elasticsearch container.

> User-defined bridges provide automatic DNS resolution between containers.
> Containers on the default bridge network can only access each other by IP addresses, unless you use the --link option, which is considered legacy. On a user-defined bridge network, containers can resolve each other by name or alias.

Create a new docker network using the `bridge` driver.

```bash
# cli
docker network create -d bridge porn-vault-net
docker run --network=porn-vault-net --name=porn-vault
```

```yml
# docker-compose.yml
version: "3"
services:
  porn-vault:
    networks:
      - porn-vault-net
networks:
  porn-vault-net:
    driver: bridge
```

Then in your config, you may set `search.host` to `http://<name_of_es_container>:9200`

```json
// config.json
{
  "search": {
    "host": "http://elasticsearch:9200"
  }
}
```

## User / Group identifiers

When using volumes (`-v` flags) permissions issues can arise between the host OS and the container, we avoid this issue by allowing you to specify the user `PUID` and group `PGID`.

Ensure any volume directories on the host are owned by the same user you specify and any permissions issues will vanish like magic.

In this instance `PUID=1000` and `PGID=1000`, to find yours use `id user` as below:

```bash
$ id username
  uid=1000(dockeruser) gid=1000(dockergroup) groups=1000(dockergroup)
```

## Hardware acceleration

### VAAPI

To use VAAPI hardware acceleration, you must mount your `/dev/dri` device inside the container:

```
--device=/dev/dri/renderD128:/dev/dri/renderD128
```

## Notes

- When using Docker, the `binaries.ffmpeg` & `binaries.ffprobe` paths in the config must be valid, otherwise the program will exit. The images should already have ffmpeg installed and thus use the following default paths:

```json
// config.json
{
  "binaries": {
    "ffmpeg": "/usr/bin/ffmpeg",
    "ffprobe": "/usr/bin/ffprobe"
  }
}
```

- By default, the images set the environment variable `PV_CONFIG_FOLDER=/config`, and create a volume for `/config`. Otherwise, you may run into permission or persistence issues.

## Build from source (advanced)

You can build a docker image yourself with the `Dockerfile` in the `docker` folder. To do this, you must "clone" this git repository or download a zip of the sources (not the release zips) from Github. Then you can follow one of the docker-cli or docker-compose guides above.

> **WARNING**: the docker context (i.e. where you are running the command from) has to be the root of the repository. You just need to specify the path to the appropriate Dockerfile.

There is a `Dockerfile` in the `docker` folder of the repo that allow you to either build an image locally.

Build the image with `docker build -t porn-vault -f docker/Dockerfile.debian .`

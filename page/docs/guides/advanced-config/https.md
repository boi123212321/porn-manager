# Enabling HTTPS

- If you're on Windows you first need to download openssl, you can find the executables [here](https://wiki.openssl.org/index.php/Binaries)
- Generate a keypair using the command `openssl req -nodes -new -x509 -keyout server.key -out server.cert`
- Set the `server.https.enable` flag in your config to true
- Change the `server.https.key` & `server.https.certificate` options to your generated key & cert file paths
- Open `https://localhost:3000`, ignore the self-generated certificate warning and enjoy an encrypted experience

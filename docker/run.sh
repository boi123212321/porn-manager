#!/bin/sh
# We want a configuration file in /config so it can be stored in a persistant volume and not wiped out if we update the container.
if [ ! -f /config/config.json ] && [ ! -f /config/config.yaml ]
then
	echo "copying example configuration to /config/config.json"
	cp config.example.json /config/config.json
fi

if [ ! -d /videos ]
then
	mkdir /videos
fi
if [ ! -d /images ]
then
	mkdir /images
fi

# Add our user the the card's group
FILES=$(find /dev/dri /dev/dvb -type c -print 2>/dev/null)

for i in $FILES
do
	VIDEO_GID=$(stat -c '%g' "$i")
	if id -G abc | grep -qw "$VIDEO_GID"; then
		touch /groupadd
	else
		if [ ! "${VIDEO_GID}" = '0' ]; then
			VIDEO_NAME=$(getent group "${VIDEO_GID}" | awk -F: '{print $1}')
			if [ -z "${VIDEO_NAME}" ]; then
				VIDEO_NAME="video$(head /dev/urandom | tr -dc 'a-zA-Z0-9' | head -c8)"
				groupadd "$VIDEO_NAME"
				groupmod -g "$VIDEO_GID" "$VIDEO_NAME"
			fi
			usermod -a -G "$VIDEO_NAME" abc
			touch /groupadd
		fi
	fi
done

if [ -n "${FILES}" ] && [ ! -f "/groupadd" ]; then
	usermod -a -G root abc
fi

/porn-vault

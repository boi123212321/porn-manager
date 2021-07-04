# Systemd

To auto start porn-vault on boot using `systemd` you create the following service file.

Create the file:  
`sudo nano /etc/systemd/system/pv.service`

Add the follwing text to the service file. Pay attention to following items:

- Change `mnt-pv.mount` to the name of your file mount if data is not stored localy.  
*If data is local, you can omit this*. Your mount can be found using `sudo systemctl list-units --type=mounts`
- If you don't have elasticsearch installed as a service, you can omit it from `After`
- Change `/home/pv/pv` in `WorkingDirectory` and `ExecStart` to the correct path for your system. Absolute path can be found be found by entering terminal typing `pwd`

```ini
[Unit]
Description=PV Start Service
# Waits for network to initialize, filesystems to mount, and # elasticsearch to start
After=network.target mnt-pv.mount elasticsearch.service

[Service]
# Set to the directory where your Porn-Vault executable is
WorkingDirectory=/home/pv/pv
# Start executable. This must be an absolute path
ExecStart=/home/pv/pv/porn-vault

[Install]
# Tells the system it needs to start before login
WantedBy=multi-user.target
```

`ctrl+o` to write the file and then `ctrl+x` to exit nano

Run:

`sudo systemctl daemon-reload`

`sudo systemctl start pv.service`

`sudo systemctl status pv.service`  - Use this to make sure everything started ok.

`sudo systemctl enable pv.service` - If everything was ok in the last step run this to tell the system it should run this service at boot.

___ 

Credit: Spyderpb
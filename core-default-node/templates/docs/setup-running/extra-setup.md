# Optional Additional Setup

## Enabling HTTPS

1. get / generate SSL certificates
	1. see [ssl.md](../backend-node/ssl.md) for instructions & more info
2. open port 443 on your server
3. modify `config.json` as follows:
	1. `server.scheme` to `https`
	2. update `ssl` object to be enabled and point to your certificates
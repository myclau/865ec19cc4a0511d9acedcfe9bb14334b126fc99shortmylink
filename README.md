# 865ec19cc4a0511d9acedcfe9bb14334b126fc99shortmylink

# Prerequisite
1. You any linux machine with docker installed
2. please install docker with following reference
```
https://docs.docker.com/install/
```
3. This API will use mongodb as database so if you donot have your own db, please also install docker-compose.
```
https://docs.docker.com/compose/install/
```
# How to Try in you machine (assume you do not have own mongodb)
1. git clone repo
2. make sure you install docker and docker-compose
3. go to the work directory of the git
4. Edit the docker-compose.yml
  a. LB_DOMAIN: if the api will behind a LB set it as the LB doamin otehrwise set as domain of itself
  b. other can keep default
5. run `docker-compose build`
6. run `docker-compose up -d`
7. To create shortenUrl use endpoint `/newurl` with json body `{"url":"https://xxxxx.com"}` (In this example my host is 192.168.56.101 and the container is using 8000 port to expose service)
```bash
$ curl -X POST \
  http://192.168.56.101:8000/newurl \
  -H 'Content-Type: application/json' \
  -d '{
	"url":"https://www.google.com"
}'

{"url":"https://www.google.com","shortenUrl":"http://192.168.56.101:8000/d5njkR82x"}
```
8.  To use the shortenUrl
```bash
$ curl -I http://192.168.56.101:8000/d5njkR82x

HTTP/1.1 304 Not Modified
X-Powered-By: Express
Location: https://www.google.com
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 51
Date: Sun, 01 Dec 2019 04:12:42 GMT
Connection: keep-alive

```
9. If you have your own MongoDB you can use docker build and docker run command directly

```bash
$ docker build -t shortenurl_api .

$ docker run -d -p 8000:8000 -e -env LB_DOMAIN=value1 --env MONGO_USER=value2 --env MONGO_PASSWORD=value3 --env MONGO_DB_HOST=value4 --env MONGO_PORT=value5 --env MONGO_DB_NAME=value6 --env MONGO_COLLECTION_NAME=value7   shortenurl_api


```
# Clean UP

1. If you do not use your own mongodb:
```bash
$ docker stop shortenurl
shortenurl
$ docker rm shortenurl
shortenurl

# as the mongo-volume I stored at ~/mongo-vloume so need to remove it
$ sudo rm -rf ~/mongo-volume

```
2. if you use the mongodb provide in docker-compose
```bash
$ docker-compose down -v
Removing shortenurl               ... done
Removing cryptoq3_mongo-express_1 ... done
Removing mongodb                  ... done
Removing network cryptoq3_default

```

# environment variable of the docker image
| Env var | Description |
| --- | --- |
| LB_DOMAIN | you can config the LB domain if you have, if not can set this api itself |
| MONGO_USER | your local mongo db user name |
| MONGO_PASSWORD | your local mongo db user password |
| MONGO_DB_HOST | the name of the monogo db container name (if you donot have own db) , else it is the mongodb host |
| MONGO_PORT | the port of mongo db |
| MONGO_DB_NAME | the db name (shortenurl) |
| MONGO_COLLECTION_NAME | the collection name in db |

# API Logic
Endpoint: /newurl
1. if endpoint /newurl receive request with the url json object, will do a search on the collection to see if the url exist.
2. if not will check if the collection are created if not create it and add the url with the random generated 9 digtal shortenUrl to the collection
3. as step (1) also have the shortenUrl in the output object, so just put it in the response object and send it out

Endpoint: ^/[a-zA-Z0-9]{9}
1. use the request originalUrl are variable and seaarch in the mongo collection
2. if can find the entry just send redirect 304  to the url
3. if not return 500 and send out message `Do not have record of the shortenUrl`

# MongoDB Design

1. In here will keep it simple, the api will only using one db and one collection.
2. you will need a db (lets say name: shortenurl)
3. need a user account that can have readwrite access to that db
4. the api itself will create the collection if not exist is the db, base on the environment variable of MONGO_COLLECTION_NAME in the api contianer.
5. For the startup config for the containerize mongodb are follow (which is the file `init-mongo.js`)
```js
db.createUser(
  {
    user : "mongouser",
    pwd : "mongopassword",
    roles : [
      {
        role : "readWrite",
        db : "shortenurl"
      }
    ] 
  }
)
```
6. for the info in the `init-mongo.js` will all connected to the environment value of MONGO_USER MONGO_PASSWORD MONGO_DB_NAME
7. For the containerize version of the mongodb provided here , the `init-mongo.js` will place in `/docker-entrypoint-initdb.d/init-mongo.js` of the mongodb instance 
8. once the containeroize mongo are startup,it will automatic load the js to init the db and the user.
9. More info and config of the containerize mongoDB provided are follow ( most configurable config as in environment variable and can be edit in `docker-compose.yml`):
MongoDB version: latest (4.2.1)
exposed port (container): 27017
```yaml
services:
  mongo:
    restart: always
    image: mongo
    container_name: "mongodb"
    environment:
     - MONGO_INITDB_ROOT_USERNAME=mongoadmin
     - MONGO_INITDB_ROOT_PASSWORD=mongopassword
     - MONGO_INITDB_DATABASE=shortenurl
    volumes:
    	# this is init script to create the db with non-admin user
     - ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js:ro
     - ~/mongo-volume:/data/db

    ports:
     - 27017:27017
  # mongo express is  not nessary
  mongo-express:
    image: mongo-express
    restart: always
    ports:
      - 8081:8081
    environment:
      ME_CONFIG_MONGODB_ADMINUSERNAME: mongoadmin
      ME_CONFIG_MONGODB_ADMINPASSWORD: mongopassword
```

# Expected Result
1. To create shortenUrl (In this example my host is 192.168.56.101 and the container is using 8000 port to expose service)
```bash
$ curl -X POST \
  http://192.168.56.101:8000/newurl \
  -H 'Content-Type: application/json' \
  -d '{
        "url":"https://www.google.com"
}'

{"url":"https://www.google.com","shortenUrl":"http://192.168.56.101:8000/d5njkR82x"}
```
2. To use the shortenUrl
```bash
$ curl -I http://192.168.56.101:8000/d5njkR82x

HTTP/1.1 304 Not Modified
X-Powered-By: Express
Location: https://www.google.com
Vary: Accept
Content-Type: text/plain; charset=utf-8
Content-Length: 51
Date: Sun, 01 Dec 2019 04:12:42 GMT
Connection: keep-alive

```

3. No Data in POST /newurl
```bash
$ curl -X POST http://192.168.56.101:8000/newurl

url in request is missing
```

4. Wrong shortenUrl

Not in 9 digit
```bash
$ curl -I http://192.168.56.101:8000/d5njkR82xasdasdasdasd

HTTP/1.1 404 Not Found
X-Powered-By: Express
Content-Security-Policy: default-src 'none'
X-Content-Type-Options: nosniff
Content-Type: text/html; charset=utf-8
Content-Length: 161
Date: Sun, 01 Dec 2019 04:19:59 GMT
Connection: keep-alive
```

Not find in database
```bash
$ curl -I http://192.168.56.101:8000/d5njkR83x

HTTP/1.1 500 Internal Server Error
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 36
ETag: W/"24-McFqDuqGs59+mapmWEij+mNIdb0"
Date: Sun, 01 Dec 2019 04:20:17 GMT
Connection: keep-alive

$ curl http://192.168.56.101:8000/d5njkR83x
Do not have record of the shortenUrl
```
# limitation & assumption
1. if you want to use https instead of http, you need to setup a lb and map the service to this api and config the environment varible of LB_DOMAIN
2. I assumpt the Random Generation of the shortUrl is unique.
3. The api will not check if the url request to newurl is valid or not

const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const assert = require('assert');
const rateLimit = require("express-rate-limit");

var MongoClient = require('mongodb').MongoClient; 
// Connection URL
var url = 'mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_DB_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}';
var lbdomain ='${LB_DOMAIN}';
 
function makeid(length) {
	var result           = '';
	var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	var charactersLength = characters.length;
	for ( var i = 0; i < length; i++ ) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}
	return result;
}
class HandlerGenerator {

	async redirectOrgurl(req,res){
		console.log(req.originalUrl);
		var shorturl=req.originalUrl
		shorturl=shorturl.replace("/","")
		console.log(shorturl)
		const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
		if (!client) {
			return;
		}
		try{
			const db = client.db("${MONGO_DB_NAME}");
			let result = await db.collection("${MONGO_COLLECTION_NAME}").findOne({"shortenUrl":shorturl})
			if (result == null){
				res.status(500).send('Do not have record of the shortenUrl');
			} else {
				console.log("[shortenUrl->url] record find:")
				console.log(result);
				res.redirect(304, result.url)

			}

		} catch (err) {
			console.log(err);
		} finally {
			client.close()
		}
		
		//res.status(200).send("OK")
	}
	async newurl(req,res){
		if(req.body.url != null){
			//console.log(req.body.url);
			var orgurl=req.body.url;
			var resulturl= makeid(9);
			const client = await MongoClient.connect(url, { useNewUrlParser: true }).catch(err => { console.log(err); });
			if (!client) {
				return;
			}
			try{
				var resultresponse = {
					"url":"" ,
					"shortenUrl":""
				};
				resultresponse.url=orgurl;

				const db = client.db("${MONGO_DB_NAME}");
				let result = await db.collection("${MONGO_COLLECTION_NAME}").findOne({"url":orgurl})
				if (result == null){
					res.send(resultresponse)
					var insertobj={
						"url":"" ,
						"shortenUrl":""
					};
					insertobj.url=orgurl;
	                                insertobj.shortenUrl=resulturl;
					console.log("Cannot find in DB");
					console.log("Create new record Now");
					db.collection('${MONGO_COLLECTION_NAME}', {strict:true}, function(err, col3) {
						// Create the collection
			                         db.createCollection('${MONGO_COLLECTION_NAME}', function(err, result) {});
					});
					db.collection("${MONGO_COLLECTION_NAME}").insertOne(insertobj, function(err, res) {
						if (err) throw err;
						console.log("Insert One Data to colleciton '${MONGO_COLLECTION_NAME}'");
					});

					resultresponse.shortenUrl=lbdomain+"/"+resulturl;
					res.send(resultresponse)

				} else {
					console.log("[url -> shortenUrl] record find:")
					console.log(result);
					resultresponse.shortenUrl=lbdomain+"/"+result.shortenUrl;
					res.send(resultresponse)
				}

			} catch (err) {
				console.log(err);
			} finally {
				client.close()
			}

		} else {
			res.status(500).send('url in request is missing');
		}
	}

}

// Starting point of the server
function main () {
  let app = express(); // Export app for other routes to use
  let handlers = new HandlerGenerator();
  const port = process.env.PORT || 8000;
  app.use(bodyParser.json());
  //rate limit of api calls
  const limiter = rateLimit({
	    windowMs: ${API_RATE_LIMIT_WINDOWS_MINUTES} * 60 * 1000, // minutes
	    max: ${API_RATE_LIMIT_CALLS} // limit each IP to max requests per windowMs
  });
	 
  //  apply to all requests
  app.use(limiter);
  // Routes & Handlers
  app.post('/newurl', handlers.newurl );
  app.get('^/[a-zA-Z0-9]{9}', handlers.redirectOrgurl );
  app.listen(port, () => console.log(`Server is listening on port: ${port}`));
}

main();

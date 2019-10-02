'use strict';
let jwkToPem = require('jwk-to-pem');
let jwt = require('jsonwebtoken');

// Ripped off from here https://github.com/vthub/aws-react-jwt-auth/blob/master/lambda/index.js
// and here https://github.com/aws-samples/authorization-lambda-at-edge/blob/master/node/lambda-edge-function/index.js

// __(JWKS)__ is obtained from https://cognito-idp.$AWS_REGION.amazonaws.com/$USERPOOL_ID/.well-known/jwks.json
// (it is publicly available so OK to be in source control)
var JWKS = `__(JWKS)__`;

let region = '__(AWS_REGION)__';
let userPoolId = '__(USERPOOL_ID)__';
let iss = 'https://cognito-idp.' + region + '.amazonaws.com/' + userPoolId;

let pems = {};
var keys = JSON.parse(JWKS).keys;
for(var i = 0; i < keys.length; i++) {
    //Convert each key to PEM
    var key_id = keys[i].kid;
    var modulus = keys[i].n;
    var exponent = keys[i].e;
    var key_type = keys[i].kty;
    var jwk = { kty: key_type, n: modulus, e: exponent};
    var pem = jwkToPem(jwk);
    pems[key_id] = pem;
}

function parseCookies(headers) {
    const parsedCookie = {};
    if (headers.cookie) {
        headers.cookie[0].value.split(';').forEach((cookie) => {
            if (cookie) {
                const parts = cookie.split('=');
                parsedCookie[parts[0].trim()] = parts[1].trim();
            }
        });
    }
    return parsedCookie;
}

const response401 = {
    status: '401',
    statusDescription: 'Unauthorized'
};

exports.handler = (event, context, callback) => {

    console.log(JSON.stringify(event, null, 2));

    const cfrequest = event.Records[0].cf.request;
    if (!cfrequest.uri.startsWith("/static/js/protected")) {
        // Request is not for protected content. Pass through
        console.log(`request for non-protected content: ${cfrequest.uri}`);
        callback(null, cfrequest);
        return true;
    }

    const headers = cfrequest.headers;

    let accessToken = null;
    if (headers.cookie) {
        let cookies = parseCookies(headers);
        for (let property in cookies) {
            if (cookies.hasOwnProperty(property) && property.includes("accessToken")) {
                accessToken = cookies[property];
            }
        }
    }

    //Fail if no accessToken
    if (accessToken === null) {
        console.log("missing access token");
        callback(null, response401);
        return false;
    }

    let jwtToken = accessToken;

    //Fail if the token is not jwt
    let decodedJwt = jwt.decode(jwtToken, {complete: true});
    if (!decodedJwt) {
        console.log("access token not jwt");
        callback(null, response401);
        return false;
    }

    //Fail if token is not from your UserPool
    if (decodedJwt.payload.iss !== iss) {
        console.log("access token from invalid user pool");
        callback(null, response401);
        return false;
    }

    //Reject the jwt if it's not an 'Access Token'
    if (decodedJwt.payload.token_use !== 'access') {
        console.log("jwt not 'access' token");
        callback(null, response401);
        return false;
    }

    //Get the kid from the token and retrieve corresponding PEM
    let kid = decodedJwt.header.kid;
    let pem = pems[kid];
    if (!pem) {
        console.log("invalid kid");
        callback(null, response401);
        return false;
    }

    //Verify the signature of the JWT token to ensure it's really coming from your User Pool
    jwt.verify(jwtToken, pem, {issuer: iss}, function (err, payload) {
        if (err) {
            console.log("invalid signature");
            callback(null, response401);
            return false;
        } else {
            //Valid token.
            console.log('Successful verification');
            //remove access token
            delete cfrequest.headers.cookie;
            //CloudFront can proceed to fetch the content from origin
            callback(null, cfrequest);
            return true;
        }
    });
};

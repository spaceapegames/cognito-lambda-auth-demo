## Cognito Lambda Auth Demo

This is the accompaniment code for this article: LIIIINK

## Setup

### Create Cognito User Pool

```
$ USERPOOL_NAME=YOUR_POOL_NAME

$ USERPOOL_ID=$(aws cognito-idp create-user-pool \
 --pool-name ${USERPOOL_NAME} \
 --username-attributes email \
 --auto-verified-attributes email | jq -r .[].Id)

$ CLIENT_ID=$(aws cognito-idp create-user-pool-client \
 --user-pool-id ${USERPOOL_ID} \
 --client-name SomeClientName --no-generate-secret | jq -r .[].ClientId)
```

Take note of `USERPOOL_ID` and `CLIENT_ID`, you'll need them throughout.

### Build Lambda@Edge Function

We need to substitute some values into edge/index.js. Make sure AWS_REGION is exported, then:

```
$ sed -i -e "s/__(AWS_REGION)__/${AWS_REGION}/g" edge/index.js
$ sed -i -e "s/__(USERPOOL_ID)__/${USERPOOL_ID}/g" edge/index.js
$ sed -i -e "s/__(JWKS)__/$(curl https://cognito-idp.${AWS_REGION}.amazonaws.com/${USERPOOL_ID}/.well-known/jwks.json)/"

$ cd edge && zip -r function.zip . && cd .. # package the function ready for deployment below
```

### Build Infrastructure

A full explanation of the infra that will be built can be found at the linked article above.

All of the infra is encapsulated in `template.yaml`, a SAM (CloudFormation) template. The only pre-requisite is that you
have an S3 bucket in which to store the packaged code. Then run:

```
$ sam package --s3-bucket ${YOUR_S3_BUCKET} --output-template-file packaged.yml

$ sam deploy --stack-name cognito-lambda-auth-demo --capabilities CAPABILITY_IAM --template-file packaged.yml \
    --parameter-overrides CognitoUserPoolArn=$(aws cognito-idp describe-user-pool --user-pool-id $USERPOOL_ID | jq -r .[].Arn)
```

### Build Front End













## Notes

Code to create s3 bucket and cloudfront is in terraform.

Creating user pool:

```
aws cognito-idp create-user-pool --pool-name LouisTest --username-attributes email
aws cognito-idp create-user-pool-client --user-pool-id us-east-1_MkGaSyQR0 --client-name Testy --no-generate-secret
```

Web setup:

```
- yarn create react-app edge-auth
 - yarn add aws-amplify@1.1.32 aws-amplify-react
 - yarn add react-router-dom
```


Build:

```
yarn build && cd build
aws s3 sync --acl public-read --sse --delete . s3://cognito-demo.labs.apelabs.net/
```

sam package --s3-bucket sag-serverless-apps-us-east-1 --output-template-file packaged.yml
sam deploy --stack-name cognito-lambda-auth-demo --capabilities CAPABILITY_IAM --template-file packaged.yml

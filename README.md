## Cognito Lambda Auth Demo

This is the accompaniment code for this article: <link to go here>

## Setup

### Create Cognito User Pool

```
$ USERPOOL_NAME=YOUR_POOL_NAME

$ USERPOOL_ID=$(aws cognito-idp create-user-pool \
 --pool-name ${USERPOOL_NAME} \
 --username-attributes email \
 --auto-verified-attributes email \
 --schema Name=name,Required=true \
 | jq -r .[].Id)

$ CLIENT_ID=$(aws cognito-idp create-user-pool-client \
 --user-pool-id ${USERPOOL_ID} \
 --client-name SomeClientName --no-generate-secret | jq -r .[].ClientId)
```

Take note of `USERPOOL_ID` and `CLIENT_ID`, you'll need them throughout.

### Build Lambda@Edge Function

We need to substitute some values into edge/index.js. Make sure AWS_REGION is exported, then:

```
$ sed -i .bak -e "s/__(AWS_REGION)__/${AWS_REGION}/g" edge/index.js && \
  sed -i .bak -e "s/__(USERPOOL_ID)__/${USERPOOL_ID}/g" edge/index.js && \
  sed -i .bak -e "s/__(JWKS)__/$(curl https://cognito-idp.${AWS_REGION}.amazonaws.com/${USERPOOL_ID}/.well-known/jwks.json)/" edge/index.js

$ cd edge && zip -r function.zip . && cd .. # package the function ready for deployment below
```

### Build Infrastructure

A full explanation of the infra that will be built can be found at the linked article above.

All of the infra is encapsulated in `template.yaml`, a SAM (CloudFormation) template. The only pre-requisite is that you
have an S3 bucket in which to store the packaged code. Then run:

```
$ STACK_NAME=cognito-lambda-auth-demo2
$ sam package --s3-bucket ${YOUR_S3_BUCKET} --output-template-file packaged.yml

$ sam deploy --stack-name ${STACK_NAME} --capabilities CAPABILITY_IAM --template-file packaged.yml \
    --parameter-overrides CognitoUserPoolArn=$(aws cognito-idp describe-user-pool --user-pool-id $USERPOOL_ID | jq -r .[].Arn)
```

### Build Front End

This involves updating and compiling the React application, uploading it to the S3 bucket created above, and
invalidating the CloudFront cache.

```
## Setup some variables ##
$ aws cloudformation describe-stacks --stack-name ${STACK_NAME} >/tmp/cf.json && \
  API_ENDPOINT=$(cat /tmp/cf.json | jq -r '.Stacks[0].Outputs[]|select(.OutputKey=="ApiEndpoint").OutputValue') && \
  BUCKET_NAME=$(cat /tmp/cf.json | jq -r '.Stacks[0].Outputs[]|select(.OutputKey=="BucketName").OutputValue') && \
  DOMAIN_NAME=$(cat /tmp/cf.json | jq -r '.Stacks[0].Outputs[]|select(.OutputKey=="DomainName").OutputValue') && \
  CF_DIST_ID=$(cat /tmp/cf.json | jq -r '.Stacks[0].Outputs[]|select(.OutputKey=="CloudFrontDistributionId").OutputValue') && \
  rm /tmp/cf.json

## Do some sed-ing ##
# web/auth-demo/src/App.js
$ sed -i .bak -e "s/__(AWS_REGION)__/${AWS_REGION}/g" web/auth-demo/src/App.js && \
  sed -i .bak -e "s/__(USERPOOL_ID)__/${USERPOOL_ID}/g" web/auth-demo/src/App.js && \
  sed -i .bak -e "s/__(CLIENT_ID)__/${CLIENT_ID}/g" web/auth-demo/src/App.js && \
  sed -i .bak -e "s/__(CF_DOMAIN_NAME)__/${DOMAIN_NAME}/g" web/auth-demo/src/App.js

# web/auth-demo/src/components/Protected.js
$ sed -i .bak -e "s|__(API_ENDPOINT)__|${API_ENDPOINT}|g" web/auth-demo/src/components/Protected.js

## Build ##
$ cd web/auth-demo && yarn && yarn build

## Deploy ##
$ cd web/auth-demo/build && \
  aws s3 sync --acl public-read --sse --delete . s3://${BUCKET_NAME}/ && \
  aws cloudfront create-invalidation --distribution-id ${CF_DIST_ID} --paths '/*'

```

That's it, you should now be able to visit https://${DOMAIN_NAME} and see the magic happen.

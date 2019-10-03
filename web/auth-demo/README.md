# Web Frontend

## Commands

The following commands were used to create this application:

 - yarn create react-app auth-demo
 - cd auth-demo
 - yarn add aws-amplify@1.1.32 aws-amplify-react react-router-dom react-loadable axios

## Build

 - yarn build

## Deploy

See main README.md for more information.

 - cd build
 - aws s3 sync --acl public-read --sse --delete . s3://${S3_BUCKET}/
 - aws cloudfront create-invalidation --distribution-id ${CF_DIST} --paths '/*'
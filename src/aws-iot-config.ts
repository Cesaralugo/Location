// src/aws-iot-config.ts
import { Amplify } from 'aws-amplify';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { fromCognitoIdentityPool } from '@aws-sdk/credential-provider-cognito-identity';
import { IoTDataPlaneClient } from '@aws-sdk/client-iot-data-plane';
import amplify_outputs from "../amplify_outputs.json";

Amplify.configure(amplify_outputs);

export const iotClient = new IoTDataPlaneClient({
  region: amplify_outputs.aws_region,
  credentials: fromCognitoIdentityPool({
    client: new CognitoIdentityClient({ region: amplify_outputs.aws_region }),
    identityPoolId: amplify_outputs.auth.identity_pool_id
  })
});

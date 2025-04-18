// src/aws-iot-config.ts
import amplify_outputs from "../amplify_outputs.json";

export const AWS_REGION = amplify_outputs.auth.aws_region;
export const IDENTITY_POOL_ID = amplify_outputs.auth.identity_pool_id;
export const USER_POOL_ID = amplify_outputs.auth.user_pool_id;

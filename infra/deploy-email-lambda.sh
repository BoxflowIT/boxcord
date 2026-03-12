#!/usr/bin/env bash
set -euo pipefail
# ─────────────────────────────────────────────────────────────────
# Deploy the Cognito CustomMessage Lambda trigger
#
# Prerequisites:
#   - AWS CLI v2 configured with eu-north-1
#   - Permissions: lambda:*, iam:PassRole, cognito-idp:UpdateUserPool
#
# Usage:
#   ./infra/deploy-email-lambda.sh
# ─────────────────────────────────────────────────────────────────

REGION="eu-north-1"
FUNCTION_NAME="boxcord-cognito-custom-message"
HANDLER="index.handler"
RUNTIME="nodejs20.x"
ROLE_NAME="boxcord-cognito-custom-message-role"
USER_POOL_ID="eu-north-1_SJ3dGBIPY"
LAMBDA_DIR="infra/lambda/custom-message"

echo "==> Packaging Lambda..."
TMPZIP=$(mktemp /tmp/custom-message-XXXXX.zip)
(cd "$LAMBDA_DIR" && zip -j "$TMPZIP" index.mjs)

# ── IAM Role ──────────────────────────────────────────────────
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text 2>/dev/null || true)

if [ -z "$ROLE_ARN" ] || [ "$ROLE_ARN" = "None" ]; then
  echo "==> Creating IAM role..."
  ROLE_ARN=$(aws iam create-role \
    --role-name "$ROLE_NAME" \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": { "Service": "lambda.amazonaws.com" },
        "Action": "sts:AssumeRole"
      }]
    }' \
    --query 'Role.Arn' --output text)

  aws iam attach-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"

  echo "    Waiting for role propagation..."
  sleep 10
fi

echo "    Role: $ROLE_ARN"

# ── Lambda Function ───────────────────────────────────────────
EXISTING=$(aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || true)

if [ -z "$EXISTING" ]; then
  echo "==> Creating Lambda function..."
  LAMBDA_ARN=$(aws lambda create-function \
    --function-name "$FUNCTION_NAME" \
    --runtime "$RUNTIME" \
    --handler "$HANDLER" \
    --role "$ROLE_ARN" \
    --zip-file "fileb://$TMPZIP" \
    --timeout 5 \
    --memory-size 128 \
    --region "$REGION" \
    --query 'FunctionArn' --output text)
else
  echo "==> Updating Lambda function code..."
  LAMBDA_ARN=$(aws lambda update-function-code \
    --function-name "$FUNCTION_NAME" \
    --zip-file "fileb://$TMPZIP" \
    --region "$REGION" \
    --query 'FunctionArn' --output text)
fi

echo "    Lambda: $LAMBDA_ARN"
rm -f "$TMPZIP"

# ── Permission for Cognito to invoke Lambda ───────────────────
echo "==> Adding Cognito invoke permission..."
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "CognitoCustomMessage" \
  --action "lambda:InvokeFunction" \
  --principal "cognito-idp.amazonaws.com" \
  --source-arn "arn:aws:cognito-idp:${REGION}:$(aws sts get-caller-identity --query Account --output text):userpool/${USER_POOL_ID}" \
  --region "$REGION" 2>/dev/null || echo "    (permission already exists)"

# ── Attach trigger to Cognito User Pool ───────────────────────
echo "==> Attaching CustomMessage trigger to User Pool..."
aws cognito-idp update-user-pool \
  --user-pool-id "$USER_POOL_ID" \
  --lambda-config "CustomMessage=$LAMBDA_ARN" \
  --region "$REGION"

echo ""
echo "✅ Done! Cognito emails are now styled."
echo "   Test by signing up or resetting a password at ${BOXCORD_URL:-https://boxcord.boxflow.com}"

#!/bin/bash
# Get next PR number from .pr-number file

PR_NUMBER_FILE=".pr-number"

# Check if file exists
if [ ! -f "$PR_NUMBER_FILE" ]; then
  echo "229"
  exit 0
fi

# Read current number
CURRENT=$(cat "$PR_NUMBER_FILE")

# Increment
NEXT=$((CURRENT + 1))

echo "$NEXT"

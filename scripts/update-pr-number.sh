#!/bin/bash
# Update .pr-number file with new number

if [ -z "$1" ]; then
  echo "Usage: $0 <pr_number>"
  exit 1
fi

echo "$1" > .pr-number
echo "✅ Updated .pr-number to $1"

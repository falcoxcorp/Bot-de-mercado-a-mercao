#!/bin/bash

# Test Edge Function Script
# This script calls the trading bot Edge Function to test it manually

EDGE_FUNCTION_URL="https://wltlscihxmnntxmvmypt.supabase.co/functions/v1/trading-bot-executor"

echo "=========================================="
echo "Testing Falco-X Trading Bot Edge Function"
echo "=========================================="
echo ""
echo "Calling: $EDGE_FUNCTION_URL"
echo ""

response=$(curl -s -X POST "$EDGE_FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n")

echo "Response:"
echo "$response"
echo ""
echo "=========================================="
echo "Test completed!"
echo "=========================================="

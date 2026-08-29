#!/bin/bash
set -e

# ==============================================================================
# HCL Hackathon Submission Packager Script
# Purpose: Creates a clean, safe, non-destructive ZIP archive of the
#          learning-path-recommender application for evaluation.
# ==============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${APP_DIR}/.." && pwd)"
OUTPUT_ZIP="${ROOT_DIR}/hcl_hackathon_submission.zip"

echo "=========================================================="
echo "📦 Packaging Hackathon Submission..."
echo "=========================================================="
echo "Source Directory: ${APP_DIR}"
echo "Target Archive:   ${OUTPUT_ZIP}"
echo ""

# Remove previous zip if it exists
if [ -f "${OUTPUT_ZIP}" ]; then
  rm "${OUTPUT_ZIP}"
  echo "Removed existing archive: ${OUTPUT_ZIP}"
fi

# Navigate to learning-path-recommender directory to maintain clean root in zip
cd "${APP_DIR}"

# Package using zip with explicit exclusions
zip -r "${OUTPUT_ZIP}" . \
  -x "node_modules/*" \
  -x ".next/*" \
  -x "dist/*" \
  -x "build/*" \
  -x "coverage/*" \
  -x ".env" \
  -x ".env.*" \
  -x "*.log" \
  -x ".DS_Store" \
  -x "*/.DS_Store" \
  -x ".git/*" \
  -x ".turbo/*"

echo ""
echo "=========================================================="
echo "✅ Submission Archive Created Successfully!"
echo "=========================================================="
echo "Archive location: ${OUTPUT_ZIP}"
echo "Archive size:     $(du -h "${OUTPUT_ZIP}" | cut -f1)"
echo ""
echo "Verification check (Top 20 files in zip):"
unzip -l "${OUTPUT_ZIP}" | head -n 25

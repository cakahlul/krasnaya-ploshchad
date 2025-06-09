# Pull Request: Add Vercel Serverless Support and Firebase Admin Improvements

## PR Title
Add Vercel Serverless Support and Firebase Admin Module Improvements

## PR Description

### Summary
This pull request introduces serverless deployment support for Vercel and improves the Firebase Admin module initialization with better error handling and environment flexibility.

### What's Changed

#### 🚀 New Features
- **Vercel Serverless Support**: Added serverless configuration and handler for Vercel deployment
  - Added `vercel.json` configuration file with function settings
  - Modified `main.ts` to support both traditional and serverless deployments
  - Implemented proper request handler for Vercel runtime

#### 🔧 Improvements
- **Firebase Admin Module**:
  - Added proper error handling and logging for initialization
  - Improved credential loading logic for both local and production environments
  - Added check to prevent multiple Firebase app initializations
  - Better error messages for debugging credential issues

- **TypeScript Configuration**:
  - Updated `tsconfig.json` with improved module resolution settings
  - Added necessary type definitions for serverless deployment

- **Import Adjustments**:
  - Fixed import statements in reports service
  - Added required Express types for serverless handler

#### 📦 Dependencies
- Added `@types/express` package for TypeScript support

### Technical Details

#### Files Modified
1. **`apps/aioc-service/vercel.json`** (New file)
   - Configures Vercel serverless functions
   - Sets memory, timeout, and region settings
   - Defines routing rules

2. **`apps/aioc-service/src/main.ts`**
   - Added serverless handler export for Vercel
   - Conditional server startup based on environment
   - Maintains backward compatibility for traditional deployment

3. **`apps/aioc-service/src/firebase/firebase-admin.ts`**
   - Wrapped initialization in try-catch block
   - Added file existence check for local development
   - Improved logging for different initialization methods
   - Prevents duplicate app initialization

4. **`apps/aioc-service/src/modules/reports/reports.service.ts`**
   - Fixed import statement formatting

5. **`apps/aioc-service/tsconfig.json`**
   - Updated compiler options for better module resolution
   - Added path mappings and type roots

6. **`apps/aioc-service/package.json`**
   - Added `@types/express` dependency

### Deployment Notes
- The application now supports deployment on Vercel's serverless platform
- Existing Railway/traditional deployments remain unaffected
- Firebase credentials can be provided via `FIREBASE_SERVICE_ACCOUNT_BASE64` environment variable

### Testing
- Firebase initialization tested in both local and production environments
- Serverless handler tested for proper request/response handling
- Backward compatibility verified for existing deployment methods

### Commits Included
- `153381d` - add serverless config
- `869523d` - adjust firebase admin module  
- `dd1201e` - Adjust Firebase admin module configuration and dependencies
- `7b224fe` - adjust importing
- `1248a89` - Merge branch 'development'

---

## How to Create the PR

### Option 1: Using GitHub CLI (requires authentication)
```bash
gh auth login
gh pr create --base main --head development --title "Add Vercel Serverless Support and Firebase Admin Module Improvements" --body-file PR_DEVELOPMENT_TO_MAIN.md
```

### Option 2: Using GitHub Web Interface
1. Go to: https://github.com/cakahlul/krasnaya-ploshchad/compare/main...development
2. Click "Create pull request"
3. Copy the title and description from this file
4. Submit the PR

### Option 3: Using Git Push (if not already pushed)
```bash
git push origin development
# Then create PR via GitHub web interface
```
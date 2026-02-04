// tools/security-check.js
// Security audit script - run before deployment

const fs = require('fs');
const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

const securityChecks = {
  // Check for exposed secrets in code
  checkForSecrets: () => {
    const filesToCheck = [
      'src/**/*.js',
      'src/**/*.jsx',
      'src/**/*.ts',
      'src/**/*.tsx',
      'supabase/**/*.ts'
    ];

    const secretPatterns = [
      /sk-\w+/g,  // OpenAI keys
      /rk_\w+/g,  // Stripe restricted keys
      /whsec_\w+/g,  // Stripe webhook secrets
      /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_.]+/g  // JWT tokens
    ];

    let foundSecrets = false;

    filesToCheck.forEach(pattern => {
      // Simple glob implementation for demo
      const scanDirectory = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);

          if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
            scanDirectory(filePath);
          } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
            const content = fs.readFileSync(filePath, 'utf8');
            secretPatterns.forEach(pattern => {
              const matches = content.match(pattern);
              if (matches) {
                console.error(`🚨 POTENTIAL SECRET FOUND in ${filePath}:`);
                matches.forEach(match => console.error(`   ${match}`));
                foundSecrets = true;
              }
            });
          }
        });
      };

      if (fs.existsSync(path.join(projectRoot, pattern.split('/')[0]))) {
        scanDirectory(path.join(projectRoot, pattern.split('/')[0]));
      }
    });

    return !foundSecrets;
  },

  // Check for console.logs in production code
  checkForConsoleLogs: () => {
    const srcDir = path.join(projectRoot, 'src');
    let hasConsoleLogs = false;

    const scanForLogs = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          scanForLogs(filePath);
        } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(file)) {
          const content = fs.readFileSync(filePath, 'utf8');
          const consoleMatches = content.match(/console\.(log|warn|error|info)/g);
          if (consoleMatches) {
            console.warn(`⚠️  Console statements found in ${filePath}:`);
            consoleMatches.forEach(match => console.warn(`   ${match}`));
            hasConsoleLogs = true;
          }
        }
      });
    };

    if (fs.existsSync(srcDir)) {
      scanForLogs(srcDir);
    }

    return !hasConsoleLogs;
  },

  // Check environment variables
  checkEnvironmentVariables: () => {
    const envPath = path.join(projectRoot, '.env');
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'OPENAI_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    let missingVars = [];

    requiredVars.forEach(varName => {
      if (!envContent.includes(`${varName}=`)) {
        missingVars.push(varName);
      }
    });

    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:');
      missingVars.forEach(v => console.error(`   ${v}`));
      return false;
    }

    console.log('✅ All required environment variables are configured');
    return true;
  }
};

console.log('🔒 Running Security Checks...\n');

let allPassed = true;

console.log('1. Checking for exposed secrets...');
if (securityChecks.checkForSecrets()) {
  console.log('✅ No secrets found in code\n');
} else {
  allPassed = false;
  console.log('❌ Secrets found in code\n');
}

console.log('2. Checking for console statements...');
if (securityChecks.checkForConsoleLogs()) {
  console.log('✅ No console statements found\n');
} else {
  console.log('⚠️  Console statements found (acceptable for development)\n');
}

console.log('3. Checking environment variables...');
if (securityChecks.checkEnvironmentVariables()) {
  console.log('✅ Environment variables configured\n');
} else {
  allPassed = false;
  console.log('❌ Environment variables missing\n');
}

if (allPassed) {
  console.log('🎉 All security checks passed!');
  process.exit(0);
} else {
  console.log('❌ Some security checks failed. Please review before deployment.');
  process.exit(1);
}
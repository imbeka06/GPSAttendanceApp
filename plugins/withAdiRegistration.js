const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('@expo/config-plugins');

function withAdiRegistration(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidProjectRoot = modConfig.modRequest.platformProjectRoot;

      const sourceFile = path.join(projectRoot, 'assets', 'adi-registration.properties');
      const targetDir = path.join(androidProjectRoot, 'app', 'src', 'main', 'assets');
      const targetFile = path.join(targetDir, 'adi-registration.properties');

      if (!fs.existsSync(sourceFile)) {
        throw new Error(
          'Missing assets/adi-registration.properties. Add the exact Google Play token snippet to that file.'
        );
      }

      fs.mkdirSync(targetDir, { recursive: true });
      const tokenContents = fs.readFileSync(sourceFile, 'utf8').replace(/[\r\n]+$/, '');
      fs.writeFileSync(targetFile, tokenContents, 'utf8');

      return modConfig;
    },
  ]);
}

module.exports = withAdiRegistration;

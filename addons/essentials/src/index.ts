import path, { dirname, join } from 'path';
import { logger } from '@storybook/node-logger';
import { serverRequire } from '@storybook/core-common';

interface PresetOptions {
  configDir?: string;
  docs?: boolean;
  controls?: boolean;
  actions?: boolean;
  backgrounds?: boolean;
  viewport?: boolean;
  toolbars?: boolean;
  measure?: boolean;
  outline?: boolean;
}

const requireMain = (configDir: string) => {
  const absoluteConfigDir = path.isAbsolute(configDir)
    ? configDir
    : path.join(process.cwd(), configDir);
  const mainFile = path.join(absoluteConfigDir, 'main');

  return serverRequire(mainFile) ?? {};
};

export function addons(options: PresetOptions = {}) {
  const checkInstalled = (addon: string, main: any) => {
    const existingAddon = main.addons?.find((entry: string | { name: string }) => {
      const name = typeof entry === 'string' ? entry : entry.name;
      return name?.startsWith(addon);
    });
    if (existingAddon) {
      logger.info(`Found existing addon ${JSON.stringify(existingAddon)}, skipping.`);
    }
    return !!existingAddon;
  };

  const main = requireMain(options.configDir);
  return (
    [
      'docs',
      'controls',
      'actions',
      'backgrounds',
      'viewport',
      'toolbars',
      'measure',
      'outline',
      'highlight',
    ]
      .filter((key) => (options as any)[key] !== false)
      .map((key) => `@storybook/addon-${key}`)
      .filter((addon) => !checkInstalled(addon, main))
      // Use `require.resolve` to ensure Yarn PnP compatibility
      // Files of various addons should be resolved in the context of `addon-essentials` as they are listed as deps here
      // and not in `@storybook/core` nor in SB user projects. If `@storybook/core` make the require itself Yarn 2 will
      // throw an error saying that the package to require must be added as a dependency. Doing `require.resolve` will
      // allow `@storybook/core` to work with absolute path directly, no more require of dep no more issue.
      // File to load can be `preset.js`, `register.js`, or the package entry point, so we need to check all these cases
      // as it's done in `lib/core/src/server/presets.js`.
      .map((addon) => {
        try {
          return dirname(require.resolve(join(addon, 'package.json')));
          // eslint-disable-next-line no-empty
        } catch (err) {}

        return require.resolve(addon);
      })
  );
}

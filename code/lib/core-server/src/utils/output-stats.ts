import dje from '@discoveryjs/json-ext';
import { logger } from '@storybook/node-logger';
import type { Stats } from '@storybook/types';
import chalk from 'chalk';
import fse from 'fs-extra';
import path from 'node:path';

export async function outputStats(directory: string, previewStats?: any, managerStats?: any) {
  if (previewStats) {
    const filePath = await writeStats(directory, 'preview', previewStats as Stats);
    logger.info(`=> preview stats written to ${chalk.cyan(filePath)}`);
  }
  if (managerStats) {
    const filePath = await writeStats(directory, 'manager', managerStats as Stats);
    logger.info(`=> manager stats written to ${chalk.cyan(filePath)}`);
  }
}

export const writeStats = async (directory: string, name: string, stats: Stats) => {
  const filePath = path.join(directory, `${name}-stats.json`);
  const { chunks, ...data } = stats.toJson(); // omit chunks, which is about half of the total data
  await new Promise((resolve, reject) => {
    dje
      .stringifyStream(data, null, 2)
      .on('error', reject)
      .pipe(fse.createWriteStream(filePath))
      .on('error', reject)
      .on('finish', resolve);
  });
  return filePath;
};

import { readConfig } from 'node-dotconfig';

const PATH = '.config/local/rfid-reader.ini'

type Config = {
  server?: {
    port?: number;
  };
  reader?: {
    address?: string;
    port?: number;
  }
}

export const getConfig = async (): Promise<Config> => {
	return readConfig(PATH) as Promise<Config>;
};

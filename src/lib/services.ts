import { Config } from './config';

type Services = {
  config: Config | undefined;
};

const services: Services = {
  config: undefined,
};

export function getConfig(): Config {
  if (!services.config) {
    throw new Error('Config has not been initialized');
  }
  return services.config;
}

export function setService(
  name: keyof Services,
  value: Services[typeof name]
): void {
  services[name] = value;
}

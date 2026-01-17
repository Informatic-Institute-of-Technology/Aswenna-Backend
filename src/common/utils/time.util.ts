import { InternalServerErrorException } from '@nestjs/common';

export const parseDurationToSeconds = (duration: string = '1d'): number => {
  const regex = /^(\d+)([smhd])$/;
  const match = duration.match(regex);

  if (!match) {
    const num = parseFloat(duration);
    if (!isNaN(num)) return num;

    throw new InternalServerErrorException(
      `Invalid duration format: ${duration}`,
    );
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 3600;
    case 'd':
      return value * 86400;
    default:
      throw new InternalServerErrorException(`Invalid time unit: ${unit}`);
  }
};

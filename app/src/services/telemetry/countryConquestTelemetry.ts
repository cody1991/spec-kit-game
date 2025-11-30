import type { TelemetrySignal } from '@/core/types';

export interface CountryConquestTelemetryPayload {
  territoryId: string;
  territoryName: string;
  previousOwnerId: string | null;
  newOwnerId: string;
  attackPower: number;
  defensePower: number;
  battleDuration: number;
}

export function createCountryConquestTelemetry(
  payload: CountryConquestTelemetryPayload
): TelemetrySignal {
  return {
    type: 'territory:conquered',
    timestamp: new Date().toISOString(),
    payload,
  };
}

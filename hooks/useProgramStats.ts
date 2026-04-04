import { useMemo } from 'react';
import { RealEstateProgram, ProgramStats } from '../types';

export function useProgramStats(program: RealEstateProgram, overrideSource?: 'platform' | 'ga4'): ProgramStats {
    return useMemo(() => {
        // Priority 1: Manual Override (e.g. for Expert analysis)
        if (overrideSource) {
            return overrideSource === 'ga4' ? program.stats_ga4 : program.stats_platform;
        }

        // Priority 2: Program Default Configuration
        if (program.conversion_source === 'ga4') {
            return program.stats_ga4;
        }

        // Default: Platform Data
        return program.stats_platform;
    }, [program, overrideSource]);
}

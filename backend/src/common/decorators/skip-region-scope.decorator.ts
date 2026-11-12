import { SetMetadata } from '@nestjs/common';

export const SKIP_REGION_SCOPE = 'skipRegionScope';
export const SkipRegionScope = () => SetMetadata(SKIP_REGION_SCOPE, true);
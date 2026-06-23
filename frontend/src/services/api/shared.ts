/** Public shared-card API endpoint. */

import api from "./client";
import type { SharedCard } from "./types";

export const sharedApi = {
  get: (slug: string) => api.get<SharedCard>(`/shared/${slug}`),
};

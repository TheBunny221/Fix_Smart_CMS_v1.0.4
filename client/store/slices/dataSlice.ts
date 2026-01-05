import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";

// Types for centralized data management
export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  isStale?: boolean;
}

export interface DataState {
  // Complaints data
  complaints: {
    list: CachedData<any[]> | null;
    details: Record<string, CachedData<any>>;
  };

  // Service requests data
  serviceRequests: {
    list: CachedData<any[]> | null;
    details: Record<string, CachedData<any>>;
  };

  // Users data
  users: {
    list: CachedData<any[]> | null;
    profile: CachedData<any> | null;
  };

  // Wards and locations
  locations: {
    wards: CachedData<any[]> | null;
    subZones: Record<string, CachedData<any[]>>;
  };

  // Configuration data
  config: {
    complaintTypes: CachedData<any[]> | null;
    systemSettings: CachedData<any> | null;
  };

  // Statistics and analytics
  analytics: {
    complaintStats: CachedData<any> | null;
    userStats: CachedData<any> | null;
    wardStats: Record<string, CachedData<any>>;
  };

  // Status tracking
  statusTracking: {
    activeComplaints: CachedData<any[]> | null;
    recentUpdates: CachedData<any[]> | null;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const initialState: DataState = {
  complaints: {
    list: null,
    details: {},
  },
  serviceRequests: {
    list: null,
    details: {},
  },
  users: {
    list: null,
    profile: null,
  },
  locations: {
    wards: null,
    subZones: {},
  },
  config: {
    complaintTypes: null,
    systemSettings: null,
  },
  analytics: {
    complaintStats: null,
    userStats: null,
    wardStats: {},
  },
  statusTracking: {
    activeComplaints: null,
    recentUpdates: null,
  },
};

const dataSlice = createSlice({
  name: "data",
  initialState,
  reducers: {
    // Complaints management
    setComplaintsList: (state, action: PayloadAction<any[]>) => {
      state.complaints.list = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setComplaintDetails: (
      state,
      action: PayloadAction<{ id: string; data: any }>,
    ) => {
      state.complaints.details[action.payload.id] = {
        data: action.payload.data,
        timestamp: Date.now(),
      };
    },

    updateComplaintInList: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<any> }>,
    ) => {
      const { id, updates } = action.payload;

      // Update in list if exists
      if (state.complaints.list?.data) {
        const index = state.complaints.list.data.findIndex(
          (complaint) => complaint.id === id,
        );
        if (index !== -1) {
          state.complaints.list.data[index] = {
            ...state.complaints.list.data[index],
            ...updates,
          };
        }
      }

      // Update in details if exists
      if (state.complaints.details[id]) {
        state.complaints.details[id].data = {
          ...state.complaints.details[id].data,
          ...updates,
        };
      }
    },

    // Service requests management
    setServiceRequestsList: (state, action: PayloadAction<any[]>) => {
      state.serviceRequests.list = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setServiceRequestDetails: (
      state,
      action: PayloadAction<{ id: string; data: any }>,
    ) => {
      state.serviceRequests.details[action.payload.id] = {
        data: action.payload.data,
        timestamp: Date.now(),
      };
    },

    // Users management
    setUsersList: (state, action: PayloadAction<any[]>) => {
      state.users.list = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setUserProfile: (state, action: PayloadAction<any>) => {
      state.users.profile = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    // Locations management
    setWards: (state, action: PayloadAction<any[]>) => {
      // Store wards WITH their subZones property preserved
      state.locations.wards = {
        data: action.payload, // Keep the full ward objects including subZones
        timestamp: Date.now(),
      };

      // Also extract and normalize sub-zones from wards for efficient lookups
      action.payload.forEach((ward) => {
        if (ward.subZones && Array.isArray(ward.subZones)) {
          state.locations.subZones[ward.id] = {
            data: ward.subZones,
            timestamp: Date.now(),
          };
        }
      });
    },

    setSubZones: (
      state,
      action: PayloadAction<{ wardId: string; data: any[] }>,
    ) => {
      state.locations.subZones[action.payload.wardId] = {
        data: action.payload.data,
        timestamp: Date.now(),
      };
    },

    // New action to set wards with sub-zones in one go
    setWardsWithSubZones: (state, action: PayloadAction<any[]>) => {
      // 1. Check if the payload actually contains sub-zone data
      const hasSubZones = action.payload.some(
        (ward) =>
          ward.subZones &&
          Array.isArray(ward.subZones) &&
          ward.subZones.length > 0,
      );

      // 2. Set wards list (this might be shallow or deep)
      state.locations.wards = {
        data: action.payload,
        timestamp: Date.now(),
      };

      // 3. Only update sub-zones map if we actually received sub-zone data
      // This prevents shallow fetches (without include=subzones) from wiping the cache
      if (hasSubZones) {
        state.locations.subZones = {};
        action.payload.forEach((ward) => {
          if (ward.subZones && Array.isArray(ward.subZones)) {
            state.locations.subZones[ward.id] = {
              data: ward.subZones,
              timestamp: Date.now(),
            };
          }
        });
      }
    },

    // Configuration management
    setComplaintTypes: (state, action: PayloadAction<any[]>) => {
      state.config.complaintTypes = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setSystemSettings: (state, action: PayloadAction<any>) => {
      state.config.systemSettings = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    // Analytics management
    setComplaintStats: (state, action: PayloadAction<any>) => {
      state.analytics.complaintStats = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setUserStats: (state, action: PayloadAction<any>) => {
      state.analytics.userStats = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setWardStats: (
      state,
      action: PayloadAction<{ wardId: string; data: any }>,
    ) => {
      state.analytics.wardStats[action.payload.wardId] = {
        data: action.payload.data,
        timestamp: Date.now(),
      };
    },

    // Status tracking management
    setActiveComplaints: (state, action: PayloadAction<any[]>) => {
      state.statusTracking.activeComplaints = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    setRecentUpdates: (state, action: PayloadAction<any[]>) => {
      state.statusTracking.recentUpdates = {
        data: action.payload,
        timestamp: Date.now(),
      };
    },

    // Cache management
    markDataAsStale: (state, action: PayloadAction<string>) => {
      const path = action.payload.split(".");
      let current: any = state;

      for (let i = 0; i < path.length - 1; i++) {
        const key = path[i];
        if (!key || !(key in current)) return;
        current = current[key];
        if (!current) return;
      }

      const lastKey = path[path.length - 1];
      if (!lastKey) return;
      const final = current[lastKey];
      if (final && typeof final === "object" && "isStale" in final) {
        (final as { isStale: boolean }).isStale = true;
      }
    },

    clearStaleData: (state) => {
      const now = Date.now();

      // Helper function to check and clear stale data
      const clearIfStale = (cached: CachedData<any> | null | undefined) => {
        if (!cached) return null;
        if (now - cached.timestamp > CACHE_TTL || cached.isStale) {
          return null;
        }
        return cached;
      };

      // Clear stale data across all sections
      state.complaints.list = clearIfStale(state.complaints.list);
      state.serviceRequests.list = clearIfStale(state.serviceRequests.list);
      state.users.list = clearIfStale(state.users.list);
      state.users.profile = clearIfStale(state.users.profile);
      state.locations.wards = clearIfStale(state.locations.wards);
      state.config.complaintTypes = clearIfStale(state.config.complaintTypes);
      state.config.systemSettings = clearIfStale(state.config.systemSettings);
      state.analytics.complaintStats = clearIfStale(
        state.analytics.complaintStats,
      );
      state.analytics.userStats = clearIfStale(state.analytics.userStats);

      // Clear stale details
      Object.keys(state.complaints.details).forEach((id) => {
        const cached = state.complaints.details[id];
        if (!cached || now - cached.timestamp > CACHE_TTL || cached.isStale) {
          delete state.complaints.details[id];
        }
      });

      Object.keys(state.serviceRequests.details).forEach((id) => {
        const cached = state.serviceRequests.details[id];
        if (!cached || now - cached.timestamp > CACHE_TTL || cached.isStale) {
          delete state.serviceRequests.details[id];
        }
      });
    },

    clearAllData: (state) => {
      return initialState;
    },
  },
});

export const {
  setComplaintsList,
  setComplaintDetails,
  updateComplaintInList,
  setServiceRequestsList,
  setServiceRequestDetails,
  setUsersList,
  setUserProfile,
  setWards,
  setSubZones,
  setWardsWithSubZones,
  setComplaintTypes,
  setSystemSettings,
  setComplaintStats,
  setUserStats,
  setWardStats,
  setActiveComplaints,
  setRecentUpdates,
  markDataAsStale,
  clearStaleData,
  clearAllData,
} = dataSlice.actions;

// Selectors for easy data access
export const selectComplaintsList = (state: { data: DataState }) =>
  state.data.complaints.list;
export const selectComplaintDetails =
  (id: string) => (state: { data: DataState }) =>
    state.data.complaints.details[id];
export const selectWards = (state: { data: DataState }) =>
  state.data.locations.wards;
export const selectSubZones =
  (wardId: string) => (state: { data: DataState }) =>
    state.data.locations.subZones[wardId];
export const selectComplaintTypes = (state: { data: DataState }) =>
  state.data.config.complaintTypes;
export const selectComplaintStats = (state: { data: DataState }) =>
  state.data.analytics.complaintStats;
export const selectActiveComplaints = (state: { data: DataState }) =>
  state.data.statusTracking.activeComplaints;
export const selectRecentUpdates = (state: { data: DataState }) =>
  state.data.statusTracking.recentUpdates;

// Enhanced selectors for wards and sub-zones
export const selectWardsArray = createSelector(
  [(state: { data: DataState }) => state.data.locations.wards],
  (wardsData) => wardsData?.data || [],
);

export const selectSubZonesByWardId = (wardId: string) =>
  createSelector(
    [(state: { data: DataState }) => state.data.locations.subZones[wardId]],
    (subZonesData) => subZonesData?.data || [],
  );

export const selectWardById = (wardId: string) =>
  createSelector(
    [selectWardsArray],
    (wards) => wards.find((ward) => ward.id === wardId) || null,
  );

export const selectAllSubZones = createSelector(
  [(state: { data: DataState }) => state.data.locations.subZones],
  (subZonesMap) => {
    const allSubZones: any[] = [];
    Object.values(subZonesMap).forEach((cached) => {
      if (cached?.data) {
        allSubZones.push(...cached.data);
      }
    });
    return allSubZones;
  },
);

// Helper selectors for checking data freshness
export const selectIsDataFresh =
  (dataPath: string) => (state: { data: DataState }) => {
    const path = dataPath.split(".");
    let current: any = state.data;

    for (const segment of path) {
      current = current[segment];
      if (!current) return false;
    }

    if (!current || typeof current !== "object" || !("timestamp" in current)) {
      return false;
    }

    const now = Date.now();
    return now - current.timestamp < CACHE_TTL && !current.isStale;
  };

export default dataSlice.reducer;

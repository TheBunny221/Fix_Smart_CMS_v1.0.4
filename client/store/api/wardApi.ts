import { baseApi, ApiResponse } from "./baseApi";

interface Ward {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: SubZone[];
}

interface SubZone {
  id: string;
  name: string;
  wardId: string;
  description?: string;
  isActive: boolean;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
}

interface LocationDetection {
  exact: {
    ward: Ward | null;
    subZone: SubZone | null;
  };
  nearest: {
    ward: Ward | null;
    subZone: SubZone | null;
    distance: number;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
}

export interface UpdateBoundariesRequest {
  wardId: string;
  boundaries?: string;
  centerLat?: number;
  centerLng?: number;
  boundingBox?: string;
  subZones?: Array<{
    id: string;
    boundaries?: string;
    centerLat?: number;
    centerLng?: number;
    boundingBox?: string;
  }>;
}

interface DetectAreaRequest {
  latitude: number;
  longitude: number;
}

interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
}

interface WardTeamMembersResponse {
  success: boolean;
  message: string;
  data: {
    teamMembers: TeamMember[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface CreateWardRequest {
  name: string;
  description?: string;
}

interface UpdateWardRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

interface CreateSubZoneRequest {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateSubZoneRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export const wardApi = baseApi.injectEndpoints({
  overrideExisting: true,
  endpoints: (builder) => ({
    // Get all wards (with optional subzones)
    getWards: builder.query<
      ApiResponse<{ wards: Ward[] }>,
      { includeSubzones?: boolean; all?: boolean }
    >({
      query: ({ includeSubzones = false, all = false } = {}) => ({
        url: "/users/wards",
        params: {
          include: includeSubzones ? "subzones" : undefined,
          all: all ? "true" : undefined,
        },
      }),
      providesTags: ["Ward"],
      // Disable caching for debugging
      keepUnusedDataFor: 0,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data.success && data.data?.wards) {
            // Import the action here to avoid circular dependency
            const { setWardsWithSubZones } = await import(
              "../slices/dataSlice"
            );

            // Only ensure subZones property exists
            const wardsWithSubZones = data.data.wards.map((ward: any) => ({
              ...ward,
              subZones: ward.subZones || [], // Ensure subZones is always an array
            }));

            // Use the processed wards data
            dispatch(setWardsWithSubZones(wardsWithSubZones));
          }
        } catch (error) {
          // Query failed, no need to update Redux state
        }
      },
    }),

    getWardsWithBoundaries: builder.query<ApiResponse<Ward[]>, void>({
      query: () => "/wards/boundaries",
      providesTags: ["Ward"],
    }),

    // Create ward
    createWard: builder.mutation<
      ApiResponse<{ ward: Ward }>,
      CreateWardRequest
    >({
      query: (body) => ({
        url: "/users/wards",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Ward"],
    }),

    // Update ward
    updateWard: builder.mutation<
      ApiResponse<{ ward: Ward }>,
      { id: string; data: UpdateWardRequest }
    >({
      query: ({ id, data }) => ({
        url: `/users/wards/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Ward"],
    }),

    // Delete ward
    deleteWard: builder.mutation<ApiResponse<void>, string>({
      query: (id) => ({
        url: `/users/wards/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ward"],
    }),

    // Create subzone
    createSubZone: builder.mutation<
      ApiResponse<SubZone>,
      { wardId: string; data: CreateSubZoneRequest }
    >({
      query: ({ wardId, data }) => ({
        url: `/users/wards/${wardId}/subzones`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Ward"],
    }),

    // Update subzone
    updateSubZone: builder.mutation<
      ApiResponse<SubZone>,
      { wardId: string; id: string; data: UpdateSubZoneRequest }
    >({
      query: ({ wardId, id, data }) => ({
        url: `/users/wards/${wardId}/subzones/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Ward"],
    }),

    // Delete subzone
    deleteSubZone: builder.mutation<
      ApiResponse<void>,
      { wardId: string; id: string }
    >({
      query: ({ wardId, id }) => ({
        url: `/users/wards/${wardId}/subzones/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Ward"],
    }),

    updateWardBoundaries: builder.mutation<
      ApiResponse<Ward>,
      UpdateBoundariesRequest
    >({
      query: ({ wardId, ...body }) => ({
        url: `/wards/${wardId}/boundaries`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Ward"],
    }),

    detectLocationArea: builder.mutation<
      ApiResponse<LocationDetection>,
      DetectAreaRequest
    >({
      query: (body) => ({
        url: "/wards/detect-area",
        method: "POST",
        body,
      }),
    }),

    getWardTeamMembers: builder.query<
      ApiResponse<{ users: TeamMember[]; pagination: any }>,
      string
    >({
      query: (wardId) =>
        `/complaints/ward-users?role=MAINTENANCE_TEAM&limit=100`,
      providesTags: ["Ward"],
    }),
  }),
});

export const {
  useGetWardsQuery,
  useGetWardsWithBoundariesQuery,
  useCreateWardMutation,
  useUpdateWardMutation,
  useDeleteWardMutation,
  useCreateSubZoneMutation,
  useUpdateSubZoneMutation,
  useDeleteSubZoneMutation,
  useUpdateWardBoundariesMutation,
  useDetectLocationAreaMutation,
  useGetWardTeamMembersQuery,
} = wardApi;

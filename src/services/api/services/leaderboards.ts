import { createGetService } from "../factory";

// Leaderboard entry type
export interface LeaderboardEntry {
  id: string;
  leaderboardId: string;
  username: string;
  score: number;
  metadata?: Record<string, unknown>;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

// Type definitions for Leaderboard APIs
export type QueryLeaderboardRequest = {
  page?: number;
  limit?: number;
};

export type QueryLeaderboardResponse = {
  data: LeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
};

export type UserLeaderboardEntriesRequest = {
  page?: number;
  limit?: number;
};

export type UserLeaderboardEntriesResponse = {
  data: LeaderboardEntry[];
  page: number;
  limit: number;
};

export type GetUserScoreRequest = {
  leaderboardId: string;
  username: string;
};

export type GetUserScoreResponse = LeaderboardEntry;

// Format query params for leaderboard requests
const formatLeaderboardQueryParams = (params: QueryLeaderboardRequest) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  return searchParams.toString();
};

// Format query params for user entries requests
const formatUserEntriesQueryParams = (
  params: UserLeaderboardEntriesRequest
) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  return searchParams.toString();
};

// API Services using the factory pattern
export const useGetAllLeaderboardsService = createGetService<
  Array<{
    leaderboardId: string;
    entryCount: number;
    topScore: number;
    lastActivity: string;
  }>
>("/v1/leaderboards");

export const useGetLeaderboardService = createGetService<
  QueryLeaderboardResponse,
  { leaderboardId: string },
  QueryLeaderboardRequest
>((params) => `/v1/leaderboards/${params.leaderboardId}`, {
  formatQueryParams: formatLeaderboardQueryParams,
});

export const useGetUserLeaderboardEntriesService = createGetService<
  UserLeaderboardEntriesResponse,
  { username: string },
  UserLeaderboardEntriesRequest
>((params) => `/v1/leaderboards/users/${params.username}/entries`, {
  formatQueryParams: formatUserEntriesQueryParams,
});

export const useGetUserScoreForLeaderboardService = createGetService<
  GetUserScoreResponse,
  GetUserScoreRequest
>(
  (params) =>
    `/v1/leaderboards/${params.leaderboardId}/users/${params.username}`
);

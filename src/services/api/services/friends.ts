import { FriendRequest, FriendRequestWithUsers } from "../types/friend-request";
import { User } from "../types/user";
import { InfinityPaginationType } from "../types/infinity-pagination";
import {
  createGetService,
  createPostService,
  createPatchService,
  createDeleteService,
} from "../factory";

// Type definitions for Friend Request APIs
export type SendFriendRequestRequest = {
  recipientUsername: string;
};

export type SendFriendRequestResponse = FriendRequest;

export type QueryFriendRequestsRequest = {
  page?: number;
  limit?: number;
};

export type QueryFriendRequestsResponse =
  InfinityPaginationType<FriendRequestWithUsers>;

export type FriendRequestActionRequest = {
  id: string;
};

export type FriendRequestActionResponse = FriendRequest;

export type FriendsListRequest = {
  page?: number;
  limit?: number;
};

export type FriendsListResponse =
  InfinityPaginationType<FriendRequestWithUsers>;

// Format query params for friend requests
const formatFriendRequestQueryParams = (params: QueryFriendRequestsRequest) => {
  const searchParams = new URLSearchParams();

  if (params.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  return searchParams.toString();
};

// Format query params for friends list
const formatFriendsListQueryParams = (params: FriendsListRequest) => {
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
export const useSendFriendRequestService = createPostService<
  SendFriendRequestRequest,
  SendFriendRequestResponse
>("/v1/friends/requests");

export const useGetSentFriendRequestsService = createGetService<
  QueryFriendRequestsResponse,
  void,
  QueryFriendRequestsRequest
>("/v1/friends/requests/sent", {
  formatQueryParams: formatFriendRequestQueryParams,
});

export const useGetReceivedFriendRequestsService = createGetService<
  QueryFriendRequestsResponse,
  void,
  QueryFriendRequestsRequest
>("/v1/friends/requests/received", {
  formatQueryParams: formatFriendRequestQueryParams,
});

export const useAcceptFriendRequestService = createPatchService<
  void,
  FriendRequestActionResponse,
  FriendRequestActionRequest
>((params) => `/v1/friends/requests/${params.id}/accept`);

export const useRejectFriendRequestService = createPatchService<
  void,
  FriendRequestActionResponse,
  FriendRequestActionRequest
>((params) => `/v1/friends/requests/${params.id}/reject`);

export const useCancelFriendRequestService = createDeleteService<
  void,
  FriendRequestActionRequest
>((params) => `/v1/friends/requests/${params.id}`);

export const useGetFriendsListService = createGetService<
  FriendsListResponse,
  void,
  FriendsListRequest
>("/v1/friends/list", {
  formatQueryParams: formatFriendsListQueryParams,
});

export const useGetFriendRequestByIdService = createGetService<
  FriendRequestWithUsers,
  { id: string }
>((params) => `/v1/friends/requests/${params.id}`);

// User search for adding friends
export type UserSearchRequest = {
  search?: string;
  page?: number;
  limit?: number;
};

export type UserSearchResponse = InfinityPaginationType<User>;

const formatUserSearchParams = (params: UserSearchRequest) => {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.append("search", params.search);
  }
  if (params.page) {
    searchParams.append("page", params.page.toString());
  }
  if (params.limit) {
    searchParams.append("limit", params.limit.toString());
  }

  return searchParams.toString();
};

export const useSearchUsersService = createGetService<
  UserSearchResponse,
  void,
  UserSearchRequest
>("/v1/friends/search", {
  formatQueryParams: formatUserSearchParams,
});

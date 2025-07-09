import { User } from "./user";

export enum FriendRequestStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export type FriendRequest = {
  id: string;
  requesterId: string;
  recipientId: string;
  status: FriendRequestStatus;
  statusChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Populated fields
  requester?: User;
  recipient?: User;
};

export type FriendRequestWithUsers = FriendRequest & {
  requester: User;
  recipient: User;
};

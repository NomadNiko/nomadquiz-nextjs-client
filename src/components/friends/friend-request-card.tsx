"use client";

import { useState } from "react";
import { Card, Group, Text, Button, Avatar, Badge, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import {
  FriendRequestWithUsers,
  FriendRequestStatus,
} from "@/services/api/types/friend-request";
import {
  useAcceptFriendRequestService,
  useRejectFriendRequestService,
  useCancelFriendRequestService,
} from "@/services/api/services/friends";
import { ApiError } from "@/services/api/types/api-error";

interface FriendRequestCardProps {
  request: FriendRequestWithUsers;
  type: "sent" | "received";
  onUpdate?: () => void;
}

export function FriendRequestCard({
  request,
  type,
  onUpdate,
}: FriendRequestCardProps) {
  const { t } = useTranslation(["friends", "common"]);
  const [loading, setLoading] = useState(false);

  const acceptRequest = useAcceptFriendRequestService();
  const rejectRequest = useRejectFriendRequestService();
  const cancelRequest = useCancelFriendRequestService();

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptRequest(undefined, { id: request.id });
      notifications.show({
        title: t("common:success"),
        message: t("friends:messages.requestAccepted"),
        color: "green",
      });
      onUpdate?.();
    } catch (err: unknown) {
      const error = err as ApiError;
      notifications.show({
        title: t("common:error"),
        message:
          error?.response?.data?.message || error?.message || t("common:error"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectRequest(undefined, { id: request.id });
      notifications.show({
        title: t("common:success"),
        message: t("friends:messages.requestRejected"),
        color: "green",
      });
      onUpdate?.();
    } catch (err: unknown) {
      const error = err as ApiError;
      notifications.show({
        title: t("common:error"),
        message:
          error?.response?.data?.message || error?.message || t("common:error"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setLoading(true);
    try {
      await cancelRequest({ id: request.id });
      notifications.show({
        title: t("common:success"),
        message: t("friends:messages.requestCancelled"),
        color: "green",
      });
      onUpdate?.();
    } catch (err: unknown) {
      const error = err as ApiError;
      notifications.show({
        title: t("common:error"),
        message:
          error?.response?.data?.message || error?.message || t("common:error"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: FriendRequestStatus) => {
    switch (status) {
      case FriendRequestStatus.PENDING:
        return "yellow";
      case FriendRequestStatus.ACCEPTED:
        return "green";
      case FriendRequestStatus.REJECTED:
        return "red";
      case FriendRequestStatus.CANCELLED:
        return "gray";
      default:
        return "gray";
    }
  };

  const displayUser = type === "sent" ? request.recipient : request.requester;

  return (
    <Card withBorder padding="md">
      <Group align="flex-start">
        <Avatar src={displayUser.photo?.path} size="md" radius="xl" />

        <Stack style={{ flex: 1 }} gap="xs">
          <Group>
            <Text size="sm" fw={500}>
              {displayUser.firstName} {displayUser.lastName}
            </Text>
            <Badge
              color={getStatusColor(request.status)}
              variant="light"
              size="sm"
            >
              {t(`status.${request.status}`)}
            </Badge>
          </Group>

          <Text size="xs" c="dimmed">
            @{displayUser.username}
          </Text>

          <Text size="xs" c="dimmed">
            {new Date(request.createdAt).toLocaleDateString()}
          </Text>
        </Stack>

        {request.status === FriendRequestStatus.PENDING && (
          <Group gap="xs">
            {type === "received" ? (
              <>
                <Button
                  size="xs"
                  color="green"
                  onClick={handleAccept}
                  loading={loading}
                >
                  {t("actions.accept")}
                </Button>
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={handleReject}
                  loading={loading}
                >
                  {t("actions.reject")}
                </Button>
              </>
            ) : (
              <Button
                size="xs"
                color="gray"
                variant="light"
                onClick={handleCancel}
                loading={loading}
              >
                {t("actions.cancel")}
              </Button>
            )}
          </Group>
        )}
      </Group>
    </Card>
  );
}

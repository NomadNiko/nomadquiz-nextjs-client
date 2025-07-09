"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Stack,
  Text,
  Button,
  Group,
  Card,
  Avatar,
  Pagination,
  Center,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { User } from "@/services/api/types/user";
import { FriendRequestWithUsers } from "@/services/api/types/friend-request";
import { useGetFriendsListService } from "@/services/api/services/friends";
import useAuth from "@/services/auth/use-auth";
import { ApiError } from "@/services/api/types/api-error";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

interface FriendsListProps {
  refreshTrigger?: number;
}

export function FriendsList({ refreshTrigger }: FriendsListProps) {
  const { t } = useTranslation(["friends", "common"]);
  const { user: currentUser } = useAuth();
  const [friendRequests, setFriendRequests] = useState<
    FriendRequestWithUsers[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setHasNextPage] = useState(false);

  const getFriendsList = useGetFriendsListService();

  const fetchFriends = useCallback(
    async (pageNum: number = page) => {
      setLoading(true);
      try {
        const response = await getFriendsList(undefined, {
          page: pageNum,
          limit: 10,
        });
        if (response.status === HTTP_CODES_ENUM.OK && response.data) {
          setFriendRequests(response.data.data);
          setHasNextPage(response.data.hasNextPage);

          // Calculate total pages based on current page and hasNextPage
          if (response.data.hasNextPage) {
            setTotalPages(pageNum + 1);
          } else {
            setTotalPages(pageNum);
          }
        }
      } catch (err: unknown) {
        const error = err as ApiError;
        notifications.show({
          title: t("common:error"),
          message:
            error?.response?.data?.message ||
            error?.message ||
            t("common:error"),
          color: "red",
        });
      } finally {
        setLoading(false);
      }
    },
    [page, getFriendsList, t]
  );

  useEffect(() => {
    fetchFriends(1);
    setPage(1);
  }, [refreshTrigger, fetchFriends]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchFriends(newPage);
  };

  // Helper function to extract friend data
  const getFriendFromRequest = (
    friendRequest: FriendRequestWithUsers
  ): User | null => {
    if (!currentUser) return null;

    // If current user is the requester, the friend is the recipient
    if (friendRequest.requesterId === currentUser.id) {
      return friendRequest.recipient;
    }
    // If current user is the recipient, the friend is the requester
    else if (friendRequest.recipientId === currentUser.id) {
      return friendRequest.requester;
    }

    return null;
  };

  if (loading && friendRequests.length === 0) {
    return (
      <Center py="xl">
        <Text>{t("common:loading")}</Text>
      </Center>
    );
  }

  if (friendRequests.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">{t("noFriends")}</Text>
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="lg" fw={500}>
          {t("friendsList")}
        </Text>
        <Button
          variant="light"
          size="xs"
          onClick={() => fetchFriends(page)}
          loading={loading}
        >
          {t("common:refresh")}
        </Button>
      </Group>

      <Stack gap="md">
        {friendRequests.map((friendRequest) => {
          const friend = getFriendFromRequest(friendRequest);

          if (!friend) return null;

          return (
            <Card key={friendRequest.id} withBorder padding="md">
              <Group>
                <Avatar src={friend.photo?.path} size="md" radius="xl" />

                <Stack style={{ flex: 1 }} gap={2}>
                  <Text size="sm" fw={500}>
                    {friend.firstName} {friend.lastName}
                  </Text>
                  <Text size="xs" c="dimmed">
                    @{friend.username}
                  </Text>
                </Stack>
              </Group>
            </Card>
          );
        })}
      </Stack>

      {totalPages > 1 && (
        <Center mt="md">
          <Pagination
            value={page}
            onChange={handlePageChange}
            total={totalPages}
            disabled={loading}
          />
        </Center>
      )}
    </Stack>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { Stack, Text, Button, Group, Pagination, Center } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { FriendRequestWithUsers } from "@/services/api/types/friend-request";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import {
  useGetSentFriendRequestsService,
  useGetReceivedFriendRequestsService,
} from "@/services/api/services/friends";
import { ApiError } from "@/services/api/types/api-error";
import { FriendRequestCard } from "./friend-request-card";

interface FriendRequestsListProps {
  type: "sent" | "received";
  refreshTrigger?: number;
}

export function FriendRequestsList({
  type,
  refreshTrigger,
}: FriendRequestsListProps) {
  const { t } = useTranslation(["friends", "common"]);
  const [requests, setRequests] = useState<FriendRequestWithUsers[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [, setHasNextPage] = useState(false);

  const getSentRequests = useGetSentFriendRequestsService();
  const getReceivedRequests = useGetReceivedFriendRequestsService();

  const fetchRequests = useCallback(
    async (pageNum: number = page) => {
      setLoading(true);
      try {
        const service = type === "sent" ? getSentRequests : getReceivedRequests;
        const response = await service(undefined, { page: pageNum, limit: 10 });
        if (response.status === HTTP_CODES_ENUM.OK && response.data) {
          setRequests(response.data.data);
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
    [page, type, getSentRequests, getReceivedRequests, t]
  );

  useEffect(() => {
    fetchRequests(1);
    setPage(1);
  }, [type, refreshTrigger, fetchRequests]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchRequests(newPage);
  };

  const handleUpdate = () => {
    fetchRequests(page);
  };

  if (loading && requests.length === 0) {
    return (
      <Center py="xl">
        <Text>{t("common:loading")}</Text>
      </Center>
    );
  }

  if (requests.length === 0) {
    return (
      <Center py="xl">
        <Text c="dimmed">
          {type === "sent" ? t("noSentRequests") : t("noReceivedRequests")}
        </Text>
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Text size="lg" fw={500}>
          {type === "sent" ? t("sentRequests") : t("receivedRequests")}
        </Text>
        <Button
          variant="light"
          size="xs"
          onClick={() => fetchRequests(page)}
          loading={loading}
        >
          {t("common:refresh")}
        </Button>
      </Group>

      <Stack gap="md">
        {requests.map((request) => (
          <FriendRequestCard
            key={request.id}
            request={request}
            type={type}
            onUpdate={handleUpdate}
          />
        ))}
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

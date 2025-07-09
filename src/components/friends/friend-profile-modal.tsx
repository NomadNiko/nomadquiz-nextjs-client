"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Avatar,
  Text,
  Button,
  Stack,
  Group,
  Card,
  Badge,
  Divider,
  ScrollArea,
  Table,
  Center,
  Loader,
} from "@mantine/core";
import { IconUserPlus, IconTrophy, IconCalendar } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { User } from "@/services/api/types/user";
import { useSendFriendRequestService } from "@/services/api/services/friends";
import {
  useGetUserLeaderboardEntriesService,
  LeaderboardEntry,
} from "@/services/api/services/leaderboards";
import useAuth from "@/services/auth/use-auth";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

interface FriendProfileModalProps {
  user: User | null;
  opened: boolean;
  onClose: () => void;
  onFriendRequestSent?: () => void;
  existingFriendIds?: string[];
  pendingRequestUserIds?: string[];
}

export function FriendProfileModal({
  user,
  opened,
  onClose,
  onFriendRequestSent,
  existingFriendIds = [],
  pendingRequestUserIds = [],
}: FriendProfileModalProps) {
  const { t } = useTranslation(["friends", "common"]);
  const { user: currentUser } = useAuth();
  const [sendingRequest, setSendingRequest] = useState(false);
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [loadingScores, setLoadingScores] = useState(false);

  const sendFriendRequest = useSendFriendRequestService();
  const getUserEntries = useGetUserLeaderboardEntriesService();

  const loadUserScores = useCallback(async () => {
    if (!user?.username) return;

    setLoadingScores(true);
    try {
      const response = await getUserEntries(
        { username: user.username },
        { page: 1, limit: 10 }
      );

      if (response.status === HTTP_CODES_ENUM.OK && response.data) {
        setLeaderboardEntries(response.data.data || []);
      }
    } catch (error) {
      console.error("Error loading user scores:", error);
    } finally {
      setLoadingScores(false);
    }
  }, [user?.username, getUserEntries]);

  // Load user's leaderboard entries when modal opens
  useEffect(() => {
    if (opened && user && user.username) {
      loadUserScores();
    }
  }, [opened, user, loadUserScores]);

  const handleSendRequest = async () => {
    if (!user?.username) {
      notifications.show({
        title: t("common:error"),
        message: t("friends:messages.noUsername"),
        color: "red",
      });
      return;
    }

    setSendingRequest(true);
    try {
      await sendFriendRequest({ recipientUsername: user.username });

      notifications.show({
        title: t("common:success"),
        message: t("friends:messages.requestSent"),
        color: "green",
      });

      onFriendRequestSent?.();
      onClose();
    } catch (error) {
      const err = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };

      notifications.show({
        title: t("common:error"),
        message:
          err?.response?.data?.message || err?.message || t("common:error"),
        color: "red",
      });
    } finally {
      setSendingRequest(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const getRelationshipStatus = () => {
    if (!user) return null;

    if (user.id === currentUser?.id) {
      return { text: t("friends:profile.itsYou"), color: "blue" };
    }

    if (existingFriendIds.includes(user.id)) {
      return { text: t("friends:profile.alreadyFriends"), color: "green" };
    }

    if (pendingRequestUserIds.includes(user.id)) {
      return { text: t("friends:profile.requestPending"), color: "yellow" };
    }

    return null;
  };

  const relationshipStatus = getRelationshipStatus();
  const canSendRequest = !relationshipStatus && user?.id !== currentUser?.id;

  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={t("friends:profile.title")}
      size="md"
      centered
    >
      <Stack gap="lg">
        {/* User Header */}
        <Card withBorder padding="lg">
          <Stack gap="md" align="center">
            <Avatar src={user.photo?.path} size="xl" radius="xl" />
            <Stack gap="xs" align="center">
              <Text size="xl" fw={600}>
                {user.firstName} {user.lastName}
              </Text>
              <Text size="sm" c="dimmed">
                @{user.username}
              </Text>
              {relationshipStatus && (
                <Badge color={relationshipStatus.color} variant="light">
                  {relationshipStatus.text}
                </Badge>
              )}
            </Stack>

            {canSendRequest && (
              <Button
                leftSection={<IconUserPlus size={16} />}
                onClick={handleSendRequest}
                loading={sendingRequest}
                variant="filled"
              >
                {t("friends:addFriend")}
              </Button>
            )}
          </Stack>
        </Card>

        <Divider />

        {/* Leaderboard Scores */}
        <Card withBorder padding="lg">
          <Stack gap="md">
            <Group>
              <IconTrophy size={20} />
              <Text size="lg" fw={500}>
                {t("friends:profile.highscores")}
              </Text>
            </Group>

            {loadingScores ? (
              <Center py="xl">
                <Loader size="sm" />
              </Center>
            ) : leaderboardEntries.length > 0 ? (
              <ScrollArea style={{ maxHeight: 300 }}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t("friends:profile.leaderboard")}</Table.Th>
                      <Table.Th>{t("friends:profile.score")}</Table.Th>
                      <Table.Th>{t("friends:profile.date")}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {leaderboardEntries.map((entry, index) => (
                      <Table.Tr key={index}>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {entry.leaderboardId}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconTrophy size={14} color="gold" />
                            <Text size="sm" fw={600}>
                              {entry.score.toLocaleString()}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <IconCalendar size={14} />
                            <Text size="sm" c="dimmed">
                              {formatDate(entry.timestamp)}
                            </Text>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            ) : (
              <Center py="xl">
                <Stack align="center" gap="xs">
                  <IconTrophy size={48} color="var(--mantine-color-gray-5)" />
                  <Text size="sm" c="dimmed">
                    {t("friends:profile.noScores")}
                  </Text>
                </Stack>
              </Center>
            )}
          </Stack>
        </Card>
      </Stack>
    </Modal>
  );
}

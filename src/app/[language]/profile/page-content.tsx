"use client";
import useAuth from "@/services/auth/use-auth";
import {
  Container,
  Stack,
  Avatar,
  Card,
  Group,
  Text,
  Button,
  ScrollArea,
  Table,
  Center,
  Loader,
  Badge,
  Grid,
} from "@mantine/core";
import {
  IconTrophy,
  IconCalendar,
  IconUsers,
  IconEdit,
} from "@tabler/icons-react";
import Link from "@/components/link";
import { useTranslation } from "@/services/i18n/client";
import RouteGuard from "@/services/auth/route-guard";
import { useEffect, useState, useCallback } from "react";
import useGlobalLoading from "@/services/loading/use-global-loading";
import {
  useGetUserLeaderboardEntriesService,
  LeaderboardEntry,
} from "@/services/api/services/leaderboards";
import { useGetFriendsListService } from "@/services/api/services/friends";
import { FriendProfileModal } from "@/components/friends/friend-profile-modal";
import { User } from "@/services/api/types/user";
import { FriendRequestWithUsers } from "@/services/api/types/friend-request";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation("profile");
  const { t: tFriends } = useTranslation("friends");
  const { setLoading } = useGlobalLoading();
  const [leaderboardEntries, setLeaderboardEntries] = useState<
    LeaderboardEntry[]
  >([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const getUserEntries = useGetUserLeaderboardEntriesService();
  const getFriendsList = useGetFriendsListService();

  // Turn off loading indicator when component mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

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

  const loadFriendsList = useCallback(async () => {
    setLoadingFriends(true);
    try {
      const response = await getFriendsList(undefined, {
        page: 1,
        limit: 50,
      });

      if (response.status === HTTP_CODES_ENUM.OK && response.data) {
        const friendsData = response.data.data
          .map((friendRequest: FriendRequestWithUsers) => {
            // Extract the friend (the other person in the friendship)
            if (friendRequest.requester?.id === user?.id) {
              return friendRequest.recipient;
            } else {
              return friendRequest.requester;
            }
          })
          .filter(Boolean) as User[];
        setFriends(friendsData);
      }
    } catch (error) {
      console.error("Error loading friends:", error);
    } finally {
      setLoadingFriends(false);
    }
  }, [getFriendsList, user?.id]);

  useEffect(() => {
    if (user) {
      loadUserScores();
      loadFriendsList();
    }
  }, [user, loadUserScores, loadFriendsList]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const handleFriendClick = (friend: User) => {
    setSelectedFriend(friend);
    setProfileModalOpen(true);
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
    setSelectedFriend(null);
  };

  const handleFriendRequestSent = () => {
    // Refresh friends list after sending request
    loadFriendsList();
  };

  if (!user) return null;

  return (
    <Container size="lg">
      <Stack gap="lg" py="md">
        {/* User Header */}
        <Card withBorder padding="lg">
          <Stack gap="md" align="center">
            <Avatar
              src={user.photo?.path}
              size="xl"
              radius="xl"
              alt={user.firstName + " " + user.lastName}
              data-testid="user-icon"
            />
            <Stack gap="xs" align="center">
              <Text size="xl" fw={600} data-testid="user-name">
                {user.firstName} {user.lastName}
              </Text>
              <Text size="sm" c="dimmed" data-testid="user-username">
                @{user.username || "no-username"}
              </Text>
              <Text size="sm" c="dimmed" data-testid="user-email">
                {user.email}
              </Text>
            </Stack>

            <Button
              leftSection={<IconEdit size={16} />}
              component={Link}
              href="/profile/edit"
              data-testid="edit-profile"
              variant="filled"
            >
              {t("actions.edit")}
            </Button>
          </Stack>
        </Card>

        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            {/* Leaderboard Scores */}
            <Card withBorder padding="lg" h="100%">
              <Stack gap="md">
                <Group>
                  <IconTrophy size={20} />
                  <Text size="lg" fw={500}>
                    {tFriends("profile.highscores")}
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
                          <Table.Th>{tFriends("profile.leaderboard")}</Table.Th>
                          <Table.Th>{tFriends("profile.score")}</Table.Th>
                          <Table.Th>{tFriends("profile.date")}</Table.Th>
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
                      <IconTrophy
                        size={48}
                        color="var(--mantine-color-gray-5)"
                      />
                      <Text size="sm" c="dimmed">
                        {tFriends("profile.noScores")}
                      </Text>
                    </Stack>
                  </Center>
                )}
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            {/* Friends List */}
            <Card withBorder padding="lg" h="100%">
              <Stack gap="md">
                <Group>
                  <IconUsers size={20} />
                  <Text size="lg" fw={500}>
                    {tFriends("friendsList")}
                  </Text>
                  <Badge variant="light" size="sm">
                    {friends.length}
                  </Badge>
                </Group>

                {loadingFriends ? (
                  <Center py="xl">
                    <Loader size="sm" />
                  </Center>
                ) : friends.length > 0 ? (
                  <ScrollArea style={{ maxHeight: 300 }}>
                    <Stack gap="xs">
                      {friends.map((friend) => (
                        <Card
                          key={friend.id}
                          padding="sm"
                          style={{
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "var(--mantine-color-gray-0)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                          onClick={() => handleFriendClick(friend)}
                        >
                          <Group>
                            <Avatar
                              src={friend.photo?.path}
                              size="sm"
                              radius="xl"
                            />
                            <div>
                              <Text size="sm" fw={500}>
                                {friend.firstName} {friend.lastName}
                              </Text>
                              <Text size="xs" c="dimmed">
                                @{friend.username}
                              </Text>
                            </div>
                          </Group>
                        </Card>
                      ))}
                    </Stack>
                  </ScrollArea>
                ) : (
                  <Center py="xl">
                    <Stack align="center" gap="xs">
                      <IconUsers
                        size={48}
                        color="var(--mantine-color-gray-5)"
                      />
                      <Text size="sm" c="dimmed">
                        {tFriends("noFriends")}
                      </Text>
                    </Stack>
                  </Center>
                )}
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>

        <FriendProfileModal
          user={selectedFriend}
          opened={profileModalOpen}
          onClose={handleProfileModalClose}
          onFriendRequestSent={handleFriendRequestSent}
          existingFriendIds={friends.map((f) => f.id)}
          pendingRequestUserIds={[]}
        />
      </Stack>
    </Container>
  );
}

function ProfilePage() {
  return (
    <RouteGuard>
      <Profile />
    </RouteGuard>
  );
}

export default ProfilePage;

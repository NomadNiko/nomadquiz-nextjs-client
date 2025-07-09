"use client";

import { useState, useEffect } from "react";
import { Container, Tabs, Title, Stack, Card } from "@mantine/core";
import {
  IconUserPlus,
  IconUserCheck,
  IconUsers,
  IconMail,
} from "@tabler/icons-react";
import { useTranslation } from "@/services/i18n/client";
import RouteGuard from "@/services/auth/route-guard";
import useGlobalLoading from "@/services/loading/use-global-loading";
import { UserSearchAutocomplete } from "@/components/friends/user-search-autocomplete";
import { FriendRequestsList } from "@/components/friends/friend-requests-list";
import { FriendsList } from "@/components/friends/friends-list";
import {
  useGetSentFriendRequestsService,
  useGetReceivedFriendRequestsService,
  useGetFriendsListService,
} from "@/services/api/services/friends";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";

function Friends() {
  const { t } = useTranslation("friends");
  const { setLoading } = useGlobalLoading();
  const [activeTab, setActiveTab] = useState<string>("search");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [existingFriendIds, setExistingFriendIds] = useState<string[]>([]);
  const [pendingRequestUserIds, setPendingRequestUserIds] = useState<string[]>(
    []
  );

  const getSentRequests = useGetSentFriendRequestsService();
  const getReceivedRequests = useGetReceivedFriendRequestsService();
  const getFriendsList = useGetFriendsListService();

  // Turn off loading indicator when component mounts
  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  // Fetch existing friends and pending requests to filter search results
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch friends
        const friendsResponse = await getFriendsList(undefined, {
          page: 1,
          limit: 100,
        });
        if (
          friendsResponse.status === HTTP_CODES_ENUM.OK &&
          friendsResponse.data
        ) {
          const friendIds = friendsResponse.data.data
            .map((friendRequest) => {
              // Extract the friend ID from the request (could be requester or recipient)
              return friendRequest.requester?.id || friendRequest.recipient?.id;
            })
            .filter(Boolean);
          setExistingFriendIds(friendIds);
        }

        // Fetch sent requests
        const sentResponse = await getSentRequests(undefined, {
          page: 1,
          limit: 100,
        });
        if (sentResponse.status === HTTP_CODES_ENUM.OK && sentResponse.data) {
          const sentIds = sentResponse.data.data
            .map((req) => req.recipient?.id)
            .filter(Boolean);

          // Fetch received requests
          const receivedResponse = await getReceivedRequests(undefined, {
            page: 1,
            limit: 100,
          });
          if (
            receivedResponse.status === HTTP_CODES_ENUM.OK &&
            receivedResponse.data
          ) {
            const receivedIds = receivedResponse.data.data
              .map((req) => req.requester?.id)
              .filter(Boolean);
            setPendingRequestUserIds([...sentIds, ...receivedIds]);
          } else {
            setPendingRequestUserIds(sentIds);
          }
        }
      } catch (error) {
        console.error("Error fetching friend data:", error);
      }
    };

    fetchData();
  }, [refreshTrigger, getFriendsList, getSentRequests, getReceivedRequests]);

  const handleRequestSent = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleTabChange = (value: string | null) => {
    if (value) {
      setActiveTab(value);
    }
  };

  return (
    <Container size="lg">
      <Stack gap="lg" py="md">
        <Title order={2}>{t("title")}</Title>

        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tabs.List>
            <Tabs.Tab value="search" leftSection={<IconUserPlus size={16} />}>
              {t("searchUsers")}
            </Tabs.Tab>
            <Tabs.Tab value="friends" leftSection={<IconUsers size={16} />}>
              {t("friendsList")}
            </Tabs.Tab>
            <Tabs.Tab value="received" leftSection={<IconMail size={16} />}>
              {t("receivedRequests")}
            </Tabs.Tab>
            <Tabs.Tab value="sent" leftSection={<IconUserCheck size={16} />}>
              {t("sentRequests")}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search" pt="md">
            <Card withBorder padding="md">
              <UserSearchAutocomplete
                onRequestSent={handleRequestSent}
                existingFriendIds={existingFriendIds}
                pendingRequestUserIds={pendingRequestUserIds}
              />
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="friends" pt="md">
            <Card withBorder padding="md">
              <FriendsList refreshTrigger={refreshTrigger} />
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="received" pt="md">
            <Card withBorder padding="md">
              <FriendRequestsList
                type="received"
                refreshTrigger={refreshTrigger}
              />
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="sent" pt="md">
            <Card withBorder padding="md">
              <FriendRequestsList type="sent" refreshTrigger={refreshTrigger} />
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}

function FriendsPage() {
  return (
    <RouteGuard>
      <Friends />
    </RouteGuard>
  );
}

export default FriendsPage;

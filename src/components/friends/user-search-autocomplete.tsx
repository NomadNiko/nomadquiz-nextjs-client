"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TextInput,
  Button,
  Stack,
  Text,
  Card,
  Group,
  Avatar,
  Loader,
  ActionIcon,
  ScrollArea,
  Portal,
} from "@mantine/core";
import { IconSearch, IconUserPlus, IconX } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import { notifications } from "@mantine/notifications";
import { useDebouncedValue } from "@mantine/hooks";
import { User } from "@/services/api/types/user";
import {
  useSearchUsersService,
  useSendFriendRequestService,
} from "@/services/api/services/friends";
import useAuth from "@/services/auth/use-auth";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { FriendProfileModal } from "./friend-profile-modal";

interface UserSearchAutocompleteProps {
  onRequestSent?: () => void;
  existingFriendIds?: string[];
  pendingRequestUserIds?: string[];
}

export function UserSearchAutocomplete({
  onRequestSent,
  existingFriendIds = [],
  pendingRequestUserIds = [],
}: UserSearchAutocompleteProps) {
  const { t } = useTranslation(["friends", "common"]);
  const { user: currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch] = useDebouncedValue(searchQuery, 300);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchUsers = useSearchUsersService();
  const sendFriendRequest = useSendFriendRequestService();

  const performSearch = useCallback(async () => {
    if (!debouncedSearch.trim() || debouncedSearch.length < 2) {
      setUsers([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await searchUsers(undefined, {
        search: debouncedSearch,
        page: 1,
        limit: 10,
      });

      if (response.status === HTTP_CODES_ENUM.OK && response.data) {
        // Filter out current user, existing friends, and pending requests
        const filteredUsers = response.data.data.filter(
          (user) =>
            user.id !== currentUser?.id &&
            !existingFriendIds.includes(user.id) &&
            !pendingRequestUserIds.includes(user.id)
        );
        setUsers(filteredUsers);
        updateDropdownPosition();
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Search error:", error);
      notifications.show({
        title: t("common:error"),
        message: t("friends:messages.searchError"),
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  }, [
    debouncedSearch,
    searchUsers,
    currentUser,
    existingFriendIds,
    pendingRequestUserIds,
    t,
  ]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  useEffect(() => {
    const handleScroll = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    const handleResize = () => {
      if (showDropdown) {
        updateDropdownPosition();
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [showDropdown]);

  const handleSendRequest = async (user: User) => {
    if (!user.username) {
      notifications.show({
        title: t("common:error"),
        message: t("friends:messages.noUsername"),
        color: "red",
      });
      return;
    }

    setSendingTo(user.id);
    try {
      await sendFriendRequest({ recipientUsername: user.username });

      notifications.show({
        title: t("common:success"),
        message: t("friends:messages.requestSent"),
        color: "green",
      });

      // Remove user from search results
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setSearchQuery("");
      setShowDropdown(false);

      onRequestSent?.();
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
      setSendingTo(null);
    }
  };

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setUsers([]);
    setShowDropdown(false);
  };

  const handleFocus = () => {
    if (users.length > 0) {
      updateDropdownPosition();
      setShowDropdown(true);
    }
  };

  const handleUserClick = (user: User) => {
    setSelectedUser(user);
    setProfileModalOpen(true);
    setShowDropdown(false);
  };

  const handleProfileModalClose = () => {
    setProfileModalOpen(false);
    setSelectedUser(null);
  };

  const handleFriendRequestSentFromModal = () => {
    // Remove user from search results
    if (selectedUser) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    }
    setSearchQuery("");
    setShowDropdown(false);
    onRequestSent?.();
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <TextInput
        ref={inputRef}
        placeholder={t("friends:searchPlaceholder")}
        leftSection={<IconSearch size={16} />}
        rightSection={
          <Group gap={4}>
            {loading && <Loader size={16} />}
            {searchQuery && (
              <ActionIcon
                size={16}
                variant="subtle"
                onClick={handleClearSearch}
              >
                <IconX size={12} />
              </ActionIcon>
            )}
          </Group>
        }
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.currentTarget.value)}
        onFocus={handleFocus}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />

      <Portal>
        {showDropdown && users.length > 0 && (
          <Card
            style={{
              position: "fixed",
              top: dropdownPosition.top + 4,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              zIndex: 1000,
              maxHeight: "300px",
            }}
            withBorder
            shadow="md"
          >
            <ScrollArea style={{ maxHeight: "280px" }}>
              <Stack gap="xs">
                {users.map((user) => (
                  <Card
                    key={user.id}
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
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                    onClick={() => handleUserClick(user)}
                  >
                    <Group justify="space-between">
                      <Group>
                        <Avatar src={user.photo?.path} size="sm" radius="xl" />
                        <div>
                          <Text size="sm" fw={500}>
                            {user.firstName} {user.lastName}
                          </Text>
                          <Text size="xs" c="dimmed">
                            @{user.username}
                          </Text>
                        </div>
                      </Group>

                      <Button
                        size="xs"
                        variant="light"
                        leftSection={<IconUserPlus size={14} />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendRequest(user);
                        }}
                        loading={sendingTo === user.id}
                      >
                        {t("friends:addFriend")}
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </ScrollArea>
          </Card>
        )}

        {showDropdown &&
          users.length === 0 &&
          !loading &&
          searchQuery.length >= 2 && (
            <Card
              style={{
                position: "fixed",
                top: dropdownPosition.top + 4,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                zIndex: 1000,
              }}
              withBorder
              shadow="md"
            >
              <Text size="sm" c="dimmed" ta="center" py="md">
                {t("friends:noUsersFound")}
              </Text>
            </Card>
          )}
      </Portal>

      <FriendProfileModal
        user={selectedUser}
        opened={profileModalOpen}
        onClose={handleProfileModalClose}
        onFriendRequestSent={handleFriendRequestSentFromModal}
        existingFriendIds={existingFriendIds}
        pendingRequestUserIds={pendingRequestUserIds}
      />
    </div>
  );
}

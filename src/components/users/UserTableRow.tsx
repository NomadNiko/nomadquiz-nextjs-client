// src/components/users/UserTableRow.tsx
import { Avatar, Popover, Text } from "@mantine/core"; // Import Avatar directly from Mantine
import { User } from "@/services/api/types/user";
import { useTranslation } from "@/services/i18n/client";
import { Box, useMantineColorScheme } from "@mantine/core";
import UserActions from "./UserActions";

interface UserTableRowProps {
  user: User;
}

function UserTableRow({ user }: UserTableRowProps) {
  const { t: tRoles } = useTranslation("admin-panel-roles");
  const { colorScheme } = useMantineColorScheme();

  // Use the correct colorScheme from hook
  const shadowColor =
    colorScheme === "dark"
      ? "rgba(114, 180, 255, 0.4)" // Light blue for dark mode
      : "rgba(0, 100, 255, 0.4)"; // Darker blue for light mode

  return (
    <>
      <td style={{ width: 60, textAlign: "left" }}>
        <Box p="xs">
          <Avatar
            alt={user?.firstName + " " + user?.lastName}
            src={user?.photo?.path}
            size="md"
            style={{
              margin: "2px",
              boxShadow: `0 0 10px ${shadowColor}`,
            }}
          />
        </Box>
      </td>
      <td
        style={{
          width: 120,
          textAlign: "left",
          wordBreak: "break-word",
          maxWidth: "120px",
        }}
      >
        <div
          style={{
            maxWidth: "120px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.username || "-"}
        </div>
      </td>
      <td
        style={{
          width: 150,
          textAlign: "left",
          wordBreak: "break-word",
          maxWidth: "150px",
        }}
      >
        <div
          style={{
            maxWidth: "150px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {user?.firstName} {user?.lastName}
        </div>
      </td>
      <td
        style={{
          width: 180,
          textAlign: "left",
          maxWidth: "180px",
        }}
      >
        <Popover width="max-content" position="bottom" withArrow shadow="md">
          <Popover.Target>
            <div
              style={{
                maxWidth: "180px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
              }}
            >
              {user?.email}
            </div>
          </Popover.Target>
          <Popover.Dropdown>
            <Text size="sm" ta="center" style={{ whiteSpace: "nowrap" }}>
              {user?.email}
            </Text>
          </Popover.Dropdown>
        </Popover>
      </td>
      <td
        style={{
          width: 100,
          textAlign: "left",
          wordBreak: "break-word",
          maxWidth: "100px",
        }}
      >
        <div
          style={{
            maxWidth: "100px",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tRoles(`role.${user?.role?.id}`)}
        </div>
      </td>
      <td style={{ width: 375, textAlign: "right" }}>
        {user && <UserActions user={user} />}
      </td>
    </>
  );
}

export default UserTableRow;

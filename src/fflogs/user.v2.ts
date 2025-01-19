import { client } from "./client";

const currentUserQuery = `
query UserData {
  userData {
    currentUser {
      id
      name
      guilds {
        id
        name
        type
      }
    }
  }
}
`;

type CurrentUser = {
  userData: {
    currentUser: User
  }
};

export type User = {
  id: number,
  name: string,
  guilds: Guild[]
};
export type Guild = {
  id: number,
  name: string,
  type: number
};

export async function fetchCurrentUser() {
  const raw: CurrentUser = await client.request(currentUserQuery);
  return raw.userData.currentUser;
}
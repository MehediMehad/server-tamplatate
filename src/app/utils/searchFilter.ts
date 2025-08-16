export const searchFilter = (search: string | null) => {
  if (!search) {
    return undefined;
  }

  return {
    createdAt: { contains: search, mode: "insensitive" },
  };
};

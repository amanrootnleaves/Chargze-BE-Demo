export const Read = async (parent, args, Context) => {
  const accountId = Context.Account.id;

  const invitations = await Context.DataBase.invitation.findMany({
    where: {
      InvitedBy__fk__: accountId,
      isDeleted: false,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invitations;
};

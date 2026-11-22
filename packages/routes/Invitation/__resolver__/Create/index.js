export const Create = async (__, { input }, Context) => {
  const { phoneNumber, friendName } = input;
  const accountId = Context.Session.getAccountId();

  const invitation = await Context.DataBase.invitation.create({
    data: {
      phoneNumber,
      friendName,
      InvitedBy__fk__: accountId,
      status: "PENDING",
    },
  });

  const invitationLink = `https://www.chargze.com/invite?ref=${accountId}`;

  return {
    ...invitation,
    invitationLink,
  };
};

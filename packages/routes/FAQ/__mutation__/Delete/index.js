export default async (__, { id }, Context) => {
  const _functionName = "Routes -> FAQ -> Mutation -> DeleteFAQ";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: `Deleting FAQ with id: ${id}`,
        },
        _functionName,
      );

      const faq = await Context.DataBase.faq.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!faq) {
        throw new Error("FAQ_NOT_FOUND");
      }

      const deletedFaq = await Context.DataBase.faq.delete({
        where: {
          id,
        },
      });

      await Context.Debug(
        {
          message: "FAQ deleted successfully.",
          faqId: id,
        },
        _functionName,
      );

      return {
        id: deletedFaq.id,
        isDeleted: true,
      };
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while deleting FAQ.",
        error: error.message,
      },
      _functionName,
    );

    throw error;
  }
};
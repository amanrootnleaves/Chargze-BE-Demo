export default async (__, { input }, Context) => {
  const _functionName = "Routes -> FAQ -> Mutation -> UpdateFAQ";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Updating FAQ.",
          input,
        },
        _functionName,
      );

      const {
        id,
        question,
        answer,
        isActive,
        category,
        displayOrder,
      } = input;

      const faq = await Context.DataBase.faq.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!faq) {
        throw new Error("FAQ_NOT_FOUND");
      }

      const updatedFAQ = await Context.DataBase.faq.update({
        where: {
          id,
        },
        data: {
          ...(question !== undefined && { question }),
          ...(answer !== undefined && { answer }),
          ...(isActive !== undefined && { isActive }),
          ...(category !== undefined && { category }),
          ...(displayOrder !== undefined && { displayOrder }),
        },
      });

      await Context.Debug(
        {
          message: "FAQ updated successfully.",
          faqId: updatedFAQ.id,
        },
        _functionName,
      );

      return updatedFAQ;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while updating FAQ.",
        error: error.message,
      },
      _functionName,
    );

    throw error;
  }
};
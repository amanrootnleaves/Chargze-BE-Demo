export default async (__, { input }, Context) => {
  const _functionName = "Routes -> FAQ -> Mutation -> CreateFAQ";

  try {
    if (Context && Context.isContext) {
      await Context.Debug(
        {
          message: "Creating FAQ.",
          input,
        },
        _functionName
      );
      const faq = await Context.DataBase.faq.create({
        data: {
          ...input
        },
      });

      await Context.Debug(
        {
          message: "FAQ created successfully.",
          faqId: faq.id,
        },
        _functionName
      );

      return faq;
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    await Context.Debug(
      {
        message: "Error while creating FAQ.",
        error: error.message,
      },
      _functionName
    );

    throw error;
  }
};
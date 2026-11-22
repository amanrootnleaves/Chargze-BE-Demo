
export default async (__, { phoneNumber }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Account -> ResendOTP";

      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiry = new Date(Date.now() + 10 * 60000);

      console.log(`[ResendOTP] Regenerating OTP for ${phoneNumber}: ${otpCode}`);

      let account = await Context.DataBase.account.findFirst({
        where: { phoneNumber },
      });

      if (!account) {
        // This shouldn't typically happen for Resend, but we'll handle it nicely
        account = await Context.DataBase.account.create({
          data: {
            phoneNumber: phoneNumber,
            verificationToken: otpCode,
            verificationTokenExpiry: expiry,
            isActive: false, 
            displayName: `User_${phoneNumber.substring(phoneNumber.length - 4)}`,
          },
        });
      } else {
        account = await Context.DataBase.account.update({
          where: { id: account.id },
          data: {
            verificationToken: otpCode,
            verificationTokenExpiry: expiry,
          },
        });
      }

      const accountSid = process.env.TWILIO_SID;
      const authToken = process.env.TWILIO_AUTH;
      const twilioPhone = process.env.TWILIO_PHONE;

      if (!accountSid || !authToken || !twilioPhone) {
        console.warn(`[ResendOTP] Twilio credentials missing. BYPASSING Twilio for development. OTP: ${otpCode}`);
        return {
          message: `OTP regenerated (Dev Bypass). Check server console.`,
          request_id: "dev-bypass-resend",
          type: "success",
        };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader =
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : "+" + phoneNumber;

      const params = new URLSearchParams();
      params.append("To", formattedPhoneNumber);
      params.append("From", twilioPhone);
      params.append("Body", `Your NEW Chargze verification code is: ${otpCode}`);

      const options = {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      };

      const response = await fetch(url, options);
      const jsonResponse = await response.json();

      if (response.ok) {
         return {
          message: `OTP resent successfully.`,
          request_id: jsonResponse.sid,
          type: "success",
        };
      } else {
        console.error(`[ResendOTP] Twilio failure:`, jsonResponse);
        return {
           message: `Twilio failed but OTP regenerated in DB: ${otpCode}`,
           request_id: "dev-failure-bypass-resend",
           type: "success"
        };
      }
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    console.error("[ResendOTP] Unexpected Error:", error);
    return error;
  }
};


export default async (__, { phoneNumber }, Context) => {
  try {
    if (Context && Context.isContext) {
      const _functionName = "Routes -> Account -> SendOTP";

      const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
      const expiry = new Date(Date.now() + 10 * 60000);

      console.log(`[SendOTP] Generating OTP for ${phoneNumber}: ${otpCode}`);

      let account = await Context.DataBase.account.findFirst({
        where: { phoneNumber },
      });

      if (!account) {
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

      console.log("[Twilio Debug] SID:", accountSid ? "Present" : "Missing");
      console.log("[Twilio Debug] AUTH:", authToken ? "Present" : "Missing");
      console.log("[Twilio Debug] PHONE:", twilioPhone);

      if (!accountSid || !authToken || !twilioPhone) {
        console.warn(`[SendOTP] Twilio credentials missing. BYPASSING Twilio for development. OTP: ${otpCode}`);
        return {
          message: `OTP generated (Dev Bypass). Check server console.`,
          request_id: "dev-bypass",
          type: "success",
        };
      }

      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader =
        "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const formattedPhoneNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : "+" + phoneNumber;

        console.log("[Twilio Debug] Sending SMS:");
        console.log("To:", formattedPhoneNumber);
        console.log("From:", twilioPhone);
        
      const params = new URLSearchParams();
      params.append("To", formattedPhoneNumber);
      params.append("From", twilioPhone);
      params.append("Body", `Your Chargze verification code is: ${otpCode}`);

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
        console.log("[Twilio Status]:", response.status);

      if (response.ok) {
        console.log("[Twilio Success] SID:", jsonResponse?.sid);
         return {
          message: `OTP sent successfully.`,
          request_id: jsonResponse.sid,
          type: "success",
        };
      } else {
        console.error(`[SendOTP] Twilio failure:`, jsonResponse);
        return {
           message: `Twilio failed but OTP generated in DB: ${otpCode}`,
           request_id: "dev-failure-bypass",
           type: "success"
        };
      }
    }

    return new Error("MISSING__CONTEXT");
  } catch (error) {
    console.error("[SendOTP] Unexpected Error:", error);
      return {
        message: `Network error while sending OTP`,
        request_id: "network-error",
        type: "error",
  };
  }
};

import nacl from 'tweetnacl';
import bs58 from 'bs58';
import _ from 'underscore';
import { context } from '../context';

export const useSignatureVerification = () => ({
  onExecute: async ({ args }) => {
    try {
      const contextValue = args?.contextValue;
      const request = contextValue?.request;
      
      const signatureHeader = request?.headers?.get?.('x-signature') || contextValue?.reqHeaders?.['x-signature'] || contextValue?.Session?.headers?.['x-signature'];
      const timestampHeader = request?.headers?.get?.('x-timestamp') || contextValue?.reqHeaders?.['x-timestamp'] || contextValue?.Session?.headers?.['x-timestamp'];
      const nonceHeader = request?.headers?.get?.('x-nonce') || contextValue?.reqHeaders?.['x-nonce'] || contextValue?.Session?.headers?.['x-nonce'];
      
      const opName = args?.operationName || contextValue?.params?.operationName || '';
      const queryStr = contextValue?.params?.query || '';
      const isSignup = opName === 'AccountRegisterWithEmail' || opName?.includes('Register') || opName === 'AccountVerifyOTPMutation' || opName === 'AccountVerifyOTP' || opName === 'AccountSendOTPMutation' || opName === 'AccountSendOTP';
      const isLoginOrAdmin = opName === 'AccountLoginWithEmail' || opName === 'Login';
      const isIntrospection = opName === 'IntrospectionQuery' || queryStr.includes('__schema');
      const isPlayground = contextValue?.Session?.headers?.['b-authorization'] || contextValue?.Session?.headers?.['x-authorization'] === process.env.APP_PASSWORD;

      if (isPlayground || contextValue?.noAuth || isLoginOrAdmin || isIntrospection) {
        return; 
      }

      let publicKeyBase58 = null;
      if (isSignup) {
        publicKeyBase58 = args?.variableValues?.publicKey;
        // if no public key is passed (e.g., SendOTP or older calls), skip signature verify entirely
        if (!publicKeyBase58) {
           console.log(`[Signature] Bypassing ${opName} because no publicKey was provided in variables`);
           return;
        }
      }

      if (!signatureHeader || !timestampHeader || !nonceHeader) {
        throw new Error(`Missing required signature headers (sig: ${!!signatureHeader}, ts: ${!!timestampHeader}, nonce: ${!!nonceHeader})`);
      }

      const timestamp = parseInt(timestampHeader, 10);
      const currentTime = Date.now();
      if (Math.abs(currentTime - timestamp) > 300000) { 
        throw new Error("Request timestamp is too old");
      }

      const rawBody = contextValue?.Session?.rawBody || '';
      
      // Reconstruct payload using exact raw text
      const messageToSign = rawBody + timestampHeader + nonceHeader;
      console.log("[Signature] RAW BODY FOR VERIFICATION:", rawBody);
      console.log("[Signature] MESSAGE TO SIGN:", messageToSign);
      const messageUint8 = new TextEncoder().encode(messageToSign);
      
      if (!isSignup) {
        const userId = contextValue?.Session?.user?.id;
        if (!userId) {
          throw new Error("User not authenticated but signature is provided");
        }
        
        const user = await context.DataBase.account.findUnique({ where: { id: userId } });
        if (!user || !user.publicKey) {
             throw new Error("No public key registered for user");
        }
        publicKeyBase58 = user.publicKey;
      }

      if (!publicKeyBase58) {
        throw new Error("Public key not provided for verification");
      }

      const signatureUint8 = bs58.decode(signatureHeader);
      const publicKeyUint8 = bs58.decode(publicKeyBase58);

      const isValid = nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
      
      if (!isValid) {
        throw new Error("Invalid request signature");
      }
      
    } catch (error) {
       console.error("Signature verification failed", error.message);
       throw new Error(`SIGNATURE_VERIFICATION_FAILED: ${error.message}`);
    }
  }
});

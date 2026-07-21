import { useCallback } from "react";
import { buildLocalReply } from "../../../../services/classes/CompanionBot/localFallback";
import { normalizeAiResponse, replaceInfrastructureText } from "../utils/chatInfrastructure";

export function useChatEngine() {
  const createLocalSafetyReply = useCallback((text, options) => buildLocalReply(text, options), []);

  const sanitizeStreamChunk = useCallback((chunkText, localSafetyReply) => {
    return replaceInfrastructureText(chunkText, localSafetyReply.reply);
  }, []);

  const normalizeFinalResponse = useCallback((botResponse, localSafetyReply) => {
    return normalizeAiResponse(botResponse, localSafetyReply);
  }, []);

  return {
    createLocalSafetyReply,
    sanitizeStreamChunk,
    normalizeFinalResponse,
  };
}

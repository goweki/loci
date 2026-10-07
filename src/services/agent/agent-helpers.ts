export function shouldHandoffToHuman(message: string, keywords: string[]) {
  const normalizedMessage = message.normalize("NFKC").toLocaleLowerCase();
  return keywords.some((keyword) => {
    const normalizedKeyword = keyword.normalize("NFKC").trim().toLocaleLowerCase();
    return normalizedKeyword.length > 0 && normalizedMessage.includes(normalizedKeyword);
  });
}

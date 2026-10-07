import { AutoReplyRule, TriggerType } from "@/lib/prisma/generated";

export function matchAutoReplyRule(
  rules: AutoReplyRule[],
  input: { text?: string; messageType: string },
): AutoReplyRule | null {
  const normalizedText = input.text?.normalize("NFKC").toLocaleLowerCase() ?? "";
  const activeRules = [...rules]
    .filter((rule) => rule.isActive)
    .sort((left, right) => left.priority - right.priority || left.createdAt.getTime() - right.createdAt.getTime());

  for (const rule of activeRules) {
    if (
      rule.triggerType === TriggerType.KEYWORD &&
      rule.triggerValue &&
      normalizedText.includes(rule.triggerValue.normalize("NFKC").toLocaleLowerCase())
    ) {
      return rule;
    }
    if (
      rule.triggerType === TriggerType.MESSAGE_TYPE &&
      rule.triggerValue?.toLocaleLowerCase() === input.messageType.toLocaleLowerCase()
    ) {
      return rule;
    }
  }
  return activeRules.find((rule) => rule.triggerType === TriggerType.DEFAULT) ?? null;
}

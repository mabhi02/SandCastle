import { useTranslations } from "next-intl";
import { SectionHeader } from "@/components/utils/SectionHeader";
import { ExperienceItem } from "./ExperienceItem";

export const Experience = () => {
  const t = useTranslations("Experience");

  const experiences = [
    {
      title: t("exp1"),
      role: t("role1"),
      date: t("date1"),
      location: t("loca1"),
      description: t("desc1"),
      tech: ["Vapi", "Voice", "Barge-in", "WebRTC", "PSTN"],
    },
    {
      title: t("exp2"),
      role: t("role2"),
      date: t("date2"),
      location: t("loca2"),
      description: t("desc2"),
      tech: ["AgentMail", "Email", "Inbox", "Outbox", "Trace"],
    },
    {
      title: t("exp3"),
      role: t("role3"),
      date: t("date3"),
      location: t("loca3"),
      description: t("desc3"),
      tech: ["Autumn", "Stripe Test Mode", "Payment Link", "Webhook", "Reconcile"],
    },
    {
      title: t("exp4"),
      role: t("role4"),
      date: t("date4"),
      location: t("loca4"),
      description: t("desc4"),
      tech: ["Convex", "Transactions", "Reactive", "Audit Trail", "Counters"],
    },
    {
      title: t("exp5"),
      role: t("role5"),
      date: t("date5"),
      location: t("loca5"),
      description: t("desc5"),
      tech: ["MCP", "Tool Registry", "Guardrails", "Trace", "Policy Check"],
    },
  ];

  return (
    <section className="section-wrapper" id="experience">
      <SectionHeader title={t("section")} dir="l" />
      {experiences.map((experience) => (
        <ExperienceItem key={experience.title} {...experience} />
      ))}
    </section>
  );
};

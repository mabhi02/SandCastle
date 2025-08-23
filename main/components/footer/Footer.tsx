import Link from "next/link";
import styles from "./footer.module.scss";
import { useTranslations } from "next-intl";
import { TransitionLink } from "../utils/TransitionLink";

export const Footer = () => {
  const t = useTranslations("Footer");

  return (
    <footer className={styles.footer}>
      <p>©{(new Date()).getFullYear()} {t("copyright")}</p>
      <div className={styles.rightNote}>
        YC Agents Hackathon 2025 | Abhijith Varma Mudunuri · Atharva Patel · Alan Fu · Darin Kishore
      </div>
    </footer>
  );
};

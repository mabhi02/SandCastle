import { useTranslations } from "next-intl";
import Link from "next/link";
import { Reveal } from "@/components/utils/Reveal";
import { DotGrid } from "./DotGrid";
import styles from "./hero.module.scss";

export const Hero = () => {
  const t = useTranslations("Hero");

  return (
    <section className={`section-wrapper ${styles.hero}`} id="hero">
      <div className={styles.heroGrid}>
        <div className={styles.copyWrapper}>
          <Reveal>
            <h1 className={styles.title}>
              {t("title")}
              <span>.</span>
            </h1>
          </Reveal>
          <Reveal>
            <h2 className={styles.subTitle}>
              <span>{t("tagline")}</span>
            </h2>
          </Reveal>
          <Reveal>
            <p className={styles.aboutCopy}>
              {t("p1")}
            </p>
          </Reveal>
          <Reveal>
            <Link href="#contact" aria-label="Go to Contact">
              <button className={styles.contactButton}>Try it out</button>
            </Link>
          </Reveal>
        </div>
      </div>
      <DotGrid />
    </section>
  );
};

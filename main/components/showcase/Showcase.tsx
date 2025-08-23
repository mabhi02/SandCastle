import { useTranslations } from "next-intl";
import { AiOutlineArrowRight } from "react-icons/ai";
import { SectionHeader } from "@/components/utils/SectionHeader";
import { ShowcaseItem } from "./ShowcaseItem";
import { TransitionLink } from "../utils/TransitionLink";
import styles from "./showcase.module.scss";

export const Showcase = () => {
  const t = useTranslations("Projects");

  const projects = [
    {
      title: "Abhijith Varma Mudunuri",
      img: "/avmpic.jpg",
      code: "https://github.com/mabhi02",
      link: "https://www.linkedin.com/in/a-v-m-/",
      tech: ["Fullstack", "Backend Engineering", "ML"],
      desc: "I work within GenAI, ML, & Quantitative Analysis at BlackRock, ML Research at UCSF & UC Berkeley Haas, and I'm a scout at Collide Capital. I'm also a Data Science, Statistics, & Buisness student at UC Berkeley",
      modal: <>Abhijith Varma Mudunuri</>,
      initials: "AVM",
      baseWidth: 90,
      translateY: "0%",
    },
    {
      title: "Atharva Patel",
      img: "/image.png",
      code: "https://github.com/atharvajpatel",
      link: "https://www.linkedin.com/in/atharva-patel/",
      tech: ["Backend Engineering", "ML"],
      desc: "I am an incoming Applied Scientist at Amazon and conduct applied research at Haas school of Business working on agents. I love to work with Gen AI & Machine learning systems in my free time.",
      modal: <>Atharva Patel</>,
      initials: "AP",
      baseWidth: 90,
      translateY: "0%",
    },
    {
      title: "Alan Fu",
      img: "/alan.jpg",
      code: "https://github.com/fu351",
      link: "https://www.linkedin.com/in/alan-fu-a100b91a5/",
      tech: ["Backend Engineering", "ML"],
      desc: "I just finished my BS CompEng at Purdue university and now pursuing an MEng degree in EECS at Berkeley focusing on Embedded Systems and AI. Published first author at CVPR '25.",
      modal: <>Alan Fu</>,
      initials: "AF",
      baseWidth: 90,
      translateY: "0%",
    },
    {
      title: "Darin Kishore",
      img: "/daren.png",
      code: "https://github.com/darinkishore",
      link: "https://www.linkedin.com/in/darin-kishore-a65576a1/",
      tech: ["Backend Engineering", "MCP", "ML"],
      desc: "I am a synthetic data researcher and evaluation consultant based in San Francisco, currently focused on delivering reliable and secure Model Context Protocol (MCP) solutions",
      modal: <>Darin Kishore</>,
      initials: "DK",
      baseWidth: 90,
      translateY: "0%",
    },
  ];

  return (
    <section className="section-wrapper" id="projects">
      <SectionHeader title={t("section")} dir="r" />
      
      

      <div className={styles.projects}>
        {projects.map((project) => {
          return <ShowcaseItem key={project.title} {...project} />;
        })}
      </div>

      
    </section>
  );
};

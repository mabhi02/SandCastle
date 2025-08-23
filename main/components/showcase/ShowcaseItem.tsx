import Image from "next/image";
import { Reveal } from "@/components/utils/Reveal";
import { useAnimation, useInView, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AiFillGithub, AiFillLinkedin } from "react-icons/ai";
import styles from "./showcase.module.scss";
import { Modal } from "./Modal";

interface Props {
  modal: JSX.Element;
  desc: string;
  link: string;
  img: string;
  tech: string[];
  title: string;
  code: string;
  baseWidth?: number; // percentage without % sign, default 85
  translateY?: string; // e.g., "20%"
  initials?: string;
}

export const ShowcaseItem = ({
  modal,
  link,
  desc,
  img,
  title,
  code,
  tech,
  baseWidth,
  translateY,
  initials,
}: Props) => {
  // Image Animation
  const [hovered, setHovered] = useState(false);
  // Else
  const controls = useAnimation();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  // Reveal Animation
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [isInView, controls]);

  // Ensure the page remains scrollable regardless of item interactions
  useEffect(() => {
    const body = document.querySelector("body");
    if (body) body.style.overflowY = "auto";
  }, []);
  
  return (
    <>
      <motion.div
        ref={ref}
        variants={{
          hidden: { opacity: 0, y: 100 },
          visible: { opacity: 1, y: 0 },
        }}
        initial="hidden"
        animate={controls}
        transition={{ duration: 0.75 }}>
        <div className={styles.personRow}>
          <div className={styles.nameStack}>
            {title.split(" ").map((word, idx) => (
              <span key={`${word}-${idx}`}>{word}</span>
            ))}
          </div>
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={styles.portrait}>
            <Image
              priority
              src={img}
              alt={`An image of the ${title} portrait.`}
              width={1200}
              height={1600}
              style={{
                width: hovered
                  ? `${(baseWidth ?? 85) + 5}%`
                  : `${baseWidth ?? 85}%`,
                rotate: hovered ? "2deg" : "0deg",
                translate: `-50% ${translateY ?? "20%"}`,
                objectFit: "cover",
              }}
            />
          </div>
        </div>
        <div className={styles.projectCopy}>
          <Reveal width="100%">
            <div className={styles.projectTitle}>
              <h4>{initials ?? title}</h4>
              <div className={styles.projectTitleLine} />

              <a href={code} target="_blank" rel="nofollow" title="GitHub" aria-label="View GitHub">
                <AiFillGithub size="2.8rem" />
              </a>

              <a href={link} target="_blank" rel="nofollow" title="LinkedIn" aria-label="View LinkedIn">
                <AiFillLinkedin size="2.8rem" />
              </a>
            </div>
          </Reveal>
          <Reveal>
            <div className={styles.projectTech}>{tech.join(" - ")}</div>
          </Reveal>
          <Reveal>
            <p className={styles.projectDescription}>{desc}</p>
          </Reveal>
        </div>
      </motion.div>
      
    </>
  );
};

import { useState } from "react";
import ReactDOM from "react-dom";
import Image from "next/image";
import { motion } from "framer-motion";
import { AiFillGithub, AiOutlineExport } from "react-icons/ai";
import { MdClose } from "react-icons/md";
import styles from "./modal.module.scss";

interface Props {
  isOpen: boolean;
  setIsOpen: Function;
  title: string;
  img: string;
  code: string;
  link: string;
  tech: string[];
  modal: JSX.Element;
}

export const Modal = ({
  modal,
  link,
  setIsOpen,
  img,
  isOpen,
  title,
  code,
  tech,
}: Props) => {
  // Blur images
  const [isImageLoading, setImageLoading] = useState(true)

  const content = (
    <div className={styles.modal} onClick={() => setIsOpen(false)}>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className={styles.modalCard}>
      <button className={styles.closeModalBtn} onClick={() => setIsOpen(false)} aria-label="Close Modal">
        <MdClose />
      </button>
          <Image
            priority
            src={img}
            alt={`An image of the ${title} project.`}
            width={1080}
            height={608}
            onLoad={() => setImageLoading(false)}
            className={`${styles.modalImage} ${isImageLoading ? 'blur' : 'remove-blur'}`}
          />
        <div className={styles.modalContent}>
          <h4>{title}</h4>
          <div className={styles.modalTech}>{tech.join(" - ")}</div>
          <div className={styles.suppliedContent}>{modal}</div>
          <div className={styles.modalFooter}>
            <p className={styles.linksText}>
              Links<span>.</span>
            </p>
            <div className={styles.spaceBetween}>
              <div className={styles.links}>
                <a target="_blank" rel="nofollow" href={code} title="GitHub" aria-label="View Code">
                  <AiFillGithub />
                  Code
                </a>
                <a target="_blank" rel="nofollow" href={link} title="Demo"aria-label="View Website">
                  <AiOutlineExport />
                  Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );

  if (!isOpen) return <></>;

  // @ts-ignore
  return ReactDOM.createPortal(content, document.getElementById("root"));
};

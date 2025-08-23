import { Link } from "@/i18n/navigation";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AiOutlinePlayCircle } from "react-icons/ai";
import styles from "./navbar.module.scss";
import { Socials } from "./Socials";

export const Navbar = () => {
  // Switch
const currentPath = usePathname();
const newPath = currentPath.includes("/fr")
  ? currentPath.replace("/fr", "/en")
  : `${currentPath}/fr`.replace("//", "/");
  

  return (
    <header className={styles.heading}>
      {/* <- left */}
      <div className={styles.headingLeft}>
        <Socials />
      </div>

      {/* right -> */}
      <div className={styles.headingButtons}>
        <motion.span
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}>
          <Link href="/app" aria-label="Try it out">
            <button className={styles.outlineButton} aria-label="Try it out">
              Try it out
              <AiOutlinePlayCircle size="2.4rem" />
            </button>
          </Link>
        </motion.span>
      </div>
    </header>
  );
};

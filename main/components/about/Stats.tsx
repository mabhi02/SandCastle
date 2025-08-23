import styles from "./stats.module.scss";
import { AiFillCode } from "react-icons/ai";
import { Reveal } from "@/components/utils/Reveal";

export const Stats = () => {
  return (
    <div className={styles.stats}>
      <Reveal>
        <div className={styles.statColumn}>
          <h4>
            <AiFillCode size="2.4rem" color="var(--brand)" />
            <span>Stack</span>
          </h4>
          <div className={styles.statGrid}>
            <span className="chip">Next.js</span>
            <span className="chip">React</span>
            <span className="chip">TypeScript</span>
            <span className="chip">MCP</span>
            <span className="chip">Convex</span>
            <span className="chip">Vapi (Voice)</span>
            <span className="chip">AgentMail</span>
            <span className="chip">Autumn / Stripe</span>
            <span className="chip">Tailwind</span>
            <span className="chip">Node.js</span>
            <span className="chip">PostgreSQL</span>
            <span className="chip">MongoDB</span>
            <span className="chip">Git</span>
            <span className="chip">GitHub</span>
            <span className="chip">OpenAI</span>
            <span className="chip">Prompting</span>
            <span className="chip">Agent Safety</span>
            <span className="chip">Tracing</span>
            <span className="chip">Audit Trail</span>
            <span className="chip">Stripe Test Mode</span>
            <span className="chip">State Machines</span>
            <span className="chip">Cursor</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
};

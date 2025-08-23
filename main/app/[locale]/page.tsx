'use client'
import { Navbar } from '@/components/nav/Navbar';
import { SideBar } from '@/components/nav/SideBar';
import { Hero } from '@/components/hero/Hero';
import { About } from '@/components/about/About';
import { Showcase } from '@/components/showcase/Showcase';
import { Experience } from '@/components/experience/Experience';
import { Contact } from '@/components/contact/Contact';
import {Footer} from '@/components/footer/Footer';
import styles from "@/components/utils/home.module.scss";

const Home = () => {
  return (
    <>
      <div className={styles.home}>
        <SideBar />
        <main id="main">
          <Navbar />
          <Hero />
          <About />
          <Experience />
          <Showcase />
          <Contact />
          {/* <div
            style={{
              height: "200px",
              background:
                "linear-gradient(180deg, var(--background), var(--background-dark))",
            }}
          /> */}
        <Footer/>
        </main>
      </div>
    </>
  );
};


export default Home


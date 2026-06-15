import Hero from "../../components/Hero/Hero";
import Experiences from "../../components/Experiences/Experiences";
import Portfolio from "../../components/Portfolio/Portfolio";
import Films from "../../components/Films/Films";
import Process from "../../components/Process/Process";
import About from "../../components/About/About";
import Testimonials from "../../components/Testimonials/Testimonials";
import Agenda from "../../components/Agenda/Agenda";
import FAQ from "../../components/FAQ/FAQ";
import CTA from "../../components/CTA/CTA";

function Home() {
  return (
    <>
      <Hero />
      <Experiences />
      <Portfolio />
      <Films />
      <Process />
      <About />
      <Testimonials />
      <Agenda />
      <FAQ />
      <CTA />
    </>
  );
}

export default Home;
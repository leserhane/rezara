import { Hero } from "@/components/hero/Hero";
import { Manifesto } from "@/components/manifesto/Manifesto";
import { Space } from "@/components/space/Space";
import { Collection } from "@/components/collection/Collection";
import { OpeningSoon } from "@/components/opening/OpeningSoon";
import { EarlyAccess } from "@/components/newsletter/EarlyAccess";
import { Location } from "@/components/location/Location";
import { Footer } from "@/components/footer/Footer";

export default function HomePage() {
  return (
    <main id="main">
      <Hero />
      <Manifesto />
      <Space />
      <Collection />
      <OpeningSoon />
      <EarlyAccess />
      <Location />
      <Footer />
    </main>
  );
}

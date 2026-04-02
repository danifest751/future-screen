import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Equipment } from "@/components/equipment"
import { Directions } from "@/components/directions"
import { Cases } from "@/components/cases"
import { Process } from "@/components/process"
import { ContactCta } from "@/components/contact-cta"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <Equipment />
      <Directions />
      <Cases />
      <Process />
      <ContactCta />
      <Footer />
    </main>
  )
}

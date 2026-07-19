import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const About = () => {
  const location = useLocation();

  useEffect(() => {
    // Handle smooth scrolling to section on page load or hash change
    if (location.hash) {
      // Small delay to ensure page is rendered
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          const headerOffset = 80; // Account for fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 100);
    } else {
      // Scroll to top if no hash
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />

      <main className="pt-16 md:pt-20">
        {/* Hero */}
        <section className="py-16 md:py-24 lg:py-32 bg-secondary">
          <div className="container mx-auto px-4 text-center">
            <p className="font-accent text-primary tracking-[0.3em] uppercase mb-3 md:mb-4 text-xs md:text-sm animate-slide-in-left">Our Story</p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl xl:text-6xl mb-4 md:mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              The Art of
              <br />
              <span className="text-primary">Sensus Perfume</span>
            </h1>
            <div className="w-16 h-px bg-primary mx-auto animate-scale-in" style={{ animationDelay: '0.4s' }} />
          </div>
        </section>

        {/* Story */}
        <section className="py-12 md:py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <p className="font-accent text-lg md:text-xl lg:text-2xl text-primary mb-6 md:mb-8 leading-relaxed text-center">
                "A fragrance is a work of art, a silent symphony that speaks to the soul."
              </p>
              
              <div className="relative bg-secondary/30 rounded-lg p-6 md:p-10 lg:p-12 border border-primary/10 backdrop-blur-sm mb-8">
                {/* Decorative element */}
                <div className="absolute -top-3 -left-3 w-6 h-6 border-2 border-primary/30 rounded-full hidden md:block" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 border-2 border-primary/30 rounded-full hidden md:block" />
                
                <div className="space-y-6 md:space-y-8">
                  <p className="text-sm md:text-base lg:text-lg text-foreground leading-relaxed text-justify hyphens-auto">
                    Sensus Perfume was born from a passion for the extraordinary. Our journey began with a simple belief: that fragrance 
                    is the most intimate form of self-expression, a silent signature that 
                    lingers long after you've left the room. We believe every scent tells a story, and every person deserves to find their perfect olfactory match.
                  </p>
                  
                  <div className="flex items-center gap-4 md:gap-6 py-4 md:py-6 border-y border-primary/20">
                    <div className="w-1 h-16 bg-gradient-to-b from-primary to-primary/30 rounded-full" />
                    <p className="text-sm md:text-base text-muted-foreground italic font-accent">
                      Our perfumers carefully curate each scent using premium quality ingredients, creating distinctive signatures that feel luxurious yet wearable for every occasion. Crafted to perfection, every drop carries the essence of elegance.
                    </p>
                  </div>
                  
                  <p className="text-sm md:text-base lg:text-lg text-foreground leading-relaxed text-justify hyphens-auto">
                    From Faisalabad, Pakistan, we serve fragrance enthusiasts across the country, combining modern perfume trends with timeless elegance. Our commitment is to deliver not just perfumes, but experiences that elevate your everyday moments into memorable ones.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-secondary to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 md:mb-16">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-center">Our Core Values</h2>
              <div className="flex items-center justify-center gap-4">
                <div className="w-8 h-px bg-primary/40" />
                <div className="w-3 h-3 bg-primary rounded-full" />
                <div className="w-8 h-px bg-primary/40" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {[
                {
                  title: 'Craftsmanship',
                  description: 'Each fragrance is thoughtfully blended to deliver long-lasting performance and a memorable trail. We obsess over every note, every blend, creating olfactory masterpieces.',
                  icon: '✨',
                },
                {
                  title: 'Trust',
                  description: 'We stand behind what we sell. Clear communication, genuine products, and honest service for every order. Your satisfaction is our highest priority.',
                  icon: '🤝',
                },
                {
                  title: 'Experience',
                  description: 'From unboxing to the final spritz, we focus on details that make Sensus feel truly premium. Every interaction matters.',
                  icon: '💎',
                },
              ].map((value, index) => (
                <div key={value.title} className="group relative animate-slide-up" style={{ animationDelay: `${index * 0.15}s` }}>
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105" />
                  <div className="relative p-6 md:p-8 border border-primary/20 rounded-xl bg-background/50 backdrop-blur-sm group-hover:border-primary/40 transition-all duration-500 h-full text-center group-hover:shadow-[0_8px_30px_hsl(var(--primary)/0.2)] group-hover:-translate-y-2">
                    <div className="text-4xl mb-4 transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 flex justify-center">{value.icon}</div>
                    <h3 className="font-display text-xl md:text-2xl mb-4 text-primary group-hover:text-primary transition-colors duration-300">{value.title}</h3>
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed text-justify hyphens-auto">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section id="faqs" className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-center">Frequently Asked Questions</h2>
              <div className="flex items-center justify-center gap-4 mb-12 md:mb-16">
                <div className="w-8 h-px bg-primary/40" />
                <div className="w-3 h-3 bg-primary rounded-full" />
                <div className="w-8 h-px bg-primary/40" />
              </div>

              <div className="space-y-6 md:space-y-8">
                {[
                  {
                    q: 'Do you offer cash on delivery in Pakistan?',
                    a: 'Yes. We offer cash on delivery (COD) for most cities across Pakistan through our trusted courier partners. In some remote areas, advance payment may be required and our team will contact you if needed.'
                  },
                  {
                    q: 'How long will my order take to arrive?',
                    a: 'Orders are usually dispatched within 24 hours. Delivery time is typically 2-5 business days for major cities like Lahore, Karachi, Islamabad, and Faisalabad, and 3-7 business days for other locations in Pakistan.'
                  },
                  {
                    q: 'Are your fragrances original?',
                    a: 'Every Sensus Perfume fragrance is crafted to our own signature formulations using quality ingredients. We do not sell replicas of other brands.'
                  },
                  {
                    q: 'Can I test the fragrance before buying?',
                    a: 'For selected launches we offer sample sizes and discovery sets. Follow us on social media or join our newsletter to be notified about sampling campaigns and in-person events.'
                  }
                ].map((item, index) => (
                  <div key={index} className="group border-l-2 border-primary/30 hover:border-primary/80 pl-4 md:pl-6 py-2 transition-all duration-300">
                    <h3 className="font-display text-base md:text-lg text-foreground mb-3 group-hover:text-primary transition-colors">{item.q}</h3>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify hyphens-auto">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Shipping & Returns */}
        <section id="shipping-returns" className="py-16 md:py-24 bg-gradient-to-r from-secondary/50 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-center">Shipping &amp; Returns</h2>
              <div className="flex items-center justify-center gap-4 mb-12">
                <div className="w-8 h-px bg-primary/40" />
                <div className="w-3 h-3 bg-primary rounded-full" />
                <div className="w-8 h-px bg-primary/40" />
              </div>

              <div className="space-y-6 md:space-y-8 relative">
                {/* Decorative background line */}
                <div className="absolute left-3 md:left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
                
                {[
                  'We currently ship all over Pakistan using reputed courier services. Shipping charges are calculated at checkout based on your city and order weight. From time to time we offer free shipping promotions on qualifying orders.',
                  'Please inspect your parcel at the time of delivery. If you receive a damaged, leaked, or incorrect item, contact us within 48 hours with your order number and photos so we can replace it for you.',
                  'For hygiene and safety reasons, fragrances that have been opened or used cannot be returned, except in cases of wrong or defective items. For any questions about eligibility, our support team will be happy to guide you.'
                ].map((text, index) => (
                  <div key={index} className="flex gap-4 md:gap-6">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-primary bg-background relative z-10" />
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed text-justify hyphens-auto pt-1">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16 md:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 animate-fade-in" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl mb-6 text-center animate-slide-up">Get in Touch</h2>
              <div className="flex items-center justify-center gap-4 mb-12 animate-scale-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-8 h-px bg-primary/40" />
                <div className="w-3 h-3 bg-primary rounded-full animate-pulse-glow" />
                <div className="w-8 h-px bg-primary/40" />
              </div>
              
              <p className="text-muted-foreground mb-12 text-center text-base md:text-lg leading-relaxed animate-fade-in" style={{ animationDelay: '0.3s' }}>
                Have questions about our fragrances or need assistance? Our team is here to help you discover your perfect scent.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12">
                {[
                  { icon: '✉️', label: 'Email', value: 'support@sensusperfume.com' },
                  { icon: '📞', label: 'Phone', value: '+92 341 7203695' },
                  { icon: '📍', label: 'Location', value: 'Faisalabad, Pakistan' }
                ].map((contact, index) => (
                  <div 
                    key={index} 
                    className="group text-center p-6 md:p-6 rounded-lg border border-primary/20 hover:border-primary/50 hover:bg-secondary/30 transition-all duration-500 backdrop-blur-sm min-h-[200px] md:min-h-[220px] flex flex-col items-center justify-center hover:shadow-[0_8px_30px_hsl(var(--primary)/0.2)] hover:-translate-y-2 animate-slide-up"
                    style={{ animationDelay: `${0.4 + index * 0.15}s` }}
                  >
                    <div className="text-5xl md:text-6xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">{contact.icon}</div>
                    <p className="text-muted-foreground text-xs md:text-sm mb-2 uppercase tracking-wider">{contact.label}</p>
                    <p className="text-foreground font-medium text-sm md:text-base lg:text-lg group-hover:text-primary transition-colors whitespace-nowrap">{contact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;

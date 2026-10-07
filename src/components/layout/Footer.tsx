import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { newsletterAPI } from "@/lib/api";
import { toast } from "sonner";

const Footer = () => {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget; // capture form before async work
    const formData = new FormData(form);
    const email = String(formData.get("email") || "").trim();
    if (!email) return;

    try {
      const result = await newsletterAPI.subscribe(email);
      toast.success(result.message || "Thank you for subscribing!");
      form.reset();
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error('Unable to subscribe. Please try again later.');
    }
  };

  return (
    <footer className="bg-secondary border-t border-border relative overflow-hidden">
      {/* Decorative gradient */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary to-transparent animate-scale-in" />

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1 animate-slide-in-left">
            <h3 className="font-display text-lg md:text-xl tracking-[0.3em] mb-4 md:mb-6 group">
              SENSUS <span className="text-primary group-hover:tracking-[0.4em] transition-all duration-300">PERFUME</span>
            </h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Crafting exceptional fragrances that transcend time. Each scent tells a story of elegance, passion, and artistry.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <a
                href="https://maps.google.com/?q=Faisalabad,Pakistan"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors group"
              >
                <MapPin size={16} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>Faisalabad, Pakistan</span>
              </a>
              <a
                href="tel:+923417203695"
                className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors group"
              >
                <Phone size={16} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>+92 341 7203695</span>
              </a>
              <a
                href="mailto:support@sensusperfume.com"
                className="flex items-center gap-3 text-muted-foreground text-sm hover:text-primary transition-colors group"
              >
                <Mail size={16} className="group-hover:scale-110 transition-transform flex-shrink-0" />
                <span>support@sensusperfume.com</span>
              </a>
            </div>

            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/sensus_perfumes/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="Follow us on Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61586302960503"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="Follow us on Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.tiktok.com/@sensusperfumes"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="Follow us on TikTok"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="https://wa.me/923417203695"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
                aria-label="Chat with us on WhatsApp"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="animate-slide-up" style={{ animationDelay: "0.1s" }}>
            <h4 className="text-xs md:text-sm tracking-[0.2em] uppercase mb-4 md:mb-6 text-foreground font-medium">Shop</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/shop"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    All Fragrances
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shop/men"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    For Men
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shop/women"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    For Women
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/shop/unisex"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    Unisex
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <h4 className="text-sm tracking-[0.2em] uppercase mb-6 text-foreground font-medium">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/about#contact"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    Contact Us
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about#faqs"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    FAQs
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about#shipping-returns"
                  className="text-muted-foreground text-sm hover:text-primary transition-all duration-300 hover:translate-x-2 inline-block group relative"
                >
                  <span className="relative">
                    Shipping &amp; Returns
                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                  </span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <h4 className="text-sm tracking-[0.2em] uppercase mb-6 text-foreground font-medium">Newsletter</h4>
            <p className="text-muted-foreground text-sm mb-4">
              Subscribe for exclusive offers and new arrivals.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  placeholder="Your email address"
                  required
                  className="w-full bg-background border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300 group-hover:border-primary/50"
                />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-3 text-sm tracking-[0.15em] uppercase hover:bg-primary/90 transition-all duration-300 relative overflow-hidden group"
              >
                <span className="relative z-10">Subscribe</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-center items-center gap-4">
          <p className="text-muted-foreground text-xs">
            © 2026 Sensus Perfume All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, Search, LogOut } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetClose } from "@/components/ui/sheet";
import { productsAPI } from '@/lib/api';
import type { Product } from '@/types/product';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const { totalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    if (!isSearchOpen) {
      setActiveIndex(-1);
      return;
    }
    if (allProducts.length > 0) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await productsAPI.getAll();
        const products = Array.isArray(response)
          ? response
          : (response?.data || []);
        if (!cancelled) setAllProducts(products);
      } catch (error) {
        console.error('Failed to fetch products for search suggestions:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSearchOpen, allProducts.length]);

  const suggestions = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q || q.length < 2) return [];

    const score = (p: Product) => {
      const name = p.name.toLowerCase();
      const brand = p.brand.toLowerCase();
      let s = 0;
      if (name.startsWith(q)) s += 6;
      if (brand.startsWith(q)) s += 5;
      if (name.includes(q)) s += 3;
      if (brand.includes(q)) s += 2;
      return s;
    };

    return allProducts
      .filter((p) => {
        const name = p.name.toLowerCase();
        const brand = p.brand.toLowerCase();
        return name.includes(q) || brand.includes(q);
      })
      .sort((a, b) => score(b) - score(a))
      .slice(0, 8);
  }, [allProducts, debouncedQuery]);

  const goToSearchResults = () => {
    const q = searchQuery.trim();
    if (!q) return;
    navigate(`/shop?search=${encodeURIComponent(q)}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  };

  const goToProduct = (product: Product) => {
    const identifier = product.slug || product._id || product.id;
    if (!identifier) return;
    navigate(`/product/${identifier}`);
    setIsSearchOpen(false);
    setSearchQuery('');
    setActiveIndex(-1);
  };

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    goToSearchResults();
  };

  const navLinks = [
    { name: 'Shop All', path: '/shop' },
    { name: 'Men', path: '/shop/men' },
    { name: 'Women', path: '/shop/women' },
    { name: 'Unisex', path: '/shop/unisex' },
    { name: 'About', path: '/about' },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
      scrolled 
        ? 'bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-primary/5' 
        : 'bg-background/70 backdrop-blur-md border-b border-border/30'
    }`}>
      <div className="container mx-auto px-3 sm:px-4">
          <div className={`flex items-center justify-between py-2 sm:py-3 transition-all duration-300 lg:gap-8`}>
          {/* Mobile Menu Button - Replaced with Sheet */}
          <div className="lg:hidden flex-shrink-0">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-1 text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                  aria-label="Toggle menu"
                >
                  <Menu size={24} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] border-r-border/50 bg-background/95 backdrop-blur-xl p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="p-6 pr-16 border-b border-border/50 text-left">
                    <SheetTitle>
                      <Link 
                        to="/" 
                        onClick={() => setIsMenuOpen(false)}
                        className="block"
                      >
                        <span className="font-display tracking-[0.3em] text-lg leading-tight block">
                          SENSUS <span className="text-primary">PERFUME</span>
                        </span>
                      </Link>
                    </SheetTitle>
                  </SheetHeader>
                  
                  <nav className="flex-1 overflow-y-auto py-6 px-6 flex flex-col gap-6">
                    {navLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMenuOpen(false)}
                        className={`text-lg font-display tracking-[0.15em] transition-colors duration-300 hover:text-primary hover:pl-2 ${
                          isActive(link.path) ? 'text-primary' : 'text-foreground/80'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="p-6 border-t border-border/50 bg-secondary/30">
                     {user ? (
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsMenuOpen(false);
                        }}
                        className="flex items-center gap-3 w-full text-foreground/80 hover:text-primary transition-colors text-sm tracking-[0.1em] uppercase"
                      >
                        <LogOut size={18} />
                        Logout
                      </button>
                    ) : (
                      <Link 
                        to="/auth" 
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors text-sm tracking-[0.1em] uppercase"
                      >
                        <User size={18} />
                        Sign In / Register
                      </Link>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo with animation */}
          <Link 
            to="/" 
            className="flex-shrink-0 group min-w-0 flex items-center"
          >
            <h1 className={`font-display tracking-[0.12em] sm:tracking-[0.25em] lg:tracking-[0.3em] text-foreground transition-all duration-300 text-sm sm:text-base lg:text-lg leading-none`}>
              SENSUS <span className="text-primary group-hover:tracking-[0.35em] lg:group-hover:tracking-[0.4em] transition-all duration-300">PERFUME</span>
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative text-sm tracking-[0.15em] uppercase transition-all duration-300 hover:text-primary group ${
                  isActive(link.path) ? 'text-primary' : 'text-foreground/80'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full ${
                  isActive(link.path) ? 'w-full' : ''
                }`} />
              </Link>
            ))}
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-0.5 sm:gap-2 lg:gap-3 flex-shrink-0 h-10">
            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="flex items-center justify-center w-10 h-10 text-foreground hover:text-primary transition-all duration-300 hover:scale-110 hover:rotate-12"
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center w-10 h-10 text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
                aria-label="Logout"
              >
                <LogOut size={20} />
              </button>
            ) : (
              <Link 
                to="/auth" 
                className="flex items-center justify-center w-10 h-10 text-foreground hover:text-primary transition-all duration-300 hover:scale-110"
              >
                <User size={20} />
              </Link>
            )}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center justify-center w-10 h-10 text-foreground hover:text-primary transition-all duration-300 hover:scale-110 group"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center justify-center animate-scale-in group-hover:scale-110 transition-transform">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Overlay */}
      {isSearchOpen && (
        <div className="absolute top-full left-0 right-0 bg-background/98 backdrop-blur-xl border-b border-border shadow-lg animate-slide-up">
          <div className="container mx-auto px-4 py-4">
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setActiveIndex(-1);
                      return;
                    }

                    const totalItems = suggestions.length + (searchQuery.trim() ? 1 : 0);
                    if (totalItems === 0) return;

                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndex((i) => (i + 1) % totalItems);
                      return;
                    }

                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndex((i) => (i - 1 + totalItems) % totalItems);
                      return;
                    }

                    if (e.key === 'Enter' && activeIndex >= 0) {
                      e.preventDefault();
                      if (activeIndex < suggestions.length) {
                        goToProduct(suggestions[activeIndex]);
                        return;
                      }
                      goToSearchResults();
                    }
                  }}
                  placeholder="Search fragrances..."
                  autoFocus
                  className="w-full bg-secondary border-2 border-border px-6 py-4 pr-12 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all duration-300"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:scale-110 transition-transform"
                  aria-label="Submit search"
                >
                  <Search size={20} />
                </button>

                {(debouncedQuery.length >= 2 && (suggestions.length > 0 || searchQuery.trim())) && (
                  <div
                    className="absolute left-0 right-0 top-full mt-2 bg-background border border-border shadow-xl z-50 overflow-hidden"
                    role="listbox"
                  >
                    {suggestions.map((product, idx) => (
                      <button
                        key={product._id || product.id || `${product.name}-${idx}`}
                        type="button"
                        className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors ${
                          activeIndex === idx ? 'bg-secondary' : ''
                        }`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={() => goToProduct(product)}
                        role="option"
                        aria-selected={activeIndex === idx}
                      >
                        <div className="text-sm text-foreground">
                          {highlightMatch(product.name, debouncedQuery)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {highlightMatch(product.brand, debouncedQuery)}
                        </div>
                      </button>
                    ))}

                    {searchQuery.trim() && (
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-t border-border ${
                          activeIndex === suggestions.length ? 'bg-secondary' : ''
                        }`}
                        onMouseEnter={() => setActiveIndex(suggestions.length)}
                        onMouseDown={(ev) => ev.preventDefault()}
                        onClick={goToSearchResults}
                      >
                        <div className="text-sm text-foreground">
                          Search for “{searchQuery.trim()}”
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;

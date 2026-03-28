const FooterSection = () => {
  return (
    <footer className="py-12 border-t border-border relative">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xl gradient-neon-text">GRVM</span>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Whitepaper</a>
            <a href="#" className="hover:text-primary transition-colors">Comunidade</a>
            <a href="#" className="hover:text-primary transition-colors">Redes sociais</a>
            <a href="#" className="hover:text-primary transition-colors">Contato</a>
          </nav>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Groovium © 2026 — A frequência que conecta o futuro
          </p>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;

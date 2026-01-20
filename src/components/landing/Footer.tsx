'use client';

import Link from 'next/link';
import { Twitter, Github, Linkedin, Instagram } from 'lucide-react';

const footerLinks = {
  product: [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'For Professionals', href: '#for-professionals' },
    { label: 'API', href: '/api-docs' },
    { label: 'Changelog', href: '/changelog' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
    { label: 'Contact', href: '/contact' },
    { label: 'Press', href: '/press' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
    { label: 'HIPAA', href: '/hipaa' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
    { label: 'Security', href: '/security' },
  ],
};

const socialLinks = [
  { icon: Twitter, href: 'https://twitter.com/nutritiontracker', label: 'Twitter' },
  { icon: Github, href: 'https://github.com/nutritiontracker', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/company/nutritiontracker', label: 'LinkedIn' },
  { icon: Instagram, href: 'https://instagram.com/nutritiontracker', label: 'Instagram' },
];

export default function Footer() {
  return (
    <footer className="bg-background text-muted-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          {/* Brand Column */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                 <span className="text-primary-foreground font-bold text-lg">N</span>
               </div>
               <span className="font-bold text-xl text-foreground">NutritionTracker</span>
             </Link>
             <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              The intelligent nutrition platform for individuals and professionals. 
              Track smarter, eat better, live healthier.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-card rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
                   aria-label={social.label}
                 >
                   <social.icon className="h-5 w-5 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Product</h3>
             <ul className="space-y-3">
               {footerLinks.product.map((link) => (
                 <li key={link.label}>
                   <Link 
                     href={link.href}
                     className="text-sm hover:text-foreground transition-colors"
                   >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Company</h3>
             <ul className="space-y-3">
               {footerLinks.company.map((link) => (
                 <li key={link.label}>
                   <Link 
                     href={link.href}
                     className="text-sm hover:text-foreground transition-colors"
                   >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Legal</h3>
             <ul className="space-y-3">
               {footerLinks.legal.map((link) => (
                 <li key={link.label}>
                   <Link 
                     href={link.href}
                     className="text-sm hover:text-foreground transition-colors"
                   >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Support</h3>
             <ul className="space-y-3">
               {footerLinks.support.map((link) => (
                 <li key={link.label}>
                   <Link 
                     href={link.href}
                     className="text-sm hover:text-foreground transition-colors"
                   >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
           <p className="text-sm text-muted-foreground">
             &copy; {new Date().getFullYear()} NutritionTracker. All rights reserved.
           </p>
           <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <span className="text-red-500">❤️</span>
            <span>for healthier living</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

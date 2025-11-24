import Link from "next/link";
import { Search, Twitter, Linkedin, Github } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/10 bg-black pt-16 pb-8">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 border border-primary/20">
                                <Search className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-xl font-bold text-white">HUNTER</span>
                        </Link>
                        <p className="text-zinc-400 max-w-sm mb-6">
                            La plataforma de inteligencia más avanzada para licitaciones públicas.
                            Encuentra, analiza y gana más contratos con insights impulsados por IA.
                        </p>
                        <div className="flex gap-4">
                            <Link href="#" className="text-zinc-400 hover:text-primary transition-colors">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-primary transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-zinc-400 hover:text-primary transition-colors">
                                <Github className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Producto</h3>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Características</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Precios</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">API</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Integración</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-white mb-4">Compañía</h3>
                        <ul className="space-y-2">
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Nosotros</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Blog</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Carreras</Link></li>
                            <li><Link href="#" className="text-zinc-400 hover:text-primary transition-colors">Contacto</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-zinc-500">
                        © {new Date().getFullYear()} HUNTER. Todos los derechos reservados.
                    </p>
                    <div className="flex gap-6 text-sm text-zinc-500">
                        <Link href="#" className="hover:text-zinc-300">Política de Privacidad</Link>
                        <Link href="#" className="hover:text-zinc-300">Términos de Servicio</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

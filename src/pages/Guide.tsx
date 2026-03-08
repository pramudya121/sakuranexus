import Navigation from '@/components/Navigation';
import SakuraFalling from '@/components/SakuraFalling';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Wallet,
  Palette,
  Store,
  ShoppingCart,
  Tag,
  Gift,
  ArrowLeftRight,
  Shield,
  HelpCircle,
  Sparkles,
  BookOpen,
  Rocket,
  Bell,
  Heart,
  Gavel,
  Brain,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface StepProps {
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const Step = ({ number, title, description, icon }: StepProps) => (
  <div className="flex gap-4 items-start group">
    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
      {number}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary/70">{icon}</span>
        <h4 className="font-semibold text-lg">{title}</h4>
      </div>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  </div>
);

const Guide = () => {
  const navigate = useNavigate();

  const gettingStartedSteps: StepProps[] = [
    {
      number: 1,
      title: 'Hubungkan Wallet',
      description:
        'Klik tombol "Connect Wallet" di pojok kanan atas. Kami mendukung MetaMask, OKX Wallet, dan Bitget Wallet. Pastikan Anda sudah menginstall salah satu wallet tersebut.',
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      number: 2,
      title: 'Beralih ke Nexus Testnet',
      description:
        'Setelah menghubungkan wallet, jaringan akan otomatis beralih ke Nexus Testnet (Chain ID 3945). Jika belum, jaringan akan ditambahkan secara otomatis ke wallet Anda.',
      icon: <ArrowLeftRight className="w-5 h-5" />,
    },
    {
      number: 3,
      title: 'Dapatkan NEX (Testnet Token)',
      description:
        'Kunjungi faucet Nexus Testnet untuk mendapatkan token NEX gratis sebagai gas fee dan untuk transaksi di marketplace.',
      icon: <Sparkles className="w-5 h-5" />,
    },
  ];

  const guides = [
    {
      title: '🎨 Mint NFT',
      icon: <Palette className="w-6 h-6" />,
      color: 'from-violet-500 to-purple-600',
      steps: [
        'Buka halaman Mint dari menu navigasi',
        'Upload gambar artwork Anda (PNG, JPG, GIF, max 10MB) atau gunakan AI Art Generator',
        'Isi nama dan deskripsi NFT. Gunakan tombol "Auto-Generate" untuk metadata otomatis via AI',
        'Klik "Mint NFT" dan konfirmasi transaksi di wallet Anda',
        'Setelah berhasil, Anda akan diarahkan ke halaman Profile dimana NFT baru Anda sudah muncul',
      ],
      cta: { label: 'Mint Sekarang', path: '/mint' },
    },
    {
      title: '🏪 Jual NFT (List for Sale)',
      icon: <Tag className="w-6 h-6" />,
      color: 'from-emerald-500 to-green-600',
      steps: [
        'Buka Profile → tab "Collected" untuk melihat NFT yang Anda miliki',
        'Klik tombol "List for Sale" pada NFT yang ingin dijual',
        'Masukkan harga dalam NEX dan konfirmasi',
        'Konfirmasi 2 transaksi di wallet: (1) Approve marketplace, (2) List NFT',
        'NFT Anda sekarang muncul di Marketplace dan bisa dibeli siapa saja!',
      ],
      cta: { label: 'Lihat NFT Saya', path: '/profile' },
    },
    {
      title: '🛒 Beli NFT',
      icon: <ShoppingCart className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-600',
      steps: [
        'Buka Marketplace dan jelajahi NFT yang tersedia',
        'Gunakan filter pencarian, sort berdasarkan harga, atau lihat trending NFTs',
        'Klik "Buy Now" pada NFT yang diinginkan',
        'Konfirmasi transaksi di wallet (harga NFT + gas fee)',
        'Setelah berhasil, NFT muncul di Profile Anda dan bisa di-list kembali atau di-transfer',
      ],
      cta: { label: 'Jelajahi Marketplace', path: '/marketplace' },
    },
    {
      title: '💰 Make & Accept Offer',
      icon: <Gavel className="w-6 h-6" />,
      color: 'from-amber-500 to-orange-600',
      steps: [
        'Buka detail NFT yang ingin Anda tawar (bisa dari Marketplace atau langsung via link)',
        'Masukkan harga penawaran di field "Enter offer (NEX)" dan klik "Make Offer"',
        'Konfirmasi transaksi di wallet — NEX Anda akan di-lock di smart contract',
        'Pemilik NFT akan menerima notifikasi 🔔 dan bisa Accept/Reject offer',
        'Jika di-accept: NFT otomatis berpindah ke Anda, listing di marketplace dihapus otomatis',
      ],
      cta: { label: 'Cari NFT', path: '/marketplace' },
    },
    {
      title: '🎁 Transfer NFT',
      icon: <Gift className="w-6 h-6" />,
      color: 'from-pink-500 to-rose-600',
      steps: [
        'Buka Profile → tab "Collected"',
        'Klik tombol "Transfer" pada NFT yang ingin dikirim',
        'Masukkan alamat wallet tujuan (0x...)',
        'Konfirmasi transaksi di wallet',
        'Penerima akan mendapatkan notifikasi "NFT Received!" dan NFT muncul di profile mereka',
      ],
      cta: { label: 'Lihat NFT Saya', path: '/profile' },
    },
    {
      title: '🔔 Notifikasi & Watchlist',
      icon: <Bell className="w-6 h-6" />,
      color: 'from-cyan-500 to-teal-600',
      steps: [
        'Notifikasi real-time muncul saat: NFT terjual, offer diterima, atau NFT di-transfer ke Anda',
        'Klik ikon 🔔 di navbar untuk melihat semua notifikasi',
        'Tambahkan NFT ke Watchlist dengan klik ikon ❤️ pada kartu NFT',
        'Watchlist tersedia di Profile → tab "Favorited" dan di halaman Watchlist',
        'Anda akan mendapat peringatan jika harga NFT di watchlist turun!',
      ],
      cta: { label: 'Lihat Watchlist', path: '/watchlist' },
    },
  ];

  const faqs = [
    {
      q: 'Apa itu NEX token?',
      a: 'NEX adalah native token di Nexus Testnet. Digunakan untuk gas fee dan semua transaksi di NexusLabs marketplace. Karena ini testnet, token NEX tidak memiliki nilai finansial.',
    },
    {
      q: 'Berapa biaya platform (platform fee)?',
      a: 'Platform mengenakan biaya 2.5% dari harga jual setiap transaksi NFT di marketplace. Fee ini otomatis dipotong saat NFT terjual.',
    },
    {
      q: 'Bagaimana cara cancel listing?',
      a: 'Buka Profile → tab "Collected" → klik ikon X pada NFT yang sedang di-list. Konfirmasi transaksi di wallet dan NFT Anda akan ditarik dari marketplace.',
    },
    {
      q: 'Apakah bisa membeli NFT milik sendiri?',
      a: 'Tidak. Sistem secara otomatis mencegah Anda membeli atau membuat offer pada NFT yang Anda miliki sendiri.',
    },
    {
      q: 'Apa itu Badge dan bagaimana cara mendapatkannya?',
      a: 'Badge adalah penghargaan otomatis: 🌟 Early Adopter (100 minter pertama), 📦 Collector (punya 5+ NFT), 💎 Top Seller (10+ penjualan). Badge otomatis diberikan oleh sistem.',
    },
    {
      q: 'Bagaimana cara melihat profil user lain?',
      a: 'Klik pada alamat wallet (owner) di kartu NFT atau halaman detail NFT. Anda akan diarahkan ke profil publik user tersebut.',
    },
    {
      q: 'Apa yang terjadi jika offer saya di-cancel?',
      a: 'NEX yang Anda lock saat membuat offer akan otomatis dikembalikan ke wallet Anda melalui smart contract.',
    },
    {
      q: 'Wallet apa saja yang didukung?',
      a: 'MetaMask, OKX Wallet, dan Bitget Wallet. Pastikan wallet mendukung custom network (EVM compatible).',
    },
    {
      q: 'Apakah ada fitur AI di marketplace?',
      a: 'Ya! Kami menyediakan AI Art Generator untuk membuat artwork, AI Metadata Generator untuk auto-generate nama dan deskripsi, serta AI Hub dengan fitur rarity scoring, price prediction, dan lainnya.',
    },
    {
      q: 'Bagaimana cara menggunakan DEX (Swap & Liquidity)?',
      a: 'Buka menu DEX → Swap untuk menukar token, atau Liquidity untuk menambah likuiditas ke pool. Semua menggunakan protokol UniswapV2 di Nexus Testnet.',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[120px] animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      <SakuraFalling />
      <Navigation />

      <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
        {/* Hero */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Panduan Pengguna</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="gradient-text">Panduan & FAQ</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Pelajari cara menggunakan NexusLabs NFT Marketplace dari awal hingga mahir
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-16 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Mulai Dari Sini</h2>
          </div>

          <Card className="border border-primary/10 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-8 space-y-8">
              {gettingStartedSteps.map((step) => (
                <Step key={step.number} {...step} />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Feature Guides */}
        <section className="mb-16 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Panduan Fitur</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {guides.map((guide, idx) => (
              <Card
                key={idx}
                className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 overflow-hidden"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-xl font-bold">{guide.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {guide.steps.length} langkah
                    </Badge>
                  </div>

                  <ol className="space-y-3 mb-6">
                    {guide.steps.map((step, i) => (
                      <li key={i} className="flex gap-3 items-start text-sm">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-muted-foreground leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>

                  <Button
                    onClick={() => navigate(guide.cta.path)}
                    className="w-full btn-hero gap-2"
                  >
                    {guide.cta.label}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Security Tips */}
        <section className="mb-16 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Tips Keamanan</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                title: 'Jangan Bagikan Private Key',
                desc: 'Jangan pernah membagikan private key atau seed phrase wallet Anda kepada siapapun. NexusLabs tidak akan pernah meminta informasi ini.',
              },
              {
                title: 'Verifikasi Contract Address',
                desc: 'Selalu pastikan Anda berinteraksi dengan contract address yang benar. Periksa alamat di explorer sebelum konfirmasi transaksi besar.',
              },
              {
                title: 'Hati-hati Phishing',
                desc: 'Pastikan URL website benar (sakuranexus.lovable.app). Jangan klik link mencurigakan yang meminta koneksi wallet.',
              },
            ].map((tip, i) => (
              <Card key={i} className="border border-warning/20 bg-warning/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-warning" />
                    <h4 className="font-semibold">{tip.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tip.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="animate-fade-in-up stagger-4">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">Pertanyaan Umum (FAQ)</h2>
          </div>

          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <div className="text-center mt-16 animate-fade-in-up">
          <Card className="inline-block border border-primary/20 bg-primary/5">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-3">Siap Memulai?</h3>
              <p className="text-muted-foreground mb-6">
                Hubungkan wallet Anda dan mulai jelajahi dunia NFT di NexusLabs!
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Button onClick={() => navigate('/marketplace')} className="btn-hero gap-2">
                  <Store className="w-4 h-4" />
                  Jelajahi Marketplace
                </Button>
                <Button onClick={() => navigate('/mint')} variant="outline" className="gap-2">
                  <Palette className="w-4 h-4" />
                  Mint NFT Pertama
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Guide;

import Link from 'next/link'
import { PLANS, PLAN_NAMES, type PlanName } from '@/lib/plans'
import { PlanCard } from '@/components/PlanCard'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg flex items-center justify-center font-black">W</span>
            <span className="text-lg font-bold text-zinc-900 dark:text-white">WMN</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#tinh-nang" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Tính năng</a>
            <a href="#huong-dan" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Hướng dẫn</a>
            <a href="#bang-gia" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Bảng giá</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link href="/signup" className="text-sm px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-900/50 dark:to-zinc-950 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 text-center">
          <span className="inline-block text-xs font-medium text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded-full px-3 py-1 mb-6">
            Nhận thông báo thanh toán qua Webhook
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-zinc-900 dark:text-white tracking-tight leading-tight">
            Thông báo giao dịch
            <br />
            đến server của bạn
            <span className="text-zinc-400"> trong tích tắc</span>
          </h1>
          <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Gắn API key vào app ngân hàng trên điện thoại. Khi có giao dịch, WMN nhận thông báo và
            forward về server bạn qua webhook — tự động, không rớt request.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:opacity-90 transition-opacity">
              Bắt đầu miễn phí
            </Link>
            <a href="#huong-dan" className="px-8 py-3 border border-zinc-300 dark:border-zinc-700 rounded-xl font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
              Xem hướng dẫn
            </a>
          </div>
          <p className="mt-6 text-sm text-zinc-500">Miễn phí để bắt đầu · Không cần thẻ tín dụng</p>
        </div>
      </section>

      {/* FEATURES */}
      <section id="tinh-nang" className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white text-center">Cách hoạt động</h2>
          <p className="text-center text-zinc-500 mt-3 max-w-xl mx-auto">
            3 bước đơn giản từ app điện thoại đến server của bạn
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Tạo API Key', desc: 'Đăng ký tài khoản, vào Dashboard tạo API key. Copy key và gắn vào app trên điện thoại.' },
              { step: '2', title: 'Gửi thông báo', desc: 'App gửi thông báo giao dịch về WMN qua POST request kèm API key — phản hồi 202 ngay lập tức.' },
              { step: '3', title: 'Forward webhook', desc: 'WMN lưu log và forward ngay về URL server của bạn. Không rớt request, tự động retry khi lỗi.' },
            ].map((item) => (
              <div key={item.step} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 transition-transform hover:-translate-y-1">
                <div className="w-10 h-10 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl flex items-center justify-center font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW TO */}
      <section id="huong-dan" className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white text-center">Hướng dẫn tích hợp</h2>
          <div className="mt-10 max-w-2xl mx-auto space-y-6">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">1. Gửi POST request từ app điện thoại:</p>
              <pre className="bg-white dark:bg-zinc-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
{`POST https://webhook-my-notify.vercel.app/api/wmn_endpoint
Headers:
  X-API-Key: wmn_live_xxxxxxxxxxxx
  Content-Type: application/json

Body:
{
  "application": "MBBank",
  "time": "2026-08-27T10:15:00+07:00",
  "money": 500000,
  "detail": "Chuyen tien tu Nguyen Van A"
}`}
              </pre>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">2. Response khi thành công:</p>
              <pre className="bg-white dark:bg-zinc-950 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
{`HTTP/1.1 202 Accepted
{
  "status": "accepted"
}`}
              </pre>
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">3. Cấu hình webhook forward (tùy chọn):</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Vào Dashboard → Webhook → nhập Target URL của server bạn. Mỗi thông báo sẽ được POST sang URL này.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="bang-gia" className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white text-center">Bảng giá</h2>
          <p className="text-center text-zinc-500 mt-3 max-w-xl mx-auto">
            Chọn gói phù hợp với nhu cầu của bạn. Nâng cấp bất cứ lúc nào.
          </p>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLAN_NAMES.map((name) => (
              <PlanCard key={name} name={name as PlanName} />
            ))}
          </div>
          <p className="text-center text-sm text-zinc-500 mt-8">
            Cần gói riêng theo quy mô?{' '}
            <Link href="/signup" className="text-zinc-900 dark:text-white underline">Liên hệ với chúng tôi</Link>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">Bắt đầu ngay hôm nay</h2>
          <p className="mt-4 text-zinc-500 max-w-xl mx-auto">
            Tạo tài khoản miễn phí và nhận thông báo thanh toán đầu tiên trong vài phút.
          </p>
          <Link href="/signup" className="inline-block mt-8 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl font-medium hover:opacity-90 transition-opacity">
            Tạo tài khoản miễn phí
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">Webhook My Notify (WMN) &copy; 2026</span>
          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a href="#tinh-nang" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Tính năng</a>
            <a href="#huong-dan" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Hướng dẫn</a>
            <a href="#bang-gia" className="hover:text-zinc-900 dark:hover:text-white transition-colors">Bảng giá</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

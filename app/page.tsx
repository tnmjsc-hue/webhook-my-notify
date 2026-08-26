import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white">WMN</h1>
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

      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight">
          Nhận thông báo thanh toán
          <br />
          <span className="text-zinc-500">qua Webhook</span>
        </h2>
        <p className="mt-6 text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
          Gắn API key vào app ngân hàng trên điện thoại. Khi có giao dịch, WMN sẽ nhận thông báo và forward về server của bạn qua webhook — tự động, không rớt request.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="px-6 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Bắt đầu miễn phí
          </Link>
          <a href="#huong-dan" className="px-6 py-3 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
            Xem hướng dẫn
          </a>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-12">Cách hoạt động</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Tạo API Key', desc: 'Đăng ký tài khoản, vào Dashboard tạo API key. Copy key và gắn vào app trên điện thoại.' },
              { step: '2', title: 'Gửi thông báo', desc: 'App trên điện thoại gửi thông báo giao dịch về WMN qua POST request kèm API key.' },
              { step: '3', title: 'Forward webhook', desc: 'WMN nhận, lưu log, và forward ngay về URL server của bạn. Không rớt request nhờ hàng đợi.' },
            ].map((item) => (
              <div key={item.step} className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="w-8 h-8 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg flex items-center justify-center font-bold text-sm mb-4">
                  {item.step}
                </div>
                <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="huong-dan" className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-12">Hướng dẫn tích hợp</h3>
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">1. Gửi POST request từ app điện thoại:</p>
              <pre className="bg-white dark:bg-zinc-900 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
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
            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">2. Response khi thành công:</p>
              <pre className="bg-white dark:bg-zinc-900 rounded-lg p-4 font-mono text-xs overflow-x-auto border border-zinc-200 dark:border-zinc-800">
{`HTTP/1.1 202 Accepted
{
  "status": "accepted"
}`}
              </pre>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-xl p-4">
              <p className="text-sm font-medium text-zinc-900 dark:text-white mb-2">3. Cấu hình webhook forward (tùy chọn):</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Vào Dashboard → Webhook → nhập Target URL của server bạn. Mỗi thông báo sẽ được POST sang URL này.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <h3 className="text-2xl font-bold text-zinc-900 dark:text-white text-center mb-12">Bảng giá</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Free</h4>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">0đ<span className="text-sm font-normal text-zinc-500">/tháng</span></p>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>100 thông báo/ngày</li>
                <li>1 API key</li>
                <li>Webhook forward</li>
                <li>Log 7 ngày</li>
              </ul>
              <Link href="/signup" className="mt-6 block text-center py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                Đăng ký
              </Link>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl border-2 border-zinc-900 dark:border-white p-6 relative">
              <span className="absolute -top-3 left-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold px-2 py-0.5 rounded">PHỔ BIẾN</span>
              <h4 className="font-semibold text-zinc-900 dark:text-white mb-1">Pro</h4>
              <p className="text-3xl font-bold text-zinc-900 dark:text-white mb-4">99.000đ<span className="text-sm font-normal text-zinc-500">/tháng</span></p>
              <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
                <li>Không giới hạn thông báo</li>
                <li>5 API keys</li>
                <li>Webhook forward</li>
                <li>Log 90 ngày</li>
                <li>Ưu tiên hỗ trợ</li>
              </ul>
              <Link href="/signup" className="mt-6 block text-center py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Nâng cấp
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-5xl mx-auto px-6 py-6 text-center text-sm text-zinc-500">
          Webhook My Notify (WMN) &copy; 2026
        </div>
      </footer>
    </div>
  )
}

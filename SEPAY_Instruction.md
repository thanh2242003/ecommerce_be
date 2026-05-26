Lập trình webhook SePay với Node.js
Dựng endpoint webhook SePay bằng Node.js + Express + mysql2 đạt chuẩn production: xác thực HMAC-SHA256, chống trùng race-safe với INSERT IGNORE.


Mở bằng AI
ChatGPT
ChatGPT
Claude
Claude
Perplexity
Perplexity
Grok
Grok
Cursor
Cursor

Sao chép cho AI

Xem Markdown
Hướng dẫn đầy đủ để dựng một endpoint Node.js + Express nhận webhook SePay: xác thực HMAC-SHA256, chống trùng giao dịch an toàn khi đồng thời, lưu vào MySQL. Node 18+, ESM, mysql2.

Yêu cầu
Node.js 18.0+ (có fetch native, node:crypto)
MySQL 5.7+ hoặc MariaDB 10.3+
express, mysql2
URL endpoint công khai (HTTPS cho production)
1. Tạo database
SQL

CREATE DATABASE sepay_webhook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
 
USE sepay_webhook;
 
CREATE TABLE transactions (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    sepay_id        BIGINT NOT NULL UNIQUE,
    gateway         VARCHAR(100) NOT NULL,
    transaction_date DATETIME NOT NULL,
    account_number  VARCHAR(100),
    sub_account     VARCHAR(250),
    code            VARCHAR(250),
    amount_in       BIGINT NOT NULL DEFAULT 0,
    amount_out      BIGINT NOT NULL DEFAULT 0,
    accumulated     BIGINT NOT NULL DEFAULT 0,
    content         TEXT,
    reference_code  VARCHAR(255),
    body            JSON NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_account (account_number, transaction_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
Lý do:

sepay_id UNIQUE (khoá duy nhất): khi webhook retry gửi cùng giao dịch, INSERT IGNORE sẽ lặng lẽ bỏ qua bản ghi trùng thay vì báo lỗi.
BIGINT cho tiền: VND không có phần thập phân, INT max 2.1 tỷ sẽ tràn với đơn B2B.
body JSON: lưu payload gốc để debug hoặc query sau.
2. Tạo webhook trên Dashboard
Dashboard → Webhooks → Thêm:

Trường	Giá trị
Tên	Webhook server Node
URL	https://your-server.com/webhook/sepay
Loại sự kiện	Tiền vào (hoặc Cả hai)
Tài khoản	Chọn tài khoản cần theo dõi
Xác thực	HMAC-SHA256
Copy Secret Key (chỉ hiện đầy đủ 1 lần), lưu vào .env:

Bash

SEPAY_WEBHOOK_SECRET=<secret_key_của_bạn>
DB_HOST=localhost
DB_USER=db_user
DB_PASS=db_password
DB_NAME=sepay_webhook
3. Cài dependencies
Bash

npm init -y
npm install express mysql2 dotenv
Thêm "type": "module" vào package.json để kích hoạt ES modules (ESM), cho phép dùng cú pháp import/export thay vì require.

4. Endpoint Node.js
Tạo file server.js:

JS
JavaScript

import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import mysql from 'mysql2/promise';
 
const app = express();
 
const db = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});
 
// Giữ raw body (không parse JSON) để tái tạo chữ ký HMAC.
// Dùng express.raw() cho /webhook/sepay, KHÔNG dùng express.json().
app.post(
  '/webhook/sepay',
  express.raw({ type: '*/*' }),
  async (req, res) => {
    try {
      const body = req.body.toString('utf8');
      if (!body) {
        return res.status(400).json({ success: false, message: 'Empty body' });
      }
 
      // 1. Xác thực HMAC-SHA256
      const signature = req.headers['x-sepay-signature'] ?? '';
      const timestamp = Number(req.headers['x-sepay-timestamp'] ?? 0);
      const secret    = process.env.SEPAY_WEBHOOK_SECRET;
 
      // Chống replay: timestamp lệch quá 5 phút bị từ chối
      if (Math.abs(Date.now() / 1000 - timestamp) > 300) {
        return res.status(401).json({ success: false, message: 'Request expired' });
      }
 
      const expected = 'sha256=' + crypto.createHmac('sha256', secret)
        .update(`${timestamp}.${body}`)
        .digest('hex');
 
      const sig = Buffer.from(signature);
      const exp = Buffer.from(expected);
      if (sig.length !== exp.length || !crypto.timingSafeEqual(sig, exp)) {
        return res.status(401).json({ success: false, message: 'Invalid signature' });
      }
 
      // 2. Parse JSON
      const data = JSON.parse(body);
      if (!data?.id) {
        return res.status(400).json({ success: false, message: 'Invalid payload' });
      }
 
      // 3. Chống trùng giao dịch ở tầng database: INSERT IGNORE bỏ qua nếu sepay_id đã tồn tại
      const [result] = await db.execute(
        `INSERT IGNORE INTO transactions
         (sepay_id, gateway, transaction_date, account_number, sub_account,
          code, amount_in, amount_out, accumulated, content, reference_code, body)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.id,
          data.gateway,
          data.transactionDate,
          data.accountNumber,
          data.subAccount ?? '',
          data.code,
          data.transferType === 'in'  ? data.transferAmount : 0,
          data.transferType === 'out' ? data.transferAmount : 0,
          data.accumulated ?? 0,
          data.content,
          data.referenceCode ?? '',
          body,
        ],
      );
 
      if (result.affectedRows === 0) {
        // Đã xử lý trước đó. Trả OK để SePay không retry.
        return res.json({ success: true });
      }
 
      // 4. Business logic: chỉ chạy khi giao dịch lần đầu được lưu (INSERT thành công)
      if (data.transferType === 'in' && data.code) {
        // Ví dụ: cập nhật đơn hàng
        await db.execute(
          `UPDATE orders SET status = 'paid', paid_at = NOW()
           WHERE code = ? AND status = 'pending' AND amount <= ?`,
          [data.code, data.transferAmount],
        );
 
        // TODO: enqueue job gửi email, cập nhật kho, etc.
      }
 
      res.json({ success: true });
 
    } catch (err) {
      console.error('SePay webhook error:', err);
      res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
);
 
// Health check cho monitor
app.get('/health', (_, res) => res.json({ ok: true }));
 
app.listen(3000, () => console.log('Listening on :3000'));
Raw body, không JSON parse
HMAC-SHA256 ký trên bytes gốc. Dùng express.raw({ type: '*/*' }) cho route /webhook/sepay. KHÔNG dùng app.use(express.json()) global vì nó parse body thành object rồi JSON.stringify lại sẽ lệch với bytes gốc (PHP escape Unicode \uXXXX, JS thì không).

Nếu dùng Fastify, Hono, Koa: đọc docs framework tương ứng để lấy raw body.

5. Run + test
Bash

node server.js
Local test với ngrok (expose localhost 3000 ra Internet):

Bash

ngrok http 3000
# Copy URL https://xxx.ngrok-free.app/webhook/sepay vào webhook config
Gửi thử từ Dashboard
Webhook → ⋮ → Gửi thử. Payload mẫu + kết quả HTTP hiện ngay.

Giao dịch thật
Chuyển 10.000₫ vào tài khoản đã liên kết. Mở Lịch sử gửi, check log mới nhất Status Thành công.

Query DB:

SQL

SELECT * FROM transactions ORDER BY id DESC LIMIT 5;

Khách đặt hàng → thấy QR → quét bằng app ngân hàng → chuyển khoản → SePay gửi webhook → server của bạn cập nhật đơn hàng → trang thanh toán tự chuyển sang Thành công. Toàn bộ luồng này xong trong 1 file HTML + 3 endpoint backend.

Yêu cầu
Liên kết tài khoản ngân hàng trên my.sepay.vn
Tạo webhook nhận giao dịch, xem Bắt đầu nhanh
Cấu hình mã thanh toán tại Công ty → Cấu hình chung → Cấu trúc mã thanh toán
Luồng hoạt động
Luồng thanh toán QR + Webhook

Fullscreen
Ngân hàng
SePay
Backend
Frontend
Khách
Ngân hàng
SePay
Backend
Frontend
Khách
loop
[mỗi 3 giây]
Bấm Thanh toán
POST /api/orders (tạo đơn)
{code, qrUrl}
Hiển thị QR + đếm ngược
Quét QR, xác nhận
Thông báo giao dịch
POST /webhook/sepay
UPDATE orders SET status='paid'
GET /api/orders/:code/status
{status: 'paid'}
Thanh toán thành công
URL tạo QR
SePay sinh ảnh QR qua endpoint qr.sepay.vn/img. App ngân hàng quét mã sẽ điền sẵn số tài khoản, số tiền, nội dung.

Code

https://qr.sepay.vn/img?acc={SO_TK}&bank={NGAN_HANG}&amount={TIEN}&des={NOI_DUNG}
acc
string
required
Số tài khoản thụ hưởng
bank
string
required
Mã ngắn ngân hàng. Danh sách: qr.sepay.vn/banks.json
amount
integer
Số tiền (VND)
des
string
Nội dung chuyển khoản (URL-encode)
Ví dụ:

Code

https://qr.sepay.vn/img?acc=0010000000355&bank=Vietcombank&amount=100000&des=DH12345
QR code thanh toán mẫu
Nhấn để phóng to
Mã QR chuyển khoản với số tiền và nội dung điền sẵn
Chi tiết đầy đủ: Tạo và nhúng QR Code.

Frontend: Trang thanh toán
Frontend hiển thị QR kèm bộ đếm ngược. Mỗi 3 giây, frontend gọi API kiểm tra trạng thái đơn. Khi hết 15 phút mà chưa thanh toán thì đánh dấu hết hạn.


JS
HTML + JavaScript

React / Next.js

<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Thanh toán đơn hàng</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: system-ui, sans-serif; background: #f5f5f5;
           min-height: 100dvh; margin: 0; display: grid; place-items: center; padding: 1rem; }
    .card { width: min(100%, 28rem); background: #fff; border-radius: 1rem;
            overflow: hidden; box-shadow: 0 4px 24px rgb(0 0 0 / 0.08); }
    .card header { background: #1a56db; color: #fff; padding: 1.25rem; text-align: center; }
    .card header strong { display: block; font-size: 1.75rem; }
    .card main { padding: 1.5rem; display: grid; gap: 1rem; }
    .qr { width: 15rem; height: 15rem; margin: 0 auto; }
    dl { background: #f8fafc; border-radius: .5rem; padding: 1rem; margin: 0;
         display: grid; grid-template-columns: auto 1fr; gap: .5rem 1rem; font-size: .9rem; }
    dt { color: #6b7280; } dd { margin: 0; font-weight: 600; text-align: right; }
    .status { padding: .75rem; border-radius: .5rem; text-align: center; font-weight: 600; }
    .status[data-state="waiting"] { background: #fef3c7; color: #92400e; }
    .status[data-state="paid"]    { background: #d1fae5; color: #065f46; }
    .status[data-state="expired"] { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <article class="card">
    <header>
      <div>Thanh toán đơn hàng</div>
      <strong id="amount"></strong>
    </header>
    <main>
      <img id="qr" class="qr" alt="QR code thanh toán">
      <p>Mở app ngân hàng → Quét QR → Xác nhận</p>
      <dl>
        <dt>Ngân hàng</dt>    <dd id="bank"></dd>
        <dt>Số tài khoản</dt> <dd id="account"></dd>
        <dt>Nội dung</dt>     <dd id="content"></dd>
      </dl>
      <div id="status" class="status" data-state="waiting"></div>
    </main>
  </article>
 
  <script type="module">
    const ORDER = {
      code: 'DH12345', amount: 100000,
      bank: 'Vietcombank', accountNumber: '0010000000355',
    };
 
    const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
    const $ = (id) => document.getElementById(id);
 
    // Điền thông tin + QR
    $('amount').textContent  = vnd.format(ORDER.amount);
    $('bank').textContent    = ORDER.bank;
    $('account').textContent = ORDER.accountNumber;
    $('content').textContent = ORDER.code;
    $('qr').src = `https://qr.sepay.vn/img?${new URLSearchParams({
      acc: ORDER.accountNumber, bank: ORDER.bank,
      amount: ORDER.amount, des: ORDER.code,
    })}`;
 
    // Poll trạng thái đơn hàng
    const deadline = Date.now() + 15 * 60_000;
    const status = $('status');
 
    async function tick() {
      const left = deadline - Date.now();
      if (left <= 0) {
        status.dataset.state = 'expired';
        status.textContent = 'Đơn hàng đã hết hạn';
        return;
      }
 
      const mm = String(Math.floor(left / 60_000)).padStart(2, '0');
      const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, '0');
 
      try {
        const res = await fetch(`/api/orders/${ORDER.code}/status`);
        const data = await res.json();
        if (data.status === 'paid') {
          status.dataset.state = 'paid';
          status.textContent = 'Thanh toán thành công';
          return;
        }
      } catch {}
 
      status.textContent = `Đang chờ thanh toán · ${mm}:${ss}`;
      setTimeout(tick, 3000);
    }
    tick();
  </script>
</body>
</html>
Nên dùng Polling hay Server-Sent Events?
Polling 3 giây/lần đơn giản, đủ nhanh cho UX thanh toán. Nếu dùng cùng backend cho nhiều đơn hàng, cân nhắc SSE (EventSource) hoặc WebSocket để server đẩy sự kiện thay vì client hỏi. Khi đó webhook handler chỉ cần pubsub.publish(code, 'paid') sau khi UPDATE.

Backend: 3 endpoint
POST /api/orders: tạo đơn, trả mã + QR URL.
GET /api/orders/:code/status: frontend poll.
POST /webhook/sepay: nhận webhook từ SePay.

PHP
PHP

Node.js

<?php
// db.php
$pdo = new PDO('mysql:host=localhost;dbname=myshop;charset=utf8mb4', 'user', 'pass',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
 
// --- POST /api/orders ---------------------------------------------
require 'db.php';
header('Content-Type: application/json');
 
$code   = 'DH' . bin2hex(random_bytes(6));
$amount = (int) ($_POST['amount'] ?? 100000);
 
$pdo->prepare('INSERT INTO orders (code, amount, status) VALUES (?, ?, \'pending\')')
    ->execute([$code, $amount]);
 
echo json_encode([
    'code'          => $code,
    'amount'        => $amount,
    'bank'          => 'Vietcombank',
    'accountNumber' => '0010000000355',
    'qrUrl'         => 'https://qr.sepay.vn/img?' . http_build_query([
        'acc' => '0010000000355', 'bank' => 'Vietcombank',
        'amount' => $amount, 'des' => $code,
    ]),
]);
 
 
// --- GET /api/orders/:code/status ---------------------------------
require 'db.php';
header('Content-Type: application/json');
 
$stmt = $pdo->prepare('SELECT status FROM orders WHERE code = ?');
$stmt->execute([$_GET['code'] ?? '']);
echo json_encode(['status' => $stmt->fetchColumn() ?: 'not_found']);
 
 
// --- POST /webhook/sepay ------------------------------------------
require 'db.php';
header('Content-Type: application/json');
 
// 1. Xác thực API Key (constant-time)
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if (!hash_equals('Apikey ' . getenv('SEPAY_API_KEY'), $auth)) {
    http_response_code(401);
    echo json_encode(['success' => false]);
    exit;
}
 
$body = file_get_contents('php://input');
$data = json_decode($body, true);
 
// 2. Chống trùng: UNIQUE(transaction_id) + INSERT IGNORE (race-safe)
$log = $pdo->prepare('INSERT IGNORE INTO webhook_logs (transaction_id, body) VALUES (?, ?)');
$log->execute([$data['id'], $body]);
if ($log->rowCount() === 0) {
    echo json_encode(['success' => true]); // đã xử lý trước đó
    exit;
}
 
// 3. UPDATE atomic: chỉ đổi pending → paid nếu tiền đủ
if ($data['transferType'] === 'in' && !empty($data['code'])) {
    $pdo->prepare(
        'UPDATE orders SET status = \'paid\', paid_at = NOW()
         WHERE code = ? AND status = \'pending\' AND amount <= ?'
    )->execute([$data['code'], $data['transferAmount']]);
 
    // TODO: enqueue email / cập nhật kho
}
 
echo json_encode(['success' => true]);
UPDATE atomic thay cho SELECT-then-UPDATE
UPDATE ... WHERE status = 'pending' AND amount <= ? chạy trong một câu lệnh, không cần transaction. Nếu 2 webhook đến cùng lúc (retry), chỉ lần đầu đổi được pending → paid, lần sau điều kiện status = 'pending' không còn khớp nên không làm gì. Đảm bảo không cộng tiền/gửi email 2 lần.

Database schema
SQL

CREATE TABLE orders (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE COMMENT 'Mã thanh toán (nội dung CK)',
    amount      BIGINT      NOT NULL COMMENT 'Số tiền VND',
    status      ENUM('pending', 'paid', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
    paid_at     DATETIME,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status_created (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
 
CREATE TABLE webhook_logs (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    transaction_id  BIGINT NOT NULL UNIQUE COMMENT 'ID giao dịch SePay',
    body            JSON   NOT NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
Vì sao chọn kiểu này:

amount BIGINT: VND không có phần thập phân. INT max 2.1 tỷ, hoá đơn B2B dễ tràn.
code UNIQUE: chặn trùng mã thanh toán ở tầng DB.
transaction_id UNIQUE: khoá chống trùng webhook. Cùng với INSERT IGNORE trong handler, không cần lock.
body JSON: query được theo field với JSON_EXTRACT khi debug.
idx_status_created (status, created_at): query "đơn pending cũ hơn X phút để expire".
Checklist production
Bảo mật mã thanh toán
Mã thanh toán phải khó đoán. Dùng bin2hex(random_bytes(6)) (PHP) hoặc crypto.randomBytes(6).toString('hex') (Node). Không dùng số tăng dần hoặc timestamp đơn thuần, kẻ xấu đoán được mã có thể gửi webhook giả hoặc claim đơn người khác.

Validate số tiền ở SQL, không ở code
Đặt amount <= ? trong WHERE của câu UPDATE. Check ở PHP/Node có thể bị race: hai webhook cùng lúc, cả hai đều thấy status='pending', cả hai đều update.

Bật HMAC-SHA256 khi production
API Key chỉ xác minh request đến từ SePay, nhưng không bảo vệ payload nếu có ai chen ngang sửa đổi giữa đường truyền. Chuyển sang HMAC-SHA256 khi lên prod.

Trả 200 trước, xử lý nặng sau
Webhook có timeout 30 giây. Gửi email, cập nhật kho, gọi API bên thứ ba: đẩy vào queue (Redis, SQS, rabbitmq) rồi trả {"success": true} ngay.

Tại sao cần đối soát?
Webhook gửi giao dịch theo thời gian thực, nhưng đôi lúc vẫn có trường hợp webhook không đến được server của bạn:

Server tạm ngưng (deploy, restart, downtime)
Lỗi mạng giữa SePay và server
Webhook bị timeout vì server xử lý quá lâu
Đã hết số lần retry (tối đa 7 lần trong 33 phút)
Để không bỏ sót giao dịch, bạn nên chạy đối soát định kỳ: gọi SePay API lấy danh sách giao dịch, so khớp với database của bạn, rồi bổ sung những bản ghi còn thiếu.

Các bước
1. Lấy danh sách giao dịch từ SePay
Gọi API lấy giao dịch trong khoảng thời gian cần đối soát:

GET
https://userapi.sepay.vn/v2/transactions

transaction_date_from
string
Ngày bắt đầu (bao gồm), định dạng YYYY-MM-DD HH:mm:ss
transaction_date_to
string
Ngày kết thúc (bao gồm), định dạng YYYY-MM-DD HH:mm:ss
bank_account_id
string
Lọc theo UUID tài khoản ngân hàng (không bắt buộc)
per_page
integer
Số giao dịch mỗi trang, tối đa 100 (mặc định 20)
page
integer
Số trang (mặc định 1)
since_id
string
UUID giao dịch cuối đã xử lý, trả các giao dịch mới hơn
Danh sách đầy đủ tham số: SePay API - Danh sách giao dịch.

Ví dụ: lấy giao dịch ngày 01/03/2026

Bash

curl -X GET "https://userapi.sepay.vn/v2/transactions?transaction_date_from=2026-03-01%2000:00:00&transaction_date_to=2026-03-01%2023:59:59&per_page=100" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
2. So khớp với database
So sánh giao dịch từ SePay với database của bạn. Dùng trường id (UUID) hoặc reference_number để xác định giao dịch nào bị thiếu.

3. Bổ sung giao dịch thiếu
Giao dịch có trên SePay nhưng không có trong database thì lưu bổ sung và xử lý logic (cập nhật đơn hàng, ghi nhận thanh toán...).

Code mẫu

PHP
PHP

Node.js

PY
Python

<?php
$token = getenv('SEPAY_API_TOKEN');
$pdo   = new PDO('mysql:host=localhost;dbname=db_name;charset=utf8mb4', 'db_user', 'db_pass',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
 
$dateFrom = date('Y-m-d H:i:s', strtotime('-24 hours'));
$dateTo   = date('Y-m-d H:i:s');
 
// 1. Lấy giao dịch 24h gần nhất từ SePay
$url = 'https://userapi.sepay.vn/v2/transactions?' . http_build_query([
    'transaction_date_from' => $dateFrom,
    'transaction_date_to'   => $dateTo,
    'per_page'              => 100,
]);
 
$ctx = stream_context_create(['http' => [
    'header' => "Authorization: Bearer $token\r\nContent-Type: application/json",
]]);
$result = json_decode(file_get_contents($url, false, $ctx), true);
$transactions = $result['data'] ?? [];
printf("SePay: %d giao dich\n", count($transactions));
 
// 2. Đã lưu những giao dịch nào?
$stmt = $pdo->prepare('SELECT reference_number FROM tb_transactions WHERE created_at >= ?');
$stmt->execute([$dateFrom]);
$existing = array_flip($stmt->fetchAll(PDO::FETCH_COLUMN));
 
// 3. Bổ sung phần còn thiếu. UNIQUE(sepay_id) đảm bảo không trùng.
$insert = $pdo->prepare('INSERT IGNORE INTO tb_transactions
    (sepay_id, gateway, transaction_date, account_number, sub_account,
     amount_in, amount_out, accumulated, code, transaction_content, reference_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
 
$missing = 0;
foreach ($transactions as $tx) {
    if (isset($existing[$tx['reference_number']])) continue;
 
    $insert->execute([
        $tx['id'], $tx['bank_brand_name'], $tx['transaction_date'],
        $tx['account_number'], $tx['va'] ?? '',
        $tx['amount_in'] ?? 0, $tx['amount_out'] ?? 0, $tx['accumulated'] ?? 0,
        $tx['code'], $tx['transaction_content'], $tx['reference_number'],
    ]);
    $missing++;
}
 
printf("Xong. Bo sung %d giao dich.\n", $missing);
Mẹo
Nên đặt cron job chạy đối soát tự động, ví dụ mỗi giờ:

Bash

0 * * * * node /path/to/reconcile.js >> /var/log/reconcile.log 2>&1
Chiến lược đối soát
Chọn một trong hai cách tuỳ vào tần suất chạy đối soát:


Theo khoảng thời gian


Theo since_id

Lưu ý
Rate limit (giới hạn tốc độ gọi): API chỉ cho phép tối đa 3 request/giây. Vượt quá sẽ trả HTTP 429.
Chống trùng: Luôn kiểm tra id (UUID) hoặc reference_number trước khi lưu.
Phân trang: Dùng page và per_page (tối đa 100). Khi dữ liệu lớn, chia nhỏ khoảng thời gian hoặc dùng since_id.
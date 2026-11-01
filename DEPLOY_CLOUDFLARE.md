# Triển khai hiện tại: Cloudflare Worker static assets

Website: https://agritrace-portal.ttmychau93.workers.dev

Cấu hình được lưu tại wrangler.jsonc, giữ SPA fallback và tắt preview URLs. Dùng tài khoản Cloudflare đã được chủ dự án xác thực; không đưa token vào repository.

Build: npm run build

Triển khai: npm exec --yes --package=wrangler@4.152.0 -- wrangler deploy

Kiểm tra public: node node_modules/@playwright/test/cli.js test --config playwright.public.config.ts

## Hướng dẫn Pages ban đầu (tham khảo lịch sử)

# Triển khai AgriTrace lên Cloudflare Pages

## Gói website đã build

Gói ZIP được tạo từ nội dung thư mục `dist/`, với `index.html` nằm ngay gốc ZIP. Không tải cả thư mục project, `node_modules`, tệp `.env` hoặc Git lên phần Direct Upload.

1. Tạo tài khoản và xác minh email tại https://dash.cloudflare.com/sign-up.
2. Trong Cloudflare Dashboard, mở **Workers & Pages**, tạo ứng dụng **Pages**, rồi chọn **Direct Upload / Drag and drop**.
3. Đặt tên project, ví dụ `agritrace-portal` nếu tên còn trống.
4. Tải gói ZIP hoặc nội dung thư mục `dist/`, rồi triển khai.
5. Cloudflare cấp URL `https://<ten-project>.pages.dev`. URL thực tế chỉ được xác định sau khi triển khai thành công.

Cloudflare Pages tự hỗ trợ SPA fallback khi không có tệp `404.html` ở gốc. Không thêm `404.html` vào bản build này: các route React như `/standards/srp`, `/plots/...` và `/trace/plots/...` cần được trả về `index.html` khi mở trực tiếp.

## Kiểm tra sau triển khai

- Đăng nhập, tải lại một route được bảo vệ và kiểm tra đăng xuất.
- Mở trực tiếp `/standards/srp` và xác nhận không bị HTTP 404.
- Mở `/trace/plots/VN-66-04-12-HTX01-T015/LO-2027-001` khi chưa đăng nhập; trang này phải công khai.
- QR phải trỏ tới hostname đã triển khai, không phải localhost.
- Kiểm tra bản đồ và giao diện mobile.

Đây là frontend demo. Phiên, thay đổi tài khoản và trạng thái thông báo dùng `sessionStorage` trong từng trình duyệt; chưa có backend/tài khoản dùng chung.

Bản production mặc định ẩn bảng tài khoản demo. Các tài khoản ban đầu: `quanly`, `htx`, `kythuat`, `doanhnghiep`; mật khẩu `demo123`. Muốn hiện bảng tài khoản demo trong một bản demo công khai, đặt `VITE_SHOW_DEMO_ACCOUNTS=true` trước khi build lại.

## Build cập nhật

```powershell
npm ci
npm run build
```

Nếu sau này muốn Cloudflare tự build qua Git, cấu hình build command `npm run build`, output directory `dist`, và đặt root directory đúng thư mục chứa `package.json`. Chỉ kết nối Git sau khi phiên bản mã nguồn mong muốn đã được đẩy lên repository. Project Direct Upload có thể cập nhật bằng upload hoặc Wrangler; muốn dùng Cloudflare Git integration thì tạo project Pages mới.

## Tài liệu chính thức

- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
- https://developers.cloudflare.com/pages/platform/limits/

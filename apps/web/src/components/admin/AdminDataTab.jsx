import { useEffect, useState } from "react";
import {
  Admin, Resource, List, Datagrid, Edit, Create, Show, SimpleForm, SimpleShowLayout, Labeled,
  TextField, NumberField, BooleanField, DateField, FunctionField, SearchInput,
  TextInput, NumberInput, BooleanInput, DateTimeInput, SelectInput,
  BulkDeleteButton, EditButton, ShowButton, DeleteButton, TopToolbar, CreateButton,
  fetchUtils, mergeTranslations, useResourceDefinitions, defaultTheme,
} from "react-admin";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import simpleRestProvider from "ra-data-simple-rest";
import polyglotI18nProvider from "ra-i18n-polyglot";
import englishMessages from "ra-language-english";
import vietnameseMessages from "ra-language-vietnamese";
import { API_BASE } from "../../config/apiBase";

/**
 * Dữ liệu — CRUD cho mọi bảng mà server cho phép (apps/server/routes/admin/adminDataRoutes.js).
 * Cột, ô sửa, quyền đều do server trả về theo vai trò; thêm bảng thì sửa ở server,
 * không sửa ở đây. Bản tiếng Việt của react-admin là bản v3, khoá thiếu rơi về tiếng Anh.
 */
const BASE = "/admin/data";
const httpClient = (url, options = {}) => fetchUtils.fetchJson(url, { ...options, credentials: "include" });
const dataProvider = simpleRestProvider(`${API_BASE}/admin/data`, httpClient);
const i18nProvider = polyglotI18nProvider(() => mergeTranslations(englishMessages, vietnameseMessages), "vi", [], { allowMissing: true });
const theme = {
  ...defaultTheme,
  shape: { borderRadius: 12 },
  typography: { fontFamily: "inherit" },
  components: { ...defaultTheme.components, MuiButton: { defaultProps: { disableElevation: true } } },
};

// Tên cột tiếng Việt; trường chưa có ở đây thì hiện tên gốc.
const LABELS = {
  email: "Email", displayName: "Tên", fullName: "Họ tên", name: "Tên", phone: "Điện thoại", status: "Trạng thái",
  createdAt: "Tạo lúc", updatedAt: "Cập nhật", expiresAt: "Hết hạn", trialExpiresAt: "Hết dùng thử", joyBalance: "Số dư JOY",
  isEduVerified: "Đã xác minh HS-SV", starVip: "VIP", isJoyWalletFrozen: "Khoá ví", profilePublic: "Hồ sơ công khai", headline: "Giới thiệu ngắn",
  issue: "Nội dung", adminReply: "Trả lời của admin", resolvedAt: "Xử lý lúc", contacted: "Đã liên hệ", notes: "Ghi chú", message: "Lời nhắn",
  projectType: "Loại dự án", budget: "Ngân sách", timeline: "Thời hạn", voucherCode: "Mã ưu đãi", projectId: "Mã dự án", market: "Thị trường",
  adminNote: "Ghi chú admin", duration: "Thời lượng", durationUnit: "Đơn vị", giftCode: "Mã quà", color: "Màu", description: "Mô tả",
  priceJoy: "Giá JOY", category: "Danh mục", stock: "Tồn kho", active: "Đang bán", imageUrl: "Ảnh", productType: "Loại", productName: "Sản phẩm",
  purchaseCode: "Mã mua", code: "Mã", discountType: "Kiểu giảm", discountValue: "Mức giảm", maxUses: "Lượt tối đa", usedCount: "Đã dùng",
  minOrderJoy: "Đơn tối thiểu", amount: "Số JOY", redeemed: "Đã đổi", redeemedBy: "Người đổi", redeemedAt: "Đổi lúc", balanceAfter: "Số dư sau",
  source: "Nguồn", refId: "Mã tham chiếu", title: "Tiêu đề", type: "Loại", stageId: "Chặng", pinned: "Ghim", url: "Liên kết", body: "Nội dung",
  year: "Năm", views: "Lượt xem", authorEmail: "Người đăng", text: "Nội dung", likeCount: "Thích", replyCount: "Trả lời",
  subjectType: "Đối tượng", reasonCode: "Lý do", permanent: "Vĩnh viễn", lockCount: "Số lần khoá", caseId: "Mã vụ việc", severity: "Mức độ",
  lastActiveAt: "Dùng lần cuối", "push.sent": "Push đã gửi", "push.opened": "Push được mở", "push.ignored": "Bỏ qua liên tiếp",
  "push.lastSentAt": "Push gần nhất", hours: "Giờ hay dùng", apps: "Khu hay dùng", days: "Ngày có dùng",
  action: "Hành động", path: "Đường dẫn", level: "Mức", stack: "Chi tiết lỗi", adminUsername: "Admin", targetEmail: "Tác động lên", details: "Chi tiết",
};
const label = (name) => LABELS[name] || name;

const LONG = new Set(["description", "body", "adminReply", "notes", "adminNote", "issue", "message", "text", "stack"]);

const Field = ({ f }) => {
  const props = { source: f.name, label: label(f.name) };
  if (f.type === "number") return <NumberField {...props} />;
  if (f.type === "bool") return <BooleanField {...props} />;
  if (f.type === "date") return <DateField {...props} showTime locales="vi-VN" />;
  if (f.type === "json") return <FunctionField {...props} render={(r) => <pre className="max-w-xl whitespace-pre-wrap text-xs">{JSON.stringify(r[f.name], null, 2)}</pre>} />;
  return <TextField {...props} sx={LONG.has(f.name) ? { whiteSpace: "pre-wrap" } : { maxWidth: 320, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} />;
};

const Input = ({ f }) => {
  const props = { source: f.name, label: label(f.name), fullWidth: true };
  if (f.options) return <SelectInput {...props} choices={f.options.map((id) => ({ id, name: id }))} emptyText="—" />;
  if (f.type === "number") return <NumberInput {...props} />;
  if (f.type === "bool") return <BooleanInput {...props} />;
  if (f.type === "date") return <DateTimeInput {...props} />;
  return <TextInput {...props} multiline={LONG.has(f.name)} minRows={LONG.has(f.name) ? 3 : undefined} />;
};

const ReadOnly = ({ fields }) => fields.map((f) => <Labeled key={f.name} label={label(f.name)} fullWidth><Field f={f} /></Labeled>);

const views = (r) => {
  const can = (op) => r.ops.includes(op);
  const list = () => (
    <List perPage={25} sort={{ field: "id", order: "DESC" }} filters={[<SearchInput key="q" source="q" alwaysOn />]}
      actions={<TopToolbar>{can("c") && <CreateButton />}</TopToolbar>}>
      <Datagrid rowClick={can("u") ? "edit" : "show"} bulkActionButtons={can("d") ? <BulkDeleteButton mutationMode="pessimistic" /> : false}>
        {r.list.map((f) => <Field key={f.name} source={f.name} label={label(f.name)} sortable={f.type !== "json"} f={f} />)}
      </Datagrid>
    </List>
  );
  const form = (
    <SimpleForm>
      {r.edit.map((f) => <Input key={f.name} f={f} />)}
    </SimpleForm>
  );
  const readOnly = [...r.list, ...r.show].filter((f) => !r.edit.some((e) => e.name === f.name));
  return {
    list,
    show: () => (
      <Show actions={<TopToolbar>{can("u") && <EditButton />}{can("d") && <DeleteButton mutationMode="pessimistic" />}</TopToolbar>}>
        <SimpleShowLayout>{[...r.list, ...r.show, ...r.edit].filter((f, i, a) => a.findIndex((x) => x.name === f.name) === i).map((f) => <Field key={f.name} source={f.name} label={label(f.name)} f={f} />)}</SimpleShowLayout>
      </Show>
    ),
    edit: can("u") ? () => (
      <Edit mutationMode="pessimistic" actions={<TopToolbar><ShowButton />{can("d") && <DeleteButton mutationMode="pessimistic" />}</TopToolbar>}>
        <SimpleForm>
          <ReadOnly fields={readOnly} />
          {r.edit.map((f) => <Input key={f.name} f={f} />)}
        </SimpleForm>
      </Edit>
    ) : undefined,
    create: can("c") ? () => <Create redirect="list">{form}</Create> : undefined,
  };
};

// Bố cục gọn: một hàng chip chọn bảng thay cho AppBar + menu của react-admin
// (bảng quản trị đã có thanh bên riêng).
function Layout({ children }) {
  const resources = Object.values(useResourceDefinitions());
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const current = resources.find((r) => pathname.startsWith(`${BASE}/${r.name}/`) || pathname === `${BASE}/${r.name}`);
  const curated = resources.filter((r) => !r.options?.auto);
  const raw = resources.filter((r) => r.options?.auto);
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <nav aria-label="Bảng dữ liệu" className="flex flex-wrap items-center gap-2">
        {curated.map((r) => (
          <NavLink key={r.name} to={`${BASE}/${r.name}`}
            className={`min-h-9 shrink-0 rounded-full border px-3 py-1.5 text-sm ${current?.name === r.name ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground"}`}>
            {r.options?.label || r.name}
          </NavLink>
        ))}
        {raw.length > 0 && (
          <select aria-label="Mọi bảng khác" value={current?.options?.auto ? current.name : ""} onChange={(e) => e.target.value && navigate(`${BASE}/${e.target.value}`)}
            className={`min-h-9 rounded-full border px-3 text-sm ${current?.options?.auto ? "border-foreground bg-foreground text-background" : "border-border bg-background text-muted-foreground"}`}>
            <option value="">Mọi bảng khác ({raw.length})…</option>
            {raw.map((r) => <option key={r.name} value={r.name}>{r.options?.label || r.name}</option>)}
          </select>
        )}
      </nav>
      {children}
    </div>
  );
}

export default function AdminDataTab() {
  const [resources, setResources] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    httpClient(`${API_BASE}/admin/data/_resources`)
      .then(({ json }) => setResources(json))
      .catch((err) => setError(err.message || "Không tải được danh sách bảng."));
  }, []);

  if (error) return <p role="alert" className="p-10 text-center text-sm text-destructive">{error}</p>;
  if (!resources) return <p className="p-10 text-center text-sm text-muted-foreground">Đang tải…</p>;
  if (!resources.length) return <p className="p-10 text-center text-sm text-muted-foreground">Vai trò của bạn chưa được xem bảng dữ liệu nào.</p>;

  // App.jsx khai báo riêng route /admin/data/* để đường dẫn bên trong react-admin tính từ đây.
  return (
    <Admin basename={BASE} dataProvider={dataProvider} i18nProvider={i18nProvider} theme={theme} layout={Layout} disableTelemetry>
      {resources.map((r) => <Resource key={r.id} name={r.id} options={{ label: r.label, auto: r.auto }} {...views(r)} />)}
    </Admin>
  );
}

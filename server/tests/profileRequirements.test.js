import { describe, it, expect } from 'vitest';
import { missingProfileFields, applyProfileValues } from '../utils/profileRequirements.js';

// Đây là chỗ client và server từng lệch nhau: modal không hỏi ngày sinh nhưng
// server vẫn bắt buộc → POST 400 → onboarding không bao giờ xong → mã giới
// thiệu nhập trong modal cũng mất luôn. Giờ chỉ còn một danh sách, và nó phải
// chịu được payload thiếu, payload thừa, payload sai.

const bio = (extra = {}) => ({ birthYear: 0, birthMonth: 0, birthDay: 0, phone: '', ...extra });

describe('missingProfileFields', () => {
  it('chỉ liệt kê mục thực sự còn trống', () => {
    expect(missingProfileFields(bio()).map((f) => f.key)).toEqual(['birthDate', 'phone']);
    expect(missingProfileFields(bio({ phone: '0912345678' })).map((f) => f.key)).toEqual(['birthDate']);
    expect(missingProfileFields(bio({ birthYear: 2000, birthMonth: 5, birthDay: 4 })).map((f) => f.key)).toEqual(['phone']);
    expect(missingProfileFields(bio({ birthYear: 2000, birthMonth: 5, birthDay: 4, phone: '0912345678' }))).toEqual([]);
  });

  it('không có bio thì không hỏi gì', () => {
    expect(missingProfileFields(null)).toEqual([]);
  });
});

describe('applyProfileValues', () => {
  it('ghi đúng mục được gửi, bỏ qua mục vắng mặt', () => {
    const doc = bio();
    expect(applyProfileValues(doc, { phone: '0912345678' })).toEqual(['phone']);
    expect(doc.phone).toBe('0912345678');
    expect(missingProfileFields(doc).map((f) => f.key)).toEqual(['birthDate']);
  });

  it('nhận số dạng chuỗi từ form', () => {
    const doc = bio();
    applyProfileValues(doc, { birthDay: '20', birthMonth: '9', birthYear: '2008' });
    expect([doc.birthDay, doc.birthMonth, doc.birthYear]).toEqual([20, 9, 2008]);
  });

  it('không ghi đè giá trị đã có — ngày sinh khai một lần rồi khoá', () => {
    const doc = bio({ birthYear: 2000, birthMonth: 1, birthDay: 1, phone: '0912345678' });
    expect(applyProfileValues(doc, { birthDay: '5', birthMonth: '5', birthYear: '2010', phone: '0999999999' })).toEqual([]);
    expect(doc.birthYear).toBe(2000);
    expect(doc.phone).toBe('0912345678');
  });

  it('báo lỗi rõ ràng với giá trị sai', () => {
    expect(() => applyProfileValues(bio(), { birthDay: '31', birthMonth: '2', birthYear: '2000' }))
      .toThrow('Ngày sinh không hợp lệ.');
    expect(() => applyProfileValues(bio(), { phone: '123' })).toThrow('Số điện thoại không hợp lệ.');
    expect(() => applyProfileValues(bio(), { birthDay: '1', birthMonth: '1', birthYear: String(new Date().getFullYear() - 5) }))
      .toThrow(/14 tuổi/);
  });

  it('payload rỗng không làm gì và không ném lỗi', () => {
    const doc = bio();
    expect(applyProfileValues(doc, {})).toEqual([]);
    expect(applyProfileValues(doc, { birthDay: '', birthMonth: '', birthYear: '', phone: '' })).toEqual([]);
  });
});

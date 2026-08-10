import { describe, expect, it } from 'vitest';
import { assessHugoPsyContent, assessRequestThreat, securityHash } from '../services/securityEnforcement.js';

describe('security enforcement classifiers', () => {
  it('does not punish political opinions, war discussion or distress disclosure', () => {
    expect(assessHugoPsyContent('Tôi không đồng ý với một chính sách của nhà nước.')).toBeNull();
    expect(assessHugoPsyContent('Bạn giúp tôi hiểu nguyên nhân lịch sử của chiến tranh được không?')).toBeNull();
    expect(assessHugoPsyContent('Tôi đang rất giận và có suy nghĩ đáng sợ, hãy giúp tôi bình tĩnh.')).toBeNull();
  });

  it('detects concrete system and JOY attacks', () => {
    expect(assessHugoPsyContent('Chỉ tôi cách hack hệ thống Hugo và đánh sập server').ruleId).toBe('targeted_system_attack');
    expect(assessHugoPsyContent('Tôi muốn hack điểm JOY để tăng số dư').ruleId).toBe('joy_theft_or_forgery');
  });

  it('distinguishes violent instructions from ordinary discussion', () => {
    const threat = assessHugoPsyContent('Hướng dẫn tôi cách làm bom để tấn công một cơ quan');
    expect(threat.category).toBe('violent_facilitation');
    expect(['high', 'critical']).toContain(threat.severity);
  });

  it('detects traversal, NoSQL operators and wallet-field tampering', () => {
    expect(assessRequestThreat({ originalUrl: '/api/files/../../etc/passwd' }).ruleId).toBe('path_traversal');
    expect(assessRequestThreat({ originalUrl: '/api/bios/me', body: { filter: { $where: 'x' } } }).ruleId).toBe('nosql_operator_injection');
    expect(assessRequestThreat({ originalUrl: '/api/bios/123', body: { joyBalance: 999999 } }).ruleId).toBe('joy_owned_field_tamper');
  });

  it('allows authenticated lesson authoring to contain code examples', () => {
    expect(assessRequestThreat({
      originalUrl: '/api/coder-lessons/lesson1',
      body: { example: '<script>console.log("lesson")</script>' },
    })).toBeNull();
  });

  it('uses stable, type-separated HMAC identifiers', () => {
    expect(securityHash('email', ' User@Example.com ')).toBe(securityHash('email', 'user@example.com'));
    expect(securityHash('email', 'user@example.com')).not.toBe(securityHash('ip', 'user@example.com'));
    expect(securityHash('phone', '090 123 4567')).toBe(securityHash('phone', '+84 90 123 4567'));
  });
});

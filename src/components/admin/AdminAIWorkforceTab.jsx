import { useEffect, useMemo, useState } from 'react';
import { notify } from '../../lib/notify';
import aiWorkforceApi from '../../services/api/AIWorkforceApi';

const STATUS_STYLES = {
  queued: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
  running: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
  awaiting_approval: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  executing: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20',
  completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  failed: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  rejected: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20',
};

const STATUS_LABELS = {
  queued: 'Đang chờ',
  running: 'Đang làm',
  awaiting_approval: 'Chờ phê duyệt',
  executing: 'Đang thực thi',
  completed: 'Hoàn thành',
  failed: 'Thất bại',
  rejected: 'Đã từ chối',
};

const AGENT_ICONS = {
  support: 'support_agent',
  operations: 'monitoring',
  knowledge: 'library_books',
  risk: 'shield',
  server_specialist: 'dns',
  ui_specialist: 'web',
};

function autonomyLabel(autonomy) {
  if (autonomy === 'read_only') return 'Tự động đọc';
  if (autonomy === 'guarded_auto_repair') return 'Tự sửa có rào chắn';
  return 'Cần duyệt';
}

function taskSummary(task) {
  if (task.error) return task.error;
  if (typeof task.result?.summary === 'string') return task.result.summary;
  if (typeof task.result?.analysis === 'string') return task.result.analysis;
  return 'Nhiệm vụ chưa có báo cáo.';
}

export default function AdminAIWorkforceTab() {
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState('operations');
  const [objective, setObjective] = useState('Phân tích tình hình hiện tại và nêu các ưu tiên cần xử lý.');
  const [ticketId, setTicketId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actingTaskId, setActingTaskId] = useState('');

  const selectedEmployee = useMemo(
    () => agents.find((agent) => agent.key === selectedAgent),
    [agents, selectedAgent]
  );
  const needsTicket = selectedAgent === 'support' || selectedAgent === 'knowledge';
  const pendingCount = tasks.filter((task) => task.status === 'awaiting_approval').length;

  const loadData = async () => {
    setLoading(true);
    try {
      const [agentsResponse, tasksResponse] = await Promise.all([
        aiWorkforceApi.getAgents(),
        aiWorkforceApi.getTasks(),
      ]);
      setAgents(agentsResponse.agents || []);
      setTasks(tasksResponse.tasks || []);
    } catch (error) {
      notify.error(error.message || 'Không thể tải AI Workforce');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const createTask = async (event) => {
    event.preventDefault();
    if (!objective.trim()) return notify.warning('Hãy nhập mục tiêu cho nhân viên AI.');
    if (needsTicket && !ticketId.trim()) return notify.warning('Vai trò này cần ID ticket.');

    setSubmitting(true);
    try {
      const response = await aiWorkforceApi.createTask({
        agentKey: selectedAgent,
        objective: objective.trim(),
        context: needsTicket ? { ticketId: ticketId.trim() } : {},
      });
      setTasks((current) => [response.task, ...current.filter((task) => task._id !== response.task._id)]);
      if (response.task.status === 'failed') {
        notify.error(response.task.error || 'Nhân viên AI không thể hoàn thành nhiệm vụ.');
      } else {
        notify.success(response.task.status === 'awaiting_approval'
          ? 'Đã tạo dự thảo và chuyển vào hộp phê duyệt.'
          : 'Nhân viên AI đã hoàn thành nhiệm vụ.');
      }
    } catch (error) {
      notify.error(error.message || 'Không thể tạo nhiệm vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const decideTask = async (task, decision) => {
    const approving = decision === 'approve';
    const confirmed = await notify.confirm({
      title: approving ? 'Phê duyệt hành động của AI?' : 'Từ chối đề xuất này?',
      message: approving
        ? 'Server sẽ thực thi đúng hành động đã ghi trong nhiệm vụ và lưu nhật ký kiểm toán.'
        : 'Nhiệm vụ sẽ đóng mà không thay đổi dữ liệu đích.',
      confirmText: approving ? 'Phê duyệt' : 'Từ chối',
      danger: !approving,
    });
    if (!confirmed) return;

    setActingTaskId(task._id);
    try {
      const response = approving
        ? await aiWorkforceApi.approveTask(task._id)
        : await aiWorkforceApi.rejectTask(task._id);
      setTasks((current) => current.map((item) => item._id === task._id ? response.task : item));
      notify.success(approving ? 'Đã phê duyệt và thực thi.' : 'Đã từ chối đề xuất.');
    } catch (error) {
      notify.error(error.message || 'Không thể cập nhật nhiệm vụ');
      await loadData();
    } finally {
      setActingTaskId('');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/20 bg-slate-950 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
              Human-in-the-loop
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">AI Workforce</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Giao việc cho đội nhân sự AI production. Báo cáo chỉ đọc chạy tự động;
              hai chuyên viên kỹ thuật báo Telegram, tự chẩn đoán và chỉ tạo bản sửa qua PR có kiểm tra.
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center">
              <div className="text-xl font-black">{agents.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Nhân viên</div>
            </div>
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-center">
              <div className="text-xl font-black text-amber-300">{pendingCount}</div>
              <div className="text-[10px] uppercase tracking-wider text-amber-200/70">Chờ duyệt</div>
            </div>
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black hover:bg-white/15 disabled:opacity-50"
            >
              <span className={`material-symbols-outlined text-base ${loading ? 'animate-spin' : ''}`}>sync</span>
              Làm mới
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agents.map((agent) => (
          <button
            type="button"
            key={agent.key}
            onClick={() => setSelectedAgent(agent.key)}
            className={`rounded-3xl border p-5 text-left transition-all ${selectedAgent === agent.key
              ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
              : 'border-slate-200 bg-white/70 hover:border-blue-300 dark:border-white/10 dark:bg-white/5'}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="material-symbols-outlined text-2xl text-slate-700 dark:text-slate-200">
                {AGENT_ICONS[agent.key] || 'smart_toy'}
              </span>
              <span className="rounded-full border border-slate-300/60 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-slate-400">
                {autonomyLabel(agent.autonomy)}
              </span>
            </div>
            <h3 className="mt-4 text-sm font-black text-slate-900 dark:text-white">{agent.name}</h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{agent.responsibility}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <form onSubmit={createTask} className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Giao nhiệm vụ mới</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedEmployee?.name || 'Chọn một nhân viên'} · Mức rủi ro {selectedEmployee?.riskLevel || '—'}
            </p>
          </div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Mục tiêu
            <textarea
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              maxLength={2000}
              rows={5}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white"
              placeholder="Mô tả kết quả bạn muốn nhận..."
            />
          </label>
          {needsTicket && (
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              ID ticket
              <input
                value={ticketId}
                onChange={(event) => setTicketId(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-900 outline-none focus:border-blue-500 dark:border-white/10 dark:bg-black/30 dark:text-white"
                placeholder="MongoDB ObjectId của ticket"
              />
            </label>
          )}
          <button
            type="submit"
            disabled={submitting || loading || !selectedEmployee}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-base ${submitting ? 'animate-spin' : ''}`}>
              {submitting ? 'sync' : 'send'}
            </span>
            {submitting ? 'Nhân viên đang xử lý...' : 'Giao việc'}
          </button>
        </form>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-white/10">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Nhiệm vụ gần đây</h3>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Tối đa 50 nhiệm vụ mới nhất</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-xs text-slate-500">
              <span className="material-symbols-outlined animate-spin">sync</span>
              Đang tải nhiệm vụ...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">Chưa có nhiệm vụ nào.</div>
          ) : (
            <div className="max-h-[720px] divide-y divide-slate-200 overflow-y-auto dark:divide-white/10">
              {tasks.map((task) => (
                <article key={task._id} className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg text-slate-500">
                          {AGENT_ICONS[task.agentKey] || 'smart_toy'}
                        </span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {agents.find((agent) => agent.key === task.agentKey)?.name || task.agentKey}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{task.objective}</p>
                    </div>
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider ${STATUS_STYLES[task.status] || STATUS_STYLES.queued}`}>
                      {STATUS_LABELS[task.status] || task.status}
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-slate-100/80 p-4 text-xs leading-relaxed text-slate-700 dark:bg-black/30 dark:text-slate-200">
                    {taskSummary(task)}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400">
                    <span>{new Date(task.createdAt).toLocaleString('vi-VN')}</span>
                    {task.status === 'awaiting_approval' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => decideTask(task, 'reject')}
                          disabled={actingTaskId === task._id}
                          className="rounded-xl border border-slate-300 px-3 py-2 font-black text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
                        >
                          Từ chối
                        </button>
                        <button
                          type="button"
                          onClick={() => decideTask(task, 'approve')}
                          disabled={actingTaskId === task._id}
                          className="rounded-xl bg-emerald-600 px-3 py-2 font-black text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {actingTaskId === task._id ? 'Đang xử lý...' : 'Phê duyệt'}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

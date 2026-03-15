"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Staff } from "@/types";
import type { ShiftTask } from "@/types";

type ShiftTaskRow = ShiftTask & { staff?: { name: string } | null };

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [tasks, setTasks] = useState<ShiftTaskRow[]>([]);
  const [taskDate, setTaskDate] = useState("");
  const [taskShift, setTaskShift] = useState<"朝" | "昼" | "夕">("朝");
  const [taskFilterDate, setTaskFilterDate] = useState("");
  const [taskFilterShift, setTaskFilterShift] = useState("");
  const [form, setForm] = useState({ name: "", role: "", line_user_id: "" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({ task: "", staff_id: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff");
      if (!res.ok) throw new Error("スタッフ一覧の取得に失敗しました");
      const data = await res.json();
      setStaffList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams();
      if (taskFilterDate) params.set("date", taskFilterDate);
      if (taskFilterShift) params.set("shift", taskFilterShift);
      const res = await fetch(`/api/shift-tasks?${params}`);
      if (!res.ok) throw new Error("タスク一覧の取得に失敗しました");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchStaff(), fetchTasks()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setTaskDate(new Date().toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [taskFilterDate, taskFilterShift]);

  const resetForm = () => {
    setForm({ name: "", role: "", line_user_id: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEditStaff = (row: Staff) => {
    setForm({
      name: row.name,
      role: row.role ?? "",
      line_user_id: row.line_user_id ?? "",
    });
    setEditingId(row.id);
    setShowForm(true);
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(null);
    try {
      const body = {
        name: form.name.trim(),
        role: form.role.trim() || null,
        line_user_id: form.line_user_id.trim() || null,
      };
      if (editingId) {
        const res = await fetch(`/api/staff/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "更新に失敗しました");
        }
      } else {
        const res = await fetch("/api/staff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "登録に失敗しました");
        }
      }
      resetForm();
      await fetchStaff();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("このスタッフを削除しますか？")) return;
    setError(null);
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchStaff();
      if (editingId === id) resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim()) return;
    const date = taskDate || new Date().toISOString().slice(0, 10);
    if (!date) return;
    setError(null);
    try {
      const res = await fetch("/api/shift-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          shift: taskShift,
          staff_id: newTask.staff_id || null,
          task: newTask.task.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "タスクの登録に失敗しました");
      }
      setNewTask({ task: "", staff_id: "" });
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleToggleDone = async (task: ShiftTaskRow) => {
    try {
      const res = await fetch(`/api/shift-tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: !task.is_done }),
      });
      if (!res.ok) throw new Error("更新に失敗しました");
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleAssignStaff = async (taskId: string, staffId: string) => {
    try {
      const res = await fetch(`/api/shift-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffId || null }),
      });
      if (!res.ok) throw new Error("担当者の更新に失敗しました");
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm("このタスクを削除しますか？")) return;
    try {
      const res = await fetch(`/api/shift-tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("削除に失敗しました");
      await fetchTasks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  };

  const handleNotify = async (staffId: string, name: string) => {
    setNotifyResult(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staff_id: staffId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNotifyResult(`${name} に通知を送りました。`);
      } else {
        setNotifyResult(data.error || "通知に失敗しました");
      }
    } catch (e) {
      setNotifyResult(e instanceof Error ? e.message : "Unknown error");
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        スタッフ管理
      </h1>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {notifyResult && (
        <div className="mb-4 rounded-md bg-zinc-100 p-3 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {notifyResult}
        </div>
      )}

      {/* スタッフ一覧 */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            スタッフ一覧
          </h2>
          <Button
            variant="default"
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
          >
            {showForm ? "キャンセル" : "追加"}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmitStaff}
            className="mb-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-zinc-50">
              {editingId ? "編集" : "新規登録"}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  名前 *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  役割
                </label>
                <input
                  type="text"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  placeholder="調理, 配膳"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  LINE ユーザーID
                </label>
                <input
                  type="text"
                  value={form.line_user_id}
                  onChange={(e) => setForm((f) => ({ ...f, line_user_id: e.target.value }))}
                  placeholder="通知を受け取るLINEユーザーID"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="submit">{editingId ? "更新" : "登録"}</Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                キャンセル
              </Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">読み込み中...</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full min-w-[400px] text-left text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-800">
                <tr>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">名前</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">役割</th>
                  <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">LINE</th>
                  <th className="w-40 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {staffList.map((row) => (
                  <tr key={row.id} className="bg-white dark:bg-zinc-900">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                      {row.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {row.role ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 text-xs">
                      {row.line_user_id ? "登録済" : "—"}
                    </td>
                    <td className="px-4 py-3 flex flex-wrap gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditStaff(row)}
                      >
                        編集
                      </Button>
                      {row.line_user_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNotify(row.id, row.name)}
                        >
                          LINE通知
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStaff(row.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        削除
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* シフト・タスク */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          シフト別タスク
        </h2>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">表示絞り:</span>
          <input
            type="date"
            value={taskFilterDate}
            onChange={(e) => setTaskFilterDate(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <select
            value={taskFilterShift}
            onChange={(e) => setTaskFilterShift(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          >
            <option value="">すべてのシフト</option>
            <option value="朝">朝</option>
            <option value="昼">昼</option>
            <option value="夕">夕</option>
          </select>
        </div>

        <form onSubmit={handleAddTask} className="mb-4 flex flex-wrap items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">日付</label>
            <input
              type="date"
              value={taskDate}
              onChange={(e) => setTaskDate(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">シフト</label>
            <select
              value={taskShift}
              onChange={(e) => setTaskShift(e.target.value as "朝" | "昼" | "夕")}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="朝">朝</option>
              <option value="昼">昼</option>
              <option value="夕">夕</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">タスク *</label>
            <input
              type="text"
              value={newTask.task}
              onChange={(e) => setNewTask((t) => ({ ...t, task: e.target.value }))}
              placeholder="例: 調理担当"
              className="min-w-[140px] rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">担当</label>
            <select
              value={newTask.staff_id}
              onChange={(e) => setNewTask((t) => ({ ...t, staff_id: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <option value="">未割当</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" size="sm">タスク追加</Button>
        </form>

        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="w-full min-w-[500px] text-left text-sm">
            <thead className="bg-zinc-100 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">日付</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">シフト</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">タスク</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">担当</th>
                <th className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">完了</th>
                <th className="w-24 px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {tasks.map((task) => (
                <tr key={task.id} className="bg-white dark:bg-zinc-900">
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{task.date}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{task.shift}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{task.task}</td>
                  <td className="px-4 py-3">
                    <select
                      value={task.staff_id ?? ""}
                      onChange={(e) => handleAssignStaff(task.id, e.target.value)}
                      className="rounded border border-zinc-300 px-2 py-1 text-xs dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
                    >
                      <option value="">未割当</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDone(task)}
                      className={`rounded px-2 py-1 text-xs ${task.is_done ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"}`}
                    >
                      {task.is_done ? "完了" : "未完了"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      削除
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {tasks.length === 0 && !loading && (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            タスクがありません。上記フォームで追加してください。
          </p>
        )}
      </section>
    </div>
  );
}
